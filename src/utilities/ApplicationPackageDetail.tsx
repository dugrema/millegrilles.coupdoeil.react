import { Link, useParams } from "react-router-dom";
import useConnectionStore from "../connectionStore";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import useWorkers from "../workers/workers";
import { ApplicationPackage } from "../workers/connection.worker";
import { preparePackages } from "./ApplicationPackageList";
import ActionButton from "../components/ActionButton";

function ApplicationPackageDetail() {

    let { packageName } = useParams();

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    const [currentVersion, setCurrentVersion] = useState('');
    let [versions, setVersions] = useState(null as ApplicationPackage[] | null);

    const changeVersionHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>)=>{
        if(!workers || !ready) throw new Error('workers not initialized');
        if(!packageName) throw new Error("Package name not provided");
        const version = e.currentTarget.value;
        console.debug("Changing package version to ", version);
        const response = await workers.connection.setPackageVersion(packageName, version);
        if(!response.ok) throw new Error("Error changing version: " + response.err);
        setCurrentVersion(version);
    }, [workers, ready, packageName, setCurrentVersion]);

    useEffect(()=>{
        if(!workers || !ready || !packageName) return;
        workers.connection.getPackageVersions(packageName)
            .then(response=>{
                console.debug("Package response", response);
                if(response.ok !== true) console.error("Error loading package versions: ", response.err);
                else if(response.resultats) {
                    setVersions(response.resultats);
                    setCurrentVersion(response.current_version || '');
                }
                else console.error("No results received");
            })
            .catch(err=>console.error("Error loading package versions", err));

    }, [workers, ready, packageName, setVersions, setCurrentVersion]);

    return (
        <>
            <Link to='/coupdoeil2/applicationPackages'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold py-4'>Application Package {packageName}</h1>

            <ListPackageVersions value={versions} version={currentVersion} onChange={changeVersionHandler} />
        </>
    )
}

export default ApplicationPackageDetail;

function ListPackageVersions(props: {value: ApplicationPackage[] | null, version: string, onChange: (version: MouseEvent<HTMLButtonElement>)=>Promise<void>}) {

    let { value, version, onChange } = props;

    let ready = useConnectionStore(state=>state.connectionAuthenticated);

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
                    {version===item.version?
                        <p className='text-green-500 font-bold text-center'>{item.version}</p>
                    :
                        <ActionButton onClick={onChange} value={item.version} disabled={!ready}>{item.version}</ActionButton>
                    }
                    <p>{item.securityLabel}</p>
                    <div className='text-sm col-span-2 md:col-span-4'>
                        <ul>
                            {images.map(item=><li key={item}>{item}</li>)}
                        </ul>
                    </div>
                </li>
            )
        })
        
    }, [value, version, onChange]);

    return (
        <section>
            <div className='grid grid-cols-2 md:grid-cols-6 pb-2 font-bold'>
                <p className='text-center'>Version</p>
                <p>Security</p>
                <p>Content</p>
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
