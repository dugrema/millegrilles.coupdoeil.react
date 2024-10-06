import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ServerInstance } from '../workers/connection.worker';

export type ServerInstanceStore = ServerInstance & {
    
};

interface ServerInstanceStoreState {
    instances: Array<ServerInstanceStore> | null,
    setInstances: (instances: Array<ServerInstanceStore>) => void,
    updateInstance: (instance: ServerInstanceStore) => void,
    clear: () => void,
};

const useInstanceStore = create<ServerInstanceStoreState>()(
    devtools(
        (set) => ({
            instances: null,
            setInstances: (instances) => set(() => ({ instances })),
            updateInstance: (instance) => set(state=>{
                let instances = state.instances;
                if(!instances) return {instances: [instance]};  // New
                let instanceItems = instances.filter(item=>item.instance_id === instance.instance_id).pop() || {};
                let instanceUpdate = {...instanceItems, ...instance};
                let instancesUpdate = instances.map(item=>{
                    if(item.instance_id === instanceUpdate.instance_id) { return instanceUpdate };
                    return item;
                })
                return {instances: instancesUpdate};
            }),
            clear: () => set(()=>({instances: null})),
        })
    ),
);

export default useInstanceStore;
