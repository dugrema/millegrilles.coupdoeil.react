import {proxy} from 'comlink';
import { Outlet } from 'react-router-dom';
import { SubscriptionMessage } from 'millegrilles.reactdeps.typescript';

import HeaderMenu from '../Menu';
import Footer from '../Footer';
import useInstanceStore from './instanceStore';
import useConnectionStore from '../connectionStore';
import useWorkers, { AppWorkers } from '../workers/workers';
import { useEffect, useMemo } from 'react';
import { ServerInstance, ServerInstancePresenceEventSubscriptionMessage } from '../workers/connection.worker';


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
                if(response.ok !== true) {
                    console.error("Error loading domain list: %O", response);
                    return;
                }
                if(response.server_instances) setInstances(response.server_instances)
            })
            .catch(err=>console.error("Error loading domain list", err));


        // Load current application packages
        workers.connection.getCurrentPackagesList()
            .then(response=>{
                if(response.resultats) setApplicationCurrentPackages(response.resultats);
                else console.error("Error receiving application packages: ", response);
            })
            .catch(err=>console.error("Error loading application packages", err));

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

async function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, updateInstance: (update: ServerInstance)=>void) {
    let content = event.message.content;
    if(!content) throw new Error("message .content is missing");
    let instanceId = content?.__certificate?.extensions?.commonName;
    let original = content['__original'];
    let timestamp = original?.estampille;

    if(!instanceId) return;  // No instance id

    let action = event.routingKey.split('.').pop();
    if(action === 'presenceInstance') {
        if(!timestamp) throw new Error("Missing timestamp from message");
        processEventPresenceInstance(instanceId, timestamp, event as ServerInstancePresenceEventSubscriptionMessage, updateInstance);
    }
}

async function processEventPresenceInstance(instance_id: string, timestamp: number, eventInstance: ServerInstancePresenceEventSubscriptionMessage, 
    updateInstance: (update: ServerInstance)=>void) 
{
    let instanceStatus = eventInstance.message.status;
    let serverInstance = {instance_id, timestamp, ...instanceStatus};
    updateInstance(serverInstance);
}
