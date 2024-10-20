import { useState } from "react";
import { Link } from "react-router-dom";

import MasterKeyLoader, { MasterKeyFile, MasterKeyInformation } from "../utilities/MasterKeyLoader";
import InstallInstance from "./GenerateCertificates";


function Install4Secure() {

    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null);

    return (
        <>
            <Link to='/coupdoeil2/install'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Install a secure instance</h1>

            {masterKey?
                <InstallInstance masterKey={masterKey} security='4.secure' />
            :
                <MasterKeySource onChange={setMasterKey} />
            }
        </>
    );
}

export default Install4Secure;

function MasterKeySource(props: {onChange: (key: MasterKeyInformation|null)=>void}, setFile?: (file: MasterKeyFile)=>void) {

    let { onChange } = props;

    return (
        <section>
            <h2 className='text-lg font-bold pt-2'>Master key</h2>
            <h3 className='font-bold pt-4'>Load an existing master key</h3>
            <MasterKeyLoader onChange={onChange} />
        </section>
    );
}
