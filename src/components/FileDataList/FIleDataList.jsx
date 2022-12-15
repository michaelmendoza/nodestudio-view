import './FileDataList.scss';
import { useEffect, useRef } from 'react';
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

    return ( <div className='filedatalist'>
        <label> Active File: </label>
        <div> { state.activeFile?.name ? state.activeFile?.name : 'Please load file' } </div>
        
        <Divider></Divider>

        {
            state.files.map((file, index) => <div key={index} className='filedata-item' onClick={() => onSelect(file)}> 
                <img src={file.img} style={{width:'64px'}} alt='preview' />
                <label> { file.name } </label>
            </div> )
        }
    </div>
    )
}

export default FileDataList;