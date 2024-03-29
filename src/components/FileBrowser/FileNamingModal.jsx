import './FileNamingModal.scss';
import { useEffect, useState } from 'react';
import { useAppState } from "../../state/AppState";
import Modal from '../Modal/Modal'
import TextInput from '../TextInput/TextInput';

const FileNamingModal = ({showModal, setShowModal, filename, setFilename, loadFile}) => {
    const { state } = useAppState();

    const handleFileNaming = () => {
        if (filename === '') return;
        else {
            loadFile();
            setShowModal(false);
        }
    }

    return (
        <Modal title='Load File' open={showModal} onClose={() => setShowModal(!showModal)}>
            <div className='file-naming-modal'>
                <TextInput name="Enter file name" value={filename} onChange={(e) => setFilename(e.target.value)}></TextInput>
                <div className='layout-row-center'>
                    <button onClick={handleFileNaming}>Save</button>
                </div>
            </div>
        </Modal>
        
    )

}

export default FileNamingModal;