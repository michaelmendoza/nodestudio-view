from typing import List, Dict, TypeVar, Generic

T = TypeVar('T')

class CacheManager(Generic[T]):
    """Generic cache manager implemented with class methods."""
    
    _cache: Dict[str, T] = {}

    @classmethod
    def get(cls, key: str) -> T:
        """Retrieve an item from the cache."""
        return cls._cache.get(key) # type: ignore

    @classmethod
    def set(cls, key: str, value: T) -> None:
        """Store an item in the cache."""
        cls._cache[key] = value

    @classmethod
    def remove(cls, key: str) -> None:
        """Remove an item from the cache."""
        cls._cache.pop(key, None)

    @classmethod
    def values(cls) -> List[T]:
        """Get all values stored in the cache."""
        return list(cls._cache.values())

    @classmethod
    def keys(cls) -> List[str]:
        """Get all keys stored in the cache."""
        return list(cls._cache.keys())

    @classmethod
    def clear(cls) -> None:
        """Clear all items from the cache."""
        cls._cache.clear()

    @classmethod
    def size(cls) -> int:
        """Get the number of items in the cache."""
        return len(cls._cache)

    @classmethod
    def exists(cls, key: str) -> bool:
        """Check if a key exists in the cache."""
        return key in cls._cache