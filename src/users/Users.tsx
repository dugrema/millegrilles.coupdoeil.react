import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { proxy } from 'comlink';

import HeaderMenu from '../Menu';
import Footer from '../Footer';
import useWorkers, { AppWorkers } from '../workers/workers';
import useUserStore from './userStore';
import useConnectionStore from '../connectionStore';
import { SubscriptionMessage } from 'millegrilles.reactdeps.typescript';
import { UserListItem, UserEventCallback } from '../workers/connection.worker';

function Users() {

    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();
    let setUsers = useUserStore(state=>state.setUsers);
    let updateDomain = useUserStore(state=>state.updateUser);
    let clearStore = useUserStore(state=>state.clear);

    let userEventsCb = useMemo(()=>{
        if(!workers) return null;
        return proxy((event: SubscriptionMessage)=>processEvent(workers, event, updateDomain))
    }, [workers, updateDomain]);

    useEffect(()=>{
        if(!ready || !userEventsCb) return;
        if(!workers) throw new Error('workers not initialized');

        // Register listener
        workers.connection.subscribeUserEvents(userEventsCb)
            .catch(err=>console.error("Error subscribing to chat conversation events", err));

        // Load domains
        workers.connection.getUserList()
            .then(response=>{
                console.debug("User list", response);
                setUsers(response.usagers)
            })
            .catch(err=>console.error("Error loading domain list", err));

        // Cleanup
        return () => { 
            // Unsubscribe listener
            if(workers && userEventsCb) {
                workers.connection.unsubscribeUserEvents(userEventsCb)
                    .catch(err=>console.error("Error unsubscribing from chat conversation events", err));
            }
    
            clearStore(); 
        }
    }, [ready, workers, clearStore, userEventsCb, setUsers, updateDomain]);

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

export default Users;

async function processEvent(workers: AppWorkers | null, event: SubscriptionMessage, updateUser: (update: UserListItem)=>void) {
    let eventUser = event as UserEventCallback;
    let action = event.routingKey.split('.').pop();

    console.debug("User event ", eventUser);

    // if(action === 'presenceDomaine') {
    //     processEventPresenceDomaine(eventDomains, updateDomain);
    // } else if(action === 'regeneration') {
    //     processEventRebuildDomain(eventDomains, updateDomain);
    // }
}

export function mapUserSecurity(user: UserListItem): string {
    if(!user) return '';
    if(user.delegation_globale === 'proprietaire') return '3.protege';
    if(user.compte_prive) return '2.prive';
    return '1.public';
}

export function sortUsers(a: UserListItem, b: UserListItem) {
    if(a===b) return 0;
    return a.nomUsager.localeCompare(b.nomUsager);
}
