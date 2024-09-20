import logging
from fastapi import HTTPException
from typing import Callable, Any

logger = logging.getLogger(__name__)

def setup_logging() -> None:
    """Set up basic logging configuration."""
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                        filename='dataviewer.log')

def handle_error(func: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator for handling errors in route handlers."""
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            logger.exception(f"Unexpected error: {str(e)}")
            print(f"Unexpected error: {str(e)}")
            raise HTTPException(status_code=500, detail={f'message':"Error", 'error':{str(e)} })
    return wrapper