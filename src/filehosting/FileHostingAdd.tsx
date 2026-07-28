import { Link, useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { ChangeEvent, useCallback, useState } from "react";
import { ExternalUrlTypeDropdown, SecurityDescription } from "./FileHostingEdit";

function FileHostingAdd() {
    const ready = useConnectionStore(state => state.connectionAuthenticated);
    const workers = useWorkers();
    const navigate = useNavigate();

    const [instanceId, setInstanceId] = useState('');
    const instanceIdOnChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setInstanceId(e.currentTarget.value), []);
    const [externalUrl, setExternalUrl] = useState('');
    const externalUrlOnChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setExternalUrl(e.currentTarget.value), []);
    const [tlsSecurity, setTlsSecurity] = useState('external');

    const saveHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error('workers not initialized');
        const externalUrlParsed = new URL(externalUrl);
        const response = await workers.connection.addFileHost(instanceId, externalUrlParsed.href, tlsSecurity);
        if (response.ok !== true) {
            throw new Error('Error adding file host: ' + response.err);
        }
        navigate('/coupdoeil2/fileHosting');
    }, [navigate, workers, ready, instanceId, externalUrl, tlsSecurity]);

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2/fileHosting'
                    className='inline-flex items-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-xl font-bold text-slate-300'>Add new file host</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <div className='space-y-6'>
                    <p>Use Instance ID for filehosts in the same MilleGrille</p>
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-center'>
                        <label className='lg:col-span-2 text-sm text-slate-400'>Instance ID</label>
                        <input 
                            placeholder="E.g.: 66e0f0d6-89e7-11f1-a228-fc349716f87d" 
                            value={instanceId} 
                            onChange={instanceIdOnChange}
                            className='lg:col-span-10 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                        />
                    </div>

                    <p>OR use External url for filehosts managed externally</p>

                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-center'>
                        <label className='lg:col-span-2 text-sm text-slate-400'>External url</label>
                        <input 
                            placeholder="E.g.: https://myhost.com" 
                            value={externalUrl} 
                            onChange={externalUrlOnChange}
                            className='lg:col-span-10 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                        />
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-center'>
                        <label className='lg:col-span-2 text-sm text-slate-400'>TLS security check</label>
                        <div className='lg:col-span-10'>
                            <ExternalUrlTypeDropdown value={tlsSecurity} onChange={setTlsSecurity} className='w-full' />
                        </div>
                    </div>

                    <SecurityDescription />

                    <div className='flex flex-wrap gap-4 pt-4 justify-end'>
                        <ActionButton onClick={saveHandler} disabled={!ready || !workers} mainButton={true}>
                            Save
                        </ActionButton>
                        <Link to='/coupdoeil2/fileHosting'
                            className='inline-flex items-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl transition-all duration-200'>
                            Cancel
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    )
}

export default FileHostingAdd;

