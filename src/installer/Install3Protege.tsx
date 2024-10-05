import { Link } from "react-router-dom";
import MasterKeyLoader from "../utilities/MasterKeyLoader";
import { useCallback, useState } from "react";

function Install3Protege() {

    let [masterKey, setMasterKey] = useState(null as Uint8Array | null);
    let masterKeyChangeHandler = useCallback((key: Uint8Array | null)=>setMasterKey(key), [setMasterKey]);

    return (
        <>
            <Link to='/coupdoeil2/install'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Install new system</h1>

            <MasterKeySource onChange={masterKeyChangeHandler} />
        </>
    );
}

export default Install3Protege;

function MasterKeySource(props: {onChange: (key: Uint8Array|null)=>void}) {

    let { onChange } = props;

    return (
        <section>
            <h2 className='text-lg font-bold pt-2'>Master key</h2>

            <p>
                You can load an existing master key to restore your system or create a new key for a new system. 
                Do not reuse a master key <span className='font-bold'>between different systems</span>.
            </p>

            <h3 className='font-bold pt-2'>Create a new master key</h3>
            <button className="btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900">
                Generate key
            </button>

            <h3 className='font-bold pt-4'>Load an existing master key</h3>
            <MasterKeyLoader onChange={onChange} />

        </section>
    );
}
