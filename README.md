# Nodestudio View

A simple python data viewer with ROI/Segmenation tools

## Features

- Can load npy, dicom and raw data (from Siemens MRI scanner)
- Can view data in 2D, 3D View, and Lightbox modes
- Allows for viewing slices in N-dim dataset 
- Simple ROI tools for manual segmentation of images
- Control Pan/Zoom/ROI select with Left Mouse. Right mouse to switch options.

# Development 

## Local Development

Frontend javascript code located in dataviewer. Backend python server code located in dataserver.

To run locally frontend: ( From project root directory )
- Install nodejs. (Requires Node 14 or greater)
- Setup nodejs third party packages (uses npm install)
```
cd dataviewer
npm install
```
- To run frontend react server from dataviewer directory
``` 
npm run dev
```

To run locally backend api server: ( From project root directory )

- Create and setup conda enviroment 

> ```
> conda create -n dataserver python=3.9
> conda activate dataserver
> ```
> Then install packages with pip using requirements file 
> ```
> pip install -r dataserver/requirements.txt
> ```

- Run to API server
```
npm run api
```

### TODO:

* [x] Ability to switch between 2D and Lightbox modes 
* [x] ROI Persisiece between data switch
* [x] ROI for Lightbox mode 
* [x] 3D View Mode -> 3 slices (axial, sag, cor)
* [x] Query data value on hover on point
* [x] Fix Query data value on hover on point - for sag, cor slices
* [x] Fix GridBox for 3D View
* [x] Depth -> Multidimenstional includes all dims 
* [x] Read npy files (python data with numpy arrays)
* [ ] Persistent ROI data. ROI data stored on server and loaded on startup
* [X] Export ROI data mask, and segmented dataset values
* [X] ROI segmentated data stats (i.e. mean, std, min, max, histogram)
* [ ] Import ROI data
* [ ] Multiclass Segmenation
* [ ] Compare multiple segmenations
* [ ] Line View: Line Graph from 2D Graph View
* [ ] Read nifty file
* [ ] Read png images
* [ ] Fix ROI viewing for sag, cor slices
* [ ] Lightbox for raw data 
* [ ] Run custom code -> View data output 
* [ ] 3D View Controls 
* [ ] Image rotation
* [ ] Histogram / Thresholding 
* [ ] Measurement tools
* [ ] ChartControl: Added Slices option
* [ ] View Img, Complex, Mag, Phase of data 
* [ ] UI Update with draggable Control Bar
* [ ] Segment anything ML model 
