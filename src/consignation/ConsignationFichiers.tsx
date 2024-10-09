import HeaderMenu from '../Menu';
import Footer from '../Footer';
import { Link } from 'react-router-dom';


function ConsignationFichiers() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" backLink={true} />

            <main className='fixed top-9 bottom-8 overflow-y-auto pt-2 pb-2 pl-2 pr-2 w-full'>

                <Link to='/coupdoeil2'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Back
                </Link>

                <h1 className='text-xl font-bold pt-4'>Consignation Fichiers</h1>

                <section>
                    <p>Todo</p>
                </section>
            </main>
            
            <Footer />
        </div>
    );
}

export default ConsignationFichiers;
