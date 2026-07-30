import React, { Dispatch, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { BackupDomainVersions, FilehostBackupDomainVersions } from "../workers/connection.worker";
import ActionButton from "../components/ActionButton";
import { formatDate } from '../utilities/dateUtils';

function DomainBackupVersions(props: {back: string}) {

    let backUrl = props.back;
    let { domainName } = useParams();
    let [list, setList] = useState(null as FilehostBackupDomainVersions[] | null);
    let [error, setError] = useState(false);
    let [currentVersion, setCurrentVersion] = useState('');

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    useEffect(()=>{
        if(!workers || !ready || !domainName) return;
        workers.connection.getDomainVersionsBackupInformation(domainName)
            .then(response=>{
                console.debug("Domain versions", response);
                if(response.ok) {
                    setList(response.list);
                } else {
                    console.error("Error loading domain list: ", response.err);
                    setList(null);
                    setError(true);
                }
            })
            .catch(err=>{
                console.error("Error loading domain backup versions", err);
                setError(true);
            });

        workers.connection.getDomainBackupVersions()
            .then(response=>{
                console.debug("Domain backup versions", response);
                if(response.ok) {
                    let domain = response.domains.filter(item=>item.domain===domainName).pop();
                    setCurrentVersion(domain?.version || '');
                }
            })
            .catch(err=>console.error("Error getting domain backup versions from CoreTopologie", err));
    }, [workers, ready, domainName, setList, setCurrentVersion, setError]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to={backUrl}
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-3xl font-bold text-white'>Backup versions for domain {domainName}</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>⭐</span> Current version
                </h2>
                <p className="text-slate-400 mb-4">This is the currently used version for this domain.</p>
                <div className="bg-slate-900/50 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Version ID</span>
                    <span className="text-white font-mono">{currentVersion ? currentVersion : 'N/A'}</span>
                </div>
            </section>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>📦</span> Backup files
                </h2>
                {error ? 
                    <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-xl text-red-400 text-center">
                        Error loading files
                    </div>
                :
                    <>
                        <p className='text-slate-400 mb-6'>Click on a version to set it as the current version to use.</p>
                        <Filehosts value={list} current={currentVersion} setCurrent={setCurrentVersion} />
                    </>
                }
            </section>
        </div>
    )
}

export default DomainBackupVersions;

function Filehosts(props: {value: FilehostBackupDomainVersions[] | null, current: string | null, setCurrent: Dispatch<string>}) {
    
    let { value, current, setCurrent } = props;

    let filehostsElem = useMemo(()=>{
        if(!value) return <div className="text-slate-400">Loading ...</div>;

        let filehosts = value.map(item=>{
            let label = item.filehost_id;
            return {...item, label};
        });

        filehosts.sort((a, b)=>a.label.localeCompare(b.label));

        return filehosts.map(item=>{
            return (
                <div key={item.filehost_id} className="mb-8 last:mb-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xl font-bold text-white">{item.label}</h3>
                    </div>
                    <Versions value={item.versions || []} current={current} setCurrent={setCurrent} />
                </div>
            )
        })
    }, [value, current, setCurrent])
    
    return (
        <div className="space-y-6">
            {filehostsElem}
        </div>
    )
}

function Versions(props: {value: BackupDomainVersions[] | null, current: string | null, setCurrent: Dispatch<string>}) {

    let { value, current, setCurrent } = props;

    let { domainName } = useParams();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let changeVersionHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>)=>{
        if(!workers || !ready) throw new Error("workers not initialized");
        if(!domainName) throw new Error('no domain name provided');
        let version = e.currentTarget.value;
        let result = await workers.connection.setDomainBackupVersion(domainName, version);
        if(!result.ok) throw new Error('Error changing backup domain version: ' + result.err);
        setCurrent(version);
    }, [workers, ready, domainName, setCurrent]);

    let versionElems = useMemo(()=>{
        if(!value) return <div className="text-slate-400">Loading ...</div>;
        if(value.length === 0) return <div className="text-slate-400">No files available</div>;

        let versions = value.map(item=>{
            let label = item.version;
            return {...item, label};
        })

        versions.sort((a, b)=>{
            if(a === b) return 0;
            if(a.transactions !== b.transactions) return b.transactions - a.transactions;
            if(a.start_date !== b.start_date) return a.start_date - b.start_date;
            if(a.end_date !== b.end_date) return b.end_date - a.end_date;
            return a.label.localeCompare(b.label);
        })

        return versions.map(item=>{
            return (
                <tr key={item.version} className="hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 last:border-0">
                    <td className="px-4 py-3">
                        {item.version!==current?
                            <ActionButton onClick={changeVersionHandler} value={item.version} disabled={!ready || !domainName} className="px-2 py-1 text-xs">
                                {item.version}
                            </ActionButton>
                            :
                            <span className="font-bold text-blue-400">{item.version}</span>
                        }
                    </td>
                    <td className="px-4 py-3 text-slate-400">{item.transactions}</td>
                    <td className="px-4 py-3 text-slate-400">
                        {formatDate(item.start_date as any, true)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                        {formatDate(item.end_date as any, true)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                        {formatDate(item.end_date_concatene as any, true)}
                    </td>
                </tr>
            )
        })
    }, [value, current, ready, domainName, changeVersionHandler]);

    return (
        <div className="overflow-x-auto border border-slate-700 rounded-xl">
            <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-4 py-3">Version</th>
                        <th className="px-4 py-3">Count</th>
                        <th className="px-4 py-3">Start</th>
                        <th className="px-4 py-3">End</th>
                        <th className="px-4 py-3">End concatene</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {versionElems}
                </tbody>
            </table>
        </div>
    );
}
