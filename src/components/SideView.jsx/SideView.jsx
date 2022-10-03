import './SideView.scss';
import Tabs from '../Tabs/Tabs';
import FileBrowser from '../FileBrowser/FileBrowser';
import FileDataList from '../FileDataList/FIleDataList';
import FileDataInfo from '../FileDataInfo/FileDataInfo';

const SideView = () => {
    return ( <div className="sideview">
        <Tabs tabnames={['Load', 'Files', 'Inspect']}>
                <FileBrowser></FileBrowser>
                <FileDataList></FileDataList>
                <FileDataInfo></FileDataInfo>
        </Tabs>
        
    </div>
    )
}

export default SideView;