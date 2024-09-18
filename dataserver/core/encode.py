import base64
import numpy as np

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