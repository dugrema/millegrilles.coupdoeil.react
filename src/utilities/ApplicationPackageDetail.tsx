import { Link, useParams } from "react-router-dom";
import HeaderMenu from "../Menu";
import Footer from "../Footer";
import useConnectionStore from "../connectionStore";
import { useEffect, useMemo, useState } from "react";
import useWorkers from "../workers/workers";
import { ApplicationPackage } from "../workers/connection.worker";
import { preparePackages } from "./ApplicationPackageList";

function ApplicationPackageDetail() {

    let { packageName } = useParams();

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [versions, setVersions] = useState(null as ApplicationPackage[] | null);

    useEffect(()=>{
        if(!workers || !ready || !packageName) return;
        workers.connection.getPackageVersions(packageName)
            .then(response=>{
                if(response.ok !== true) console.error("Error loading package versions: ", response.err);
                else if(response.resultats) setVersions(response.resultats);
                else console.error("No results received");
            })
            .catch(err=>console.error("Error loading package versions", err));

    }, [workers, ready, packageName]);

    return (
        <>
            <Link to='/coupdoeil2/applicationPackages'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Application Package {packageName}</h1>

            <ListPackageVersions value={versions} />
        </>
    )
}

export default ApplicationPackageDetail;

function ListPackageVersions(props: {value: ApplicationPackage[] | null}) {

    let { value } = props;

    let rows = useMemo(()=>{
        if(!value) return [];
        let sortedPackages = [...value];
        sortedPackages.sort(sortPackagesByVersion);
        sortedPackages = sortedPackages.reverse();
        let preparedPackages = preparePackages(sortedPackages);

        return preparedPackages.map(item=>{

            let deps = item.dependances;
            let images = [] as string[];
            if(deps) {
                for(let dep of deps) {
                    if(dep.image) images.push(dep.image);
                }
            }
            images.sort();

            return (
                <li key={item.version} className='grid grid-cols-2 md:grid-cols-6'>
                    <p>{item.version}</p>
                    <p>{item.securityLabel}</p>
                    <div className='text-sm col-span-2 md:col-span-4'>
                        <ul>
                            {images.map(item=><li>{item}</li>)}
                        </ul>
                    </div>
                </li>
            )
        })
        
    }, [value]);

    return (
        <section>
            <div>
                Header
            </div>
            <ul>{rows}</ul>
        </section>
    )
}

function sortPackagesByVersion(a: ApplicationPackage, b: ApplicationPackage) {
    if(a === b) return 0;
    if(!a) return 1;
    if(!b) return -1;
    if(a.version === b.version) return 0;
    if(!a.version) return 1;
    return a.version.localeCompare(b.version);
}
