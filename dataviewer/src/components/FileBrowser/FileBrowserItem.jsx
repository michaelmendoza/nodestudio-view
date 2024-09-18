import { Icons } from '../Icons';
import './FileBrowserItem.scss';

const FileBrowserItem = ({ item, type, onSelect, isActive }) => {

    const handleSelect = (e) => {
        onSelect(e, item, type);
    }

    return (
        <div className={'file-browser-item ' + (isActive ? 'active' : null)} onClick={handleSelect}>
            { type === 'folder' ? <Icons.FileBrowser.Folder/> : null }
            { type === 'file' ? <Icons.FileBrowser.File/> : null }
            <label> { item } </label>
        </div>
    )
}

export default FileBrowserItem;