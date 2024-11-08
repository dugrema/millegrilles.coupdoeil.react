import { Link } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { useCallback, useMemo } from "react";
import useFilehostStore, { FilehostStoreItem } from "./filehostingStore";

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
                <h2 className='text-lg font-bold pt-4 pb-2'>File hosts list</h2>

                <div className='pb-2'>
                    <Link to='/coupdoeil2/fileHosting/add'
                        className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                            + Add host
                    </Link>
                </div>

                <div className='grid grid-cols-12'>
                    <p className='font-bold col-span-12 lg:col-span-4'>Url / Instance</p>
                    <p className='font-bold col-span-6 lg:col-span-3'>Presence</p>
                    <p className='font-bold col-span-3 lg:col-span-1'>Files</p>
                    <p className='font-bold col-span-2 lg:col-span-2'>Size</p>
                    <p className='font-bold hidden lg:block'>Orphans</p>
                    <p className='font-bold hidden lg:block'>Missing</p>
                </div>
                <FileHostList />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>File controlers list</h2>
                <div className='grid grid-cols-12'>
                    <p className='font-bold col-span-7'>Instance</p>
                    <p className='font-bold col-span-3'>Type</p>
                </div>
                <FileControlerList />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Current transfers between servers</h2>
                <CurrentTransfers />
            </section>

        </>
    )
}

export default FileHostingList;

const CONST_CLASSNAME_FILEHOST_ROW = '';

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
            return (
                <div key={item.filehost_id} className={CONST_CLASSNAME_FILEHOST_ROW}>
                    <Link to={`/coupdoeil2/fileHosting/filehost/${item.filehost_id}`}
                        className='underline'>
                            {item.url_external || item.filehost_id}
                    </Link>
                </div>
            )
        })
    }, [filehosts]);

    if(!filehostElems) return <p>Loading ...</p>;
    return <>{filehostElems}</>;
}

function FileControlerList() {
    return <>None</>
}

function CurrentTransfers() {
    return <></>;
}
