import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Domain } from '../workers/connection.worker';

export type DomainStore = Domain & {
    rebuilding?: boolean,
    rebuildDone?: boolean,
    rebuildPosition?: number,
    rebuildTotalTransactions?: number,
    backupRunning?: boolean,
    backupResult?: boolean,
    backupMessage?: string | null,
};

interface DomainStoreState {
    domains: Array<DomainStore> | null,
    setDomains: (domains: Array<DomainStore>) => void,
    updateDomain: (domain: DomainStore) => void,
    clear: () => void,
};

const useDomainStore = create<DomainStoreState>()(
    devtools(
        (set) => ({
            domains: null,
            setDomains: (domains) => set(() => ({ domains })),
            updateDomain: (domain) => set(state=>{
                let domains = state.domains;
                if(!domains) return {domains: [domain]};  // New
                let domainItem = domains.filter(item=>item.domaine === domain.domaine).pop() || {};
                let domainUpdate = {...domainItem, ...domain};
                let domainsUpdate = domains.map(item=>{
                    if(item.domaine === domainUpdate.domaine) { return domainUpdate };
                    return item;
                })
                return {domains: domainsUpdate};
            }),
            clear: () => set(()=>({domains: null})),
        })
    ),
);

export default useDomainStore;
