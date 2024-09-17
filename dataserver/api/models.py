from typing import Any, List, Dict
from pydantic import BaseModel
from xmlrpc.client import Boolean

class FileDataOptions(BaseModel):
    datatype : str = 'image'
    doChaAverage : Boolean = True
    doChaSOSAverage : Boolean = False
    doAveAverage : Boolean = True

class ROIData(BaseModel):
    roi_data: str
    shape: List[int] = []