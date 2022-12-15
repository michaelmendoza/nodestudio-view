import os
import glob
import uuid
import pydicom
import numpy as np
import mapvbvd

files_loaded = {}

def get_filedata(id):
    ''' Retrieves file data from files_loaded cache. '''

    if(id in files_loaded):
        return files_loaded[id]['data']

def get_files():
    return [ { 'id':file['id'], 'path':file['path'], 'name':file['name'], 'type':file['type'] } for file in files_loaded.values() ]

def read_file(filepath, name: str = '', id = None):
    id = uuid.uuid1().hex if id == None else id
    if name == '':
        name =  f'File {len(files_loaded)}'

    ''' Detects valid files in filepath and reads file, and places data in io datastore '''
    if os.path.isdir(filepath):
        # Read raw data files in folder (load one dataset per file)
        filepath = os.path.join(filepath, '') # Added ending slash if needed
        paths = glob.glob(filepath + '*.dat') 
        for filename in paths:
            id = uuid.uuid1().hex
            files_loaded[id] = { 'id':id, 'path':filename, 'name':name, 'type':'raw data', 'data': read_rawdata(filename)} 

        # Read raw data files in folder (load one dataset/datagroup per folder)
        paths = glob.glob(filepath + '*.dcm')        
        paths.extend(glob.glob(filepath + '*.ima'))
        if len(paths) > 0:
            files_loaded[id] = { 'id':id, 'path':filepath, 'name':name, 'type':'dicom', 'data': read_dicom(filepath)}  
    else:
        # Check for file extension and read dicom / raw data files
        filename, file_extension = os.path.splitext(filepath)
        if file_extension == '.dat':
            files_loaded[id] = { 'id':id, 'path':filepath, 'name':name, 'type':'raw data', 'data': read_rawdata(filepath)}  
        if file_extension == '.dcm' or file_extension == '.ima':
            files_loaded[id] = { 'id':id, 'path':filepath, 'name':name, 'type':'dicom', 'data': read_dicom(filepath)}  
    
    return id

def read_dicom(filepath, group_by=None, sort_by=None):
    ''' Reads dicom files from a folder or single file. Groups data if group_by is set to tag in dicom header'''

    # Get filenames and sort alphabetically
    if os.path.isdir(filepath):
        paths = glob.glob(filepath + '*.dcm')        # add .dcm files
        paths.extend(glob.glob(filepath + '*.ima'))  # add .ima files
    elif os.path.isfile(filepath):
        paths = [filepath]
    else:
        raise IOError(f"No directory or file found: {filepath}")
    paths = sorted(paths)

    # Read dicom files
    headers = {}
    for idx, path in enumerate(paths):
        dicom = pydicom.dcmread(path, force=True)

        # Group dicoms by group_by tag
        if group_by:
            group_key = dicom.EchoNumbers
        else:
            group_key = 0

        if group_key in headers:
            headers[group_key].append(dicom)
        else:
            headers[group_key] = [dicom]

    # TODO: sort_by tag after group_by

    # For each datagroup item - Create a dataset
    datagroup = []
    for key in headers.keys():
        depth = len(headers[key])
        height = headers[key][0].pixel_array.shape[0]
        width = headers[key][0].pixel_array.shape[1]

        # Create data array from dicoms            
        data = np.zeros((depth, height, width), dtype='uint16')
        for idx, header in enumerate(headers[key]):
            data[idx,:,:] = header.pixel_array

        # Create datasets
        min = float(np.nanmin(np.abs(data)))
        max = float(np.nanmax(np.abs(data)))
        isComplex = np.iscomplexobj(data)
        dataset = { 'data': data, 'dims': ['Sli', 'Lin', 'Col'], 'shape': data.shape, 'min': min, 'max': max, 'isComplex': isComplex }
        datagroup.append(dataset)

    if len(datagroup) == 1:
        return datagroup[0]
    else:
        return datagroup

def read_rawdata(filepath, datatype='image', doChaAverage = True, doChaSOSAverage = False, doAveAverage = True):
    ''' Reads rawdata files and returns NodeDataset '''

    twixObj = mapvbvd.mapVBVD(filepath)
    sqzDims = twixObj.image.sqzDims    
    twixObj.image.squeeze = True

    data = twixObj.image['']
    # Move Lin be first index
    linIndex = sqzDims.index('Lin')
    data = np.moveaxis(data, linIndex, 0)
    sqzDims.insert(0, sqzDims.pop(linIndex))

    if doAveAverage and 'Ave' in sqzDims:
        chaIndex = sqzDims.index('Ave')
        data = np.mean(data, axis=chaIndex)
        sqzDims.pop(chaIndex)
                
    if 'Par' in sqzDims:
        sliceIndex = sqzDims.index('Par')
        data = np.moveaxis(data, sliceIndex, 0)
        sqzDims.insert(0, sqzDims.pop(sliceIndex))
        is3D = True
    else:
        is3D = False

    if datatype == 'image':
        if is3D:
            data = np.fft.fftshift(np.fft.ifftn(np.fft.fftshift(data, axes=(0,1,2))))
        else:
            data = np.fft.fftshift(np.fft.ifft2(np.fft.fftshift(data, axes=(0, 1)), axes=(0, 1)), axes=(0, 1))
    else: # datatype is kspace
        pass

    if (doChaAverage or doChaSOSAverage) and 'Cha' in sqzDims:
        chaIndex = sqzDims.index('Cha')

        if doChaAverage:
            data = np.mean(data, axis=chaIndex)
        elif doChaSOSAverage:
            data = np.sqrt(np.sum(data**2, axis=(chaIndex)))

        sqzDims.pop(chaIndex)

    if 'Sli' in sqzDims:
        sliceIndex = sqzDims.index('Sli')
        data = np.moveaxis(data, sliceIndex, 0)
        sqzDims.insert(0, sqzDims.pop(sliceIndex))
    else:
        sqzDims.insert(0, 'Sli')
        data = data[np.newaxis, ...]


    min = float(np.nanmin(np.abs(data)))
    max = float(np.nanmax(np.abs(data)))
    isComplex = np.iscomplexobj(data)

    header =  twixObj.hdr
    return { 'data':data, 'dims':sqzDims, 'shape':data.shape, 'min': min, 'max': max, 'isComplex': isComplex } 