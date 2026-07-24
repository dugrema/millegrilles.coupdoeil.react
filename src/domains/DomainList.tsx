import { Link } from 'react-router-dom';
import useDomainStore, { DomainStore } from './domainStore';
import { MouseEvent, useCallback, useMemo } from 'react';
import { DomainBackupInformation } from '../workers/connection.worker';
import { ConditionalFormatters } from 'millegrilles.reactdeps.typescript';
import useWorkers from '../workers/workers';
import useConnectionStore from '../connectionStore';
import ActionButton from '../components/ActionButton';
import useInstanceStore, { ServerInstanceStore } from '../instances/instanceStore';

function DomainList() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let rebuildHandler = useCallback(async (domaine: string) => {
        if(!ready || !workers) throw new Error("workers not initialized");
        let response = await workers.connection.rebuildDomain(domaine);
        if(response.ok !== true) throw new Error('Error starting rebuild: ' + response.err);
    }, [workers, ready]);

    let domainBackupHandler = useCallback(async (domaine: string) => {
        if(!ready || !workers) throw new Error("workers not initialized");
        let response = await workers.connection.backupDomain(domaine);
        if(response.ok !== true) {
            console.warn("Error starting backup", response);
            throw new Error('Error starting backup: ' + response.err);
        }
    }, [workers, ready]);

    let backupAllHandler = useCallback(async () => {
        if(!ready || !workers) throw new Error('workers not initialized');
        let result = await workers.connection.backupDomain('global', true);
        // Only check that a result was received. The command is sent to all domains at the same time, the first response wins.
        if(!result) throw new Error("No response received to complete backup command");
    }, [workers, ready]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2/domains'
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-3xl font-bold text-white'>Domains</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>🛠️</span> Utilities
                </h2>

                <div className="flex flex-wrap gap-4 mb-6">
                    <ActionButton onClick={backupAllHandler} disabled={!ready} mainButton={true}>
                        Backup now
                    </ActionButton>

                    <Link to='/coupdoeil2/domains/restore'
                        className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                        Restore
                    </Link>

                    <Link to='/coupdoeil2/domains/backup'
                        className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                        Files
                    </Link>
                </div>
            </section>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>📋</span> Domain list
                </h2>
                <DomainListSection rebuild={rebuildHandler} backup={domainBackupHandler} />
            </section>
        </div>
    );
}

export default DomainList;

type DomainListSectionProps = {
    rebuild?: (domaine: string) => Promise<void>,
    backup?: (domaine: string) => Promise<void>,
}

export function DomainListSection(props: DomainListSectionProps) {
    
    let { rebuild, backup } = props;

    let domains = useDomainStore(state=>state.domains);

    let sortedDomainElems = useMemo(()=>{
        if(!domains) return [];
        // Sort
        let domainCopy = [...domains];
        domainCopy.sort(sortDomains);
        return domainCopy.map(item=><DomainItem key={item.domaine} value={item} rebuild={rebuild} backup={backup} />)
    }, [domains, rebuild, backup]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-4 py-3">Domain</th>
                        <th className="px-4 py-3">Last presence</th>
                        <th className="px-4 py-3">Instance</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {sortedDomainElems.length > 0 ? (
                        sortedDomainElems
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No domains found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

type DomainItemProps = {
    value: DomainStore,
    rebuild?: (domaine: string) => Promise<void>,
    backup?: (domaine: string) => Promise<void>,
}

function DomainItem(props: DomainItemProps) {

    const { value, rebuild, backup } = props;

    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const instances = useInstanceStore(state=>state.instances);

    const backupHandler = useCallback(async () => {
        if(!backup) throw new Error("backup method not provided");
        if(!value.domaine) throw new Error("domaine not provided");
        await backup(value.domaine);
    }, [backup, value.domaine]);

    const rebuildHandler = useCallback(async () => {
        if(!rebuild) throw new Error("rebuild method not provided");
        if(!value.domaine) throw new Error("domaine not provided");
        await rebuild(value.domaine);
    }, [value.domaine, rebuild]);

    const instanceLabel = useMemo(()=>{
        if(!instances || !value.instance_id) return '-';
        let instance = instances.filter(item=>item.instance_id === value.instance_id).pop();
        if(instance) {
            const hostname = instance?.system_state?.host?.hostname;
            if(hostname) {
                const labelSplit = hostname.split('.');
                if(labelSplit && labelSplit.length > 1) {
                    return <><span className="font-medium">{labelSplit[0]}</span> <span className="text-slate-500 text-xs">.{labelSplit.slice(1).join('.')}</span></>
                }
                return <>{hostname}</>;
            }
        }
        return <span className="text-slate-500">{value.instance_id}</span>;
    }, [instances, value.instance_id]);

    const backupRunning = useMemo(()=>{
        return !!value.backupRunning;
    }, [value.backupRunning]);

    return (
        <tr>
            <td className='px-4 py-3 text-white font-medium'>{value.domaine}</td>
            <td className="px-4 py-3 text-slate-400">
                <ConditionalFormatters.FormatterConditionalDate value={value.presence?value.presence:undefined} warn={360} error={1800} />
            </td>
            <td className="px-4 py-3 text-slate-400 break-words">{instanceLabel}</td>
            <td className="px-4 py-3 text-slate-400">
                <DomainStatus value={value} />
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                    {backup?
                        <ActionButton onClick={backupHandler} disabled={!ready || backupRunning} 
                            forceErrorStatus={!!value.backupMessage} className="px-2 py-1 text-xs">Backup</ActionButton>
                    :
                        <></>}
                    {rebuild?
                        <ActionButton onClick={rebuildHandler} disabled={!ready || !!value.rebuilding} className="px-2 py-1 text-xs">Rebuild</ActionButton>
                    :
                        <></>}
                </div>
            </td>
        </tr>
    )
}

export function sortDomains(a: DomainStore | DomainBackupInformation | null, b: DomainStore | DomainBackupInformation | null) {
    if(a === b) return 0;
    if(!a) return 1;
    if(!b) return -1;
    return a.domaine.localeCompare(b.domaine);
}

function DomainStatus(props: {value: DomainStore}) {
    let { value } = props;

    let rebuildPct = useMemo(()=>{
        if(value.rebuilding) {
            let { rebuildPosition, rebuildTotalTransactions } = value;
            if(typeof(rebuildPosition) === 'number' && typeof(rebuildTotalTransactions) === 'number') {
                return Math.floor(rebuildPosition / rebuildTotalTransactions * 100.0);
            }
            return 0;
        }
        return 100;
    }, [value]) as number;

    let backupStatus = useMemo(()=>{
        if(!value.backupRunning && !value.backupResult && !value.backupMessage) return null;
        if(value.backupMessage) return value.backupMessage;
        if(value.backupRunning) return 'Backup running';
        if(value.backupResult) return 'Backup done';
    }, [value]);

    if(value.rebuildDone) {
        return <span className="text-green-400 text-xs">Rebuild complete</span>;
    }

    if(value.rebuilding) {
        return <span className="text-blue-400 text-xs">Rebuilding ({rebuildPct}%)</span>;
    }

    if(backupStatus) return <span className="text-amber-400 text-xs">{backupStatus}</span>;

    if(value.reclame_fuuids) {
        return <span className="text-purple-400 text-xs">Reclame fuuids</span>;
    }

    return <span className="text-slate-600 text-xs">Stable</span>;
}
