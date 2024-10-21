import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { FileManager } from "../workers/connection.worker";
import { sortFileManagers } from "../consignation/FileManagerList";
import { JsxElement } from "typescript";
import useInstanceStore from "./instanceStore";

function InstanceConfigure() {

    let { instanceId } = useParams();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let deleteInstanceHandler = useCallback(async () => {
        if(!ready) return;
        if(!workers) throw new Error("workers not initialized");
        if(!instanceId) throw new Error("instanceId not provided");
        let response = await workers.connection.deleteInstance(instanceId)
        if(response.ok !== true) throw new Error("Error deleting instance: " + response);
    }, [workers, ready, instanceId]);

    return (
        <>
            <ConfigureFileManager />

            <section className='pt-10'>
                <h2 className='text-lg font-bold pt-4'>Danger zone</h2>
                <ActionButton onClick={deleteInstanceHandler} disabled={!ready || !instanceId}>
                        Delete instance
                </ActionButton>
            </section>
        </>
    )
};

export default InstanceConfigure;

function ConfigureFileManager() {

    let { instanceId } = useParams();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let [fileManagers, setFileManagers] = useState(null as FileManager[] | null);;
    let instances = useInstanceStore(state=>state.instances);
    
    let currentInstance = useMemo(()=>{
        if(!instances || !instanceId) return null;
        return instances.filter(item=>item.instance_id===instanceId).pop();
    }, [instances, instanceId]);

    let [selected, setSelected] = useState(null as string | null);
    let onChangeHandler = useCallback((e: ChangeEvent<HTMLSelectElement>)=>setSelected(e.currentTarget.value), [setSelected]);

    let fileManagerOptions = useMemo(()=>{
        let fileManagerOpts = [<option key='default' value=''>Default</option>];
        if(fileManagers) {
            // Make list of instances with labels, then sort labels
            let fileMappedInstances = fileManagers.map(item=>{
                let label = item.instance_id;
                let instance = instances?.filter(innerItem=>innerItem.instance_id === item.instance_id).pop();
                if(instance) {
                    label = instance.domaine || label;
                }
                return {instance_id: item.instance_id, label};
            })
            fileMappedInstances.sort((a: any, b: any)=>a.label.localeCompare(b.label));

            // Add sorted options
            for(let item of fileMappedInstances) {
                fileManagerOpts.push(
                    <option key={item.instance_id} value={item.instance_id}>{item.label}</option>
                );
            }
        }
        return fileManagerOpts;
    }, [fileManagers, instances]);

    let saveInstanceFileManagerHandler = useCallback(async () => {
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceId) throw new Error('Instance id not provided');
        if(selected === null) throw new Error('File manager id not provided');
        // workers.connexion.setConsignationPourInstance(instanceId, consignation_id)
        let response = await workers.connection.setFileManagerForInstance(instanceId, selected?selected:null);
        if(response.ok !== true) {
            throw new Error(`Error changing file manager for instance: ${response.err}`);
        }
    }, [workers, ready, instanceId, selected]);

    useEffect(()=>{
        if(!ready || !workers) return;
        workers.connection.getFileManagerList()
            .then(result=>{
                console.debug("File managers", result);
                let fileManagers = result.liste.filter(item=>!item.supprime);
                fileManagers.sort(sortFileManagers);
                setFileManagers(fileManagers);
            })
            .catch(err=>console.error("Error loading file managers", err));
    }, [workers, ready, setFileManagers]);

    useEffect(()=>{
        if(!currentInstance) return;
        if(selected !== null) return;
        // Init
        if(currentInstance.consignation_id) {
            setSelected(currentInstance.consignation_id);
        } else {
            setSelected('');
        }
    }, [currentInstance, instances, selected, setSelected]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4'>Instance file manager</h2>

            <div className='grid grid-cols-1 md:grid-cols-3'>
                <label htmlFor='select-file-manager'>Select file manager</label>
                <select id='select-file-manager' value={selected||''} onChange={onChangeHandler} 
                    className='text-black col-span-2'>
                    {fileManagerOptions}
                </select>
            </div>
            <ActionButton onClick={saveInstanceFileManagerHandler} disabled={!ready} mainButton={true}>Save</ActionButton>
        </section>
)
}
