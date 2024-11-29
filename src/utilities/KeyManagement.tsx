import { useEffect, useMemo } from 'react';
import {proxy} from 'comlink';
import { Outlet } from 'react-router-dom';

import useWorkers, { AppWorkers } from '../workers/workers';
import useKeymasterStore, { KeymasterRecoveryRequestStore } from './KeymasterStore';
import HeaderMenu from '../Menu';
import Footer from '../Footer';
import useConnectionStore from '../connectionStore';
import { SubscriptionMessage } from 'millegrilles.reactdeps.typescript';
import { KeymasterRecoveryRequest, KeymasterRecoveryRequestCallback } from '../workers/connection.worker';


function KeyManagement() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" backLink={true} />

            <main className='fixed top-9 bottom-8 overflow-y-auto pt-2 pb-2 pl-2 pr-2 w-full'>
                <Outlet />
            </main>
            
            <Footer />

            <KeymasterEventHandler />
        </div>
    );
}

export default KeyManagement;

export function KeymasterEventHandler() {
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();
    // let keymasterRecoveryRequests = useKeymasterStore(state=>state.keymasterRecoveryRequests);
    let updateKeymasterRecoveryRequests = useKeymasterStore(state=>state.updateKeymasterRecoveryRequests);

    let eventsCb = useMemo(()=>{
        if(!workers) return null;
        return proxy((event: SubscriptionMessage)=>processEvent(workers, event, updateKeymasterRecoveryRequests))
    }, [workers, updateKeymasterRecoveryRequests]);

    useEffect(()=>{
        if(!ready || !eventsCb) return;
        if(!workers) throw new Error('workers not initialized');

        // Register listener
        workers.connection.subscribeKeymasterEvents(eventsCb)
            .catch(err=>console.error("Error subscribing to chat conversation events", err));

        // Cleanup
        return () => { 
            // Unsubscribe listener
            if(workers && eventsCb) {
                workers.connection.subscribeKeymasterEvents(eventsCb)
                    .catch(err=>console.error("Error unsubscribing from chat conversation events", err));
            }
        }
    }, [ready, workers, eventsCb]);

    return <></>;
}

async function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, 
    updateRequests: (update: KeymasterRecoveryRequestStore)=>void) 
{
    let request = event as KeymasterRecoveryRequestCallback;
    let action = event.routingKey.split('.').pop();
    console.debug("Keymaster recovery event", request);
    if(action === 'demandeCleSymmetrique') {
        let message = request.message as KeymasterRecoveryRequest;
        let cleSymmetriqueCa = message.cle_symmetrique_ca;
        let certificate = message.content?.__certificate;
        let certificatePem = message.content?.__original?.certificat;
        let instanceId = certificate?.extensions?.commonName;
        let requestStore = {instance_id: instanceId, cle_symmetrique_ca: cleSymmetriqueCa, certificate, certificatePem, ...request} as KeymasterRecoveryRequestStore;
        console.debug("processEvent demandeCleSymmetrique: ", requestStore)
        updateRequests(requestStore);
    }
}
