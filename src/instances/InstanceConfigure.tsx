import { ChangeEvent, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
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

            <WebCertificate />

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

    let [selected, setSelected] = useState(null as string | null);
    let onChangeHandler = useCallback((e: ChangeEvent<HTMLSelectElement>)=>setSelected(e.currentTarget.value), [setSelected]);

    useEffect(()=>{
        if(!workers || !ready || !instanceId) return;
        workers.connection.getInstanceConfigurationList(instanceId)
            .then(response=>{
                console.debug("Configuration", response);
                if(response.ok !== true) console.error("Error loading server instance configuration: %O", response)
                let filehostConfigId = response.configuration['filehost_id'];
                setSelected(filehostConfigId)
            })
            .catch(err=>console.error("Error loading server instance configuration", err));
    }, [workers, ready, instanceId, setSelected]);

    let filehostsOptions = useMemo(()=>{
        let filehostsOpts = [<option key='default' value=''>Default</option>];
        if(filehosts) {
            // Make list of instances with labels, then sort labels
            let fileMappedInstances = filehosts.map(item=>{
                let label = item.url_external;
                if(!label) {
                    let instance = instances?.filter(innerItem=>innerItem.instance_id === item.instance_id).pop();
                    if(instance) {
                        label = instance.hostname || label;
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
                if(result.list) {
                    let filehosts = result.list.filter(item=>!item.deleted);
                    setFilehosts(filehosts);
                }
            })
            .catch(err=>console.error("Error loading file managers", err));
    }, [workers, ready, setFilehosts]);

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
            <ActionButton onClick={saveInstanceFilehostHandler} disabled={!ready} mainButton={true}>Save filehost</ActionButton>
        </section>
    )
}

function WebCertificate() {

    let { instanceId } = useParams();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let instances = useInstanceStore(state=>state.instances);

    let currentInstance = useMemo(()=>{
        if(!instances || !instanceId) return null;
        return instances.filter(item=>item.instance_id===instanceId).pop();
    }, [instances, instanceId]);

    let [email, setEmail] = useState('');
    let emailOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
        let value = e.currentTarget.value;
        setEmail(value);
    }, [setEmail]);
    let [additionalDomains, setAdditionalDomains] = useState(null as string[] | null);
    let [additionalDomainString, setAdditionalDomainString] = useState('');
    let additionalDomainOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
        let value = e.currentTarget.value;
        setAdditionalDomainString(value);
    }, [setAdditionalDomainString]);
    let addDomainHandler = useCallback(async ()=>{
        console.debug("Add domain ", additionalDomainString);
        if(!additionalDomainString) throw new Error('Invalid domain name (empty)');
        let additionalDomainsUpdated = additionalDomains?[...additionalDomains]:[];
        additionalDomainsUpdated.push(additionalDomainString);
        setAdditionalDomainString('');
        setAdditionalDomains(additionalDomainsUpdated);
    }, [additionalDomainString, setAdditionalDomainString, additionalDomains, setAdditionalDomains])
    let removeDomainHandler = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        if(!additionalDomains) return;  // Nothing to do
        let value = e.currentTarget.value;
        console.debug("Remove domain ", value);
        let additionalDomainsUpdate = additionalDomains.filter(item=>item!==value);
        setAdditionalDomains(additionalDomainsUpdate);
    }, [additionalDomains, setAdditionalDomains]);

    let saveConfigurationHandler = useCallback(async () => {
        if(!workers || !ready || !instanceId) throw new Error('workers/instanceId not initialized');
        let response = await workers.connection.updateAcmeConfiguration(instanceId, {email, additionalDomains});
        if(!response.ok) throw new Error(`Error saving acme configuration: ${response.err}`);
    }, [workers, ready, instanceId, email, additionalDomains]);

    let renewCertificateHandler = useCallback(async () => {
        if(!workers || !ready || !instanceId) throw new Error('workers/instanceId not initialized');
        if(!email) throw new Error('Email must be provided');
        if(additionalDomainString) throw new Error('Save additional domain first');
        let response = await workers.connection.issueAcmeCertificate(instanceId, {email, additionalDomains});
        if(!response.ok) throw new Error(`Error issuing new acme certificate: ${response.err}`);
    }, [additionalDomainString, workers, ready, instanceId, email, additionalDomains]);

    useEffect(()=>{
        if(!workers || !ready || !instanceId) return;
        console.debug("Loading ACME account email");
        workers.connection.getAcmeConfiguration(instanceId)
            .then(configuration=>{
                console.debug("ACME configuration: ", configuration);
                if(configuration.email) setEmail(configuration.email);
                if(configuration.additionalDomains) setAdditionalDomains(configuration.additionalDomains);
            })
            .catch(err=>console.error("Error loading ACME configuration", err));
    }, [workers, ready, instanceId, setEmail, setAdditionalDomains]);

    return (
        <section className='pt-4'>
            <h2 className='text-lg font-bold pt-4'>Web certificate</h2>

            <p>
                The web certificate is handled by <a href="https://letsencrypt.org/" target='_blank' className="underline font-bold">Let's Encrypt</a>. 
                It's free so pay up. The price is an email for them to spam.
            </p>

            <div className="grid grid-cols-3">
                <label>Email</label>
                <input type="text" value={email} onChange={emailOnChange} 
                    className='text-black' />                    
            </div>
            <div className="grid grid-cols-3 pt-2">
                <p>Domain</p>
                <p>{currentInstance?.hostname}</p>
            </div>
            <AdditionalDomainList domains={additionalDomains} remove={removeDomainHandler} />
            <div className="grid grid-cols-3">
                <label>Additional domain</label>
                <input type="text" value={additionalDomainString} onChange={additionalDomainOnChange} 
                    className='text-black' />
                <div className='pl-2'>
                    <ActionButton onClick={addDomainHandler}>Add</ActionButton>
                </div>
            </div>
            <ActionButton onClick={saveConfigurationHandler}>Save</ActionButton>
            <ActionButton onClick={renewCertificateHandler}>Get new</ActionButton>
        </section>
    )
}

function AdditionalDomainList(props: {domains: string[] | null, remove: (e: MouseEvent<HTMLButtonElement>)=>void}) {
    if(!props.domains) return <></>;

    let mappedDomains = props.domains.map(item=>{
        return (
            <div key={item}>
                <div className="grid grid-cols-3 pt-2">
                    <div></div>
                    <p>{item}</p>
                    <div className='pl-2'>
                        <button onClick={props.remove} value={item}
                            className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                                Remove
                        </button>
                    </div>
                </div>
            </div>
        )
    });

    return <>{mappedDomains}</>;
}
