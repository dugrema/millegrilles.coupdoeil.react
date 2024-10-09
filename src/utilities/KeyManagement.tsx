import HeaderMenu from '../Menu';
import Footer from '../Footer';
import { Link, Outlet } from 'react-router-dom';


function KeyManagement() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" backLink={true} />

            <main className='fixed top-9 bottom-8 overflow-y-auto pt-2 pb-2 pl-2 pr-2 w-full'>
                <Outlet />
            </main>
            
            <Footer />
        </div>
    );
}

export default KeyManagement;
