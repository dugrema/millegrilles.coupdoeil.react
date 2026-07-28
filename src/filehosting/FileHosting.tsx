import { useEffect, useMemo } from "react";
import { MessageResponse, SubscriptionMessage } from "millegrilles.reactdeps.typescript";
import { Outlet } from "react-router-dom";
import { proxy } from 'comlink';

import HeaderMenu from "../Menu";
import Footer from "../Footer";
import useWorkers, { AppWorkers } from "../workers/workers";
import useConnectionStore from "../connectionStore";
import useFilehostStore, { FilecontrolerStoreItem, FilehostStoreItem } from "./filehostingStore";
import { FilecontrolerStatusMessage, FileHost, FileHostUsageEventMessage } from "../workers/connection.worker";
import useInstanceStore from "../instances/instanceStore";
import { InstanceByIdType, ManagerStatusV2 } from "../workers/typesInstance";

function FileHosting() {

    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const setFilehosts = useFilehostStore(state=>state.setFilehosts);
    const setFilecontrolers = useFilehostStore(state=>state.setFilecontrolers);
    const updateFilehosts = useFilehostStore(state=>state.updateFilehosts);
    const updateFilecontrolers = useFilehostStore(state=>state.updateFilecontrolers);

    const domainEventsCb = useMemo(()=>{
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
            const filehostResponse = await workers.connection.getFilehostList();
            if(filehostResponse.ok !== true || !filehostResponse.list) {
                console.error("Error loading filehosts: %O", filehostResponse.err);
                return;
            }
            const filecontrolersResponse = await workers.connection.getFilecontrolersList();
            if(filecontrolersResponse.ok !== true || !filecontrolersResponse.list) {
                console.error("Error loading filecontrolers: %O", filecontrolersResponse.err);
                return;
            }
            setFilehosts(filehostResponse.list);

            const filecontrolers = filecontrolersResponse.list;
            const filecontrolerPrimaryId = filecontrolersResponse.filecontroler_primary;
            if((!filecontrolers || filecontrolers.length === 0) && filecontrolerPrimaryId) {
                const filecontrolers = [{instance_id: filecontrolerPrimaryId}]
                setFilecontrolers(filecontrolers);
            } else {
                setFilecontrolers(filecontrolers);
            }
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

type FilehostItemEvent = MessageResponse & FileHost;
type FilehostDeleteEvent = MessageResponse & {filehost_id: string};

async function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, 
    updateFilehosts: (e: FilehostStoreItem)=>void, updateFilecontrolers: (e: FilecontrolerStoreItem)=>void) 
{
    console.debug("FileHosting event", event);
    const rkSplit = event.routingKey.split('.');
    const domain = rkSplit[1];
    const action = rkSplit.pop();

    if(domain === 'CoreTopologie') {
        if(action === 'filehostAdd' || action === 'filehostUpdate') {
            const message = event.message as FilehostItemEvent;
            delete message.content
            updateFilehosts(message);
        } else if(action === 'filehostDelete') {
            const message = event.message as FilehostDeleteEvent;
            const filehostId = message.filehost_id;
            updateFilehosts({filehost_id: filehostId, deleted: true});
        } else if(action === 'filehostRestore') {
            const message = event.message as FilehostDeleteEvent;
            const filehostId = message.filehost_id;
            updateFilehosts({filehost_id: filehostId, deleted: false});
        } else {
            console.warn("Event received from CoreTopologie for unhandled action %s - DROPPED", action);
        }
    } else if(domain === 'filecontroler') {
        if(action === 'status') {
            const message = event.message as FilecontrolerStatusMessage;
            for(const fh of message.filehosts) {
                const status = {filehost_id: fh.filehost_id, connected: fh.connected, transfer_q_len: fh.transfer_q_len };
                updateFilehosts(status);
            }
            // @ts-ignore
            const timestamp = message.content['__original']?.estampille;
            const fileControlerUpdate = {
                instance_id: message.filecontroler_id,
                lastUpdate: timestamp,
            }
            updateFilecontrolers(fileControlerUpdate);
        } else if(action === 'filehostUsage') {
            const message = event.message as FileHostUsageEventMessage;
            const filehostId = message.filehost_id;
            const fuuid = message.fuuid;
            if(fuuid) updateFilehosts({filehost_id: filehostId, fuuid});
        } else {
            console.warn("Event received from filecontroler for unhandled action %s - DROPPED", action);
        }
    } else {
        console.warn("Event received from unhandled domain %s - DROPPED", domain);
    }
}

export function mapInstancesById(instances: ManagerStatusV2[]): InstanceByIdType {
    return instances?.reduce((instanceDict, instance)=>{
        instanceDict[instance.instance_id] = instance;
        return instanceDict;
    }, {} as InstanceByIdType);
}