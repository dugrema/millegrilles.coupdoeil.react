import axios from 'axios';
import { Link } from 'react-router-dom';
import useWorkers from '../workers/workers';
import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import useConnectionStore from '../connectionStore';
import { DomainBackupInformation, FilehostBackupInformation } from '../workers/connection.worker';
import { Formatters } from 'millegrilles.reactdeps.typescript';
import { sortDomains } from './DomainList';
import ActionButton from '../components/ActionButton';
import { messageStruct } from 'millegrilles.cryptography';


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
                <FilehostBackupList />
            </section>
        </>
    );
}

export default DomainBackup;

export function FilehostBackupList() {
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [filehostBackupList, setFilehostBackupList] = useState([] as FilehostBackupInformation[]);

    useEffect(()=>{
        if(!ready) return;
        if(!workers) throw new Error("Workers non initialized");

        workers.connection.getDomainBackupInformation(true, false)
            .then(response=>{
                console.debug("getDomainBackupInformation response", response);
                if(response.ok) {
                    setFilehostBackupList(response.list);
                } else {
                    console.error("Error message from server: ", response.err);
                }
            })
            .catch(err=>console.error("getDomainBackupInformation Error", err));

    }, [ready, workers, setFilehostBackupList]);


    let filehostElems = useMemo(()=>{
        if(!filehostBackupList) return [];

        let filehostBackupListCopy = filehostBackupList.map(item=>{
            let label = item.filehost_id;
            return {...item, label};
        })
        filehostBackupListCopy.sort((a, b)=>a.label.localeCompare(b.label));

        return filehostBackupListCopy.map(item=>{
            return (
                <React.Fragment key={item.filehost_id}>
                    <div className='grid grid-cols-3 pt-4'>
                        <p>Filehost</p>
                        <p className='col-span-2'>{item.label}</p>
                    </div>
                    {item.ok?
                        <DomainBackupList value={item.domains} url={item.url} />
                        :
                        <p>No information</p>
                    }
                </React.Fragment>
            )
        });
    }, [filehostBackupList]);

    if(!filehostBackupList) return <></>;
    return <>{filehostElems}</>;
}

function DomainBackupList(props: {value: DomainBackupInformation[] | null | undefined, url: string | null | undefined}) {
    let domainBackupList = props.value;
    let url = props.url;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let downloadHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>)=>{
        if(!workers || !ready) throw new Error("workers not initialized");
        if(!url) throw new Error("No filehost url provided");

        let value = e.currentTarget.value;
        await workers.connection.authenticateFilehost(url);

        let fileUrl = new URL(url + '/backup_v2/tar/' + value)
        console.debug("Download domain backup file %s", fileUrl.href);
        window.location.href = fileUrl.href;
    }, [workers, ready, url]);

    let listElems = useMemo(()=>{
        if(!domainBackupList) return <></>;

        let listCopy = [...domainBackupList];
        listCopy.sort(sortDomains);

        return listCopy.map(item=>{

            return (
                <div key={item.domaine} 
                    className='grid grid-cols-5 odd:bg-amber-600 odd:bg-opacity-10 pt-1 pb-1 pl-2 pr-2 hover:bg-amber-500 hover:bg-opacity-40'>
                        <p>
                            {item.domaine}
                            {url?<ActionButton onClick={downloadHandler} value={item.domaine}>Download</ActionButton>:<></>}
                        </p>
                        <Formatters.FormatterDate value={item.concatene?.date} />
                        <p><Formatters.FormatterDate value={item.transaction_plus_recente} /></p>
                        <p>{item.nombre_transactions}</p>
                        <Link to={`/coupdoeil2/domains/restore/versions/${item.domaine}`} className='underline font-bold'>
                            {item.concatene?.version}
                        </Link>
                </div>
            )
        });
    }, [domainBackupList]);

    return (
        <>
            <div className='grid grid-cols-5'>
                <p className='font-bold pb-2'>Domain</p>
                <p className='font-bold pb-2'>Last complete</p>
                <p className='font-bold pb-2'>Last transaction date</p>
                <p className='font-bold pb-2'>Transaction count</p>
                <p className='font-bold pb-2'>Version id</p>
            </div>
            {listElems}
        </>
    )
}
