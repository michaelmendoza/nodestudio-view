import './FileDataList.scss';
import { useEffect, useRef, useState } from 'react';
import { useAppState, ActionTypes } from '../../state';
import Divider from '../Divider/Divider';
import APIDataService from '../../services/APIDataService';

const FileDataList = () => {
    
    const { state, dispatch } = useAppState();
    const initRef = useRef(false);

    useEffect(() => {
        if(!initRef.current) {
            fetch();
            initRef.current = true;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetch = async () => {
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
                <button className='icon-button' onClick={(e) => onCancel(e, file)}> x </button>
            </div> )
        }
    </div>
    )
}

export default FileDataList;