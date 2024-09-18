import numpy as np
from dataserver.core.cache import CacheManager

class RoiData:

    def __init__(self, dataset):
        self.datasetID = dataset.id
        self.shape = dataset.shape
        self.roidata = np.zeros(self.shape)

class Dataset:

    def __init__(self, file):
        self.id = file.id
        self.file = file
        self.metadata = None
        self.data = None
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