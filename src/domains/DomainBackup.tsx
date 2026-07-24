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
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2/domains'
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-3xl font-bold text-white'>Domain backup files</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <p className='text-slate-300 mb-4'>
                    This list is taken from the file server. It acts as a backup server for each domain databases. 
                    An incremental backup is done every 30 minutes but with transfers the files can be over an hour old.
                    If you need the latest backup files, trigger a complete backup (previous screen) and come back here when completed.
                </p>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>💾</span> Backup files for each domain
                </h2>
                <p className='text-slate-400 text-sm mb-4'>
                    You can download an archive for each domain by clicking on the domain name. 
                    Each domain tar file contains .mgbak encrypted archives. These archives
                    can only be used with the system's master key.
                </p>
                <FilehostBackupList />
            </section>
        </div>
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
        if(!filehostBackupList) return null;

        let filehostBackupListCopy = filehostBackupList.map(item=>{
            let label = item.filehost_id;
            return {...item, label};
        })
        filehostBackupListCopy.sort((a, b)=>a.label.localeCompare(b.label));

        return filehostBackupListCopy.map(item=>{
            return (
                <div key={item.filehost_id} className="mb-8 last:mb-0">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                        {item.ok ? (
                            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">Online</span>
                        ) : (
                            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full">Offline</span>
                        )}
                    </div>
                    {item.ok?
                        <DomainBackupList value={item.domains} url={item.url} />
                        :
                        <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-xl text-red-400 text-sm text-center">
                            No information available for this filehost
                        </div>
                    }
                </div>
            )
        });
    }, [filehostBackupList]);

    if(!filehostBackupList) return null;
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
        if(!domainBackupList || domainBackupList.length === 0) return (
            <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No backup files found for this filehost</td>
            </tr>
        );

        let listCopy = [...domainBackupList];
        listCopy.sort(sortDomains);

        return listCopy.map(item=>{

            return (
                <tr key={item.domaine} className="hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 last:border-0">
                    <td className="px-4 py-3 text-white font-medium">
                        {item.domaine}
                        {url && (
                            <ActionButton onClick={downloadHandler} value={item.domaine} className="ml-2 px-2 py-1 text-xs">
                                Download
                            </ActionButton>
                        )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                        <Formatters.FormatterDate value={item.concatene?.date} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                        <Formatters.FormatterDate value={item.transaction_plus_recente} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{item.nombre_transactions}</td>
                    <td className="px-4 py-3">
                        <Link to={`/coupdoeil2/domains/restore/versions/${item.domaine}`} className='text-blue-400 hover:text-blue-300 font-medium'>
                            {item.concatene?.version}
                        </Link>
                    </td>
                </tr>
            )
        });
    }, [domainBackupList, url]);

    return (
        <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-4 py-3">Domain</th>
                        <th className="px-4 py-3">Last complete</th>
                        <th className="px-4 py-3">Last transaction date</th>
                        <th className="px-4 py-3">Count</th>
                        <th className="px-4 py-3">Version id</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {listElems}
                </tbody>
            </table>
        </div>
    )
}
