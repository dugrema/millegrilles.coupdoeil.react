import { Outlet } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { proxy } from 'comlink';

import HeaderMenu from '../Menu';
import Footer from '../Footer';
import useDomainStore, { DomainStore } from './domainStore';
import useWorkers, { AppWorkers } from '../workers/workers';
import useConnectionStore from '../connectionStore';
import { SubscriptionMessage } from 'millegrilles.reactdeps.typescript';
import { BackupEvent, Domain, DomaineEventCallback } from '../workers/connection.worker';
import { certificates, messageStruct } from 'millegrilles.cryptography';


function Domains() {

    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();
    let setDomains = useDomainStore(state=>state.setDomains);
    let updateDomain = useDomainStore(state=>state.updateDomain);
    let clearStore = useDomainStore(state=>state.clear);

    let domainEventsCb = useMemo(()=>{
        if(!workers) return null;
        return proxy((event: SubscriptionMessage)=>processEvent(workers, event, updateDomain))
    }, [workers, updateDomain]);

    useEffect(()=>{
        if(!ready || !domainEventsCb) return;
        if(!workers) throw new Error('workers not initialized');

        // Register listener
        workers.connection.subscribeDomainEvents(domainEventsCb)
            .catch(err=>console.error("Error subscribing to chat conversation events", err));

        // Load domains
        workers.connection.getDomainList()
            .then(response=>{
                // console.debug("Domain list", response);
                setDomains(response.resultats)
            })
            .catch(err=>console.error("Error loading domain list", err));

        // Cleanup
        return () => { 
            // Unsubscribe listener
            if(workers && domainEventsCb) {
                workers.connection.unsubscribeDomainEvents(domainEventsCb)
                    .catch(err=>console.error("Error unsubscribing from chat conversation events", err));
            }
    
            clearStore(); 
        }
    }, [ready, workers, clearStore, domainEventsCb, setDomains, updateDomain]);

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

export default Domains;

async function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, updateDomain: (update: Domain)=>void) {
    let eventDomains = event as DomaineEventCallback;
    let action = event.routingKey.split('.').pop();
    if(action === 'presenceDomaine') {
        processEventPresenceDomaine(eventDomains, updateDomain);
    } else if(action === 'regeneration') {
        processEventRebuildDomain(eventDomains, updateDomain);
    } else if(action === 'backupMaj') {
        processEventBackupDomain(eventDomains, updateDomain);
    } else {
        console.warn("Unknown event received: ", eventDomains);
    }
}

function processEventPresenceDomaine(eventDomains: DomaineEventCallback, updateDomain: (update: Domain)=>void) {
    let message = eventDomains.message;
    // @ts-ignore
    let presence = message.content['__original'].estampille;
    let presenceUpdate = { domaine: message.domaine, presence } as Domain;
    if(typeof(message.reclame_fuuids) === 'boolean') presenceUpdate.reclame_fuuids = message.reclame_fuuids;
    if(message.instance_id) presenceUpdate.instance_id = message.instance_id;
    updateDomain(presenceUpdate);
}

function processEventBackupDomain(eventDomains: DomaineEventCallback, updateDomain: (update: Domain)=>void) {
    let message = eventDomains.message as BackupEvent;
    // @ts-ignore
    let estampille = message.content['__original'].estampille;
    // @ts-ignore
    let certificat = message.content['__certificate'] as certificates.CertificateWrapper;
    let domain = eventDomains.routingKey.split('.')[1];
    if(!certificat.extensions?.domains?.includes(domain)) {
        console.warn("Backup event ignored, mismatch on domains");
        return;
    }
    let instanceId = certificat.extensions.commonName;
    let backupUpdate = { 
        domaine: domain, 
        instance_id: instanceId, 
        presence: estampille, 
        backupRunning: !message.done, 
        backupResult: message.ok } as DomainStore;
    if(message.err) backupUpdate.backupMessage = message.err;  // Avoid overriding last message
    else if(message.done && message.ok) backupUpdate.backupMessage = null;  // Reset
    updateDomain(backupUpdate);
}

type RebuildMessage = messageStruct.MilleGrillesMessage & {
    domaine: string,
    event: string,
    position?: number,
    stats_backup?: {
        nombre_transactions: number,
    },
    termine?: boolean,
}

function processEventRebuildDomain(eventDomains: DomaineEventCallback, updateDomain: (update: Domain)=>void) {
    let message = eventDomains.message as RebuildMessage;

    let rebuildEvent = message.event;
    if(!rebuildEvent) return;  // Nothing to do

    let statusUpdate = {domaine: message.domaine, rebuilding: message.termine === false, rebuildDone: false} as DomainStore;
    let done = message.termine === true;
    if(done) statusUpdate.rebuildDone = true;

    let position = message.position;
    let transactionCount = message?.stats_backup?.nombre_transactions;
    if(typeof(position) === 'number' && typeof(transactionCount) === 'number') {
        // Update count
        statusUpdate.rebuildPosition = position;
        statusUpdate.rebuildTotalTransactions = transactionCount;
    }

    updateDomain(statusUpdate);
}
