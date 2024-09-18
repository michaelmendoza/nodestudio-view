
class CacheManager(object):
    ''' Manages cache as a singleton object. Use get_instance to get instance of manager. '''
    
    _instance = None
    _cache_store = {}

    def __init__(self):
        raise RuntimeError("Call get_instance() instead")

    @classmethod
    def get_instance(cls):
        ''' Retrieves singleton instance of cache manager '''
        if cls._instance is None:
            cls._instance = cls.__new__(cls)
        return cls._instance

    def exist(self, key: str) -> bool:
        ''' Checks if key is in cache '''
        return key in self._cache_store 

    def set(self, key: str, value):
        ''' Sets cache with key/value pair '''
        self._cache_store[key] = value

    def get(self, key: str):
        ''' Retrieves value from cache using key '''
        if (key in self._cache_store):
            return self._cache_store[key]
        return None

    def keys(self):
        ''' Retrives all keys stored '''
        return list(self._cache_store.keys())