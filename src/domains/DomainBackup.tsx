import { Link } from 'react-router-dom';


function DomainBackup() {

    return (
        <>
            <Link to='/coupdoeil2/domains'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Domain backup</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Actions</h2>

                <button
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Run backup
                </button>

                <button
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Download all
                </button>

                <button
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Rebuild all
                </button>

                <Link to='/coupdoeil2/domains/restore'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Restore system
                </Link>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Domain list</h2>
                <p>Todo</p>
            </section>
        </>
    );
}

export default DomainBackup;
