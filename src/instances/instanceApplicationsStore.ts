import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ServerInstanceApplicationInformation } from '../workers/connection.worker';


interface ServerInstanceApplicationStoreState {
    applications: ServerInstanceApplicationInformation | null,
    setApplications: (applications: ServerInstanceApplicationInformation) => void,
    clear: () => void,
};

const useInstanceApplicationStore = create<ServerInstanceApplicationStoreState>()(
    devtools(
        (set) => ({
            applications: null,
            setApplications: (applications) => set(()=>({applications})),
            clear: () => set(()=>({applications: null})),
        })
    ),
);

export default useInstanceApplicationStore;
