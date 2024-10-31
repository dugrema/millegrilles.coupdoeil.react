import { Link, useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { ChangeEvent, useCallback, useState } from "react";

function FileHostingAdd() {

    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let workers = useWorkers();
    let navigate = useNavigate();
    
    let [url, setUrl] = useState('');
    let urlOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setUrl(e.currentTarget.value), []);

    let saveHandler = useCallback(async ()=>{
        if(!ready || !workers) throw new Error('workers not initialized');
        let urlParsed = new URL(url);
        console.debug("Adding file host with url: %s", urlParsed.href);
        let response = await workers.connection.addFileHost(urlParsed.href);
        console.debug("Response", response);
        if(response.ok !== true) {
            throw new Error('Error adding file host: ' + response.err);
        }
        navigate('/coupdoeil2/fileHosting');
    }, [navigate, workers, ready, url]);

    let testUrlHandler = useCallback(async ()=>{
    }, []);

    return (
        <>
            <Link to='/coupdoeil2/fileHosting'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4 pb-2'>Add new file host</h1>

            <section>
                <div className='grid grid-cols-1 lg:grid-cols-12'>
                    <label>Url</label>
                    <input placeholder="E.g.: https://myhost.com" value={url} onChange={urlOnChange}
                        className='col-span-11 text-black'/>
                </div>
                <div className='text-center pt-4'>
                    <ActionButton onClick={saveHandler} disabled={!ready||!workers} mainButton={true}>Save</ActionButton>
                    <ActionButton onClick={testUrlHandler}>Test</ActionButton>
                    <Link to='/coupdoeil2/fileHosting'
                        className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                            Cancel
                    </Link>
                </div>
            </section>
        </>
    )
}

export default FileHostingAdd;
