import math
import base64
import numpy as np
from io import BytesIO
from PIL import Image
from dataserver.core import io, path

def get_path_query(relative_path):
    data = path.query_path(relative_path)
    return { 'path': data[0], 'folders': data[1], 'files': data[2] }

def get_files():
    return io.get_files()

def read_file(filepath, filename, id, options ):
    io.read_file(filepath, filename, id, options)
    return get_files()
    
def remove_file(id):
    return io.remove_file(id)

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

    return encodedData, dtype, _min, _max, resolution

def get_data(fileid, key, encode = True, dims = ['Sli','Lin','Col']):
    # Retrive data
    dataset = io.get_filedata(fileid)
    data = dataset['data']

    # Reshape data if dims requires
    dataset_dims = dataset['dims']
    dims = eval(dims)

    # Slice data and reorganize array to encoding
    data = eval(f'data{key}')
    data = np.ascontiguousarray(data)
    shape = data.shape

    # Take mag of complex data
    isComplex= False
    if np.iscomplexobj(data):
        data = np.abs(data)
        isComplex = True

    # Encode data and generate basic statistics
    if (encode):
        data, dtype, min, max, resolution = encode_data(data, dataset['min'], dataset['max'])
    else:
        data = np.reshape(data, -1).tolist()
        dtype = data.dtype
        min = dataset['min']
        max = dataset['max']
        resolution = None
    
    return  { 'data': data, 'shape': shape, 'dims': dataset_dims, 'min':min, 'max':max, 'resolution': resolution, 'dtype': dtype, 'isComplex': isComplex, 'isEncoded': encode }

def get_metadata(fileid):
    dataset = io.get_filedata(fileid)
    return { 'shape': dataset['shape'], 'dims': dataset['dims'] , 'min': dataset['min'], 'max': dataset['max'], 'isComplex': dataset['isComplex'] }


def get_file_preview_img(fileid, size = 128):
    dataset = io.get_filedata(fileid)
    
    ''' Generate key for preview img'''
    shape = dataset['shape']
    indices = [math.floor(s / 2) for s in shape ]

    if len(indices) == 2:
        data = dataset['data'][:,:]
    else:
        key = '['
        for dim, index in enumerate(indices):
            if dim == 1 or dim == 2:
                key += ':'
            else:
                key += str(index)
            if dim < len(indices) - 1:
                key += ','
        key += ']'

        data = dataset['data']
        data = eval(f'data{key}')

    if np.iscomplexobj(data):
        data = np.abs(data)
    min = float(np.nanmin(data))
    max = float(np.nanmax(data))
    scaled_data = (data - min) * 255 / (max - min)
    scaled_data = np.uint8(scaled_data)

    buffered = BytesIO()
    im = Image.fromarray(np.uint8(scaled_data))
    im = im.resize((size, size))
    im.save(buffered, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode()

def export_roi_data(roi_data, shape): 
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
