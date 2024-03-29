import { fetchAPI, FetchTypes } from "./FetchUtils";

export const dataUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const APIDataService = {

    // ************* Files *************

    getFiles: () => fetchAPI(`${dataUrl}/files`, FetchTypes.GET),

    addFiles: (filepath, filename, id = '', options = undefined) => fetchAPI(`${dataUrl}/files/add?filepath=${filepath}&filename=${filename}&id=${id}`, FetchTypes.POST, options),

    removeFile: (id) => fetchAPI(`${dataUrl}/files/remove?id=${id}`, FetchTypes.GET),

    getFileData: (id, key, dims) => fetchAPI(`${dataUrl}/files/data?id=${id}&key=${key}&encode=${true}&dims=${dims}`, FetchTypes.GET),

    getFileMetadata: (id) => fetchAPI(`${dataUrl}/files/metadata?id=${id}`, FetchTypes.GET),

    getFilePreview: (id, size = 128) => fetchAPI(`${dataUrl}/files/preview?id=${id}&size=${size}`, FetchTypes.GET),

    // ************* FileSystem Path *************
   
    getPathQuery: (path = '') => fetchAPI(`${dataUrl}/path/query?path=${path}`, FetchTypes.GET),
    
    // ************* FileSystem Path *************

    exportROIData: (roi_data, shape) => fetchAPI(`${dataUrl}/roi/export`, FetchTypes.POST, {roi_data, shape}),

    exportDownload: () => window.location.href = `${dataUrl}/roi/download`,

    exportDownload2: () => fetchAPI(`${dataUrl}/roi/download`, FetchTypes.FILE),

}

export default APIDataService;