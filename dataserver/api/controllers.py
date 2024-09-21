import math
import base64
import numpy as np
from typing import Dict, Any, List
from dataserver.api import models
from dataserver.core import io, path
from dataserver.core.dataset import DatasetCache

def get_path_query(relative_path: str) -> Dict[str, Any]:
    """Query the filesystem for folders and files at the given path."""
    data = path.query_path(relative_path)
    return { 'path': data[0], 'folders': data[1], 'files': data[2] }

def get_files() -> List[Dict[str, Any]]:
    """Retrieve information about all loaded files."""
    return io.get_files()

def read_file(filepath: str, filename: str, id: str, options: models.FileDataOptions) -> List[Dict[str, Any]]:
    """Read a file and store it in the dataset cache."""
    io.read_file(filepath, filename, id, options)
    return get_files()
    
def remove_file(id: str) -> str:
    """Remove a file from the dataset cache."""
    return io.remove_file(id)

def get_data(fileid, key, encode = True, dims = ['Sli','Lin','Col']):
    """Retrieve data for a specific file and key."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    return dataset.get_data_subset(fileid, key, encode, dims)

def get_metadata(fileid: str) -> Dict[str, Any]:
    """Retrieve metadata for a specific file."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    return dataset.metadata

def get_file_preview_img(fileid, size = 128):
    """Generate a preview image for a specific file."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    
    return dataset.generate_preview_img(size)

def get_roi_mask_slice(fileid: str, key: str) -> Dict[str, Any]:
    """Retrieve a slice of the ROI mask for a specific file and key."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    return dataset.roi.get_slice(key)

def set_roi_mask(fileid: str, mask: np.ndarray) -> None:
    """Set the ROI mask for a specific file."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    dataset.roi.set_mask(mask)

def update_roi_mask(fileid: str, indices: List[List[int]], add: bool = True) -> None:
    """Add or remove points from the ROI mask for a specific file."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    dataset.roi.update_mask(indices, add)
    stats = dataset.get_roi_statistics()
    return stats

def get_roi_statistics(fileid: str) -> Dict[str, Any]:
    """Retrieve ROI statistics for a specific file."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    return dataset.get_roi_statistics()

def export_segmented_data(fileid: str, filepath: str) -> None:
    """Export ROI data for a specific file to the given filepath."""
    dataset = DatasetCache.get(fileid)
    if not dataset:
        raise ValueError(f"Dataset with id {fileid} not found")
    dataset.export_segmented_data(filepath)

def export_roi_data_old(roi_data: str, shape: List[int]) -> str: 
    decoded = base64.b64decode(roi_data)
    decoded = np.frombuffer(decoded, dtype=np.uint8)
    indices = np.nonzero(decoded)

    SliceIndices = {}
    for index in indices[0].tolist():
        z = math.floor(index / (shape[0] * shape[1]))
        dz = index % (shape[0] * shape[1])
        y = math.floor(dz / shape[0])
        x = dz % (shape[1])

        if z in SliceIndices.keys():
            SliceIndices[z].append((y,x))
        else:
            SliceIndices[z] = [(y,x)]

    import os
    roi_path = os.path.join(os.getcwd(), 'roi', '')
    roi_path_exists = os.path.exists(roi_path)
    if not roi_path_exists:
        os.mkdir(roi_path)

    filepaths = []
    for z in SliceIndices.keys():
        im = np.zeros((shape[1], shape[0]), dtype=np.uint8)
        for idx in SliceIndices[z]:
            im[idx[0], idx[1]] = 255

        from PIL import Image
        im = Image.fromarray(im)
        filename = f"./roi/test-{z}.png"
        im.save(filename)
        filepaths.append(filename)

    from zipfile import ZipFile

    roi_filepath = './roi/roi_images.zip'
    with ZipFile(roi_filepath, 'w') as zip:
        # writing each file one by one
        for file in filepaths:
            zip.write(file)

    import os
    import glob

    files = glob.glob('./roi/*.png')
    for f in files:
        try:
            os.remove(f)
        except OSError as e:
            print("Error: %s : %s" % (f, e.strerror))

    message = f'All {len(filepaths)} files zipped successfully!'
    print(message)
    return message 
