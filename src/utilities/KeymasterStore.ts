import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { KeymasterRecoveryRequest } from '../workers/connection.worker';

export type KeymasterRecoveryRequestStore = KeymasterRecoveryRequest & {instance_id: string};

interface KeymasterStoreState {
    keymasterRecoveryRequests: Array<KeymasterRecoveryRequestStore>,
    updateKeymasterRecoveryRequests: (request: KeymasterRecoveryRequestStore) => void,
    clear: () => void,
};

const useKeymasterStore = create<KeymasterStoreState>()(
    devtools(
        (set) => ({
            keymasterRecoveryRequests: [],
            updateKeymasterRecoveryRequests: (request) => set(state=>{
                let requests = state.keymasterRecoveryRequests;
                let instanceItems = requests.filter(item=>item.instance_id === request.instance_id).pop();

                // New item
                if(!instanceItems) {return {keymasterRecoveryRequests: [...requests, request]}};
                
                // Update item
                let requestUpdate = {...instanceItems, ...request};
                let requestsUpdate = requests.map(item=>{
                    if(item.instance_id === requestUpdate.instance_id) { return requestUpdate };
                    return requestUpdate;
                })
                return {keymasterRecoveryRequests: requestsUpdate};
            }),
            clear: () => set(()=>({keymasterRecoveryRequests: []})),
        })
    ),
);

export default useKeymasterStore;
