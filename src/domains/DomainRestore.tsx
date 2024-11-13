import { Link } from 'react-router-dom';
import MasterKeyLoader, { MasterKeyInformation } from '../utilities/MasterKeyLoader';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import { FilehostBackupList } from './DomainBackup';
import UploadButton from '../components/UploadButton';
import useWorkers, { AppWorkers } from '../workers/workers';
import { certificates, keymaster, multiencoding, x25519 } from 'millegrilles.cryptography';
import { DomainListSection } from './DomainList';
import useConnectionStore from '../connectionStore';
import { decryptNonDecryptableKeys, KeyProgress, MaitreDesClesProgress } from '../utilities/DecryptKeys';


function DomainRestore() {

    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null);

    return (
        <>
            <Link to='/coupdoeil2/domains'
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
            
            <FilehostBackupList />

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
        restoreInitialDomain(workers, domain, masterKey.key, false)
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

async function restoreInitialDomain(workers: AppWorkers, domain: string, masterKey: Uint8Array, resubmitKeys: boolean) {
    let [caEncryptedKeys, decryptedKeys] = await loadDomainBackupKeys(workers, domain, masterKey);
    let contentToEncrypt = { cles: decryptedKeys };
    // console.debug("CA Keys: %O. Decrypted rebuild command %O", caEncryptedKeys, contentToEncrypt);

    if(resubmitKeys) {
        // console.debug("Resubmitting CA encrypted keys to ensure they exist on KeyMaster: ", caEncryptedKeys);
        for await (let keyId of Object.keys(decryptedKeys)) {
            let decrytpedKey = decryptedKeys[keyId];
            if(typeof(decrytpedKey) !== 'string') {
                console.warn("Wrong decrypted key type, skipping: ", keyId);
                continue;
            }
            let decryptedKeyBytes = multiencoding.decodeBase64Nopad(decrytpedKey);
            let caKey = caEncryptedKeys[keyId] as keymaster.DomainSignature;
            let encryptedKey = await workers.encryption.encryptSecretKey(decryptedKeyBytes);
            // console.debug("Submit re-encrypted key Signature: %O, Key: %O", caKey, encryptedKey);
            await workers.connection.saveKeyToKeyMaster(encryptedKey, caKey);
        }
    }

    // Encrypt the command for the domain
    let encryptedKeys = null as keymaster.EncryptionBase64Result | null;
    if(domain === 'MaitreDesCles') {
        // Use the currently loaded keymaster certificate to encrypt the keys.
        encryptedKeys = await workers.encryption.encryptMessageMgs4ToBase64(contentToEncrypt, [domain]);
    } else {
        // Make dummy request for a certificate, this returns the domain's certificate in the response
        let response = await workers.connection.pingDomain(domain)
        // console.debug("Ping response ", response);
        // @ts-ignore
        let certificate: certificates.CertificateWrapper = response.content['__certificate'];
        Object.setPrototypeOf(certificate, certificates.CertificateWrapper.prototype);
        // console.debug("Domain certificate ", certificate);
        let corePkiFingerprint = certificate.getPublicKey();
        // console.debug("Fingerprint: ", corePkiFingerprint);
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

    return await workers.connection.rebuildDomain(domain, encryptedKeys);
}

async function loadDomainBackupKeys(workers: AppWorkers, domain: string, masterKey: Uint8Array) {
    let response = await workers.connection.getDomainBackupInformation(true, true, [domain]);

    let encryptedKeys = {} as {[key: string]: keymaster.DomainSignature};
    let decryptedKeys = {} as {[key: string]: string};
    for await (let filehost of response.list) {
        if(filehost.domains) {
            for await (let backup of filehost.domains) {
                if(backup.domaine !== domain) continue;  // Wrong domain
                if(!backup.cles) continue;  // No keys
                Object.assign(encryptedKeys, backup.cles);  // Copy encrypted keys
                let domainKeys = await workers.encryption.decryptCaKeysToBase64Nopad(masterKey, backup.cles, domain);
                decryptedKeys = {...decryptedKeys, ...domainKeys};
            }
        }
    }

    return [encryptedKeys, decryptedKeys];
}

function DomainListRegeneration(props: {masterKey: MasterKeyInformation | null}) {

    let { masterKey } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    
    let rebuildHandler = useCallback(async (domain: string ) => {
        if(!ready) throw new Error("not authenticated");
        if(!workers) throw new Error("workers not initialized");

        if(masterKey) {
            let response = await restoreInitialDomain(workers, domain, masterKey.key, true);
            throw new Error("todo - fix")
            //if(response.ok !== true) throw new Error('Error restoring initial domain' + response.err);
        } else {
            let response = await workers.connection.rebuildDomain(domain)
            if(response.ok !== true) throw new Error('Error restoring domain' + response.err);
        }
    }, [workers, ready, masterKey]);

    return (
        <DomainListSection rebuild={rebuildHandler} />
    )
}
