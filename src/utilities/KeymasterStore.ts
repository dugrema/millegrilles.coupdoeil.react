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
                // Update
                let instanceItems = requests.filter(item=>item.instance_id === request.instance_id).pop() || {};
                let requestUpdate = {...instanceItems, ...request};
                let requestsUpdate = requests.map(item=>{
                    if(item.instance_id === requestUpdate.instance_id) { return requestUpdate };
                    return item;
                })
                return {keymasterRecoveryRequests: requestsUpdate};
            }),
            clear: () => set(()=>({keymasterRecoveryRequests: []})),
        })
    ),
);

export default useKeymasterStore;
