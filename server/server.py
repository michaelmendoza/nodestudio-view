import sys, os
import time
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api import routes
from core import io, download_example_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_examples():
    print('Startup!')

    filepath = os.path.join(os.getcwd(), 'data', 'examples', 'example1', '')
    example1Exists = os.path.exists(filepath)
    if example1Exists:
        files = io.read_file(filepath, 'Example1', 'example1-b7027ec6f5b311ecbc2eacde48001122') #'./data/examples/example1'
        print('Example data loaded: ' + files)
    else:
        print('Warning: Unable to load Example data.')

@app.get("/")
def read_root():
    url_list = [{"path": route.path, "name": route.name} for route in app.routes]
    return {"message": "Welcome Node Studio Viewer", "routes": url_list}

app.include_router(routes.router)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

if __name__ == "__main__":       
    download_example_data()
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True, debug=True, workers=4)