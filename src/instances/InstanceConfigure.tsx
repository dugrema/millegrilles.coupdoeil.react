import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { FileHost } from "../workers/connection.worker";
import useInstanceStore from "./instanceStore";

function InstanceConfigure() {
    const { instanceId } = useParams();
    const workers = useWorkers();
    const ready = useConnectionStore(state => state.connectionAuthenticated);

    const deleteInstanceHandler = useCallback(async () => {
        if (!ready) return;
        if (!workers) throw new Error("workers not initialized");
        if (!instanceId) throw new Error("instanceId not provided");
        const response = await workers.connection.deleteInstance(instanceId);
        if (response.ok !== true) throw new Error("Error deleting instance: " + response);
    }, [workers, ready, instanceId]);

    return (
        <div className="space-y-8 pb-12 p-4">
            <ConfigureFileManager />

            <section className='bg-slate-800/50 border border-red-500/30 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-red-400 mb-4 border-b border-red-500/20 pb-2 flex items-center'>
                    <span className='mr-2'>⚠️</span> Danger zone
                </h2>
                <p className='text-slate-400 text-sm mb-4'>
                    This action is permanent and cannot be undone.
                </p>
                <ActionButton 
                    onClick={deleteInstanceHandler} 
                    disabled={!ready || !instanceId}
                    className="bg-red-600 hover:bg-red-500 border-red-500"
                >
                    Delete instance
                </ActionButton>
            </section>
        </div>
    )
};

export default InstanceConfigure;


function ConfigureFileManager() {
    const { instanceId } = useParams();
    const workers = useWorkers();
    const ready = useConnectionStore(state => state.connectionAuthenticated);
    const [filehosts, setFilehosts] = useState(null as FileHost[] | null);
    const instances = useInstanceStore(state => state.instances);

    const [selected, setSelected] = useState(null as string | null);
    const onChangeHandler = useCallback((e: ChangeEvent<HTMLSelectElement>) => setSelected(e.currentTarget.value), [setSelected]);

    useEffect(() => {
        if (!workers || !ready || !instanceId) return;
        workers.connection.getInstanceConfigurationList(instanceId)
            .then(response => {
                if (response.ok !== true) console.error("Error loading server instance configuration: %O", response)
                const filehostConfigId = response.configuration['filehost_id'];
                setSelected(filehostConfigId)
            })
            .catch(err => console.error("Error loading server instance configuration", err));
    }, [workers, ready, instanceId]);

    const filehostsOptions = useMemo(() => {
        const filehostsOpts = [<option key='default' value=''>Default</option>];
        if (filehosts) {
            const fileMappedInstances = filehosts.map(item => {
                let label = item.url_external;
                if (!label) {
                    const instance = instances?.filter(innerItem => innerItem.instance_id === item.instance_id).pop();
                    if (instance) {
                        label = instance.system_state.host?.hostname || label || instance.instance_id;
                    } else {
                        label = item.filehost_id;
                    }
                }
                return { filehost_id: item.filehost_id, label };
            })
            fileMappedInstances.sort((a: any, b: any) => a.label.localeCompare(b.label));

            for (const item of fileMappedInstances) {
                filehostsOpts.push(
                    <option key={item.filehost_id} value={item.filehost_id}>{item.label}</option>
                );
            }
        }
        return filehostsOpts;
    }, [filehosts, instances]);

    const saveInstanceFilehostHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error('workers not initialized');
        if (!instanceId) throw new Error('Instance id not provided');
        if (selected === null) throw new Error('File manager id not provided');
        const response = await workers.connection.setFilehostForInstance(instanceId, selected ? selected : null);
        if (response.ok !== true) {
            throw new Error(`Error changing file manager for instance: ${response.err}`);
        }
    }, [workers, ready, instanceId, selected]);

    useEffect(() => {
        if (!ready || !workers) return;
        workers.connection.getFilehostList()
            .then(result => {
                if (result.list) {
                    const filehosts = result.list.filter(item => !item.deleted);
                    setFilehosts(filehosts);
                }
            })
            .catch(err => console.error("Error loading file managers", err));
    }, [workers, ready]);

    return (
        <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
            <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                <span className='mr-2'>📁</span> Instance file host
            </h2>

            <div className='space-y-4'>
                <div className='flex flex-col space-y-2'>
                    <label htmlFor='select-file-manager' className='text-sm text-slate-400'>
                        Select file host
                    </label>
                    <select 
                        id='select-file-manager' 
                        value={selected || ''} 
                        onChange={onChangeHandler} 
                        className='bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                    >
                        {filehostsOptions}
                    </select>
                </div>
                <div className="pt-2">
                    <ActionButton onClick={saveInstanceFilehostHandler} disabled={!ready} mainButton={true}>
                        Save filehost
                    </ActionButton>
                </div>
            </div>
        </section>
    )
}
