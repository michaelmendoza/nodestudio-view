import './Modal.scss';
import ReactDOM from 'react-dom';
import { Close } from '../Icons';

export const Modal = ({children, className = '', title = 'Modal Header', open, onClose, useClose=true}) => {

    const createModalDiv = () => {
        const modal = document.getElementById("modal")
        if(!modal) {
            const el = document.createElement("div");
            el.setAttribute("id", "modal");
            document.body.appendChild(el);
        }
    }

    createModalDiv();

    return ReactDOM.createPortal(
        <div>
            { open ? <div className={'modal layout-center ' + className}>
                { useClose ? <div className='modal-backdrop' onClick={onClose}></div> : null }
                <div className='modal-container'>
                    <div className='modal-header layout-center layout-space-between'> 
                        <h2> {title} </h2>
                        { useClose ? <button className='button-icon' onClick={onClose}> <Close></Close> </button>  : null }
                    </div>
                    <div className='modal-content'> 
                        <div className='modal-children'>
                            {children}     
                        </div> 
                           
                    </div>
                </div>
            </div> : null}
        </div>
    , document.getElementById('modal'));
};

export default Modal;