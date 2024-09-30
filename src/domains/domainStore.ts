import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DomainStoreState {
    domains: Array<Array<any>> | null,
    setDomains: (domains: Array<any>) => void,
    clear: () => void,
};

const useDomainStore = create<DomainStoreState>()(
    devtools(
        (set) => ({
            domains: null,
            setDomains: (domains) => set(() => ({ domains })),
            clear: () => set(()=>({domains: null})),
        })
    ),
);

export default useDomainStore;
