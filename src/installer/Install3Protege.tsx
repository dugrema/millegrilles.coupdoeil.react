import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import MasterKeyLoader, { MasterKeyFile, MasterKeyInformation } from "../utilities/MasterKeyLoader";
import { certificates, forgePrivateKey, multiencoding, random } from "millegrilles.cryptography";


function Install3Protege() {

    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null);

    return (
        <>
            <Link to='/coupdoeil2/install'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Install new system</h1>

            {masterKey?
                <InstallInstance masterKey={masterKey} />
            :
                <MasterKeySource onChange={setMasterKey} />
            }
        </>
    );
}

export default Install3Protege;

function MasterKeySource(props: {onChange: (key: MasterKeyInformation|null)=>void}, setFile?: (file: MasterKeyFile)=>void) {

    let { onChange } = props;

    let [generateNewKey, setGenerateNewKey] = useState(false);
    let [taunt, setTaunt] = useState(false);
    let openGenerateNewKey = useCallback(()=>setGenerateNewKey(true), [setGenerateNewKey]);
    let closeGenerateNewKey = useCallback(()=>{setGenerateNewKey(false); setTaunt(true)}, [setGenerateNewKey, setTaunt]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-2'>Master key</h2>

            {taunt?
                <p>
                    Use the new key you just saved in the Load an existing master key area below. 
                    This check allows making sure you have both the complete password and the file.
                </p>
            :
                <p>
                    You can load an existing master key to restore your system or create a new key for a new system. 
                    Do not reuse a master key <span className='font-bold'>between different systems</span>.
                </p>
            }

            {generateNewKey?
                <GenerateNewKey show={generateNewKey} close={closeGenerateNewKey} />
            :
                <>
                    {taunt?<></>:
                        <>
                            <h3 className='font-bold pt-2'>Create a new master key</h3>
                            <button onClick={openGenerateNewKey} disabled={!!generateNewKey} 
                                className="btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900">
                                    Generate key
                            </button>
                        </>
                    }

                    <h3 className='font-bold pt-4'>Load an existing master key</h3>
                    <MasterKeyLoader onChange={onChange} disabled={!!generateNewKey} />

                    <TauntScreen show={taunt} generateNewKey={openGenerateNewKey} />
                </>
            }

        </section>
    );
}

type NewKeyInformation = {
    idmg: string,
    certPem: string,
    encryptedPem: string,
    password: string,
}

function GenerateNewKey(props: {show: boolean, close:()=>void}) {
    
    let { show, close } = props;

    let [key, setKey] = useState(null as NewKeyInformation|null)
    let [downloadUrl, setDownloadUrl] = useState('');
    let [keyReady, setKeyReady] = useState(false);
    let keyReadyHandler = useCallback(()=>setKeyReady(true), [setKeyReady]);

    useEffect(()=>{
        if(key || !show) return;
        Promise.resolve().then(async ()=>{
            let randomBytes = random.getRandom(20);
            let password = multiencoding.encodeBase64Nopad(randomBytes);
            let newSysteminfo = await forgePrivateKey.generateMilleGrilleCertificate(password);
            console.debug("New system info: ", newSysteminfo);
            let wrapper = new certificates.CertificateWrapper([newSysteminfo.certPem]);
            let certificate = wrapper.certificate;
            let idmg = await certificates.getIdmg(certificate);
            
            console.debug("New system identifier: %s, password: %s", idmg, password);
            setKey({idmg, certPem: newSysteminfo.certPem, encryptedPem: newSysteminfo.encryptedPem, password});
            let downloadUrl = generateDataUrlDownloadKey(idmg, newSysteminfo.certPem, newSysteminfo.encryptedPem);
            setDownloadUrl(downloadUrl)
        })
        .catch(err=>console.error("Error generating new millegrille key/certificate", err));
    }, [show, setKey, setDownloadUrl, key]);

    if(!show) return <></>;

    return (
        <>
            <h3 className='font-bold pt-6'>New master key</h3>
            <p className='font-bold pt-4'>Important!</p>
            <p>
                This is your new system master key.
                Make sure you keep the password and the file somewhere safe where you won't lose them.
            </p>
            <ul className='pt-2 pb-6'>
                <li>This key cannot be recovered if you lose it.</li>
                <li>You cannot prevent someone who has it from controlling your system if it is stolen.</li>
            </ul>
            <ShowKeyDetail value={key} downloadUrl={downloadUrl} onReady={keyReadyHandler} />

            <p className='pt-10'>Copy the password and download the file before continuing. The key cannot be recovered once you leave this page.</p>
            <button disabled={!keyReady} onClick={close}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Next
            </button>
        </>
    )
}

function ShowKeyDetail(props: {value: NewKeyInformation|null, downloadUrl: string, onReady:()=>void}) {
    let {value, downloadUrl, onReady} = props;

    let downloadFileName = useMemo(()=>{
        if(!value) return '';
        return `masterKey_${value.idmg}.json`;
    }, [value]);

    let downloadClickHandler = useCallback(()=>{
        setTimeout(onReady, 1_000);
        return true;
    }, [onReady]);

    if(!value || !downloadUrl) return <></>;

    return (
        <div className='grid grid-cols-4'>
            <p className="pb-6">New system Id</p>
            <p className='col-span-3 pb-6'>{value.idmg}</p>
            <p>Password</p>
            <p className='col-span-3 font-bold'>{value.password}</p>
            <p>Key file</p>
            <div className='col-span-3'>
                <a href={downloadUrl} download={downloadFileName} onClick={downloadClickHandler}
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                    Download key
                </a>
            </div>
        </div>
    )
}

function generateDataUrlDownloadKey(idmg: string, rootPem: string, encryptedKeyPem: string): string {
    let jsonContent = { idmg, racine: {certificat: rootPem, cleChiffree: encryptedKeyPem} };
    let stringContent = JSON.stringify(jsonContent);
    const fileBlob = new Blob([stringContent], {type: 'application/json'});
    return window.URL.createObjectURL(fileBlob);
}

function TauntScreen(props: {show: boolean, generateNewKey:()=>void}) {

    let {generateNewKey} = props;

    if(!props.show) return <></>;

    return (
        <>
            <p className='pt-10 pb-2'>If you didn't save it, your previously generated key is lost for good. Make a new one and be sure to save it this time!</p>
            <button onClick={generateNewKey}
                className="btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900">
                    Generate key
            </button>
        </>
    );
}

type InstallInstanceProps = {
    masterKey: MasterKeyInformation,
}

function InstallInstance(props: InstallInstanceProps) {
    let { masterKey } = props;

    let [running, setRunning] = useState(false);
    let runSetupHandler = useCallback(()=>{
        runSetup(masterKey)
            .then(()=>{
                console.debug("Initial setup done.")
            })
            .catch(err=>console.error("Error during initial setup: ", err))
            .finally(()=>{
                setRunning(false);
            });
    }, [masterKey, setRunning]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-2'>Setup instance</h2>
            <p className='pt-4 pb-2'>The system Id for the key is: {masterKey.file.idmg}</p>

            <button onClick={runSetupHandler} disabled={running}
                className="btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900">
                    Start
            </button>
        </section>
    )
}

async function runSetup(masterKey: MasterKeyInformation) {
    await generateIntermediateCertificate(masterKey);
}

async function generateIntermediateCertificate(masterKey: MasterKeyInformation) {
    // Get the CSR
    let response = await axios({method: 'GET', url: '/installation/api/csr'});
    let csrValue = response.data;
    if(typeof(csrValue) !== 'string') throw new Error("Wrong CSR response type, must be text");
    
    // Generate new signing certificate
    let intermediateCertificate = await forgePrivateKey.generateIntermediateCertificate(
        csrValue, masterKey.file.racine.certificat, masterKey.key);

    // Send setup instructions
    let params = {
        idmg: masterKey.file.idmg,
        certificatMillegrille: masterKey.file.racine.certificat,
        certificatIntermediaire: intermediateCertificate,
        securite: '3.protege',
    };
    console.debug("Installation parameters: ", params);
    await axios.post('/installation/api/installer', params);  // Throws error on failure
}
