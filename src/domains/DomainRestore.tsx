import { Link } from 'react-router-dom';


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
                <p>The following domains are already available from a consignation file server.</p>
                <p>Upload additional files.</p>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Initial domains</h2>

                <p>
                    The first two domains to restore on a MilleGrilles system are CorePki and Maitre des cles. 
                    CorePki provides the security certificates required to restore transactions and Maitre des cles provides
                    the backup decryption keys for other domains.
                </p>

                <p>You can upload the backup files in the Backup files section above.</p>

                <p>Provide the master key to decrypt the Initial Domains backup files since the Maitre des cles is not available yet.</p>

                <p>Rebuild the CorePki and Maitre des cles domains in the database.</p>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Restore the rest of the system</h2>
                
                <p>You can upload missing backup files in the Backup files section above.</p>

                <p>Launch system rebuild.</p>
            </section>
        </>
    );
}

export default DomainRestore;
