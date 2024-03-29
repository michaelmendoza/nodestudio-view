import os
import gdown
import zipfile

def download_example_data():
    # Downloads and extracts examples data for nodestudio from google drive location

    # Checks if example 1 data folder exists
    example_path = os.path.join(os.getcwd(), 'data', 'examples', 'example1', '')
    example1Exists = os.path.exists(example_path)
    if example1Exists:
        print('Nodestudio Examples: Example 1 data exists')
        return

    try:
        # Downloads example 1 data
        output = './data/examples'
        print('Downloading files ...')
        url = 'https://drive.google.com/drive/folders/1kdCB72bqZSpQqxkrVND9ZmsQydSJBG3F?usp=sharing'
        gdown.download_folder(url, quiet=False, output=output)
        print('Download complete.')

        # Extracts example data from .zip 
        filepath = './data/examples/example1_footdata.zip'
        targetdir = './data/examples/example1'
        print('Extracting files ...')
        with zipfile.ZipFile(filepath,"r") as zip_ref:
            zip_ref.extractall(targetdir)
            print('Extract complete.')
            print('Example 1 data located at: ./data/examples')
    except:
        print("Error: Failed to download example")