import './FileBrowserControls.scss';
import { useState } from 'react';
import { MdOutlineRefresh } from 'react-icons/md';
import { Icons } from '../Icons';

const FileBrowserControls = ({ onLoad, onRefresh, onBack, selectedItem }) => {
    const [filter, setFilter] = useState('')

    const loadButtonText = selectedItem?.type  === 'folder' ? 'Load Folder' : 'Load Data' ;

    return (
    <div className='file-browser-controls'>
        <div className='layout-row-center layout-space-between'>
            <div>
                <button className='button-primary'  onClick={onLoad}> { selectedItem ? loadButtonText : 'Load Current Folder'} </button>
            </div>
            <div className='controls-group'>
                <button className='button-icon' onClick={onRefresh}> <MdOutlineRefresh></MdOutlineRefresh> </button>
                <button className='button-icon' onClick={onBack}> <Icons.FileBrowser.Back/> </button>
            </div>
        </div>

        <div>
            <input type="text" name="path_filter" placeholder={'Filter files by name'} value={filter} onChange={(e) => setFilter(e)}/>
        </div>

    </div>
    )

}

export default FileBrowserControls;