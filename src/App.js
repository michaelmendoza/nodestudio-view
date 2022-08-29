import 'normalize.css';
import './styles/app.scss';
import './App.scss';
import AppState from './state/AppState';
import Viewport from './components/Viewport/Viewport';
import SideView from './components/SideView.jsx/SideView';

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
    return (
        <div>
            <header className="header"> 
                <div> NodeStudio Viewer</div>
            </header>
            <div>
                <SideView></SideView>
                <Viewport></Viewport>
            </div>
        </div>
    );
}

export default App;
