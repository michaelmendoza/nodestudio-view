name = "Jeff" # A Python variable

# Define a Python function
def multiplyTwoNumbers(x, y):
    return (x * y)

def createData():
    import numpy as np
    x = np.ones((2,2))
    x = np.uint16(x)
    return x

def base64encode(data):
    import base64
    encodedData = base64.b64encode(data)
    return encodedData

def createEncodedData():
    x = createData()
    return base64encode(x)