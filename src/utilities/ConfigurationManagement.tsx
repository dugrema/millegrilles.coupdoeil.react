import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import {proxy} from 'comlink';
import { Outlet } from 'react-router-dom';
import HeaderMenu from '../Menu';
import Footer from '../Footer';

function ConfigurationManagement() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" backLink={true} />

            <main className='fixed top-12 bottom-8 overflow-y-auto pt-2 pb-2 pl-2 pr-2 w-full'>
                <Outlet />
            </main>
            
            <Footer />

            <ConfigurationEventHandler />
        </div>
    );
}

export default ConfigurationManagement;

export function ConfigurationEventHandler() {
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();

    return <></>;
}
