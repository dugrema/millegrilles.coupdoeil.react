import React, { Dispatch, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { BackupDomainVersions, FilehostBackupDomainVersions } from "../workers/connection.worker";
import { Formatters } from "millegrilles.reactdeps.typescript";
import ActionButton from "../components/ActionButton";

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
        <>
            <Link to={backUrl}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Backup versions for domain {domainName}</h1>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Current version</h2>
                <p>This is the currently used version for this domain.</p>
                <div className='grid grid-cols-3'>
                    <p>Version</p>
                    <p className='col-span-2'>{currentVersion?currentVersion:'N/A'}</p>
                </div>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Backup files</h2>
                {error?
                    <p>Error loading files</p>
                :
                    <>
                        <p className='pb-4'>Click on a version to set it as the current version to use.</p>
                        <Filehosts value={list} current={currentVersion} setCurrent={setCurrentVersion} />
                    </>
                }
            </section>
        </>
    )
}

export default DomainBackupVersions;

function Filehosts(props: {value: FilehostBackupDomainVersions[] | null, current: string | null, setCurrent: Dispatch<string>}) {
    
    let { value, current, setCurrent } = props;

    let filehostsElem = useMemo(()=>{
        if(!value) return <p>Loading ...</p>;

        let filehosts = value.map(item=>{
            let label = item.filehost_id;
            return {...item, label};
        });

        filehosts.sort((a, b)=>a.label.localeCompare(b.label));

        return filehosts.map(item=>{
            return (
                <React.Fragment key={item.filehost_id}>
                    <div key={item.filehost_id} className='grid grid-cols-3'>
                        <p>Filehost</p>
                        <p className='col-span-2'>{item.label}</p>
                    </div>
                    <Versions value={item.versions || []} current={current} setCurrent={setCurrent} />
                </React.Fragment>
            )
        })
    }, [value])
    
    return (
        <>{filehostsElem}</>
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
        if(!value) return <p>Loading ...</p>;
        if(value.length === 0) return <p>No files</p>;

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
                <div key={item.version} className='grid grid-cols-12'>
                    <p className='col-span-2'>
                        {item.version!==current?
                            <ActionButton onClick={changeVersionHandler} value={item.version} disabled={!ready || !domainName}>
                                {item.version}
                            </ActionButton>
                            :
                            item.version
                        }
                        
                    </p>
                    <p>{item.transactions}</p>
                    <Formatters.FormatterDate value={item.start_date} className='col-span-2' />
                    <Formatters.FormatterDate value={item.end_date}  className='col-span-2' />
                    <Formatters.FormatterDate value={item.end_date_concatene}  className='col-span-2' />
                </div>
            )
        })
    }, [value]);

    return (
        <div className='pt-2 pb-4'>
            <div className='grid grid-cols-12 font-bold'>
                <p className='col-span-2'>Version</p>
                <p>Count</p>
                <p className='col-span-2'>Start</p>
                <p className='col-span-2'>End</p>
                <p className='col-span-2'>End concatene</p>
            </div>
            {versionElems}
        </div>
    );
}

