import { Link } from "react-router-dom";
import DecryptKeys from "./DecryptKeys";
import useConnectionStore from "../connectionStore";
import useWorkers, { AppWorkers } from "../workers/workers";
import { MouseEvent, useCallback, useEffect, useState } from "react";
import useKeymasterStore, { KeymasterRecoveryRequestStore } from "./KeymasterStore";
import ActionButton from "../components/ActionButton";
import MasterKeyLoader, { MasterKeyInformation } from "./MasterKeyLoader";
import { certificates, multiencoding } from 'millegrilles.cryptography';

function KeyManagementOptions() {

    let [done, setDone] = useState(0);
    let doneOnChange = useCallback(()=>{setDone(new Date().getTime())}, [setDone]);
    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null);

    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>KeyMaster</h1>

            <KeyInformation trigger={done} />

            <MasterKeyLoader onChange={setMasterKey} />

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Key decryption process</h2>
                <p className='pb-2'>
                    To fix any key that is not available to the system, enter the master key and click on start.
                </p>
                <DecryptKeys onChange={doneOnChange} masterKey={masterKey} />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Keymaster recovery</h2>
                <KeymasterRecovery masterKey={masterKey} />
            </section>
        </>
    );
}

export default KeyManagementOptions;

function KeyInformation(props: {trigger: number}) {

    let { trigger } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [count, setCount] = useState(null as number | null);

    useEffect(()=>{
        if(!workers || !ready) return;
        workers.connection.getNonDecryptableKeyCount()
            .then(response=>{
                if(typeof(response.compte) === 'number') setCount(response.compte);
                else setCount(null);
            })
            .catch(err=>console.error("Error loading undecipherable key count", err));
    }, [workers, ready, setCount, trigger]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4 pb-2'>Key information</h2>

            <div className='grid grid-cols-1 md:grid-cols-3'>
                <p>Number of undecipherable keys</p>
                <p>
                    {count!==null?
                        <>{count} keys</>
                    :
                        <>Loading ...</>
                    }
                </p>
            </div>

        </section>
    )
}

export function KeymasterRecovery(props: {masterKey: MasterKeyInformation | null}) {

    let {masterKey} = props;

    let keymasterRecoveryRequests = useKeymasterStore(state=>state.keymasterRecoveryRequests);

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let recoveryHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
        if(!workers || !ready) throw new Error('workers not initialized');
        if(!masterKey) throw new Error("Master key not loaded");

        let instanceId = e.currentTarget.value;
        console.debug("Recover %s", instanceId)
        let request = keymasterRecoveryRequests.filter(item=>item.instance_id === instanceId).pop();
        console.debug("Requests: %O, request: %O", keymasterRecoveryRequests, request);
        if(!request) throw Error(`Unknown instance_id '${instanceId}'`);
        await recoverKey(workers, masterKey, request);
    }, [workers, ready, keymasterRecoveryRequests, masterKey]);

    useEffect(()=>{console.debug("Keymaster Recovery Requests: %O", keymasterRecoveryRequests);}, [keymasterRecoveryRequests])

    // Issue initial request to trigger all eligible keymasters
    useEffect(()=>{
        if(!workers || !ready) return;
        workers.connection.requestKeymasterRecovery()
            .catch(err=>console.error("Error requesting keymaster recovery keys: %O", err));
    }, [workers, ready]);

    return (
        <section>
            <p>This Allows recovering the keymaster's decryption key if fails during a certificate rotation.</p>
            <p>Any eligible keymaster will pop-up in the list below.</p>

            {keymasterRecoveryRequests.map(item=><KeymasterItem key={item.instance_id} value={item} onClick={recoveryHandler} disabled={!masterKey} />)}
        </section>
    )
}

function KeymasterItem(props: {value: KeymasterRecoveryRequestStore, disabled: boolean, onClick: (e: MouseEvent<HTMLButtonElement>)=>Promise<void>}) {

    let {value, onClick, disabled} = props;

    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    return (
        <div className='grid grid-cols-2'>
            <p>{value.instance_id}</p>
            <div><ActionButton onClick={onClick} value={value.instance_id} disabled={disabled || !ready}>Renew</ActionButton></div>
        </div>
    )
}

async function recoverKey(workers: AppWorkers, masterKey: MasterKeyInformation, request: KeymasterRecoveryRequestStore) {
    // Decrypt key using master key.
    let encryptedKey = request.cle_symmetrique_ca;
    console.debug("Master key: %O, request: %O, encrypted key: %O", masterKey, request, encryptedKey);
    encryptedKey = encryptedKey.slice(1);  // Remove multibase format
    let secretKey = await workers.encryption.decryptCaEncryptedKey(masterKey.key, encryptedKey);
    console.debug("Secret key: %O", secretKey);

    // Re-encrypt key and send out.
    // @ts-ignore
    let certificatePem = request.certificatePem as string[];
    let certificate = new certificates.CertificateWrapper(certificatePem);
    let certificateFingerprint = certificate.getPublicKey();
    let publicKeyBytes = multiencoding.decodeHex(certificateFingerprint);
    console.debug("publicKeyBytes ", publicKeyBytes);

    console.debug("Certificate: %O", certificate)
    let reEncryptedKey = await workers.encryption.encryptKeyForPublicKey(secretKey, publicKeyBytes);
    console.debug("Encrypted key: ", reEncryptedKey);
    reEncryptedKey = 'm' + reEncryptedKey;  // Multibase format

    let response = await workers.connection.sendKeymasterRecoveryKey(certificateFingerprint, reEncryptedKey);
    if(response.ok !== true) {
        throw new Error(`Error sending recovered key: ${response.err}`)
    }
}
