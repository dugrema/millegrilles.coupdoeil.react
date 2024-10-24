import { Link } from "react-router-dom";
import useFileManagerStore from "./fileManagementStore";
import React, { useCallback, useMemo } from "react";
import useInstanceStore from "../instances/instanceStore";
import { ConditionalFormatters, Formatters } from "millegrilles.reactdeps.typescript";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import ActionButton from "../components/ActionButton";
import { FileManager } from "../workers/connection.worker";

function FileManagerList() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let syncHandler = useCallback(async () => {
        if(!workers || !ready) throw new Error('workers not initialized');
        let response = await workers.connection.syncFileManagers();
        if(!response.ok) { throw new Error(response.err || 'Error'); }
    }, [workers, ready]);

    let reindexHandler = useCallback(()=>{
        if(!workers || !ready) throw new Error('workers not initialized');
        workers.connection.reindexFileManagers()
            .then(response=>{
                console.debug("reindexFileManagers Response", response);
            })
            .catch(err=>console.error("reindexFileManagers Error", err));
    }, [workers, ready]);

    let resetTransfersHandler = useCallback(()=>{
        if(!workers || !ready) throw new Error('workers not initialized');
        workers.connection.resetTransfersFileManagers()
            .then(response=>{
                console.debug("resetTransfersFileManagers Response", response);
            })
            .catch(err=>console.error("resetTransfersFileManagers Error", err));
    }, [workers, ready]);

    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>File management</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Utilities</h2>

                <ActionButton onClick={syncHandler} disabled={!ready} mainButton={true}>Synchronize</ActionButton>

                <button onClick={reindexHandler} disabled={!ready}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Reindex
                </button>

                <button onClick={resetTransfersHandler} disabled={!ready}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Reset transfers
                </button>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>File manager list</h2>
                <div className='grid grid-cols-12'>
                    <p className='font-bold col-span-9 lg:col-span-4'>Instance</p>
                    <p className='font-bold col-span-3 lg:col-span-2'>Type</p>
                    <p className='font-bold col-span-6 lg:col-span-3 xl:col-span-2'>Presence</p>
                    <p className='font-bold col-span-3 lg:col-span-1'>Files</p>
                    <p className='font-bold col-span-2 lg:col-span-2 xl:col-span-1'>Size</p>
                    <p className='font-bold hidden xl:block'>Orphans</p>
                    <p className='font-bold hidden xl:block'>Missing</p>
                    <List />
                </div>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Current transfers between servers</h2>
                <CurrentTransfers />
            </section>
        </>
    );
}

export default FileManagerList;

function List() {

    let instances = useInstanceStore(state=>state.instances);
    let fileManagerList = useFileManagerStore(state=>state.fileManagers);

    let listElems = useMemo(()=>{
        if(!fileManagerList) return <p>Loading ...</p>;

        let activeManagers = fileManagerList.filter(item=>!item.supprime);
        activeManagers.sort(sortFileManagers);

        return activeManagers.map(item=>{
            let instance = instances?.filter(instance=>instance.instance_id === item.instance_id).pop();
            let url = new URL(item.consignation_url || 'http://fichiers');
            let label = instance?.hostname || url.hostname;
            if(label === 'fichiers') {
                label = item.instance_id;
            }

            let principal = item.principal || {}
            let orphelins = item.orphelin || {}
            let manquant = item.manquant || {}
      
            let taillePrincipal = principal.taille || 0;
            let tailleOrphelins = orphelins.taille || 0;
            let tailleTotale = taillePrincipal;

            let nombrePrincipal = principal.nombre || 0;
            let nombreOrphelins = orphelins.nombre || 0;
            let nombreManquants = manquant.nombre || 0;
            let nombreTotal = nombrePrincipal;

            return (
                <React.Fragment key={item.instance_id}>
                    <Link to={`/coupdoeil2/fileManagement/${item.instance_id}`} 
                        className='underline col-span-9 lg:col-span-4'>
                            {label}
                    </Link>
                    <p className='col-span-3 lg:col-span-2'>
                        {item.primaire?'Primary':'Secondary'}
                    </p>
                    <ConditionalFormatters.FormatterConditionalDate value={item["_mg-derniere-modification"]} warn={300} error={1800} 
                        className='col-span-6 lg:col-span-3 xl:col-span-2' />
                    <p className='col-span-3 lg:col-span-1'>{nombreTotal}</p>
                    <div className='col-span-2 lg:col-span-2 xl:col-span-1'>
                        <Formatters.FormatteurTaille value={tailleTotale} />
                    </div>
                    <p className='hidden xl:block'>
                        {nombreOrphelins} / {nombreOrphelins?<Formatters.FormatteurTaille value={tailleOrphelins} />:'0 bytes'}
                    </p>
                    <p  className='hidden xl:block'>{nombreManquants}</p>
                </React.Fragment>
            )
        });
    }, [fileManagerList, instances]);

    return (
        <>{listElems}</>
    );
}

function CurrentTransfers() {
    return (
        <></>
    );
}

export function sortFileManagers(a: FileManager, b: FileManager)  {
    if(a === b) return 0;
    if(!a) return 1;
    if(!b) return -1;
    let urlA = a.consignation_url;
    let urlB = b.consignation_url;
    if(urlA !== urlB) {
        if(!urlA) return 1;
        if(!urlB) return -1;
        return urlA.localeCompare(urlB);
    }
    return a.instance_id.localeCompare(b.instance_id);
}
