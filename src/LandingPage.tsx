import { Link } from "react-router-dom";

import HeaderMenu from './Menu';
import Footer from './Footer';


function LandingPage() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" />

            <main className='fixed top-6 bottom-8 overflow-y-auto pt-4 pb-2 pl-2 pr-2 w-full'>
                <section>
                    <h1 className='text-xl font-bold'>Actions</h1>
                    <nav className='pt-6'>
                        <ul>
                            <li className='pt-2'><Link className='underline' to='/coupdoeil/install'>Install</Link></li>
                            <li className='pt-2'><a href='/millegrilles' className='underline'>Back to portal</a></li>
                        </ul>
                    </nav>
                </section>
            </main>
            
            <Footer />
        </div>
    )
}

export default LandingPage;
