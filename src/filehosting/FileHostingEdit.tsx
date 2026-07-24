import { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ToggleSwitch } from "flowbite-react";

import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import useFilehostStore from "./filehostingStore";
import { FileHost } from "../workers/connection.worker";

function FileHostingEdit() {
    const ready = useConnectionStore(state => state.connectionAuthenticated);
    const workers = useWorkers();
    const navigate = useNavigate();
    const { filehostId } = useParams<{ filehostId: string }>();
    const filehosts = useFilehostStore(state => state.filehosts);

    // Note : this is the reference filehost - can change from external event.
    const filehostFromStore = useMemo(() => {
        if (!filehosts || !filehostId) return null;
        return filehosts.find(item => item.filehost_id === filehostId) || null;
    }, [filehosts, filehostId]);

    const [urlExternal, setUrlExternal] = useState('');
    const urlExternalOnChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setUrlExternal(e.currentTarget.value), [setUrlExternal]);
    const [externalTlsSecurity, setExternalTlsSecurity] = useState('external');
    const [urlInternal, setUrlInternal] = useState('');
    const urlInternalOnChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setUrlInternal(e.currentTarget.value), [setUrlInternal]);
    const [syncActive, setSyncActive] = useState(true);
    const syncActiveOnChange = useCallback((checked: boolean) => setSyncActive(checked), [setSyncActive]);

    const instanceId = useMemo(() => {
        if (!filehostFromStore) return null;
        return filehostFromStore.instance_id;
    }, [filehostFromStore]);

    const saveHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error('workers not initialized');
        const urlExternalParsed = urlExternal ? new URL(urlExternal) : null;
        const urlInternalParsed = urlInternal ? new URL(urlInternal) : null;

        const fileHost = {
            filehost_id: filehostId,
            url_external: urlExternalParsed ? urlExternalParsed.href : null,
            url_internal: urlInternalParsed ? urlInternalParsed.href : null,
            sync_active: syncActive,
            tls_external: externalTlsSecurity,
        } as FileHost;

        const response = await workers.connection.updateFileHost(fileHost);
        if (response.ok !== true) {
            throw new Error('Error updating file host: ' + response.err);
        }

        navigate('/coupdoeil2/fileHosting');
    }, [workers, ready, filehostId, navigate, urlExternal, urlInternal, syncActive, externalTlsSecurity]);

    const testUrlHandler = useCallback(async () => {
    }, []);

    const deleteHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error('workers not initialized');
        if (!filehostId) throw new Error('filehostId not provided');
        const response = await workers.connection.deleteFileHost(filehostId);
        if (response.ok !== true) {
            throw new Error('Error deleting fileHost: ' + response.err);
        }
        navigate('/coupdoeil2/fileHosting');
    }, [workers, ready, navigate, filehostId]);

    const [locked, setLocked] = useState(false);
    useEffect(() => {
        if (locked || !filehosts || !filehostId) return;

        const filehost = filehosts.find(item => item.filehost_id === filehostId);
        if (!filehost) {
            return;
        }

        setUrlExternal(filehost.url_external || '');
        setUrlInternal(filehost.url_internal || '');
        setSyncActive(!!filehost.sync_active);
        setExternalTlsSecurity(filehost.tls_external || 'external');

        setLocked(true);
    }, [ready, locked, filehostId, filehosts]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2/fileHosting'
                    className='inline-flex items-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-xl font-bold text-slate-300'>Edit file host</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-4'>
                        <div className='lg:col-span-2 flex flex-col'>
                            <span className='text-sm text-slate-400'>Filehost Id</span>
                            <span className='font-mono text-slate-200 break-all'>{filehostId}</span>
                        </div>
                        <div className='lg:col-span-2 flex flex-col'>
                            <span className='text-sm text-slate/400'>Instance Id</span>
                            <span className='text-slate/200 break-all'>{instanceId || 'N/A'}</span>
                        </div>
                        
                        <div className='lg:col-span-4 flex flex-col space-y-2'>
                            <label htmlFor='urlExternalId' className='text-sm text-slate/400'>Url (external)</label>
                            <input id='urlExternalId' placeholder="E.g.: https://myhost.com" value={urlExternal} onChange={urlExternalOnChange}
                                className='bg-slate-900 border border-slate/700 text-slate/200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                            />
                        </div>
                        
                        <div className='lg:col-span-6 flex flex-col space-y-2'>
                            <label className='text-sm text-slate/400'>TLS security check</label>
                            <ExternalUrlTypeDropdown value={externalTlsSecurity} onChange={setExternalTlsSecurity} className='w-full' />
                        </div>

                        {instanceId && (
                            <>
                                <div className='lg:col-span-4 flex flex-col space-y-2'>
                                    <label htmlFor='urlInternalId' className='text-sm text-slate/400'>Url (internal)</label>
                                    <input id='urlInternalId' placeholder="E.g.: https://myhost.com" value={urlInternal} onChange={urlInternalOnChange}
                                        className='bg-slate-900 border border-slate/700 text-slate/200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                                    />
                                </div>
                                <div className='lg:col-span-2 flex flex-col space-y-2'>
                                    <label htmlFor='syncActiveId' className='text-sm text-slate/400'>Synchronisation active</label>
                                    <div className='pt-1'>
                                        <ToggleSwitch id='syncActiveId' checked={syncActive} onChange={syncActiveOnChange} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <SecurityDescription />

                    <div className='flex flex-wrap gap-4 pt-4 justify-end'>
                        <ActionButton onClick={testUrlHandler} className="bg-slate/700 hover:bg-slate/600 border-slate/600">
                            Test
                        </ActionButton>
                        <ActionButton onClick={saveHandler} disabled={!ready || !workers} mainButton={true}>
                            Save
                        </ActionButton>
                    </div>
                </div>
            </section>

            <section className='bg-slate-800/50 border border-red-500/30 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-red-400 mb-4 border-b border-red-500/20'>Delete</h2>
                <p className='text-slate/400 text-sm mb-4'>
                    Remove the filehost from the list. Also disables all actions on it and allows all files to be deleted later on.
                </p>
                <ActionButton onClick={deleteHandler} disabled={!ready || !workers} className="bg-red-600 hover:bg-red-500 border-red-500">
                    Delete
                </ActionButton>
            </section>
        </div>
    )
}

export default FileHostingEdit;

export function ExternalUrlTypeDropdown(props: {value: string, onChange: Dispatch<string>, className?: string}) {
    const {value, onChange, className} = props;

    const onChangeHandler = useCallback((e: ChangeEvent<HTMLSelectElement>)=>{
        onChange(e.currentTarget.value);
    }, [onChange]);

    return (
        <select value={value} onChange={onChangeHandler}
            className={'bg-slate-900 border border-slate/700 text-slate/200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ' + className}>
                <option value="external">External TLS certificate</option>
                <option value="millegrille">MilleGrille client TLS certificate</option>
                <option value="nocheck">No check</option>
        </select>
    )    
}


export function SecurityDescription() {
    return (
        <section className="bg-slate-900/50 p-4 rounded-xl border border-slate/700/50">
            <p className='text-sm text-slate/400 mb-2'>
                Notes about the external TLS security check: 
            </p>

            <ol className='list-decimal list-inside text-xs text-slate/400 space-y-1'>
                <li>
                    The most secure is the MilleGrille client TLS certificate. This requires a filehost
                    installed on a MilleGrille instance and usage of the port 444.
                </li>
                <li>
                    External requires that a TLS certificate be installed and valid on the host (e.g. from 
                    Let's Encrypt, ZeroSSL, Verisign, etc.).
                </li>
                <li>
                    No check is inherently insecure and allows man in the middle attacks. 
                </li>
            </ol>
        </section>
    )
}
