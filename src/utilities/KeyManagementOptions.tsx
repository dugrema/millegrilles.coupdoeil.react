import { Link } from "react-router-dom";

function KeyManagementOptions() {
    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Keys actions</h1>

            <section>
                <Link to='/coupdoeil2/keys/decrypt'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Decrypt keys
                </Link>
            </section>
        </>
    );
}

export default KeyManagementOptions;
