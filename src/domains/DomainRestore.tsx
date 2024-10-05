import { Link } from 'react-router-dom';
import MasterKeyLoader, { MasterKeyInformation } from '../utilities/MasterKeyLoader';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { DomainBackupList } from './DomainBackup';
import UploadButton from '../components/UploadButton';
import useWorkers, { AppWorkers } from '../workers/workers';
import { certificates, keymaster, multiencoding, x25519 } from 'millegrilles.cryptography';
import { DomainListSection } from './DomainList';
import useConnectionStore from '../connectionStore';


function DomainRestore() {

    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null);

    return (
        <>
            <Link to='/coupdoeil2/domains/backup'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>System restore</h1>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Backup files</h2>
                <BackupFileSection />
            </section>

            <section className='pt-6'>
                <h2 className='text-lg font-bold pt-4 pb-2'>Initial domains</h2>

                <p className='pb-6'>
                    The first two domains to restore on a MilleGrilles system are CorePki and Maitre des cles. 
                    CorePki provides the security certificates required to restore transactions and Maitre des cles provides
                    the backup decryption keys for other domains.
                </p>

                <InitialDomainsSection masterKey={masterKey} masterKeyOnChange={setMasterKey} />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Restore the rest of the system</h2>
                <DomainListRegeneration masterKey={masterKey} />
            </section>
        </>
    );
}

export default DomainRestore;

function BackupFileSection() {

    let uploadHandler = useCallback((files: FileList | null)=>{
        console.warn("File uploaded (TODO): %O", files);
    }, []);

    return (
        <>
            <p className='pb-2'>The following domains are already available from a consignation file server.</p>
            
            <DomainBackupList />

            <p className="pt-4">You can upload additional files for domains to restore here.</p>
            <UploadButton id="backupUpload" onChange={uploadHandler} 
                className="btn pl-7 inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                    <p>Upload</p>
            </UploadButton>
        </>
    );
}

function InitialDomainsSection(props: {masterKey: MasterKeyInformation | null, masterKeyOnChange: (e: MasterKeyInformation | null)=>void}) {
 
    let { masterKey, masterKeyOnChange } = props;

    let workers = useWorkers();

    let [keyProgress, setKeyProgress] = useState(null as KeyProgress | null);

    let restoreDomaineCallback = useCallback((e: MouseEvent<HTMLButtonElement>)=>{
        if(!workers) throw new Error("workers not initialized");
        if(!masterKey) throw new Error("Master key not loaded");
        let domain = e.currentTarget.value;
        restoreInitialDomain(workers, domain, masterKey.key)
            .catch(err=>console.error("Error restoring domain %s: %O", domain, err));
    }, [workers, masterKey]);

    let decryptKeysHandler = useCallback(() => {
        if(!workers) throw new Error("workers not initialized");
        if(!masterKey) throw new Error("Master key not loaded");
        decryptNonDecryptableKeys(workers, masterKey.key, setKeyProgress)
            .catch(err=>console.error("Error decrypting KeyMaster keys: ", err));
    }, [workers, masterKey, setKeyProgress]);

    useEffect(()=>{
        if(!masterKey) return;
        return () => {
            if(masterKey) {
                // Override the key array with 0s then release.
                let array = new Uint8Array(masterKey.key.length);
                masterKey.key.set(array);
            }
            masterKeyOnChange(null)
        };
    }, [masterKey, masterKeyOnChange]);

    return (
        <>
            <p className='pb-2'>
                1. Provide the master key to decrypt the Initial Domains backup files since the Maitre des cles is not available yet.
            </p>
            <MasterKeyLoader onChange={masterKeyOnChange} />

            <p className='pb-2'>2. Rebuild the CorePki and Maitre des cles domains in the database.</p>

            <button value='CorePki' onClick={restoreDomaineCallback} disabled={!masterKey}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Rebuild CorePki
            </button>
            <button value='MaitreDesCles' onClick={restoreDomaineCallback} disabled={!masterKey}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Rebuild Maitre des cles
            </button>

            <p className='pb-2 pt-6'>3. Decrypt all keys in Maitre des cles to make them available to other services.</p>
            <button onClick={decryptKeysHandler} disabled={!masterKey}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Decrypt keys
            </button>
            <MaitreDesClesProgress value={keyProgress} />
        </>        
    );

}

async function restoreInitialDomain(workers: AppWorkers, domain: string, masterKey: Uint8Array) {
    let decryptedKeys = await loadDomainBackupKeys(workers, domain, masterKey);
    let contentToEncrypt = { cles: decryptedKeys };
    console.debug("Decrypted rebuild command ", contentToEncrypt);

    // Encrypt the command for the domain
    let encryptedKeys = null as keymaster.EncryptionBase64Result | null;
    if(domain === 'MaitreDesCles') {
        // Use the currently loaded keymaster certificate to encrypt the keys.
        encryptedKeys = await workers.encryption.encryptMessageMgs4ToBase64(contentToEncrypt, [domain]);
    } else {
        // Make dummy request for a certificat, this returns the CorePki certificate in the response
        let response = await workers.connection.pingDomain(domain)
        console.debug("Ping response ", response);
        // @ts-ignore
        let certificate: certificates.CertificateWrapper = response.content['__certificate'];
        Object.setPrototypeOf(certificate, certificates.CertificateWrapper.prototype);
        console.debug("Domain certificate ", certificate);
        let corePkiFingerprint = certificate.getPublicKey();
        console.debug("Fingerprint: ", corePkiFingerprint);
        let publicKey = multiencoding.decodeHex(corePkiFingerprint);
        encryptedKeys = await workers.encryption.encryptMessageMgs4ToBase64(contentToEncrypt, [domain]);
        // Re-encrypt the key for the CorePki certificate
        let secretKey = encryptedKeys.cleSecrete;
        let cles = encryptedKeys.cle?.cles;
        if(!cles || !secretKey) throw new Error("Secret key not provided by cipher");
        let keyForCorePki = await x25519.encryptEd25519(secretKey, publicKey);
        cles[corePkiFingerprint] = keyForCorePki;
    }

    if(!encryptedKeys) throw new Error("Keys not encrypted");
    // Remove unused values
    delete encryptedKeys.cleSecrete;
    delete encryptedKeys.digest;

    await workers.connection.rebuildDomain(domain, encryptedKeys);
}

async function loadDomainBackupKeys(workers: AppWorkers, domain: string, masterKey: Uint8Array) {
    let response = await workers.connection.getDomainBackupInformation(true, true, [domain]);

    let decryptedKeys = {} as {[key: string]: string};
    for await (let backup of response.backups) {
        if(backup.domaine !== domain) continue;  // Wrong domain
        if(!backup.cles) continue;  // No keys
        let domainKeys = await workers.encryption.decryptCaKeysToBase64Nopad(masterKey, backup.cles, domain);
        decryptedKeys = {...decryptedKeys, ...domainKeys};
    }

    return decryptedKeys;
}

type KeyProgress = {
    total: number,
    current: number,
    done: boolean,
}

function MaitreDesClesProgress(props: {value: KeyProgress | null}) {
    let { value } = props;

    let currentPct = useMemo(()=>{
        if(!value) return null;
        let { current, total, done } = value;
        if(done) return 100;
        return Math.floor(current / total * 100.0);
    }, [value]);

    if(!value) return <></>;

    return (
        <p>Maitre des cles progress: {currentPct}%</p>
    )
}

async function decryptNonDecryptableKeys(workers: AppWorkers, masterKey: Uint8Array, progressCallback: (e: KeyProgress)=>void) {
    let countResponse = await workers.connection.getNonDecryptableKeyCount();

    // @ts-ignore
    const keyCount = countResponse.compte;

    let keyCounter = 0;
    let serverIdx = 0;
    let batchCount = 0;
    progressCallback({total: keyCount, current: keyCounter, done: false});
    while(keyCounter < keyCount) {
        let response = await workers.connection.getNonDecryptableKeyBatch(serverIdx, 100);
        let keys = response.cles;
        if(!keys) throw new Error("out of sync, no keys received");
        if(!response.idx) throw new Error("out of sync, no server idx counter received");

        if(keys.length === 0) {
            // Out of sync but done
            break;
        }

        keyCounter += keys.length;
        serverIdx = response.idx;

        // Keep all information indexed by keyId for later reconciliation
        let keyDict = {} as {[key: string]: any};

        // Structure keys as string: DomaineSignature
        let keySignatureDict = {} as {[key: string]: keymaster.DomainSignature};
        for(let key of keys) {
            let keyId = key.cle_id;
            keySignatureDict[keyId] = key.signature;
            keyDict[keyId] = key;
        }

        // Decrypt keys
        let decryptedKeys = await workers.encryption.decryptCaKeysToBase64Nopad(masterKey, keySignatureDict);

        // Insert all key information with each decrypted key
        for await (let keyId of Object.keys(decryptedKeys)) {
            let decryptedKey = decryptedKeys[keyId];
            let keyInfo = keyDict[keyId];
            keyInfo.cle_secrete = decryptedKey;
        }

        // Encrypted command content
        let commandToEncrypt = {cles: keyDict};
        let reEncryptedKeys = await workers.encryption.encryptMessageMgs4ToBase64(commandToEncrypt, ['MaitreDesCles']);

        let nowait = batchCount % 10 !== 0;  // Sync every n batch. Avoids overloading the Q.
        await workers.connection.sendEncryptedKeyBatch(reEncryptedKeys, nowait);
        batchCount++;

        progressCallback({total: keyCount, current: keyCounter, done: false});
    };

    progressCallback({total: keyCount, current: keyCounter, done: true});
}

function DomainListRegeneration(props: {masterKey: MasterKeyInformation | null}) {

    let { masterKey } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    
    let rebuildHandler = useCallback((e: MouseEvent<HTMLButtonElement>)=>{
        if(!ready) throw new Error("not authenticated");
        if(!workers) throw new Error("workers not initialized");
        let domain = e.currentTarget.value;

        if(masterKey) {
            restoreInitialDomain(workers, domain, masterKey.key)
                .catch(err=>console.error("Error restoring domain %s: %O", domain, err));
        } else {
            workers.connection.rebuildDomain(domain)
                .catch(err=>console.error("Error rebuilding domain %s: %O", domain, err));
        }
    }, [workers, ready, masterKey]);

    return (
        <DomainListSection rebuild={rebuildHandler} />
    )
}
