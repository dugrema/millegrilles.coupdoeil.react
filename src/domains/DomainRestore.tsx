import { Link } from 'react-router-dom';
import MasterKeyLoader, { MasterKey } from '../utilities/MasterKeyLoader';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import { DomainBackupList } from './DomainBackup';
import UploadButton from '../components/UploadButton';
import useWorkers, { AppWorkers } from '../workers/workers';
import { certificates, keymaster, multiencoding, x25519 } from 'millegrilles.cryptography';


function DomainRestore() {

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

                <InitialDomainsSection />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Restore the rest of the system</h2>
                <p>Launch system rebuild.</p>
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

function InitialDomainsSection() {
 
    let workers = useWorkers();

    let [masterKey, setMasterKey] = useState(null as Uint8Array | null);
    let masterKeyChangeHandler = useCallback((key: Uint8Array | null)=>setMasterKey(key), [setMasterKey]);

    let restoreDomaineCallback = useCallback((e: MouseEvent<HTMLButtonElement>)=>{
        if(!workers) throw new Error("workers not initialized");
        if(!masterKey) throw new Error("Master key not loaded");
        let domain = e.currentTarget.value;
        restoreInitialDomain(workers, domain, masterKey)
            .catch(err=>console.error("Error restoring domain %s: %O", domain, err));
    }, [workers, masterKey]);

    useEffect(()=>{
        if(!masterKey) return;
        return () => {
            if(masterKey) {
                // Override the key array with 0s then release.
                let array = new Uint8Array(masterKey.length);
                masterKey.set(array);
            }
            setMasterKey(null)
        };
    }, [masterKey, setMasterKey]);

    return (
        <>
            <p className='pb-2'>
                1. Provide the master key to decrypt the Initial Domains backup files since the Maitre des cles is not available yet.
            </p>
            <MasterKeyLoader onChange={masterKeyChangeHandler} />

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
            <button disabled={!masterKey}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Decrypt keys
            </button>
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
    } else if(domain === 'CorePki') {
        // Make dummy request for a certificat, this returns the CorePki certificate in the response
        let response = await workers.connection.getCertificateCorePki()
        console.debug("Response corePki ", response);
        // @ts-ignore
        let certificate: certificates.CertificateWrapper = response.content['__certificate'];
        Object.setPrototypeOf(certificate, certificates.CertificateWrapper.prototype);
        console.debug("CorePki certificate ", certificate);
        let corePkiFingerprint = certificate.getPublicKey();
        console.debug("Fingerprin: ", corePkiFingerprint);
        let publicKey = multiencoding.decodeHex(corePkiFingerprint);
        encryptedKeys = await workers.encryption.encryptMessageMgs4ToBase64(contentToEncrypt, [domain]);
        // Re-encrypt the key for the CorePki certificate
        let secretKey = encryptedKeys.cleSecrete;
        let cles = encryptedKeys.cle?.cles;
        if(!cles || !secretKey) throw new Error("Secret key not provided by cipher");
        let keyForCorePki = await x25519.encryptEd25519(secretKey, publicKey);
        cles[corePkiFingerprint] = keyForCorePki;
    } else {
        throw new Error('Unsupported domain, use standard method to restore');
    }

    if(!encryptedKeys) throw new Error("Keys not encrypted");
    // Remove unused values
    delete encryptedKeys.cleSecrete;
    delete encryptedKeys.digest;
    let rebuildCommand = {
        cles: encryptedKeys,
    }

    console.debug("Rebuild command ", rebuildCommand);
    let result = await workers.connection.rebuildDomain(domain, encryptedKeys);
    console.debug("Rebuild command result: ", result);
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
