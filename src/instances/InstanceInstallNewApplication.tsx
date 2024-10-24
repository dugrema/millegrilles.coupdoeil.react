import React, { MouseEvent, useCallback, useMemo, useState } from "react";
import useInstanceStore from "./instanceStore";
import { ApplicationPackage, ServerInstance } from "../workers/connection.worker";
import { useOutletContext, useParams, Link } from "react-router-dom";
import { InstanceApp, prepareApps } from "./InstanceApplications";
import useWorkers, { AppWorkers } from "../workers/workers";
import useConnectionStore from "../connectionStore";
import ActionButton from "../components/ActionButton";

function InstallNewApplication() {

    // let navigate = useNavigate();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let currentPackages = useInstanceStore(state=>state.applicationCurrentPackages);
    let addInstallingApp = useInstanceStore(state=>state.addInstallingApp);
    let addErrorApp = useInstanceStore(state=>state.addErrorApp);
    let setApplicationCurrentPackages = useInstanceStore(state=>state.setApplicationCurrentPackages);
    let { instanceId } = useParams();
    let { instance } = useOutletContext() as {instance: ServerInstance};

    let installHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceId) throw new Error("InstanceId null");
        if(!instance || !instance.securite) throw new Error("Missing instance security level");
        let value = e.currentTarget.value;
        try {
            await installApplication(workers, instanceId, value, instance.securite)
            console.debug("Installing app %s", value);
            addInstallingApp(value);
        } catch(err) {
            addErrorApp(value);
            throw err;
        }
    }, [workers, ready, addInstallingApp, instanceId, instance, addErrorApp]);

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
        if(!currentPackages) return [];

        let currentApps = prepareApps(instance);
        // let currentAppNames = new Set(currentApps.map(item=>item.name));
        let currentAppsByName = {} as {[key: string]: InstanceApp};
        for(let app of currentApps) {
            currentAppsByName[app.name] = app;
        }
        let currentAppNames = new Set(Object.keys(currentAppsByName));

        // Filter out applications currently installed
        // let packageCopy = currentPackages.filter(item=>!currentAppNames.has(item.nom));
        let packageCopy = [...currentPackages];
        packageCopy.sort(sortPackages);
        return packageCopy.map(item=>{
            let upgradeable = false;
            let currentApp = currentAppsByName[item.nom];
            if(currentApp && currentApp.version !== item.version) {
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
                        <p className={'col-span-1 md:col-span-2 ' + versionClassname}>{item.version}</p>
                        <div className='col-span-6 pb-2 sm:pb-0'>
                            <ActionButton value={item.nom} onClick={installHandler} disabled={!ready}>
                                Install
                            </ActionButton>
                            <button value={item.nom} disabled={!ready || !upgradeable}
                                className="varbtn w-20 inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                                    Upgrade
                            </button>
                        </div>
                </li>
            )
        })
    }, [ready, instance, currentPackages, installHandler]);

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
    let response = await workers.connection.installApplication(applicationName, instanceId, security, installationPackage);
    console.debug("installApplication response: ", response);
}
