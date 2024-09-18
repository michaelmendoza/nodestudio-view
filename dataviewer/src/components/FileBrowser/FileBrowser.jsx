import './FileBrowser.scss';
import { useEffect, useState } from 'react';
import APIDataService from '../../services/APIDataService';
import FileBrowserPath from './FileBrowserPath';
import FileBrowserControls from './FileBrowserControls';
import FileBrowserItem from './FileBrowserItem';

export const FileBrowser = ({onSelect}) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [relativePath, setRelativePath] = useState('');
    const [pathInfo, setPathInfo] = useState({ path:'', folders:[], files:[] });

    useEffect(()=>{
        const fetch = async() => {
            setSelectedItem(null);
            let data = await APIDataService.getPathQuery(relativePath);
            if (data) setPathInfo(data);
            else data = { path:'', folders:[], files:[] };
        }

        fetch();
    }, [relativePath])

    const handleFileItemSelect = (e, item, type) => {
        const path = relativePath.concat("/", item)    
        
        if (e.detail == 1) { // Select on item on single click
            setSelectedItem({item, path, type})
        }

        if (e.detail == 2) { // Load item on double click
            
            if (type === 'folder') {
                setRelativePath(path);
            }
            if (type === 'file') {
                onSelect(path);
            }
        }
    }

    const backOneDirectory = () => {
        if (relativePath === 'data') return;
        const last_slash_pos = relativePath.lastIndexOf('/');
        const path = relativePath.slice(0, last_slash_pos);
        setRelativePath(path)
    }

    const refreshBrowser = async() => {
        setPathInfo(await APIDataService.getPathQuery(relativePath));
    }

    const handleFileLoad = async () => {
        selectedItem ? onSelect(selectedItem.path) : onSelect(relativePath);
    }

    const isSelected = (item) => {
        return selectedItem?.item === item
    }

    return (
    <div className='file-browser'> 
        <FileBrowserControls onLoad={handleFileLoad} onRefresh={refreshBrowser} onBack={backOneDirectory} selectedItem={selectedItem}></FileBrowserControls>
        <FileBrowserPath path={relativePath} setPath={setRelativePath}></FileBrowserPath>
        <div className='file-browser-list'>
            {
                pathInfo.folders.map((item, index)=> <FileBrowserItem key={index} item={item} type={'folder'} onSelect={handleFileItemSelect} isActive={isSelected(item)}></FileBrowserItem>)
            }

            {
                pathInfo.files.map((item, index)=> <FileBrowserItem key={index} item={item} type={'file'} onSelect={handleFileItemSelect} isActive={isSelected(item)}></FileBrowserItem>)
            }
        </div>
    </div>
    )
}

export default FileBrowser;