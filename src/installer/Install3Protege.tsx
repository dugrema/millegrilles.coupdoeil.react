import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import MasterKeyLoader from "../utilities/MasterKeyLoader";
import { certificates, forgePrivateKey, multiencoding, random } from "millegrilles.cryptography";


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

    let [generateNewKey, setGenerateNewKey] = useState(false);
    let generateNewKeyHandler = useCallback(()=>setGenerateNewKey(true), [setGenerateNewKey]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-2'>Master key</h2>

            <p>
                You can load an existing master key to restore your system or create a new key for a new system. 
                Do not reuse a master key <span className='font-bold'>between different systems</span>.
            </p>

            <h3 className='font-bold pt-2'>Create a new master key</h3>
            <button onClick={generateNewKeyHandler} disabled={!!generateNewKey} 
                className="btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900">
                    Generate key
            </button>

            <h3 className='font-bold pt-4'>Load an existing master key</h3>
            <MasterKeyLoader onChange={onChange} disabled={!!generateNewKey} />

            <GenerateNewKey show={generateNewKey} />

        </section>
    );
}

function GenerateNewKey(props: {show: boolean}) {
    
    let { show } = props;

    useEffect(()=>{
        if(!show) return;
        Promise.resolve().then(async ()=>{
            let randomBytes = random.getRandom(20);
            let password = multiencoding.encodeBase64Nopad(randomBytes);
            let newSysteminfo = await forgePrivateKey.generateMilleGrilleCertificate(password);
            console.debug("New system info: ", newSysteminfo);
            let wrapper = new certificates.CertificateWrapper([newSysteminfo.certPem]);
            let certificate = wrapper.certificate;
            let idmg = await certificates.getIdmg(certificate);
            console.debug("New system identifier: %s, password: %s", idmg, password);
        })
        .catch(err=>console.error("Error generating new millegrille key/certificate", err));
    }, [show]);

    if(!show) return <></>;

    return (
        <>
            <p>Generating a new key</p>
        </>
    )
}
