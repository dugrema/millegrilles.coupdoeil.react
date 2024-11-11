import { Link } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import useFilehostStore, { FilehostStoreItem } from "./filehostingStore";
import { ConditionalFormatters, Formatters } from "millegrilles.reactdeps.typescript";

function FileHostingList() {

    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();

    let syncHandler = useCallback(async ()=>{
        if(!ready || !workers) throw new Error("Workers not initialized");
    }, [ready, workers]);

    let reindexHandler = useCallback(async ()=>{
        if(!ready || !workers) throw new Error("Workers not initialized");
    }, [ready, workers]);

    let resetTransfersHandler = useCallback(async ()=>{
        if(!ready || !workers) throw new Error("Workers not initialized");
        let response = await workers.connection.resetTransfers();
        if(!response.ok) throw new Error('Error resetting transfers: ' + response.err);
    }, [ready, workers]);

    let resetVisitsHandler = useCallback(async ()=>{
        if(!ready || !workers) throw new Error("Workers not initialized");
        let response = await workers.connection.resetVisitsClaims();
        if(response.ok !== true) throw new Error('Error resetting visits: ' + response.err);
    }, [ready, workers]);

    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>File hosting</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Utilities</h2>

                <ActionButton onClick={syncHandler} disabled={!ready} mainButton={true}>Synchronize</ActionButton>
                <ActionButton onClick={reindexHandler} disabled={!ready}>Reindex</ActionButton>
                <ActionButton onClick={resetTransfersHandler} disabled={!ready}>Reset transfers</ActionButton>
                <ActionButton onClick={resetVisitsHandler} disabled={!ready}>Reset visits/claims</ActionButton>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Configuration</h2>
                <FilehostConfiguration />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>File hosts list</h2>

                <div className='pb-2'>
                    <Link to='/coupdoeil2/fileHosting/add'
                        className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                            + Add host
                    </Link>
                </div>

                <div>
                    <div className='grid grid-cols-12'>
                        <p className='font-bold col-span-12 lg:col-span-4'>Url / Instance</p>
                        <p className='font-bold col-span-6 lg:col-span-3'>Status</p>
                        <p className='font-bold col-span-3 lg:col-span-1'>Files</p>
                        <p className='font-bold col-span-2 lg:col-span-2'>Size</p>
                        <p className='font-bold hidden lg:block col-span-2'>Queue</p>
                    </div>
                    <FileHostList />
                </div>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>File controlers list</h2>
                <div className='grid grid-cols-12'>
                    <p className='font-bold col-span-7 lg:col-span-5'>Instance</p>
                    <p className='font-bold col-span-3 lg:col-span-7'>Presence</p>
                </div>
                <FileControlerList />
            </section>

        </>
    )
}

export default FileHostingList;

const CONST_CLASSNAME_FILEHOST_ROW = 'grid grid-cols-12 odd:bg-amber-600 odd:bg-opacity-10 pt-1 pb-1 pl-2 pr-2 hover:bg-amber-500 hover:bg-opacity-40';

type FilehostListItem = FilehostStoreItem & {label: string};

function FileHostList() {

    let filehosts = useFilehostStore(state=>state.filehosts);

    let filehostElems = useMemo(()=>{
        if(!filehosts) return null;

        // Create label and sort
        let filehostCopy = filehosts.filter(item=>!item.deleted).map(item=>{
            let label = item.url_external || item.filehost_id;
            return {...item, label};
        }) as FilehostListItem[];
        filehostCopy.sort((a, b)=>a.label.localeCompare(b.label));

        console.debug("Filehosts ", filehosts);
        return filehostCopy.map(item=>{

            let count = '' as number | string;
            if(typeof(item.fuuid?.count) === 'number') count = item.fuuid.count;
            let size = undefined as number | undefined;
            if(typeof(item.fuuid?.size) === 'number') size = item.fuuid.size;

            let status = '...';
            if(!item.sync_active) status = 'disabled';
            else if(item.connected) status = 'connected';
            else if(item.connected === false) status = 'not connected';

            let transferQueueLength = 'N/A' as number | string;
            if(typeof(item.transfer_q_len) === 'number') transferQueueLength = item.transfer_q_len;

            return (
                <div key={item.filehost_id} className={CONST_CLASSNAME_FILEHOST_ROW}>
                    <Link to={`/coupdoeil2/fileHosting/filehost/${item.filehost_id}`}
                        className='underline col-span-12 lg:col-span-4'>
                            {item.url_external || item.filehost_id}
                    </Link>
                    <p className='col-span-6 lg:col-span-3'>{status}</p>
                    <p className='col-span-3 lg:col-span-1'>{count}</p>
                    <p className='col-span-2 lg:col-span-2'><Formatters.FormatteurTaille value={size} /></p>
                    <p className='hidden lg:block col-span-2'>{transferQueueLength}</p>
                </div>
            )
        })
    }, [filehosts]);

    if(!filehostElems) return <p>Loading ...</p>;
    return <>{filehostElems}</>;
}

const CONST_CLASSNAME_FILECONTROLER_ROW = 'grid grid-cols-12 odd:bg-amber-600 odd:bg-opacity-10 pt-1 pb-1 pl-2 pr-2 hover:bg-amber-500 hover:bg-opacity-40';

function FileControlerList() {

    let filecontrolers = useFilehostStore(state=>state.filecontrolers);

    let filecontrolersElems = useMemo(()=>{
        if(!filecontrolers) return <p>Loading ...</p>;
        return filecontrolers.map(item=>{
            return (
                <div key={item.instance_id} className={CONST_CLASSNAME_FILECONTROLER_ROW}>
                    <p className='col-span-7 lg:col-span-5'>{item.instance_id}</p>
                    <ConditionalFormatters.FormatterConditionalDate 
                        value={item.lastUpdate} warn={360} error={1800} className='col-span-5 lg:col-span-7' />
                </div>
            )
        });
    }, [filecontrolers]);


    return <>{filecontrolersElems}</>;
}

export function FilehostDropdown(props: {value: string, onChange: Dispatch<string>, className?: string}) {

    let {value, onChange, className} = props;

    let filehosts = useFilehostStore(state=>state.filehosts);

    let onChangeHandler = useCallback((e: ChangeEvent<HTMLSelectElement>)=>{
        onChange(e.currentTarget.value);
    }, [onChange]);

    let filehostElems = useMemo(()=>{
        if(!filehosts) return null;
        // Create label and sort
        let filehostCopy = filehosts.filter(item=>!item.deleted).map(item=>{
            let label = item.url_external || item.filehost_id;
            return {...item, label};
        }) as FilehostListItem[];
        filehostCopy.sort((a, b)=>a.label.localeCompare(b.label));

        return filehostCopy.map(item=>{
            let label = item.url_external || item.filehost_id;
            return (
                <option key={item.filehost_id} value={item.filehost_id}>{label}</option>
            )
        })
    }, [filehosts]);

    return (
        <select value={value} onChange={onChangeHandler} className={'text-black ' + className}>
            <option>Pick one</option>
            {filehostElems}
        </select>
    )    
}

function FilehostConfiguration() {
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [defaultFilehost, setDefaultFilehost] = useState('');

    let saveConfigurationHandler = useCallback(async ()=>{
        if(!workers) throw new Error('workers not initialized');
        if(!defaultFilehost) throw new Error('No filehost value provided')
        let response = await workers.connection.setDefaultFilehost(defaultFilehost);
        if(response.ok !== true) throw new Error('Error saving default filehost: ' + response.err);
    }, [workers, defaultFilehost]);

    useEffect(()=>{
        if(!ready || !workers) return;

        workers.connection.getFilehostConfiguration()
            .then(response=>{
                console.debug("Filehost configuration response", response);
                if(response.configuration) {
                    let defaultFilehost = response.configuration['filehost.default']
                    console.debug("Default filehost : %O", defaultFilehost)
                    setDefaultFilehost(defaultFilehost);
                }
            })
            .catch(err=>console.error("Error loading filehost configuration", err));
    }, [workers, ready, setDefaultFilehost])

    return (
        <>
            <div className='grid grid-cols-1: lg:grid-cols-4'>
            <label>Default file host</label>
                <FilehostDropdown value={defaultFilehost} onChange={setDefaultFilehost} className='lg:col-span-2' />
            </div>
            <ActionButton onClick={saveConfigurationHandler}>Save</ActionButton>
        </>
    )
}