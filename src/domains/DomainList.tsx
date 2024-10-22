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
        console.debug("Rebuild response ", response);
        if(response.ok !== true) throw new Error('Error starting rebuild: ' + response.err);
    }, [workers, ready]);

    let domainBackupHandler = useCallback(async (domaine: string) => {
        if(!ready || !workers) throw new Error("workers not initialized");
        let response = await workers.connection.backupDomain(domaine)
        if(response.ok !== true) throw new Error('Error starting backup: ' + response.err);
    }, [workers, ready]);

    let backupAllHandler = useCallback(async () => {
        if(!ready || !workers) throw new Error('workers not initialized');
        let result = await workers.connection.backupDomain('global');
        // Only check that a result was received. The command is sent to all domains at the same time, the first response wins.
        if(!result) throw new Error("No response received to complete backup command");
    }, [workers, ready]);

    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Domains</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Utilities</h2>

                <ActionButton onClick={backupAllHandler} disabled={!ready} mainButton={true}>
                    Backup now
                </ActionButton>

                <Link to='/coupdoeil2/domains/restore'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Restore
                </Link>

                <Link to='/coupdoeil2/domains/backup'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Files
                </Link>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Domain list</h2>
                <DomainListSection rebuild={rebuildHandler} backup={domainBackupHandler} />
            </section>
        </>
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
        <div className='grid grid-cols-2 lg:grid-cols-6'>
            <p className='col-span-2  font-bold pb-2'>Domain</p>
            <p className='font-bold pb-2'>Last presence</p>
            <p className='font-bold pb-2'>Instance</p>
            <p className='font-bold pb-2'>Status</p>
            <p className='font-bold pb-2'>Actions</p>
            {sortedDomainElems}
        </div>
    );

}

type DomainItemProps = {
    value: DomainStore,
    rebuild?: (domaine: string) => Promise<void>,
    backup?: (domaine: string) => Promise<void>,
}

function DomainItem(props: DomainItemProps) {

    let { value, rebuild, backup } = props;

    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let instances = useInstanceStore(state=>state.instances);

    let backupHandler = useCallback(async () => {
        if(!backup) throw new Error("backup method not provided");
        if(!value.domaine) throw new Error("domaine not provided");
        await backup(value.domaine);
    }, [backup]);

    let rebuildHandler = useCallback(async () => {
        if(!rebuild) throw new Error("rebuild method not provided");
        if(!value.domaine) throw new Error("domaine not provided");
        await rebuild(value.domaine);
    }, [value, rebuild]);

    let instanceLabel = useMemo(()=>{
        if(!instances || !value.instance_id) return '';
        let instance = instances.filter(item=>item.instance_id === value.instance_id).pop();
        if(instance) {
            let labelSplit = instance.hostname.split('.');
            // Split the first domain value from the hostname. Allows displaying on 2 lines.
            if(labelSplit.length > 1) {
                return labelSplit[0] + ' .' + labelSplit.slice(1).join('.')
            }
            return instance.hostname;
        }
        return value.instance_id;
    }, [instances]);

    let backupRunning = useMemo(()=>{
        if(value.backupRunning) return true;
        return false;
    }, [value]);

    return (
        <>
            <p className='col-span-2 '>{value.domaine}</p>
            <ConditionalFormatters.FormatterConditionalDate value={value.presence?value.presence:undefined} warn={360} error={1800} />
            <p className='break-words'>{instanceLabel}</p>
            <p className='pb-2'><DomainStatus value={value} /></p>
            <div className='pb-2'>
                {backup?
                    <ActionButton onClick={backupHandler} disabled={!ready || backupRunning} 
                        forceErrorStatus={!!value.backupMessage}>Backup</ActionButton>
                :<></>}
                {rebuild?
                    <ActionButton onClick={rebuildHandler} disabled={!ready || !!value.rebuilding}>Rebuild</ActionButton>
                :<></>}
            </div>
        </>
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
        return <span>Rebuild complete</span>;
    }

    if(value.rebuilding) {
        return <span>Rebuilding ({rebuildPct})%</span>;
    }

    if(value.reclame_fuuids) {
        return <span>Reclame fuuids</span>;
    }

    if(backupStatus) return <span>{backupStatus}</span>;

    return <span></span>;
}
