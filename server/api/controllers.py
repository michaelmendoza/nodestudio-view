import base64
import numpy as np
from core import io, path

def get_path_query(relative_path):
    data = path.query_path(relative_path)
    return { 'path': data[0], 'folders': data[1], 'files': data[2] }

def get_files():
    return io.get_files()

def read_file(filepath):
    io.read_file(filepath)
    return get_files()
    
def encode_data(data, min, max, dtype='uint16'):

    if (dtype == 'uint8'):
        resolution = 255
    else: # 'uint16'
        resolution = 4096 

    scaled_data = (data - min) * resolution / (max - min)
    _min = 0
    _max = resolution

    if (dtype == 'uint8'):
        scaled_data = np.uint8(scaled_data)
    else: # 'uint16'
        scaled_data = np.uint16(scaled_data)

    scaled_data = np.ascontiguousarray(scaled_data)
    encodedData = base64.b64encode(scaled_data)

    return encodedData, dtype, _min, _max

def get_data(fileid, key, encode = True):
    dataset = io.get_filedata(fileid)
    data = dataset['data']
    data = eval(f'data{key}')
    data = np.ascontiguousarray(data)
    shape = data.shape

    isComplex= False
    if np.iscomplexobj(data):
        data = np.abs(data)
        isComplex = True

    if (encode):
        data, dtype, min, max = encode_data(data, dataset['min'], dataset['max'])
    else:
        data = np.reshape(data, -1).tolist()
        dtype = data.dtype
        min = dataset['min']
        max = dataset['max']
    
    return  { 'data': data, 'shape': shape, 'min':min, 'max':max, 'dtype': dtype, 'isComplex': isComplex, 'isEncoded': encode }

def get_metadata(fileid):
    dataset = io.get_filedata(fileid)
    return { 'shape': dataset['shape'], 'dims': dataset['dims'] , 'min': dataset['min'], 'max': dataset['max'], 'isComplex': dataset['isComplex'] }