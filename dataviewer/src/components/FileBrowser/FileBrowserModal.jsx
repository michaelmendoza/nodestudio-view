import './FileBrowserModal.scss';
import APIDataService from '../../services/APIDataService';
import { Modal } from "../Modal/Modal";
import { Button } from "../Basic/Button";
import { useState } from "react";
import { useAppState, ActionTypes } from "../../state";
import { FileBrowser } from "../FileBrowser/FileBrowser";
import Status from '../../state/models/Status';

export const FileBrowserModal = ({}) => {
    const {state, dispatch} = useAppState();
    const [path, setPath] = useState('');
    const [showModal, setShowModal] = useState(false);

    const openModal = () => {
        setShowModal(true);
    }
  
    const closeModal = () => {
        setShowModal(false);
    }

    const handleSelect = (path) => {
        setPath(path);
        loadFile(path);
        setShowModal(false);
    }

    const loadFile = async (path) => {
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: true, message: 'Load DataFile ...'}) });
        let name = path.split('/').at(-1); // Remove string after slash
        await APIDataService.addFiles(path, name);
        let files = await APIDataService.getFiles();
        dispatch({ type:ActionTypes.SET_FILES, files });
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({show: false}) });
    }

    return (<div className="file-loader">
        <Button onClick={openModal} className="button-dark"> Load File </Button> 
        <Modal title='File Browser' className={'file-loader-modal'} open={showModal} onClose={closeModal}>
            <div><FileBrowser onSelect={handleSelect}></FileBrowser></div>
        </Modal>
    </div>)
}