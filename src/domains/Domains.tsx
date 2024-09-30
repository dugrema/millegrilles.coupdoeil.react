import HeaderMenu from '../Menu';
import Footer from '../Footer';
import { Link, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import useDomainStore from './domainStore';
import useWorkers from '../workers/workers';


function Domains() {

    let workers = useWorkers();
    let clearStore = useDomainStore(state=>state.clear);

    useEffect(()=>{
        if(!workers) throw new Error('workers not initialized');

        console.warn("TODO - Initialize domain store");
        // Register listener

        // Load domains

        // Cleanup
        return () => { 
            console.warn("TODO - Cleanup Domains");
            // Unsubscribe listener

            clearStore(); 
        }
    }, [workers, clearStore]);

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" backLink={true} />

            <main className='fixed top-6 bottom-8 overflow-y-auto pt-4 pb-2 pl-2 pr-2 w-full'>
                <Outlet />
            </main>
            
            <Footer />
        </div>
    );
}

export default Domains;
