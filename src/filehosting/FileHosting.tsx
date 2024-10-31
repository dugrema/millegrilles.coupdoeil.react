import { useEffect, useMemo } from "react";
import { SubscriptionMessage } from "millegrilles.reactdeps.typescript";
import { Outlet } from "react-router-dom";
import { proxy } from 'comlink';

import HeaderMenu from "../Menu";
import Footer from "../Footer";
import useWorkers, { AppWorkers } from "../workers/workers";
import useConnectionStore from "../connectionStore";
import useFilehostStore, { FilecontrolerStoreItem, FilehostStoreItem } from "./filehostingStore";

function FileHosting() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let setFilehosts = useFilehostStore(state=>state.setFilehosts);
    let setFilecontrolers = useFilehostStore(state=>state.setFilecontrolers);
    let updateFilehosts = useFilehostStore(state=>state.updateFilehosts);
    let updateFilecontrolers = useFilehostStore(state=>state.updateFilecontrolers);

    let domainEventsCb = useMemo(()=>{
        if(!workers) return null;
        return proxy((event: SubscriptionMessage)=>processEvent(workers, event, updateFilehosts, updateFilecontrolers))
    }, [workers, updateFilehosts, updateFilecontrolers]);

    useEffect(()=>{
        if(!ready || !domainEventsCb) return;
        if(!workers) throw new Error('workers not initialized');

        // Register listener
        workers.connection.subscribeFilehostingEvents(domainEventsCb)
            .catch(err=>console.error("Error subscribing to chat conversation events", err));

        // Load hosts and controlers
        Promise.resolve().then(async ()=>{
            if(!workers) throw new Error('workers not initialized');
            let filehostResponse = await workers.connection.getFilehostList();
            console.debug("filehost Response %O", filehostResponse);
            if(filehostResponse.ok !== true || !filehostResponse.list) {
                console.error("Error loading filehosts: %O", filehostResponse.err);
                return;
            }
            let filecontrolersResponse = await workers.connection.getFilecontrolersList();
            console.debug("filecontrolers Response: %O", filecontrolersResponse);
            if(filecontrolersResponse.ok !== true || !filecontrolersResponse.list) {
                console.error("Error loading filecontrolers: %O", filecontrolersResponse.err);
                return;
            }
            setFilehosts(filehostResponse.list);
            setFilecontrolers(filecontrolersResponse.list);
        })
        .catch(err=>console.error("Error loading file hosting", err));

        // Cleanup
        return () => { 
            // Unsubscribe listener
            if(workers && domainEventsCb) {
                workers.connection.unsubscribeFilehostingEvents(domainEventsCb)
                    .catch(err=>console.error("Error unsubscribing from chat conversation events", err));
            }
        }
    }, [ready, workers, domainEventsCb, setFilehosts, setFilecontrolers]);

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

export default FileHosting;

async function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, 
    updateFilehosts: (e: FilehostStoreItem)=>void, updateFilecontrolers: (e: FilecontrolerStoreItem)=>void) 
{
    throw new Error('todo');
}
