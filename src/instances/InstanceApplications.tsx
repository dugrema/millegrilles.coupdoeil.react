import { Link, useOutletContext, useParams } from "react-router-dom";
import { ApplicationConfiguree, ServerInstance } from "../workers/connection.worker";
import React, { useMemo } from "react";

function InstanceApplications() {

    let { instanceId } = useParams();
    let { instance } = useOutletContext() as {instance: ServerInstance};

    let applications = useMemo(()=>{
        let services = prepareApps(instance);
        return services.map(item=>{
            return (
                <React.Fragment key={item.name}>
                    <p className='col-span-3'>{item.name}</p>
                    <p className='col-span-2'>{item.version}</p>
                    <div className='col-span-7'>
                        <button
                            className="varbtn w-20 inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                                Remove
                        </button>

                    </div>
                </React.Fragment>
            )
        })
    }, [instance]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4'>Applications</h2>

            <Link to={`/coupdoeil2/instances/${instanceId}/newApplication`}
                className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                    Install new
            </Link>
            <button
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Refresh packages
            </button>
            <button
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Upgrade all
            </button>

            <div className='grid grid-cols-12'>
                <p className='font-bold pt-4 pb-2 col-span-3'>Name</p>
                <p className='font-bold pt-4 pb-2 col-span-2'>Version</p>
                <p className='font-bold pt-4 pb-2 col-span-7'>Actions</p>

                {applications}
            </div>

        </section>
    );
}

export default InstanceApplications;

type InstanceApp = {
    name: string,
    image?: string,
    version?: string,
    docker?: {
        running: boolean,
        preparing: boolean,
        replicas?: number,
    }
};

export function prepareApps(instance: ServerInstance): InstanceApp[] {
    let applications = instance.applications_configurees;
    let webapps = instance.webapps || [];
    console.debug("Applications %O, webapps: %O", applications, webapps);

    let apps = {} as {[name: string]: InstanceApp};

    if(instance.services) {
        for(let appName of Object.keys(instance.services)) {
            let service = instance.services[appName];
            apps[appName] = {
                name: appName, 
                image: service.image,
                version: service.version,
                docker: {
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
