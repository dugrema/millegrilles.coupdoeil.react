import { Link } from 'react-router-dom';
import MasterKeyLoader, { MasterKey } from '../utilities/MasterKeyLoader';
import { useCallback, useEffect, useState } from 'react';
import { DomainBackupList } from './DomainBackup';
import UploadButton from '../components/UploadButton';


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
 
    let [masterKey, setMasterKey] = useState(null as Uint8Array | null);
    let masterKeyChangeHandler = useCallback((key: Uint8Array | null)=>setMasterKey(key), [setMasterKey]);

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

            <button disabled={!masterKey}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Rebuild CorePki
            </button>
            <button disabled={!masterKey}
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
