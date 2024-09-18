import './FileDataList.scss';
import { useEffect, useRef, useState } from 'react';
import { useAppState, ActionTypes } from '../../state';
import Divider from '../Divider/Divider';
import APIDataService from '../../services/APIDataService';
import { throttle } from '../../libraries/Utils';
import { Close } from '../Icons';

const FileDataList = () => {
    
    const { state, dispatch } = useAppState();
    const initRef = useRef(false);

    useEffect(() => {
        fetchLimited();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.files.length]);

    const fetch = async () => {
        console.log('Updating FileList') // TODO: FilePreview called too often. Should cache these previews.
        let files = await APIDataService.getFiles();

        // Fetch FilePreviews
        for (let i = 0; i < files.length; i++) {
            if(!files[i].img) {
                const imgSrc = await APIDataService.getFilePreview(files[i].id);
                files[i].img = imgSrc;
            }
        }

        dispatch({ type:ActionTypes.SET_FILES, files });
    }

    const fetchLimited = () => throttle(fetch, 500, 'fetch--filedatalist');

    const onSelect = (file) => {
        dispatch({ type:ActionTypes.SET_ACTIVE_FILE, payload: file })
    }

    const onCancel = async (e, file) => {
        e.stopPropagation();
        APIDataService.removeFile(file.id);
        const files = state.files.filter((_file) => _file.id !== file.id);
        dispatch({ type:ActionTypes.SET_FILES, files });
    }
    
    return ( <div className='filedatalist'>
        
        <label className='active-file-label'> Active File:  { state.activeFile?.name ? state.activeFile?.name : 'Please load file to view.' }</label>
        
        <Divider></Divider>

        {
            state.files.map((file, index) => <div key={index} className='filedata-item' onClick={() => onSelect(file)}> 
                <img src={file.img} style={{width:'64px'}} alt='preview' />
                <label> { file.name } </label>
                <button className='close-button icon-button' onClick={(e) => onCancel(e, file)}> <Close></Close> </button>
            </div> )
        }
    </div>
    )
}

export default FileDataList;