import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { FileHost } from "../workers/connection.worker";
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
    // let [fileManagers, setFileManagers] = useState(null as FileManager[] | null);;
    let [filehosts, setFilehosts] = useState(null as FileHost[] | null);;
    let instances = useInstanceStore(state=>state.instances);
    
    let currentInstance = useMemo(()=>{
        if(!instances || !instanceId) return null;
        return instances.filter(item=>item.instance_id===instanceId).pop();
    }, [instances, instanceId]);

    let [selected, setSelected] = useState(null as string | null);
    let onChangeHandler = useCallback((e: ChangeEvent<HTMLSelectElement>)=>setSelected(e.currentTarget.value), [setSelected]);

    let filehostsOptions = useMemo(()=>{
        let filehostsOpts = [<option key='default' value=''>Default</option>];
        if(filehosts) {
            // Make list of instances with labels, then sort labels
            let fileMappedInstances = filehosts.map(item=>{
                let label = item.url_external;
                if(!label) {
                    let instance = instances?.filter(innerItem=>innerItem.instance_id === item.instance_id).pop();
                    if(instance) {
                        label = instance.domaine || label;
                    } else {
                        label = item.filehost_id;
                    }
                }
                return {filehost_id: item.filehost_id, label};
            })
            fileMappedInstances.sort((a: any, b: any)=>a.label.localeCompare(b.label));

            // Add sorted options
            for(let item of fileMappedInstances) {
                filehostsOpts.push(
                    <option key={item.filehost_id} value={item.filehost_id}>{item.label}</option>
                );
            }
        }
        return filehostsOpts;
    }, [filehosts, instances]);

    let saveInstanceFilehostHandler = useCallback(async () => {
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceId) throw new Error('Instance id not provided');
        if(selected === null) throw new Error('File manager id not provided');
        let response = await workers.connection.setFilehostForInstance(instanceId, selected?selected:null);
        if(response.ok !== true) {
            throw new Error(`Error changing file manager for instance: ${response.err}`);
        }
    }, [workers, ready, instanceId, selected]);

    useEffect(()=>{
        if(!ready || !workers) return;
        workers.connection.getFilehostList()
            .then(result=>{
                console.debug("File managers", result);
                if(result.list) {
                    let filehosts = result.list.filter(item=>!item.deleted);
                    setFilehosts(filehosts);
                }
            })
            .catch(err=>console.error("Error loading file managers", err));
    }, [workers, ready, setFilehosts]);

    useEffect(()=>{
        if(!currentInstance) return;
        if(selected !== null) return;
        // Init
        if(currentInstance.filehost_id) {
            setSelected(currentInstance.filehost_id);
        } else {
            setSelected('');
        }
    }, [currentInstance, instances, selected, setSelected]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4'>Instance file host</h2>

            <div className='grid grid-cols-1 md:grid-cols-3'>
                <label htmlFor='select-file-manager'>Select file host</label>
                <select id='select-file-manager' value={selected||''} onChange={onChangeHandler} 
                    className='text-black col-span-2'>
                    {filehostsOptions}
                </select>
            </div>
            <ActionButton onClick={saveInstanceFilehostHandler} disabled={!ready} mainButton={true}>Save</ActionButton>
        </section>
)
}
