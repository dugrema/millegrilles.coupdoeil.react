import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FileHost, FileControler } from '../workers/connection.worker';

export type FilehostStoreItem = FileHost & {
};

export type FilecontrolerStoreItem = FileControler & {
};

interface FilehostingStoreState {
    filehosts: Array<FilehostStoreItem> | null,
    filecontrolers: Array<FilecontrolerStoreItem> | null,
    setFilehosts: (filehosts: Array<FilehostStoreItem>) => void,
    updateFilehosts: (filehost: FilehostStoreItem) => void,
    setFilecontrolers: (filecontrolers: Array<FilecontrolerStoreItem>) => void,
    updateFilecontrolers: (filecontroler: FilecontrolerStoreItem) => void,
    clear: () => void,
};

const useFilehostStore = create<FilehostingStoreState>()(
    devtools(
        (set) => ({
            filehosts: null,
            filecontrolers: null,
            setFilehosts: (filehosts) => set(() => ({ filehosts })),
            updateFilehosts: (filehost) => set(state=>{
                let filehosts = state.filehosts;
                if(!filehosts) return {filehosts: [filehost]};  // New
                let filehostItem = filehosts.filter(item=>item.instance_id === filehost.instance_id).pop() || {};
                let filehostUpdate = {...filehostItem, ...filehost};
                let filehostsUpdate = filehosts.map(item=>{
                    if(item.instance_id === filehostUpdate.instance_id) { return filehostUpdate };
                    return item;
                })
                return {filehosts: filehostsUpdate};
            }),
            setFilecontrolers: (filecontrolers) => set(() => ({ filecontrolers })),
            updateFilecontrolers: (filecontroler) => set(state=>{
                let filecontrolers = state.filecontrolers;
                if(!filecontrolers) return {filecontrolers: [filecontroler]};  // New
                let filecontrolerItem = filecontrolers.filter(item=>item.instance_id === filecontroler.instance_id).pop() || {};
                let filecontrolerUpdate = {...filecontrolerItem, ...filecontroler};
                let filecontrolersUpdate = filecontrolers.map(item=>{
                    if(item.instance_id === filecontrolerUpdate.instance_id) { return filecontrolerUpdate };
                    return item;
                })
                return {filecontrolers: filecontrolersUpdate};
            }),
            clear: () => set(()=>({filehosts: null, filecontrolers: null})),
        })
    ),
);

export default useFilehostStore;
