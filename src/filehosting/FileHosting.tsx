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

            let filecontrolers = filecontrolersResponse.list;
            let filecontrolerPrimaryId = filecontrolersResponse.filecontroler_primary;
            if((!filecontrolers || filecontrolers.length === 0) && filecontrolerPrimaryId) {
                let filecontrolers = [{instance_id: filecontrolerPrimaryId}]
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
    console.debug("processEvent Received ", event);
    let rkSplit = event.routingKey.split('.');
    let domain = rkSplit[1];
    let action = rkSplit.pop();

    if(domain === 'CoreTopologie') {
        if(action === 'filehostAdd' || action === 'filehostUpdate') {
            let message = event.message as FilehostItemEvent;
            delete message.content
            updateFilehosts(message);
        } else if(action === 'filehostDelete') {
            let message = event.message as FilehostDeleteEvent;
            let filehostId = message.filehost_id;
            updateFilehosts({filehost_id: filehostId, deleted: true});
        } else if(action === 'filehostRestore') {
            let message = event.message as FilehostDeleteEvent;
            let filehostId = message.filehost_id;
            updateFilehosts({filehost_id: filehostId, deleted: false});
        } else {
            console.warn("Event received from CoreTopologie for unhandled action %s - DROPPED", action);
        }
    } else if(domain === 'filecontroler') {
        if(action === 'status') {
            console.debug("Filehost status %O", event.message);
            let message = event.message as FilecontrolerStatusMessage;
            for(let fh of message.filehosts) {
                let status = {filehost_id: fh.filehost_id, connected: fh.connected, transfer_q_len: fh.transfer_q_len };
                updateFilehosts(status);
            }
            // @ts-ignore
            let timestamp = message.content['__original']?.estampille;
            let fileControlerUpdate = {
                instance_id: message.filecontroler_id,
                lastUpdate: timestamp,
            }
            updateFilecontrolers(fileControlerUpdate);
        } else if(action === 'filehostUsage') {
            console.debug("Event filehost usage %O", event.message)
            let message = event.message as FileHostUsageEventMessage;
            let filehostId = message.filehost_id;
            let fuuid = message.fuuid;
            if(fuuid) updateFilehosts({filehost_id: filehostId, fuuid});
        // } else if(action === 'filehostNewFuuid') {
        //     console.debug("!!! TODO Filehost new fuuid %O", event.message)
        // } else if(action === 'transferUpdate') {
        //     console.debug("!!! TODO Filehost transferUpdate %O", event.message)
        } else {
            console.warn("Event received from filecontroler for unhandled action %s - DROPPED", action);
        }
    } else {
        console.warn("Event received from unhandled domain %s - DROPPED", domain);
    }
}
