import { fetchAPI, FetchTypes } from "./FetchUtils";

export const dataUrl = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

const APIDataService = {

    // ************* Files *************

    getFiles: () => fetchAPI(`${dataUrl}/files`, FetchTypes.GET),

    addFiles: (filepath, filename) => fetchAPI(`${dataUrl}/files/add?filepath=${filepath}&filename=${filename}`, FetchTypes.GET),

    getFileData: (id, key) => fetchAPI(`${dataUrl}/files/data?id=${id}&key=${key}&encode=${true}`, FetchTypes.GET),

    getFileMetadata: (id) => fetchAPI(`${dataUrl}/files/metadata?id=${id}`, FetchTypes.GET),

    getFilePreview: (id, size = 128) => fetchAPI(`${dataUrl}/files/preview?id=${id}&size=${size}`, FetchTypes.GET),

    // ************* FileSystem Path *************
   
    getPathQuery: (path = '') => fetchAPI(`${dataUrl}/path/query?path=${path}`, FetchTypes.GET),
    
}

export default APIDataService;