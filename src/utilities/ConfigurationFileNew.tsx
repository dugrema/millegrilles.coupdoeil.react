import { ChangeEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";

function ConfigurationFileNew() {
    const navigate = useNavigate();
    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);

    const [filename, setFilename] = useState('');
    const filenameOnchange = useCallback((e: ChangeEvent<HTMLInputElement>) => setFilename(e.currentTarget.value), [setFilename]);
    const [roles, setRoles] = useState('');
    const rolesOnchange = useCallback((e: ChangeEvent<HTMLInputElement>) => setRoles(e.currentTarget.value), [setRoles]);
    const [domains, setDomains] = useState('');
    const domainsOnChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setDomains(e.currentTarget.value), [setDomains]);

    const createFileHandler = useCallback(async ()=>{
        if(!ready) throw new Error("Connection not ready");
        if(!workers) throw new Error("Connection not ready");
        if(!filename) throw new Error("Filename is required");
        if(!roles && !domains) throw new Error("Either roles or domains is required");

        let roleList = null as string[] | null;
        if(roles) roleList = roles.split(',');
        let domainList = null as string[] | null;
        if(domains) domainList = domains.split(',');

        const response = await workers.connection.configurationCreateFile(filename, roleList, domainList);
        console.debug("Create file response", response);
        if(!response.ok) {
            throw new Error(`Error creating configuration file: ${response.err}`);
        } else if(response.file_id) {
            navigate(`../${response.file_id}`);
        } else {
            throw new Error("No file id received");
        }
        
    }, [workers, ready, navigate, filename, roles, domains]);

    const cancelHandler = useCallback(()=>{
        navigate('..');
    }, [navigate]);
    
    return (
        <>
            <p>Create new file</p>

            <div className="grid grid-cols-3">
                <label htmlFor="filename">File name</label>
                <input id="filename" type="text" value={filename} onChange={filenameOnchange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />
                <label htmlFor="roles">Roles</label>
                <input id="roles" type="text" value={roles} onChange={rolesOnchange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />
                <label htmlFor="domains">Domains</label>
                <input id="domains" type="text" value={domains} onChange={domainsOnChange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />

                <div className="col-span-2">
                    <ActionButton onClick={createFileHandler} mainButton={true} disabled={!ready}>
                        Create
                    </ActionButton>
                    <button onClick={cancelHandler}
                            className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none'>
                        Cancel
                    </button>
                </div>
            </div>

            <p>Note on roles on domains: you can leave either empty. To use multiple roles/domains, separate them with a comma (,).</p>
        </>
    )
}

export default ConfigurationFileNew;