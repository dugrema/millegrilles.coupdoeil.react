import { Link, useNavigate, useParams } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import useFilehostStore from "./filehostingStore";

function FileHostingAdd() {

    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();
    let navigate = useNavigate();
    let {filehostId} = useParams()
    let filehosts = useFilehostStore(state=>state.filehosts);
    
    let [error, setError] = useState('');
    let [urlExternal, setUrlExternal] = useState('');
    let [urlInternal, setUrlInternal] = useState('');
    let urlExternalOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setUrlExternal(e.currentTarget.value), []);
    let urlInternalOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setUrlInternal(e.currentTarget.value), []);

    let saveHandler = useCallback(async ()=>{
        if(!ready || !workers) throw new Error('workers not initialized');
        let urlExternalParsed = new URL(urlExternal);
        let urlInternalParsed = new URL(urlInternal);
        console.debug("Adding file host with url external: %s, internal: %s", urlExternalParsed.href, urlInternalParsed.href);

        let fileHost = {

        };

        // let response = await workers.connection.updateFileHost();
        // console.debug("Response", response);
        // if(response.ok !== true) {
        //     throw new Error('Error adding file host: ' + response.err);
        // }
        navigate('/coupdoeil2/fileHosting');
    }, [workers, ready, filehostId, navigate, urlExternal, urlInternal]);

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

        setLocked(true);  // Prevent external change while editing
    }, [ready, locked, filehostId, filehosts, setLocked, setError]);

    return (
        <>
            <Link to='/coupdoeil2/fileHosting'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4 pb-2'>Edit file host</h1>

            <section>
                <div className='grid grid-cols-1 lg:grid-cols-12'>
                    <label>Url (external)</label>
                    <input placeholder="E.g.: https://myhost.com" value={urlExternal} onChange={urlExternalOnChange}
                        className='col-span-11 text-black'/>
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
