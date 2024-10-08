import React, { MouseEvent, useCallback, useMemo, useState } from "react";
import useInstanceStore from "./instanceStore";
import { ApplicationPackage, ServerInstance } from "../workers/connection.worker";
import { useOutletContext, useParams, Link, useNavigate } from "react-router-dom";
import { prepareApps } from "./InstanceApplications";
import useWorkers, { AppWorkers } from "../workers/workers";
import useConnectionStore from "../connectionStore";

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

    let [refreshing, setRefreshing] = useState(false);

    let installHandler = useCallback((e: MouseEvent<HTMLButtonElement>)=>{
        if(!ready || !workers) throw new Error('workers not initialized');
        if(!instanceId) throw new Error("InstanceId null");
        if(!instance || !instance.securite) throw new Error("Missing instance security level");
        let value = e.currentTarget.value;
        installApplication(workers, instanceId, value, instance.securite)
            .then(()=>{
                console.debug("Installing app %s", value);
                addInstallingApp(value);
                // navigate(`/coupdoeil2/instances/${instanceId}`);
            })
            .catch(err=>{
                console.error("Error installation application", err);
                addErrorApp(value);
            });
    }, [workers, ready, addInstallingApp, instanceId, instance]);

    let refreshPackagesHandler = useCallback(()=>{
        if(!workers || !ready) throw new Error('workers not initialized');
        setRefreshing(true);
        workers.connection.refreshPackages()
            .then(async response => {
                if(!response.ok) {
                    console.error("refreshPackages Error ", response);
                    return;
                }
                await new Promise(resolve=>setTimeout(resolve, 1_000));
                // Load current application packages
                if(workers) {
                    let packages = await workers.connection.getCurrentPackagesList();
                    if(packages.resultats) {
                        setApplicationCurrentPackages(packages.resultats);
                    }
                }
            })
            .catch(err=>console.error("Error refreshing application packages", err))
            .finally(()=>{
                setRefreshing(false);
            });
    },[workers, ready, refreshing, setRefreshing]);

    let applications = useMemo(()=>{
        if(!currentPackages) return [];

        let currentApps = prepareApps(instance);
        let currentAppNames = new Set(currentApps.map(item=>item.name));

        // Filter out applications currently installed
        let packageCopy = currentPackages.filter(item=>!currentAppNames.has(item.nom));
        packageCopy.sort(sortPackages);
        return packageCopy.map(item=>{
            return (
                <React.Fragment key={item.nom}>
                    <p className='col-span-3'>{item.nom}</p>
                    <p className='col-span-2'>{item.version}</p>
                    <div className='col-span-7'>
                        <button value={item.nom} onClick={installHandler} disabled={!ready}
                            className="varbtn w-20 inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                                Install
                        </button>
                    </div>
                </React.Fragment>
            )
        })
    }, [workers, ready, instance, currentPackages, installHandler]);

    return (
        <>
            <section>
                <h2 className='text-lg font-bold pt-4'>Install new application</h2>

                <Link to={`/coupdoeil2/instances/${instanceId}`}
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Back to applications
                </Link>

                <button onClick={refreshPackagesHandler} disabled={!ready || refreshing}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Refresh packages
                </button>

                <div className='grid grid-cols-12'>
                    <p className='font-bold pt-4 pb-2 col-span-3'>Name</p>
                    <p className='font-bold pt-4 pb-2 col-span-2'>Version</p>
                    <p className='font-bold pt-4 pb-2 col-span-7'>Actions</p>

                    {applications}
                </div>

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
