import './LoadingModal.scss';
import Modal from '../Modal/Modal'
import { LoadingSpinner } from '../Loading/Loading';
import { useState } from 'react';
import { useEffect } from 'react';
import { useAppState } from '../../state';

const LoadingModal = () => {

    const {state} = useAppState();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setShowModal(state.status.show);
    }, [state.status])

    return (
        <Modal title='Loading' open={showModal} onClose={() => setShowModal(!showModal)} useClose={false}>
            <div className='loading-modal layout-center'>
                <LoadingSpinner></LoadingSpinner> 
                <div className='loading-modal-message'> 
                    <label> { state.status?.message } </label>
                </div>
            </div>
        </Modal>
    )
}

export default LoadingModal;