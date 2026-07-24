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

    const [url, setUrl] = useState('');
    const urlOnChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setUrl(e.currentTarget.value), []);
    const [externalTlsSecurity, setExternalTlsSecurity] = useState('external');

    const saveHandler = useCallback(async () => {
        if (!ready || !workers) throw new Error('workers not initialized');
        const urlParsed = new URL(url);
        const response = await workers.connection.addFileHost(urlParsed.href, externalTlsSecurity);
        if (response.ok !== true) {
            throw new Error('Error adding file host: ' + response.err);
        }
        navigate('/coupdoeil2/fileHosting');
    }, [navigate, workers, ready, url, externalTlsSecurity]);

    const testUrlHandler = useCallback(async () => {
    }, []);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2/fileHosting'
                    className='inline-flex items-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-xl font-bold text-slate-300'>Add new file host</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-center'>
                        <label className='lg:col-span-2 text-sm text-slate-400'>Url</label>
                        <input 
                            placeholder="E.g.: https://myhost.com" 
                            value={url} 
                            onChange={urlOnChange}
                            className='lg:col-span-10 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
                        />
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-center'>
                        <label className='lg:col-span-2 text-sm text-slate-400'>TLS security check</label>
                        <div className='lg:col-span-10'>
                            <ExternalUrlTypeDropdown value={externalTlsSecurity} onChange={setExternalTlsSecurity} className='w-full' />
                        </div>
                    </div>
                    <SecurityDescription />
                    <div className='flex flex-wrap gap-4 pt-4 justify-end'>
                        <ActionButton onClick={testUrlHandler} className="bg-slate-700 hover:bg-slate-600 border-slate-600">
                            Test
                        </ActionButton>
                        <ActionButton onClick={saveHandler} disabled={!ready || !workers} mainButton={true}>
                            Save
                        </ActionButton>
                    </div>
                </div>
            </section>

            <div className="flex justify-end">
                <Link to='/coupdoeil2/fileHosting'
                    className='text-slate-400 hover:text-slate-200 text-sm transition-colors'>
                    Cancel
                </Link>
            </div>
        </div>
    )
}

export default FileHostingAdd;

