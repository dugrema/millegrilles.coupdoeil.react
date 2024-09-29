import { Link } from "react-router-dom";

import HeaderMenu from './Menu';
import Footer from './Footer';


function LandingPage() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" />

            <main className='fixed top-6 bottom-8 overflow-y-auto pt-4 pb-2 pl-2 pr-2 w-full'>
                <h1 className='text-xl font-bold pt-4'>Configuration of the MilleGrilles system</h1>

                <section className='pt-6'>
                    <h2 className='text-lg font-bold pt-4'>Local actions</h2>
                    <Link to='/coupdoeil2/install' 
                        className='btn inline-block pt-2 pb-2 pl-2 pr-2 text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                            Local setup 
                    </Link>
                </section>

                <section>
                    <h2 className='text-lg font-bold pt-4'>System management</h2>
                    <nav>
                        <ul>
                            <li className='pt-2'>
                                <Link to='/coupdoeil2/instances' 
                                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                                        Instances
                                </Link>
                            </li>
                            <li className='pt-2'>
                                <Link to='/coupdoeil2/domains' 
                                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                                        Domains
                                </Link>
                            </li>
                            <li className='pt-2'>
                                <Link to='/coupdoeil2/users' 
                                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                                        Users
                                </Link>
                            </li>
                            <li className='pt-2'>
                                <Link to='/coupdoeil2/decryptKeys' 
                                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                                        Key decryption
                                </Link>
                            </li>
                            <li className='pt-2'>
                                <Link to='/coupdoeil2/applicationPackages' 
                                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                                        Applications
                                </Link>
                            </li>
                            <li className='pt-2'>
                                <Link to='/coupdoeil2/consignation' 
                                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                                        File servers
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </section>
            </main>
            
            <Footer />
        </div>
    );
}

export default LandingPage;
