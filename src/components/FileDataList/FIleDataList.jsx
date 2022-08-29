import './FileDataList.scss';
import { useEffect } from 'react';
import { useAppState, ActionTypes } from '../../state';
import Divider from '../Divider/Divider';
import APIDataService from '../../services/APIDataService';
const FileDataList = () => {
    
    const { state, dispatch } = useAppState();

    useEffect(() => {
        fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetch = async () => {
        let files = await APIDataService.getFiles();
        dispatch({ type:ActionTypes.SET_FILES, files });
    }

    const onSelect = (file) => {
        dispatch({ type:ActionTypes.SET_ACTIVE_FILE, payload: file })
    }

    return ( <div className='filedatalist'>
        <label> Active File: </label>
        <div> { state.activeFile?.id ? state.activeFile?.id : 'Please load file' } </div>
        
        <Divider></Divider>

        {
            state.files.map((file, index) => <div key={index} className='filedata-item' onClick={() => onSelect(file)}>{ JSON.stringify(file) } </div> )
        }
    </div>
    )
}

export default FileDataList;