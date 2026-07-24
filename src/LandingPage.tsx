import { Link } from "react-router-dom";

import HeaderMenu from './Menu';
import Footer from './Footer';


function LandingPage() {

    return (
        <div>
            <HeaderMenu title="Coup D'Oeil" />

            <main className='fixed top-9 bottom-8 overflow-y-auto pt-2 pb-2 pl-2 pr-2 w-full'>
                <h1 className='text-xl font-bold pt-4'>Configuration of the MilleGrilles system</h1>
                <SystemManagement />
            </main>
            
            <Footer />
        </div>
    );
}

export default LandingPage;

function SystemManagement() {
    
    const navItems = [
        { to: '/coupdoeil2/instances', label: 'Instances', icon: 'fa-server', color: 'text-indigo-400' },
        { to: '/coupdoeil2/domains', label: 'Domains', icon: 'fa-globe', color: 'text-blue-400' },
        { to: '/coupdoeil2/users', label: 'Users', icon: 'fa-users', color: 'text-emerald-400' },
        { to: '/coupdoeil2/keys', label: 'Key management', icon: 'fa-key', color: 'text-amber-400' },
        { to: '/coupdoeil2/fileHosting', label: 'File hosting', icon: 'fa-folder', color: 'text-rose-400' },
    ];

    return (
        <section className="mt-8">
            <h2 className='text-lg font-bold mb-6'>System management</h2>
            <nav>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6'>
                    {navItems.map((item) => (
                        <Link 
                            key={item.to}
                            to={item.to} 
                            className='group flex flex-col items-center justify-center p-6 bg-slate-800 border border-slate-700 rounded-xl shadow-lg hover:bg-slate-700 hover:scale-105 transition-all duration-200'
                        >
                            <i className={`fa ${item.icon} text-3xl mb-3 ${item.color} group-hover:scale-110 transition-transform duration-200`} />
                            <span className='font-semibold text-center text-slate-200 group-hover:text-white'>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>        
        </section>
    )
}
