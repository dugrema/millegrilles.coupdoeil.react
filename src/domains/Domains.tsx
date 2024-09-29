import HeaderMenu from '../Menu';
import Footer from '../Footer';
import { Link } from 'react-router-dom';


function Domains() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" backLink={true} />

            <main className='fixed top-6 bottom-8 overflow-y-auto pt-4 pb-2 pl-2 pr-2 w-full'>

                <Link to='/coupdoeil2'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Back
                </Link>

                <h1 className='text-xl font-bold pt-4'>Domains</h1>

                <section>

                    <h2 className='text-lg font-bold pt-4 pb-2'>Actions on all domains</h2>

                    <button
                        className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                            Backup
                    </button>
                    <button
                        className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                            Regenerer tous
                    </button>

                </section>

                <section>
                    <h2 className='text-lg font-bold pt-4 pb-2'>Domain list</h2>
                    <p>Todo</p>
                </section>
            </main>
            
            <Footer />
        </div>
    );
}

export default Domains;
