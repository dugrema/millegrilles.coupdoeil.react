import { Link } from 'react-router-dom';
import MasterKeyLoader, { MasterKeyInformation } from '../utilities/MasterKeyLoader';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import { FilehostBackupList } from './DomainBackup';
import useWorkers, { AppWorkers } from '../workers/workers';
import { certificates, keymaster, multiencoding, x25519 } from 'millegrilles.cryptography';
import { DomainListSection } from './DomainList';
import useConnectionStore from '../connectionStore';
import { decryptNonDecryptableKeys, KeyProgress, MaitreDesClesProgress } from '../utilities/DecryptKeys';
import { BackupDomainVersion } from '../workers/connection.worker';

function DomainRestore() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [masterKey, setMasterKey] = useState(null as MasterKeyInformation | null);
    let [domainBackupVersionList, setDomainBackupVersionList] = useState(null as {[key: string]: BackupDomainVersion} | null);

    useEffect(()=>{
        if(!workers || !ready) return;
        workers.connection.getDomainBackupVersions()
            .then(response=>{
                console.debug("Domain backup versions", response);
                if(response.ok && response.domains) {
                    // Map domains
                    let mappedDomains = response.domains.reduce((acc, item)=>{
                        return {...acc, [item.domain]: item};
                    }, {});
                    setDomainBackupVersionList(mappedDomains);
                } else {
                    console.error("Error loading domain backup version from CoreTopologie", response.err);
                }
            })
            .catch(err=>console.error("Error getting domain backup versions from CoreTopologie", err));
    }, [workers, ready, setDomainBackupVersionList]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2/domains'
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-3xl font-bold text-white'>System restore</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>📁</span> Backup files
                </h2>
                <BackupFileSection />
            </section>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>🔐</span> Initial domains
                </h2>

                <div className="mb-6 text-slate-400 text-sm space-y-4">
                    <p>
                        The first two domains to restore on a MilleGrilles system are <span className="text-white font-medium">CorePki</span> and <span className="text-white font-medium">Maitre des cles</span>. 
                        CorePki provides the security certificates required to restore transactions and Maitre des cles provides
                        the backup decryption keys for other domains.
                    </p>
                </div>

                <InitialDomainsSection masterKey={masterKey} masterKeyOnChange={setMasterKey} backupVersions={domainBackupVersionList} />
            </section>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>🚀</span> Restore the rest of the system
                </h2>
                <DomainListRegeneration masterKey={masterKey} backupVersions={domainBackupVersionList} />
            </section>
        </div>
    );
}

export default DomainRestore;

function BackupFileSection() {
    return (
        <>
            <p className='text-slate-400 mb-4'>The following domains are available from a file server.</p>
            <FilehostBackupList />
        </>
    );
}

type InitialDomainSectionProps = {
    masterKey: MasterKeyInformation | null, 
    masterKeyOnChange: (e: MasterKeyInformation | null)=>void, 
    backupVersions: {[key: string]: BackupDomainVersion} | null
};

function InitialDomainsSection(props: InitialDomainSectionProps) {
 
    let { masterKey, masterKeyOnChange, backupVersions } = props;

    let workers = useWorkers();

    let [keyProgress, setKeyProgress] = useState(null as KeyProgress | null);

    let restoreDomaineCallback = useCallback((e: MouseEvent<HTMLButtonElement>)=>{
        if(!workers) throw new Error("workers not initialized");
        if(!masterKey) throw new Error("Master key not loaded");
        if(!backupVersions) throw new Error("Backup versions not provided")
        let domain = e.currentTarget.value;
        let version = backupVersions[domain].version;
        restoreInitialDomain(workers, domain, masterKey.key, false, version)
            .catch(err=>console.error("Error restoring domain %s: %O", domain, err));
    }, [workers, masterKey, backupVersions]);

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
        <div className="space-y-8">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <p className='text-slate-300 mb-4'>
                    1. Provide the master key to decrypt the Initial Domains backup files since the Maitre des cles is not available yet.
                </p>
                <MasterKeyLoader onChange={masterKeyOnChange} />
            </div>

            <div className="space-y-4">
                <p className='text-slate-300'>2. Rebuild the CorePki and Maitre des cles domains in the database.</p>
                <div className="flex flex-wrap gap-4">
                    <button value='CorePki' onClick={restoreDomaineCallback} disabled={!masterKey}
                        className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none'>
                        Rebuild CorePki
                    </button>
                    <button value='MaitreDesCles' onClick={restoreDomaineCallback} disabled={!masterKey}
                        className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none'>
                        Rebuild Maitre des cles
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <p className='text-slate-300'>3. Decrypt all keys in Maitre des cles to make them available to other services.</p>
                <button onClick={decryptKeysHandler} disabled={!masterKey}
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none'>
                    Decrypt keys
                </button>
                <MaitreDesClesProgress value={keyProgress} />
            </div>
        </div>
    );
}

async function restoreInitialDomain(workers: AppWorkers, domain: string, masterKey: Uint8Array, resubmitKeys: boolean, version: string | null) {
    let [caEncryptedKeys, decryptedKeys] = await loadDomainBackupKeys(workers, domain, masterKey, version);
    let contentToEncrypt = { cles: decryptedKeys };
    console.debug("CA Keys: %O. Decrypted rebuild command %O", caEncryptedKeys, contentToEncrypt);

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

    return await workers.connection.rebuildDomain(domain, encryptedKeys, version);
}

async function loadDomainBackupKeys(workers: AppWorkers, domain: string, masterKey: Uint8Array, version: string | null) {
    let response = await workers.connection.getDomainBackupInformation(true, true, [domain], version);
    console.debug("loadDomainBackupKeys response", response);

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

type DomainListRegenerationProps = {
    masterKey: MasterKeyInformation | null,
    backupVersions: {[key: string]: BackupDomainVersion} | null,
}

function DomainListRegeneration(props: DomainListRegenerationProps) {

    let { masterKey, backupVersions } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    
    let rebuildHandler = useCallback(async (domain: string ) => {
        if(!ready) throw new Error("not authenticated");
        if(!workers) throw new Error("workers not initialized");
        if(!backupVersions) throw new Error("Backup versions not provided");
        let version = backupVersions[domain]?.version;
        console.debug("Restoring domain %s version %s", domain, version);

        if(masterKey) {
            let response = await restoreInitialDomain(workers, domain, masterKey.key, true, version);
            if(response.ok !== true) throw new Error('Error restoring initial domain' + response.err);
        } else {
            let response = await workers.connection.rebuildDomain(domain)
            if(response.ok !== true) throw new Error('Error restoring domain' + response.err);
        }
    }, [workers, ready, masterKey, backupVersions]);

    return (
        <DomainListSection rebuild={rebuildHandler} />
    )
}
