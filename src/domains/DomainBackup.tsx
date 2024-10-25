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

            <h1 className='text-xl font-bold pt-4'>Domain backup files</h1>

            <p className='pb-2'>
                This list is taken from the file server. It acts as a backup server for each domain databases. 
                An incremental backup is done every 30 minutes but with transfers the files can be over an hour old.
                If you need the latest backup files, trigger a complete backup (previous screen) and come back here when completed.
            </p>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Backup files for each domain</h2>
                <p className='pb-4'>
                    You can download an archive for each domain by clicking on the domain name. 
                    Each domain tar file contains .mgbak encrypted archives. These archives
                    can only be used with the system's master key.
                </p>
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
                    <p>
                        <a href={`/fichiers/backup_v2/tar/${item.domaine}`} download 
                            className='underline font-bold'>
                                {item.domaine}
                        </a>
                    </p>
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
