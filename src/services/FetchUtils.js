import * as Logger from './LoggingService';

export const FetchTypes = {
    'POST': 'POST',
    'GET': 'GET',
    'IMG': 'IMG',
    'FILE': 'FILE',
}

export const fetchAPI = (url, type, payload) => {
    let options = {
        'POST': createPostOptions,
        'GET': createGetOptions,
        'IMG': createImgGetOptions,
        'FILE': createFileGetOptions,
    }

    return fetch(url, options[type](payload)).then(handleMiddleware);
}

export const handleMiddleware = (response) => {
    const p = new Promise(resolve => resolve(response));

    return p.then(() => { 
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {

            return response.json()
            .then(data => { Logger.log(response.url, data); return data.data; })
            .catch(error => { Logger.log(response.url, error); return undefined; });

        }
        else {
            return response;
        }
        
    });
}

export const createPostOptions = (body) => ({ 
    method: 'POST', 
    headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json;charset=UTF-8'   
    },
    body: JSON.stringify(body)
});

export const createGetOptions = () => ({ 
    method: 'GET', 
    headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json;charset=UTF-8;'
    }
});

export const createImgGetOptions = () => ({
    method: 'GET',
    headers: {
        'Content-Type': 'image/png',
        'Content-Transfer-Encoding': 'base64'
    }
});

export const createFileGetOptions = () => ({
    method: 'GET',
    headers: {
       
    }
});