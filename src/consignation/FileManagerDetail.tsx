import { Link } from "react-router-dom";

function FileManagerDetail() {
    return (
        <>
            <Link to='/coupdoeil2/fileManagement'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>File manager</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Utilities</h2>

                <Link to='/coupdoeil2/domains/backup'
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Backup
                </Link>

                <button
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Rebuild all
                </button>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>File manager list</h2>
                
            </section>
        </>
    );
}

export default FileManagerDetail;
