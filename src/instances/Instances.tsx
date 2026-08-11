import {proxy} from 'comlink';
import { Outlet } from 'react-router-dom';
import { SubscriptionMessage } from 'millegrilles.reactdeps.typescript';

import HeaderMenu from '../Menu';
import Footer from '../Footer';
import useInstanceStore from './instanceStore';
import useConnectionStore from '../connectionStore';
import useWorkers, { AppWorkers } from '../workers/workers';
import { useEffect, useMemo } from 'react';
import { ManagerStatusV2, SystemState } from '../workers/typesInstance';


function Instances() {
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

export default Instances;

export function InstanceEventHandler() {
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();
    let setInstances = useInstanceStore(state=>state.setInstances);
    let updateInstance = useInstanceStore(state=>state.updateInstance);
    let setApplicationCurrentPackages = useInstanceStore(state=>state.setApplicationCurrentPackages);

    let instanceEventsCb = useMemo(()=>{
        if(!workers) return null;
        return proxy((event: SubscriptionMessage)=>processEvent(workers, event, updateInstance))
    }, [workers, updateInstance]);

    useEffect(()=>{
        if(!ready || !instanceEventsCb) return;
        if(!workers) throw new Error('workers not initialized');

        // Register listener
        workers.connection.subscribeInstanceEvents(instanceEventsCb)
            .catch(err=>console.error("Error subscribing to chat conversation events", err));

        // Load domains
        workers.connection.getInstanceList()
            .then(response=>{
                // console.debug("Instance response", response);
                if(response.ok !== true || !response.results) {
                    console.error("Error loading domain list: %O", response);
                    return;
                }
                setInstances(response.results)
            })
            .catch(err=>console.error("Error loading domain list", err));

        // Cleanup
        return () => { 
            // Unsubscribe listener
            if(workers && instanceEventsCb) {
                workers.connection.unsubscribeInstanceEvents(instanceEventsCb)
                    .catch(err=>console.error("Error unsubscribing from chat conversation events", err));
            }
        }
    }, [ready, workers, instanceEventsCb, setInstances, setApplicationCurrentPackages]);

    return <></>;
}

async function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, updateInstance: (update: ManagerStatusV2)=>void) {
    let content = event.message.content;
    if(!content) throw new Error("message .content is missing");
    let instanceId = content?.__certificate?.extensions?.commonName;
    let original = content['__original'];
    let timestamp = original?.estampille;

    if(!instanceId) return;  // No instance id

    let action = event.routingKey.split('.').pop();
    if(action === 'presenceInstanceV2') {
        if(!timestamp) throw new Error("Missing timestamp from message");
        // console.debug("Presence instance ", event);
        const system_state = event.message.system_state as SystemState;

        // Securite matches the exchange except for 4.secure (that manager has a level 3.protege certificate)
        let securite = event.exchange;
        if(securite === '3.protege' && event.message.securite) securite = event.message.securite;

        const instanceUpdate = {
            instance_id: instanceId,
            timestamp: new Date(timestamp*1000).toISOString(),
            supprime: false,
            securite,
            system_state,
        } as ManagerStatusV2;
        updateInstance(instanceUpdate);
    }
}
