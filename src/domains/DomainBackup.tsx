import { Link } from 'react-router-dom';
import useWorkers from '../workers/workers';
import React, { useEffect, useMemo, useState } from 'react';
import useConnectionStore from '../connectionStore';
import { DomainBackupInformation } from '../workers/connection.worker';
import { Formatters } from 'millegrilles.reactdeps.typescript';
import { sortDomains } from './DomainList';


function DomainBackup() {

    return (
        <>
            <Link to='/coupdoeil2/domains'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Domain backup</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Actions</h2>

                {/* <button
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Run complete
                </button> */}

                <Link to='/coupdoeil2/domains/restore'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Restore system
                </Link>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Backup list for each domain</h2>
                <p className='pb-4'>This is taken from the file server. It acts as a backup server for the domain databases.</p>
                <DomainBackupList />
            </section>
        </>
    );
}

export default DomainBackup;

export function DomainBackupList() {
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [domainBackupList, setDomainBackupList] = useState([] as DomainBackupInformation[]);

    useEffect(()=>{
        if(!ready) return;
        if(!workers) throw new Error("Workers non initialized");

        workers.connection.getDomainBackupInformation(true, false)
            .then(response=>{
                console.debug("getDomainBackupInformation response", response);
                if(response.ok) {
                    setDomainBackupList(response.backups);
                } else {
                    console.error("Error message from server: ", response.err);
                }
            })
            .catch(err=>console.error("getDomainBackupInformation Error", err));

    }, [ready, workers, setDomainBackupList]);

    let listElems = useMemo(()=>{

        let listCopy = [...domainBackupList];
        listCopy.sort(sortDomains);

        return listCopy.map(item=>{
            return (
                <React.Fragment key={item.domaine}>
                    <p>{item.domaine}</p>
                    <Formatters.FormatterDate value={item.concatene?.date} />
                    <p><Formatters.FormatterDate value={item.transaction_plus_recente} /></p>
                    <p>{item.nombre_transactions}</p>
                    <p>{item.concatene?.version}</p>
                </React.Fragment>
            )
        });
    }, [domainBackupList]);

    return (
        <div className='grid grid-cols-5'>
            <p className='font-bold pb-2'>Domain</p>
            <p className='font-bold pb-2'>Last complete</p>
            <p className='font-bold pb-2'>Last transaction date</p>
            <p className='font-bold pb-2'>Transaction count</p>
            <p className='font-bold pb-2'>Version id</p>
            {listElems}
        </div>
    )
}
