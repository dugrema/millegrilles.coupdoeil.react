import { Link } from 'react-router-dom';
import useDomainStore from './domainStore';
import { useMemo } from 'react';
import { Domain, DomainBackupInformation } from '../workers/connection.worker';
import { Formatters } from 'millegrilles.reactdeps.typescript';


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
        // Sort
        let domainCopy = [...domains];
        domainCopy.sort(sortDomains);
        return domainCopy.map(item=><DomainItem key={item.domaine} value={item} />)
    }, [domains]);

    return (
        <div className='grid grid-cols-2 lg:grid-cols-4'>
            <p className='font-bold pb-2'>Domain</p>
            <p className='font-bold pb-2'>Last presence</p>
            <p className='font-bold pb-2'>Instance id</p>
            <p className='font-bold pb-2'>Status</p>
            {sortedDomainElems}
        </div>
    );

}

function DomainItem(props: {value: Domain}) {

    let { value } = props;

    return (
        <>
            <p>{value.domaine}</p>
            <Formatters.FormatterDate value={value.presence?value.presence:undefined} />
            <p className='pb-2'>{value.instance_id}</p>
            <p className='pb-2'>
                {value.reclame_fuuids===true?'Reclame fuuids':''}
            </p>
        </>
    )
}

export function sortDomains(a: Domain | DomainBackupInformation | null, b: Domain | DomainBackupInformation | null) {
    if(a === b) return 0;
    if(!a) return 1;
    if(!b) return -1;
    return a.domaine.localeCompare(b.domaine);
}
