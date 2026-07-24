import { Link } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import useFilehostStore, { FilehostStoreItem } from "./filehostingStore";
import { ConditionalFormatters, Formatters } from "millegrilles.reactdeps.typescript";
import useInstanceStore from "../instances/instanceStore";

function FileHostingList() {
    const ready = useConnectionStore(state => state.connectionAuthenticated);
    const workers = useWorkers();

    const syncHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error("Workers not initialized");
    }, [ready, workers]);

    const reindexHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error("Workers not initialized");
        const result = await workers.connection.reindexFileManagers();
        if (!result.ok) throw new Error("Error resetting indexes");
    }, [ready, workers]);

    const resetTransfersHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error("Workers not initialized");
        const response = await workers.connection.resetTransfers();
        if (!response.ok) throw new Error('Error resetting transfers: ' + response.err);
    }, [ready, workers]);

    const resetVisitsHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error("Workers not initialized");
        const response = await workers.connection.resetVisitsClaims();
        if (response.ok !== true) throw new Error('Error resetting visits: ' + response.err);
    }, [ready, workers]);

    const claimAllHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error("Workers not initialized");
        const response = await workers.connection.claimAllFiles();
        if (response.ok !== true) throw new Error('Error resetting visits: ' + response.err);
    }, [ready, workers]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2'
                    className='inline-flex items-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-xl font-bold text-slate-300'>File hosting</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate/700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2'>Utilities</h2>

                <div className="flex flex-wrap gap-4">
                    <ActionButton onClick={syncHandler} disabled={!ready} mainButton={true}>Synchronize</ActionButton>
                    <ActionButton onClick={reindexHandler} disabled={!ready}>Reindex</ActionButton>
                    <ActionButton onClick={resetTransfersHandler} disabled={!ready}>Reset transfers</ActionButton>
                    <ActionButton onClick={resetVisitsHandler} disabled={!ready}>Reset visits/claims</ActionButton>
                    <ActionButton onClick={claimAllHandler} disabled={!ready} className="bg-amber-600/20 hover:bg-amber-600/30 border-amber-600/40 text-amber-400">Claim all</ActionButton>
                </div>
            </section>

            <section className='bg-slate-800/50 border border-slate/700 p-6 rounded-2xl shadow-xl'>
                <div className="flex items-center justify-between mb-4 border-b border-slate/700 pb-2">
                    <h2 className='text-lg font-bold text-slate/300'>File hosts list</h2>
                    <Link to='/coupdoeil2/fileHosting/add'
                        className='inline-flex items-center px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm transition-all duration-200'>
                        + Add host
                    </Link>
                </div>

                <div className='grid grid-cols-12 gap-2 mb-2'>
                    <p className='font-semibold col-span-12 lg:col-span-4 text-slate-400'>Url / Instance</p>
                    <p className='font-semibold col-span-6 lg:col-span-3 text-slate/400 text-center lg:text-left'>Status</p>
                    <p className='font-semibold col-span-3 lg:col-span-1 text-slate/400 text-center'>Files</p>
                    <p className='font-semibold col-span-2 lg:col-span-2 text-slate/400 text-center'>Size</p>
                    <p className='font-semibold hidden lg:block col-span-2 text-slate/400 text-center'>Queue</p>
                </div>
                <FileHostList />
            </section>

            <section className='bg-slate-800/50 border border-slate/700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate/300 mb-4 border-b border-slate/700 pb-2'>File controllers list</h2>
                <div className='grid grid-cols-12 gap-2 mb-2'>
                    <p className='font-semibold col-span-7 lg:col-span-5 text-slate/400'>Instance</p>
                    <p className='font-semibold col-span-5 lg:col-span-7 text-slate/400 text-center'>Presence</p>
                </div>
                <FileControlerList />
            </section>
        </div>
    )
}

export default FileHostingList;

const CONST_CLASSNAME_FILEHOST_ROW = 'grid grid-cols-12 items-center odd:bg-slate-700/30 pt-2 pb-2 pl-2 pr-2 hover:bg-slate-700/50 transition-colors rounded-lg';

type FilehostListItem = FilehostStoreItem & {label: string};

function FileHostList() {
    const filehosts = useFilehostStore(state => state.filehosts);
    const instances = useInstanceStore(state => state.instances);

    const filehostElems = useMemo(() => {
        if (!filehosts) return null;

        const filehostCopy = filehosts.filter(item => !item.deleted).map(item => {
            let label = item.url_external;
            if (!label) {
                if (instances) {
                    const instance = instances.find(instance => instance.instance_id === item.instance_id);
                    if (instance) label = instance.hostname;
                }
            }
            if (!label) label = item.filehost_id; // Fallback
            return { ...item, label };
        }) as FilehostListItem[];
        filehostCopy.sort((a, b) => a.label.localeCompare(b.label));

        return filehostCopy.map(item => {
            let count = '' as number | string;
            if (typeof (item.fuuid?.count) === 'number') count = item.fuuid.count;
            let size = undefined as number | undefined;
            if (typeof (item.fuuid?.size) === 'number') size = item.fuuid.size;

            let status = '...';
            if (!item.sync_active) status = 'disabled';
            else if (item.connected) status = 'connected';
            else if (item.connected === false) status = 'not connected';

            let transferQueueLength = 'N/A' as number | string;
            if (typeof (item.transfer_q_len) === 'number') transferQueueLength = item.transfer_q_len;

            const statusColor = status === 'connected' ? 'text-emerald-400' : (status === 'disabled' ? 'text-amber-400' : 'text-red-400');

            return (
                <div key={item.filehost_id} className={CONST_CLASSNAME_FILEHOST_ROW}>
                    <Link to={`/coupdoeil2/fileHosting/filehost/${item.filehost_id}`}
                        className='underline col-span-12 lg:col-span-4 text-blue-400 hover:text-blue-300 transition-colors'>
                        {item.label}
                    </Link>
                    <p className={`col-span-6 lg:col-span-3 text-center lg:text-left text-sm font-medium ${statusColor}`}>{status}</p>
                    <p className='col-span-3 lg:col-span-1 text-center text-slate-300'>{count}</p>
                    <p className='col-span-2 lg:col-span-2 text-center text-slate/300'><Formatters.FormatteurTaille value={size} /></p>
                    <p className='hidden lg:block col-span-2 text-center text-slate/300'>{transferQueueLength}</p>
                </div>
            )
        });
    }, [filehosts, instances]);

    if (!filehostElems) return <p className="text-slate-400">Loading ...</p>;
    return <>{filehostElems}</>;
}

const CONST_CLASSNAME_FILECONTROLER_ROW = 'grid grid-cols-12 items-center odd:bg-slate/50 pt-2 pb-2 pl-2 pr-2 hover:bg-slate/50 transition-colors rounded-lg';

function FileControlerList() {
    const filecontrolers = useFilehostStore(state => state.filecontrolers);
    const instances = useInstanceStore(state => state.instances);

    const filecontrolersElems = useMemo(() => {
        if (!filecontrolers) return <p className="text-slate/400">Loading ...</p>;
        return filecontrolers.map(item => {
            let label = null;
            if (!label) {
                if (instances) {
                    const instance = instances.find(instance => instance.instance_id === item.instance_id);
                    if (instance) label = instance.hostname;
                }
            }
            if (!label) label = item.instance_id; // Fallback

            return (
                <div key={item.instance_id} className={CONST_CLASSNAME_FILECONTROLER_ROW}>
                    <p className='col-span-7 lg:col-span-5 text-slate/200'>{label}</p>
                    <div className='col-span-5 lg:col-span-7 text-center lg:text-left'>
                        <ConditionalFormatters.FormatterConditionalDate 
                            value={item.lastUpdate} warn={360} error={1800} className='text-sm' />
                    </div>
                </div>
            )
        });
    }, [filecontrolers, instances]);

    return <>{filecontrolersElems}</>;
}

export function FilehostDropdown(props: {value: string, onChange: Dispatch<string>, className?: string}) {
    const {value, onChange, className} = props;

    const filehosts = useFilehostStore(state => state.filehosts);
    const instances = useInstanceStore(state => state.instances);

    const onChangeHandler = useCallback((e: ChangeEvent<HTMLSelectElement>)=>{
        onChange(e.currentTarget.value);
    }, [onChange]);

    const filehostElems = useMemo(() => {
        if (!filehosts) return null;
        const filehostCopy = filehosts.filter(item => !item.deleted).map(item => {
            let label = item.url_external;
            if (!label) {
                if (instances) {
                    const instance = instances.find(instance => instance.instance_id === item.instance_id);
                    if (instance) label = instance.hostname;
                }
            }
            if (!label) label = item.filehost_id; // Fallback
            return { ...item, label };
        }) as FilehostListItem[];
        filehostCopy.sort((a, b) => a.label.localeCompare(b.label));

        return filehostCopy.map(item => (
            <option key={item.filehost_id} value={item.filehost_id}>{item.label}</option>
        ))
    }, [filehosts, instances]);

    return (
        <select value={value} onChange={onChangeHandler} className={'bg-slate-900 border border-slate/700 text-slate/200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ' + className}>
            <option value="">Pick one</option>
            {filehostElems}
        </select>
    )
}

function FilehostConfiguration() {
    const workers = useWorkers();
    const ready = useConnectionStore(state => state.connectionAuthenticated);

    const [defaultFilehost, setDefaultFilehost] = useState('');

    const saveConfigurationHandler = useCallback(async () => {
        if (!workers) throw new Error('workers not initialized');
        if (!defaultFilehost) throw new Error('No filehost value provided')
        const response = await workers.connection.setDefaultFilehost(defaultFilehost);
        if (response.ok !== true) throw new Error('Error saving default filehost: ' + response.err);
    }, [workers, defaultFilehost]);

    useEffect(() => {
        if (!ready || !workers) return;

        workers.connection.getFilehostConfiguration()
            .then(response => {
                if (response.configuration) {
                    const defaultFilehost = response.configuration['filehost.default']
                    setDefaultFilehost(defaultFilehost);
                }
            })
            .catch(err => console.error("Error loading filehost configuration", err));
    }, [workers, ready, setDefaultFilehost])

    return (
        <div className="space-y-4">
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 items-center'>
                <label className='text-sm text-slate/400'>Default file host</label>
                <FilehostDropdown value={defaultFilehost} onChange={setDefaultFilehost} className='lg:col-span-3' />
            </div>
            <div className="flex justify-end">
                <ActionButton onClick={saveConfigurationHandler} disabled={!ready}>Save</ActionButton>
            </div>
        </div>
    )
}
