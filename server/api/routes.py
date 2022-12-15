import traceback
from typing import Any, List
from functools import wraps
from xmlrpc.client import Boolean
from fastapi import APIRouter, HTTPException

from api import controllers

def handle_exception(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            data = await func(*args, **kwargs)
        except Exception as e:
            error_message = str(traceback.format_exc())
            print(error_message)
            raise HTTPException(status_code=500, detail = {'message':"Error", 'error':error_message })
        else:
            return data

    return wrapper

router = APIRouter(prefix="/api")

@router.get("/files")
@handle_exception
async def get_files():
    ''' Retrieves all loaded files '''
    data = controllers.get_files()
    return { 'message': 'Loaded files', 'data': data }

@router.get("/files/add")
@handle_exception
async def read_file(filepath: str, filename: str = ''):
    ''' Reads files in filepath '''
    data = controllers.read_file(filepath, filename)
    return { 'message': 'Read file', 'data': data }

@router.get("/files/data")
@handle_exception
async def get_data(id: str, key: str, encode: Boolean):
    ''' Gets data for given id '''
    data = controllers.get_data(id, key, encode)
    return { 'message': 'Retrieved data', 'data': data }

@router.get("/files/metadata")
@handle_exception
async def get_metadata(id: str):
    ''' Gets metadata for given id '''
    data = controllers.get_metadata(id)
    return { 'message': 'Retrieved metadata', 'data': data }

@router.get("/files/preview")
@handle_exception
async def get_file_preview_img(id: str, size: int = 128):
    ''' Retrieves all loaded files '''
    data = controllers.get_file_preview_img(id, size)
    return { 'message': 'Generated preview img', 'data': data }

@router.get("/path/query")
@handle_exception
async def get_path_query(path: str):
    ''' Updates entries '''
    data = controllers.get_path_query(path)
    return { 'message': 'Retrieved path filesystem query', 'data': data }

