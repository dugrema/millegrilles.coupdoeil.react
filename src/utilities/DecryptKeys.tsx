import { Link } from 'react-router-dom';


function DecryptKeys() {

    return (
        <>
            <Link to='/coupdoeil2/keys'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Decrypt Keys</h1>

            <section>
                <button
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Start
                </button>
            </section>
        </>
    );
}

export default DecryptKeys;
