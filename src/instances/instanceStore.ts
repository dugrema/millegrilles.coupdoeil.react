import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ApplicationPackage, ServerInstance } from '../workers/connection.worker';

export type ServerInstanceStore = ServerInstance & {
    
};

interface ServerInstanceStoreState {
    instances: Array<ServerInstanceStore> | null,
    applicationCurrentPackages: Array<ApplicationPackage> | null,
    installingApps: string[],
    errorInstallingApps: string[],
    setInstances: (instances: Array<ServerInstanceStore>) => void,
    updateInstance: (instance: ServerInstanceStore) => void,
    setApplicationCurrentPackages: (packages: Array<ApplicationPackage>) => void,
    addInstallingApp: (app: string )=> void,
    addErrorApp: (app: string )=> void,
    clear: () => void,
    clearAppInstallation: ()=>void,
};

const useInstanceStore = create<ServerInstanceStoreState>()(
    devtools(
        (set) => ({
            instances: null,
            applicationCurrentPackages: null,
            installingApps: [],
            errorInstallingApps: [],
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
            setApplicationCurrentPackages: (applicationCurrentPackages) => set(() => ({ applicationCurrentPackages })),
            addInstallingApp: (app) => set(state=>{
                let apps = [...state.installingApps, app];
                return { installingApps: apps };
            }),
            addErrorApp: (app) => set(state=>{
                let apps = state.installingApps.filter(item=>item!==app);
                let errorApps = [...state.errorInstallingApps, app];
                return { installingApps: apps, errorInstallingApps: errorApps };
            }),
            clear: () => set(()=>({instances: null, installingApps: [], errorInstallingApps: []})),
            clearAppInstallation: () => set(()=>({installingApps: [], errorInstallingApps: []})),
        })
    ),
);

export default useInstanceStore;
