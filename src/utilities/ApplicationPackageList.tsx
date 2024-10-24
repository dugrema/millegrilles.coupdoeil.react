import { useEffect, useMemo, useState } from "react";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { ApplicationPackage } from "../workers/connection.worker";
import { Link } from "react-router-dom";

function ApplicationPackageList() {

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [currentPackages, setCurrentPackages] = useState(null as ApplicationPackage[] | null);

    useEffect(()=>{
        if(!workers || !ready) return;
        workers.connection.getCurrentPackagesList()
            .then(packages=>{
                if(packages.resultats) setCurrentPackages(packages.resultats);
                else {
                    console.error("Error loading packages", packages);
                }
            })
            .catch(err=>console.error("Error loading packages", err));
        
    }, [workers, ready]);

    let rows = useMemo(()=>{
        if(!currentPackages) return [];
        let sortedPackages = [...currentPackages];
        sortedPackages.sort(sortPackagesByName);
        let preparedPackages = preparePackages(sortedPackages);
        return preparedPackages.map(item=>{
            return (
                <li key={item.nom} className='grid grid-cols-3 md:grid-cols-4'>
                    <Link to={`/coupdoeil2/applicationPackages/${item.nom}`}
                        className='col-span-2 underline font-bold'>
                            {item.nom}
                    </Link>
                    <p className='hidden md:block'>{item.securityLabel}</p>
                    <p>{item.version}</p>
                </li>
            )
        })
        
    }, [currentPackages]);

    return (
        <section className='pb-2'>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4 pb-2'>Application Packages</h1>

            <div className='grid grid-cols-3 md:grid-cols-4 pb-1'>
                <p className='col-span-2 font-bold'>Name</p>
                <p className='hidden md:block font-bold'>Security level</p>
                <p className='font-bold'>Current version</p>
            </div>
            <ul>{rows}</ul>
        </section>
    )
}

export default ApplicationPackageList;

export function preparePackages(items: ApplicationPackage[]) {
    // Set security label
    let updatedList = items.map(item=>{
        let updatedItem = {...item} as ApplicationPackage;
        
        let security = new Set();
        if(item.securityLevels) item.securityLevels.forEach(item=>security.add(item));
        if(item.securite) security.add(item.securite);
        let securityLevels = [] as string[];
        security.forEach(item=>securityLevels.push(item as string));
        securityLevels.sort()
        
        updatedItem.securityLabel = securityLevels.join(',');
        return updatedItem;
    });

    return updatedList;
}

function sortPackagesByName(a: ApplicationPackage, b: ApplicationPackage) {
    if(a === b) return 0;
    if(!a) return 1;
    if(!b) return -1;
    if(a.nom === b.nom) return 0;
    if(!a.nom) return 1;
    return a.nom.localeCompare(b.nom);
}
