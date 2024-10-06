import { useOutletContext } from "react-router-dom";
import { ApplicationConfiguree, ServerInstance } from "../workers/connection.worker";
import React, { useMemo } from "react";

function InstanceApplications() {

    let { instance } = useOutletContext() as {instance: ServerInstance};

    let applications = useMemo(()=>{
        let services = prepareApps(instance);
        return services.map(item=>{
            return (
                <React.Fragment key={item.name}>
                    <p>{item.name}</p>
                    <p>{item.version}</p>
                </React.Fragment>
            )
        })
    }, [instance]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4'>Applications</h2>

            <button
                className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                    Install new
            </button>
            <button
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Refresh packages
            </button>
            <button
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Upgrade all
            </button>

            <div className='grid grid-cols-2'>
                <p className='font-bold pt-4 pb-2'>Name</p>
                <p className='font-bold pt-4 pb-2'>Version</p>

                {applications}
            </div>

        </section>
    );
}

export default InstanceApplications;

type InstanceApp = {
    name: string,
    version?: string,
    docker?: {
        running: boolean,
        preparing: boolean,
        replicas?: number,
    }
};

function prepareApps(instance: ServerInstance): InstanceApp[] {
    let applications = instance.applications_configurees;
    let webapps = instance.webapps || [];
    console.debug("Applications %O, webapps: %O", applications, webapps);

    let apps = {} as {[name: string]: InstanceApp};

    if(instance.services) {
        for(let appName of Object.keys(instance.services)) {
            let service = instance.services[appName];
            apps[appName] = {name: appName, docker: {
                running: service.etat==='running', 
                preparing: service.etat==='preparing',
                replicas: service.replicas,
            }}
        }
    }

    if(instance.applications_configurees) {
        for(let app of instance.applications_configurees) {
            let existing = apps[app.nom] || {};
            apps[app.nom] = {...existing, version: app.version};
        }
    }

    let servicesCopy = [...Object.values(apps)];
    servicesCopy.sort((a: InstanceApp, b: InstanceApp)=>{
        return a.name.localeCompare(b.name)
    })

    return servicesCopy;
}

function preparePackages() {

}
