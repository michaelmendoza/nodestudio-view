import base64
import numpy as np
from PIL import Image
from io import BytesIO
from typing import Tuple

def encode_data(data : np.ndarray, min: float, max: float, dtype: str = 'uint16') -> Tuple[bytes, str, float, float, float]:
    """Encode data for data transfer from backend to frontend."""

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

def encode_preview(data, indices, size = 128) -> str:
    """Encode data for a preview image for given indices."""

    if len(indices) == 2:
        # 2d data
        # TODO: Add support for 2d data with more than 2 dims
        data = data[:,:]
    else:
        # 3d data 
        key = '['
        for dim, index in enumerate(indices):
            if dim == 1 or dim == 2:
                key += ':'
            else:
                key += str(index)
            if dim < len(indices) - 1:
                key += ','
        key += ']'

        data = data
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