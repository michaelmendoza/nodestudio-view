import 'normalize.css';
import './styles/app.scss';
import './App.scss';
import AppState from './state/AppState';
import Viewport from './components/Viewport/Viewport';
import SideView from './components/SideView.jsx/SideView';
import LoadingModal from './components/LoadingModal/LoadingModal';

const App = () => {
    return (
        <div className="app">
            <AppState.AppStateProvider>
                <AppComponents></AppComponents>
            </AppState.AppStateProvider>
        </div>
    );
}

const AppComponents = () => {
    const { state } = AppState.useAppState();

    return (
        <div className='app-components'>
            <header className="header"> 
                <div> NodeStudio Viewer</div>
            </header>
            <div className='main-components'>
                <SideView></SideView>
                <Viewport></Viewport>
            </div>
            <LoadingModal></LoadingModal>
        </div>
    );
}

export default App;
