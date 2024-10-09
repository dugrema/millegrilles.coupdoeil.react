import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { proxy } from 'comlink';

import HeaderMenu from '../Menu';
import Footer from '../Footer';
import useConnectionStore from '../connectionStore';
import useWorkers, { AppWorkers } from '../workers/workers';
import useFileManagerStore, { FileManagerStore } from './fileManagementStore';
import { SubscriptionMessage } from 'millegrilles.reactdeps.typescript';


function FileManagement() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let setFileManagers = useFileManagerStore(state=>state.setFileManagers);
    let updateFileManagers = useFileManagerStore(state=>state.updateFileManageres);

    let domainEventsCb = useMemo(()=>{
        if(!workers) return null;
        return proxy((event: SubscriptionMessage)=>processEvent(workers, event, updateFileManagers))
    }, [workers, updateFileManagers]);

    useEffect(()=>{
        if(!ready || !domainEventsCb) return;
        if(!workers) throw new Error('workers not initialized');

        // Register listener
        workers.connection.subscribeFileManagerEvents(domainEventsCb)
            .catch(err=>console.error("Error subscribing to chat conversation events", err));

        // Load domains
        workers.connection.getFileManagerList()
            .then(response=>{
                console.debug("getFileManagerList Response", response);
                if(response.liste) setFileManagers(response.liste);
                else console.error("Error receiving file manager list", response.err);
            })
            .catch(err=>console.error("Error loading domain list", err));

        // Cleanup
        return () => { 
            // Unsubscribe listener
            if(workers && domainEventsCb) {
                workers.connection.unsubscribeFileManagerEvents(domainEventsCb)
                    .catch(err=>console.error("Error unsubscribing from chat conversation events", err));
            }
        }
    }, [ready, workers, domainEventsCb, setFileManagers]);

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

export default FileManagement;

function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, updateFileManager: (e: FileManagerStore)=>void) {
    console.debug("processEvent ", event);

    let action = event.routingKey.split('.').pop();
    if(action === 'presence') {
        processEventPresence(event, updateFileManager);
    } else if(action === 'changementConsignationPrimaire') {

    } else if(action === 'syncPrimaire') {
        
    } else if(action === 'syncDownload') {
        
    } else if(action === 'syncUpload') {
        
    } else if(action === 'instanceConsignationSupprimee') {
        
    } else {
        console.warn("Unmanaged event", event);
    }
}

function processEventPresence(event: SubscriptionMessage, updateFileManager: (e: FileManagerStore)=>void) {
    let certificate = event.message?.content?.__certificate;
    let estampille = event.message?.content?.__original?.estampille;
    if(certificate) {
        let instanceId = certificate.extensions?.commonName;
        if(instanceId) {
            console.debug("Presence instance_id %s at %s", instanceId, estampille);
            let updateValue = {instance_id: instanceId, '_mg-derniere-modification': estampille};
            updateFileManager(updateValue);
        }
    }
}
