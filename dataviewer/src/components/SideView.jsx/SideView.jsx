import './SideView.scss';
import Divider from '../Divider/Divider';
import Tabs from '../Tabs/Tabs';
import FileDataList from '../FileDataList/FIleDataList';
import FileDataInfo from '../FileDataInfo/FileDataInfo';
import FileInspector from '../FileInspector/FileInspector';
import { FileBrowserModal } from '../FileBrowser/FileBrowserModal';

const SideView = () => {
    return ( <div className="sideview">
        <Tabs tabnames={[ 'Files', 'Options', 'Inspect']}>
                <FilesView></FilesView>
                <FileDataInfo></FileDataInfo>
                <FileInspector></FileInspector>
        </Tabs>
    </div>
    )
}

const FilesView  = () => {
    return(<div>
        <FileBrowserModal></FileBrowserModal>
        <Divider></Divider>
        <FileDataList></FileDataList>
    </div>)
}

export default SideView;