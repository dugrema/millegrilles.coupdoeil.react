import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FileManager } from '../workers/connection.worker';

export type FileManagerStore = FileManager & {
};

interface FileManagerStoreState {
    fileManagers: Array<FileManagerStore> | null,
    setFileManagers: (fileManagers: Array<FileManagerStore>) => void,
    updateFileManageres: (fileManager: FileManagerStore) => void,
    clear: () => void,
};

const useFileManagerStore = create<FileManagerStoreState>()(
    devtools(
        (set) => ({
            fileManagers: null,
            setFileManagers: (fileManager) => set(() => ({ fileManagers: fileManager })),
            updateFileManageres: (fileManager) => set(state=>{
                let fileManagers = state.fileManagers;
                if(!fileManagers) return {fileManagers: [fileManager]};  // New
                let fileManagerItem = fileManagers.filter(item=>item.instance_id === fileManager.instance_id).pop() || {};
                let fileManagerUpdate = {...fileManagerItem, ...fileManager};
                let fileManagersUpdate = fileManagers.map(item=>{
                    if(item.instance_id === fileManagerUpdate.instance_id) { return fileManagerUpdate };
                    return item;
                })
                return {fileManagers: fileManagersUpdate};
            }),
            clear: () => set(()=>({fileManagers: null})),
        })
    ),
);

export default useFileManagerStore;
