import uuid
import numpy as np
from dataserver.core.cache import CacheManager

class RoiData:

    def __init__(self, dataset):
        self.datasetID = dataset.id
        self.shape = dataset.shape
        self.roidata = np.zeros(self.shape)

class Dataset:

    def __init__(self, file, data, metadata):
        self.id = id = uuid.uuid1().hex if (file.id == None or file.id == '') else id
        # file is a dict includes path, name, type
        self.file = file
        # metadata is a dict includes ndim, dims,shape, min, max, isComplex
        self.metadata = metadata
        self.data = data
        self.roi = None

        self.shape = file.shape
        DatasetCache.set(self.id, self)

class DatasetCache(CacheManager):
    
    @classmethod
    def get(cls, key: str) -> Dataset:
        ''' Retrieves dataset from cache using id as key '''
        return super().get_instance().get(key) 

    @classmethod
    def set(cls, key: str, value: Dataset):
        ''' Retrieves dataset from cache using id as key '''
        super().get_instance().set(key, value)