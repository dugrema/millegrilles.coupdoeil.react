import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ToggleSwitch } from "flowbite-react";

import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import useFilehostStore, { FilehostStoreItem } from "./filehostingStore";
import { FileHost } from "../workers/connection.worker";

function FileHostingAdd() {

    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();
    let navigate = useNavigate();
    let {filehostId} = useParams()
    let filehosts = useFilehostStore(state=>state.filehosts);
    
    let [error, setError] = useState('');
    let [urlExternal, setUrlExternal] = useState('');
    let [urlInternal, setUrlInternal] = useState('');
    let urlExternalOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setUrlExternal(e.currentTarget.value), [setUrlExternal]);
    let urlInternalOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setUrlInternal(e.currentTarget.value), [setUrlInternal]);
    let [syncActive, setSyncActive] = useState(true);
    let syncActiveOnChange = useCallback((checked: boolean)=>setSyncActive(checked), [setSyncActive]);

    let saveHandler = useCallback(async ()=>{
        if(!ready || !workers) throw new Error('workers not initialized');
        let urlExternalParsed = urlExternal?new URL(urlExternal):null;
        let urlInternalParsed = urlInternal?new URL(urlInternal):null;
        console.debug("Adding file host with url external: %s, internal: %s", urlExternalParsed, urlInternalParsed);

        let fileHost = {
            filehost_id: filehostId,
            url_external: urlExternalParsed?urlExternalParsed.href:null,
            url_internal: urlInternalParsed?urlInternalParsed.href:null,
            sync_active: syncActive,
        } as FileHost;

        let response = await workers.connection.updateFileHost(fileHost);
        console.debug("Response", response);
        if(response.ok !== true) {
            throw new Error('Error adding file host: ' + response.err);
        }

        navigate('/coupdoeil2/fileHosting');
    }, [workers, ready, filehostId, navigate, urlExternal, urlInternal, syncActive]);

    let testUrlHandler = useCallback(async ()=>{
    }, []);

    let deleteHandler = useCallback(async () =>{
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!filehostId) throw new Error('filehostId not provided');
        let response = await workers.connection.deleteFileHost(filehostId);
        if(response.ok !== true) {
            throw new Error('Error deleting fileHost: ' + response.err);
        }
        navigate('/coupdoeil2/fileHosting');
    }, [workers, ready, navigate]);

    let [locked, setLocked] = useState(false);
    useEffect(()=>{
        if(locked || !filehosts) return;

        let filehost = filehosts.filter(item=>item.filehost_id === filehostId).pop();
        if(!filehost) {
            setError('Unknown file host');
            return  // No locking, gives a chance to reload the list
        };

        setUrlExternal(filehost.url_external?filehost.url_external:'');
        setUrlInternal(filehost.url_internal?filehost.url_internal:'');
        setSyncActive(!!filehost.sync_active);

        setLocked(true);  // Prevent external change while editing
    }, [ready, locked, filehostId, filehosts, setLocked, setError, setUrlExternal, setUrlInternal, setSyncActive]);

    return (
        <>
            <Link to='/coupdoeil2/fileHosting'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4 pb-2'>Edit file host</h1>

            <section>
                <div className='grid grid-cols-1 lg:grid-cols-12'>
                    <label htmlFor='urlInternalId' className='lg:col-span-2'>Url (external)</label>
                    <input id='urlInternalId' placeholder="E.g.: https://myhost.com" value={urlExternal} onChange={urlExternalOnChange}
                        className='col-span-10 text-black'/>
                    <label htmlFor='urlExternalId' className='lg:col-span-2'>Url (internal)</label>
                    <input id='urlExternalId' placeholder="E.g.: https://myhost.com" value={urlInternal} onChange={urlInternalOnChange}
                        className='col-span-10 text-black'/>
                    <label htmlFor='syncActiveId' className='lg:col-span-2'>Synchronisation active</label>
                    <ToggleSwitch id='syncActiveId' checked={syncActive} onChange={syncActiveOnChange} className='grid-cols-10 pt-1 pb-1'/>
                </div>
                <div className='text-center pt-4'>
                    <ActionButton onClick={saveHandler} disabled={!ready||!workers} mainButton={true}>Save</ActionButton>
                    <ActionButton onClick={testUrlHandler}>Test</ActionButton>
                    <Link to='/coupdoeil2/fileHosting'
                        className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                            Cancel
                    </Link>
                </div>
            </section>

            <section>
                <h2 className='font-bold pt-4 pb-2'>Delete</h2>
                <p>Remove the filehost from the list. Also disables all actions on it and allows all files to be deleted later on.</p>
                <ActionButton onClick={deleteHandler} disabled={!ready||!workers}>Delete</ActionButton>
            </section>
        </>
    )
}

export default FileHostingAdd;
