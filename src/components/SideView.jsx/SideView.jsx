import './SideView.scss';
import { useState } from 'react';
import Divider from '../Divider/Divider';
import Tabs from '../Tabs/Tabs';
import FileBrowser from '../FileBrowser/FileBrowser';
import FileDataList from '../FileDataList/FIleDataList';
import FileDataInfo from '../FileDataInfo/FileDataInfo';


const SideView = () => {
    return ( <div className="sideview">
        <Tabs tabnames={[ 'Files', 'Inspect']}>
                <FilesView></FilesView>
                <FileDataInfo></FileDataInfo>
        </Tabs>
    </div>
    )
}

const FilesView  = () => {
    const [showFileBroswer, setShowFileBroswer] = useState(false);

    return(<div>
        <button className='button-dark' onClick={() => setShowFileBroswer(!showFileBroswer)}> { showFileBroswer ? 'Back' : 'Load New File' }</button>
        <Divider></Divider>
        { showFileBroswer ? <FileBrowser></FileBrowser> : <FileDataList></FileDataList> }
    </div>)
}

export default SideView;