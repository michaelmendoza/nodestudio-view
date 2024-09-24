import math
import base64
import numpy as np
from typing import Dict, Any, Tuple, List
from dataserver.core.cache import CacheManager
from dataserver.core.encode import encode_data, encode_preview
class RoiData:
    def __init__(self, dataset: 'Dataset'):
        self.datasetID: str = dataset.id
        self.shape: Tuple[int, ...] = dataset.metadata['shape']
        self.mask: np.ndarray = np.zeros(self.shape, dtype=bool)

    def get_nonzero_indices(self) -> Tuple[np.ndarray, ...]:
        """Return the indices of non-zero elements in the mask."""
        return np.nonzero(self.mask)

    def set_mask(self, mask: np.ndarray) -> None:
        """Set a new mask, ensuring it matches the shape of the dataset."""
        if mask.shape == self.shape:
            self.mask = mask.astype(bool)
        else:
            raise ValueError("Mask shape does not match dataset shape")

    def update_mask(self, indices: List[List[int]], add: bool = True) -> None:
        """ Add or remove points from the mask based on the provided indices. """
        if not indices:
            return

        # Check dimensionality
        point_dim = len(indices[0])
        if point_dim not in (2, 3) or point_dim != len(self.shape):
            raise ValueError(f"Indices dimensionality ({point_dim}) does not match mask dimensionality ({len(self.shape)})")

        # Create a boolean array for indexing
        idx = tuple(np.array(indices).T)

        if add:
            self.mask[idx] = True
        else:
            self.mask[idx] = False

    def get_slice(self, key: str) -> Dict[str, Any]:
        """Get a slice of the mask, pack it into bits, and encode it."""
        sliced_mask = eval(f'self.mask{key}')
        packed_mask = np.packbits(sliced_mask)
        packed_mask = np.ascontiguousarray(packed_mask)
        encoded_mask = base64.b64encode(packed_mask)
        
        return {
            'mask': encoded_mask,
            'shape': sliced_mask.shape,
            'dtype': 'bool',
            'packed_shape': packed_mask.shape
        }
class Dataset:
    def __init__(self, file: Dict[str, Any], data: np.ndarray, metadata: Dict[str, Any]):
        self.id: str = file['id']
        self.file: Dict[str, Any] = file
        self.metadata: Dict[str, Any] = metadata
        self.data: np.ndarray = data
        self.roi: RoiData = RoiData(self)

    def generate_preview_img(self, size: int = 128) -> str:
        """Generate a preview image for the dataset."""
        shape = self.metadata['shape']
        indices = [math.floor(s / 2) for s in shape ]
        return encode_preview(self.data, indices, size)

    def get_data_subset(self, fileid: str, key: str, encode: bool = True, dims: List[str] = ['Sli','Lin','Col']) -> Dict[str, Any]:
        """Retrieve data for a specific file and key."""
        
        # Reshape data if dims requires
        dataset_dims = self.metadata['dims']
        dims = eval(dims)

        # Slice data and reorganize array to encoding
        data = self.data
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
            data, dtype, min, max, resolution = encode_data(data, self.metadata['min'], self.metadata['max'])
        else:
            data = np.reshape(data, -1).tolist()
            dtype = data.dtype
            min = self.metadata['min']
            max = self.metadata['max']
            resolution = None
        
        return  { 'data': data, 'shape': shape, 'dims': dataset_dims, 'min':min, 'max':max, 'resolution': resolution, 'dtype': dtype, 'isComplex': isComplex, 'isEncoded': encode }

    def get_roi_statistics(self) -> Dict[str, Any]:
        """Calculate and return statistics for the ROI data."""
        bins = 20
        roi_indices = self.roi.get_nonzero_indices()
        roi_data = self.data[roi_indices]
        
        return {
            'size': roi_data.size,
            'mean': float(np.mean(roi_data)),
            'median': float(np.median(roi_data)),
            'std_dev': float(np.std(roi_data)),
            'min': float(np.min(roi_data)),
            'max': float(np.max(roi_data)),
            'histogram': (np.histogram(roi_data, bins=bins)[0].tolist(), np.histogram(roi_data, bins=bins)[1].tolist())
        }
    
    def export_segmented_data(self, filepath: str) -> None:
        """Export ROI data and statistics to a file."""
        roi_indices = self.roi.get_nonzero_indices()
        roi_stats = self.get_roi_statistics()
        
        export_data = {
            'mask': self.roi.mask,
            'indices': np.array(roi_indices),
            'values': self.data[roi_indices],
            'statistics': roi_stats
        }
        
        np.save(filepath, export_data)

class DatasetCache(CacheManager[Dataset]):
    """Cache manager specifically for Dataset objects."""
    
    @classmethod
    def get(cls, key: str) -> Dataset:
        return super().get(key)

    @classmethod
    def set(cls, key: str, value: Dataset) -> None:
        super().set(key, value)

    @classmethod
    def values(cls) -> List[Dataset]:
        return super().values()