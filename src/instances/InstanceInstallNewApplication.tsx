import { MouseEvent, useCallback, useMemo } from "react";
import useInstanceStore from "./instanceStore";
import { ApplicationPackage, ServerInstance } from "../workers/connection.worker";
import { useOutletContext, useParams, Link } from "react-router-dom";
import { InstanceApp, prepareApps } from "./InstanceApplications";
import useWorkers, { AppWorkers } from "../workers/workers";
import useConnectionStore from "../connectionStore";
import ActionButton from "../components/ActionButton";
import useInstanceApplicationStore from "./instanceApplicationsStore";

function InstallNewApplication() {

    // let navigate = useNavigate();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let currentPackages = useInstanceStore(state=>state.applicationCurrentPackages);
    let setApplicationCurrentPackages = useInstanceStore(state=>state.setApplicationCurrentPackages);
    let serverInstanceApplications = useInstanceApplicationStore(state=>state.applications);

    let { instanceId } = useParams();
    let { instance } = useOutletContext() as {instance: ServerInstance};

    let installHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceId) throw new Error("InstanceId null");
        if(!instance || !instance.security) throw new Error("Missing instance security level");
        let value = e.currentTarget.value;
        let response = await installApplication(workers, instanceId, value, instance.security);
        if(response.ok !== true) throw new Error("Error installing application: " + response.err);
    }, [workers, ready, instanceId, instance]);

    let upgradeHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceId) throw new Error("InstanceId null");
        if(!instance || !instance.security) throw new Error("Missing instance security level");
        let value = e.currentTarget.value;
        let response = await upgradeApplication(workers, instanceId, value, instance.security);
        if(response.ok !== true) throw new Error("Error upgrading application: " + response.err);
    }, [workers, ready, instanceId, instance]);

    let refreshPackagesHandler = useCallback(async () => {
        if(!workers || !ready) throw new Error('workers not initialized');
        let response = await workers.connection.refreshPackages();
        if(!response.ok) {
            throw new Error("refreshPackages Error: " + response.err);
        }
        await new Promise(resolve=>setTimeout(resolve, 1_000));
        // Load current application packages
        if(workers) {
            let packages = await workers.connection.getCurrentPackagesList();
            if(packages.resultats) {
                setApplicationCurrentPackages(packages.resultats);
            }
        }
    },[workers, ready, setApplicationCurrentPackages]);

    let applications = useMemo(()=>{
        if(!currentPackages || !serverInstanceApplications) return [];

        let security = instance.security;
        if(!security) return [];  // No security level

        let currentApps = prepareApps(instance, serverInstanceApplications);

        // let currentAppNames = new Set(currentApps.map(item=>item.name));
        let currentAppsByName = {} as {[key: string]: InstanceApp};
        for(let app of currentApps) {
            currentAppsByName[app.name] = app;
        }
        let currentAppNames = new Set(Object.keys(currentAppsByName));

        // Filter out applications currently installed
        // let packageCopy = currentPackages.filter(item=>!currentAppNames.has(item.nom));
        let packageCopy = currentPackages.filter(item=>{
            let levels = item.securityLevels || [];
            if(item.securite) levels.push(item.securite);
            if(security) return levels.includes(security);
            return false;
        });
        packageCopy.sort(sortPackages);
        // Filter by security level
        return packageCopy.map(item=>{
            let upgradeable = false;
            let currentApp = currentAppsByName[item.nom];
            if(currentApp && currentApp.version && currentApp.version !== item.version) {
                // Assume a different version always means a newer is available
                upgradeable = true;
            }

            let nameClassname = '';
            if(currentAppNames.has(item.nom)) {
                nameClassname = 'text-green-400 font-bold';
            }
            let versionClassname = '';
            if(upgradeable) {
                versionClassname = 'text-yellow-400';
            }

            return (
                <li key={item.nom}
                    className='grid grid-cols-4 md:grid-cols-12 odd:bg-amber-600 odd:bg-opacity-10 pt-1 pb-1 pl-2 pr-2 hover:bg-amber-500 hover:bg-opacity-40'>
                        <p className={'col-span-3 md:col-span-4 ' + nameClassname}>{item.nom}</p>
                        <p className={'col-span-1 md:col-span-2'} title={'Current version: ' + currentApp?.version}>
                            <span className={versionClassname}>{item.version}</span>
                            {upgradeable?<div>Current: {currentApp?.version}</div>:<></>}
                        </p>
                        <div className='col-span-6 pb-2 sm:pb-0'>
                            <ActionButton value={item.nom} onClick={installHandler} disabled={!ready}>Install</ActionButton>
                            <ActionButton value={item.nom} onClick={upgradeHandler} disabled={!ready || !upgradeable}>Upgrade</ActionButton>
                        </div>
                </li>
            )
        })
    }, [ready, instance, serverInstanceApplications, currentPackages, installHandler, upgradeHandler]);

    return (
        <>
            <section>
                <h2 className='text-lg font-bold pt-4'>Install new application</h2>

                <Link to={`/coupdoeil2/instances/${instanceId}`}
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Back to applications
                </Link>

                <ActionButton onClick={refreshPackagesHandler} disabled={!ready}>Refresh packages</ActionButton>

                <div className='grid grid-cols-4 md:grid-cols-12'>
                    <p className='font-bold pt-4 pb-2 col-span-3 md:col-span-4'>Name</p>
                    <p className='font-bold pt-4 pb-2 col-span-1 md:col-span-2'>Version</p>
                    <p className='font-bold pt-4 pb-2 col-span-6 hidden md:block'>Actions</p>
                </div>
                <ul>{applications}</ul>
            </section>
        </>
    )
}

export default InstallNewApplication;

function sortPackages(a: ApplicationPackage, b: ApplicationPackage) {
    if(a === b) return 0;
    return a.nom.localeCompare(b.nom);
}

async function installApplication(workers: AppWorkers, instanceId: string, applicationName: string, security: string) {
    let installationPackageResponse = await workers.connection.getPackageContent(applicationName);
    console.debug("Package content ", installationPackageResponse);
    let installationPackage = {...installationPackageResponse}; // .content['__original'];
    // @ts-ignore
    delete installationPackage.content;
    return await workers.connection.installApplication(applicationName, instanceId, security, installationPackage);
}

async function upgradeApplication(workers: AppWorkers, instanceId: string, applicationName: string, security: string) {
    let installationPackageResponse = await workers.connection.getPackageContent(applicationName);
    console.debug("Package content ", installationPackageResponse);
    let installationPackage = {...installationPackageResponse}; // .content['__original'];
    // @ts-ignore
    delete installationPackage.content;
    return await workers.connection.upgradeApplication(applicationName, instanceId, security, installationPackage);
}
