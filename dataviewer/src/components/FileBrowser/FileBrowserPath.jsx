import { Icons } from '../Icons';
import './FileBrowserPath.scss';

const FileBrowserPath = ({ path, setPath }) => {

    const formatPath = () => {
        const pathArray = path.split('/').filter(item => item != '')
        const paths = pathArray.reduce((paths, path) => {
            const last = paths.length > 0 ? paths[paths.length - 1] : '';
            paths.push(last + '/' + path );
            return paths;
        }, [])

        return pathArray.map((pathItem, index) => 
            <span key={index} onClick={() => setPath(paths[index])}>{ pathItem } / </span>)
    }

    return (
    <div className='file-browser-path'>
        <span onClick={() => setPath("")}> <Icons.FileBrowser.Folder/> </span>
        <div className='path'> / { formatPath() }  </div>
    </div>
    )
}

export default FileBrowserPath;