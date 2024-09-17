import uvicorn
from dataserver.core import io, download_example_data

if __name__ == "__main__":       
    download_example_data()
    uvicorn.run("dataserver.app:app", host="0.0.0.0", port=8001, reload=True, workers=1)