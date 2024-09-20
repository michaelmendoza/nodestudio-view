import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import glob

import numpy as np
import pydicom
import mapvbvd

from dataserver.api import models
from dataserver.core.dataset import Dataset, DatasetCache

def get_files() -> List[Dict[str, Any]]:
    """Retrieve all loaded files."""
    return [dataset.file for dataset in DatasetCache.values()]

def remove_file(file_id: str) -> str:
    """Remove file data from DatasetCache."""
    DatasetCache.remove(file_id)
    return file_id

def read_file(filepath: str, name: str = '', file_id: Optional[str] = None, options: models.FileDataOptions = models.FileDataOptions()) -> str:
    """Read file and store in DatasetCache."""
    file_id = file_id or str(uuid.uuid1())
    name = name or f'File {len(DatasetCache.keys())}'
    
   # Normalize filepath
    path = os.path.normpath(filepath)
    path = path.split(os.sep)
    path = Path(os.path.join(Path.cwd(), *path))

    if os.path.isdir(path):
        read_directory(path, name, options)
    else:
        read_single_file(path, name, file_id, options)

    return file_id

def read_directory(path: Path, name: str, options: models.FileDataOptions) -> None:
    """Read all valid files in a directory."""
    # Check for .dat files
    dat_files = list(path.glob('*.dat'))
    for dat_file in dat_files:
        read_single_file(dat_file, name, str(uuid.uuid1()), options)

    # Check for .npy files
    npy_files = list(path.glob('*.npy'))
    for npy_file in npy_files:
        read_single_file(npy_file, name, str(uuid.uuid1()), options)

    # Check for DICOM files (.dcm and .ima)
    dicom_files = list(path.glob('*.dcm')) + list(path.glob('*.ima'))
    if dicom_files:
        read_dicom_group(path, name, str(uuid.uuid1()))

def read_single_file(path: Path, name: str, file_id: str, options: models.FileDataOptions) -> None:
    """Read a single file based on its extension."""
    file_type_handlers = {
        '.dat': lambda: read_rawdata(str(path), options.datatype, options.doChaAverage, options.doChaSOSAverage, options.doAveAverage),
        '.npy': lambda: read_npy(str(path)),
        '.dcm': lambda: read_dicom([str(path)]),
        '.ima': lambda: read_dicom([str(path)])
    }

    handler = file_type_handlers.get(path.suffix)
    if handler:
        data = handler()
        create_and_cache_dataset(file_id, str(path), name, path.suffix[1:], data)

def read_dicom_group(path: Path, name: str, file_id: str) -> None:
    """Read a group of DICOM files from a directory."""
    dicom_files = sorted(glob.glob(str(path / '*.dcm')) + glob.glob(str(path / '*.ima')))
    if dicom_files:
        data = read_dicom(dicom_files)
        create_and_cache_dataset(file_id, str(path), name, 'dicom', data)

def create_and_cache_dataset(file_id: str, path: str, name: str, file_type: str, data: Dict[str, Any]) -> None:
    """Create a Dataset object and store it in the DatasetCache."""
    file_info = {'id': file_id, 'path': path, 'name': name, 'type': file_type}
    metadata = {
        'dims': data['dims'],
        'shape': data['shape'],
        'min': data['min'],
        'max': data['max'],
        'isComplex': data['isComplex']
    }
    dataset = Dataset(file_info, data['data'], metadata)
    DatasetCache.set(file_id, dataset)

def read_npy(filepath: str) -> Dict[str, Any]:
    """Read NPY file and return data dictionary."""
    data = np.load(filepath)
    return {
        'data': data,
        'dims': list(range(len(data.shape))),
        'shape': data.shape,
        'min': float(np.nanmin(np.abs(data))),
        'max': float(np.nanmax(np.abs(data))),
        'isComplex': np.iscomplexobj(data)
    }

def read_dicom(filepaths: List[str]) -> Dict[str, Any]:
    """Read DICOM file(s) and return data dictionary."""
    dicom_slices = [pydicom.dcmread(filepath, force=True) for filepath in filepaths]
    dicom_slices.sort(key=lambda x: x.InstanceNumber)

    # Assume all slices have the same dimensions
    slice_shape = dicom_slices[0].pixel_array.shape
    volume_shape = (len(dicom_slices),) + slice_shape
    data = np.zeros(volume_shape, dtype=dicom_slices[0].pixel_array.dtype)

    for i, dicom_slice in enumerate(dicom_slices):
        data[i, :, :] = dicom_slice.pixel_array

    return {
        'data': data,
        'dims': ['Sli', 'Lin', 'Col'],
        'shape': data.shape,
        'min': float(np.nanmin(np.abs(data))),
        'max': float(np.nanmax(np.abs(data))),
        'isComplex': np.iscomplexobj(data)
    }

def read_rawdata(filepath: str, datatype: str = 'image', doChaAverage: bool = True, doChaSOSAverage: bool = False, doAveAverage: bool = True) -> Dict[str, Any]:
    """Read raw data file and return data dictionary."""
    twixObj = mapvbvd.mapVBVD(filepath)
    twixObj.image.squeeze = True
    data = twixObj.image['']
    sqzDims = twixObj.image.sqzDims.copy()  # Create a copy to modify

    # Move Lin to be first index
    linIndex = sqzDims.index('Lin')
    data = np.moveaxis(data, linIndex, 0)
    sqzDims.insert(0, sqzDims.pop(linIndex))

    # Process data based on options
    if doAveAverage and 'Ave' in sqzDims:
        ave_index = sqzDims.index('Ave')
        data = np.mean(data, axis=ave_index)
        sqzDims.pop(ave_index)

    if 'Par' in sqzDims:
        slice_index = sqzDims.index('Par')
        data = np.moveaxis(data, slice_index, 0)
        sqzDims.insert(0, sqzDims.pop(slice_index))

    if datatype == 'image':
        if 'Par' in sqzDims:
            data = np.fft.fftshift(np.fft.ifftn(np.fft.fftshift(data, axes=(0,1,2))))
        else:
            data = np.fft.fftshift(np.fft.ifft2(np.fft.fftshift(data, axes=(0, 1)), axes=(0, 1)), axes=(0, 1))

    if (doChaAverage or doChaSOSAverage) and 'Cha' in sqzDims:
        cha_index = sqzDims.index('Cha')
        if doChaAverage:
            data = np.mean(data, axis=cha_index)
        elif doChaSOSAverage:
            data = np.sqrt(np.sum(data**2, axis=cha_index))
        sqzDims.pop(cha_index)

    if 'Sli' in sqzDims:
        slice_index = sqzDims.index('Sli')
        data = np.moveaxis(data, slice_index, 0)
        sqzDims.insert(0, sqzDims.pop(slice_index))
    else:
        sqzDims.insert(0, 'Sli')
        data = data[np.newaxis, ...]

    return {
        'data': data,
        'dims': sqzDims,
        'shape': data.shape,
        'min': float(np.nanmin(np.abs(data))),
        'max': float(np.nanmax(np.abs(data))),
        'isComplex': np.iscomplexobj(data)
    }