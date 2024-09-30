import { Link } from 'react-router-dom';
import useDomainStore from './domainStore';
import { useMemo } from 'react';


function DomainList() {

    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Domains</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Utilities</h2>

                <Link to='/coupdoeil2/domains/backup'
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Backup
                </Link>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Domain list</h2>
                <DomainListSection />
            </section>
        </>
    );
}

export default DomainList;

function DomainListSection() {
    
    let domains = useDomainStore(state=>state.domains);

    let sortedDomainElems = useMemo(()=>{
        if(!domains) return [];
        return domains;  // TODO: sort
    }, [domains]);

    return (
        <div>
            {sortedDomainElems}
        </div>
    );

}
