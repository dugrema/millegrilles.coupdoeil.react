import { Link, useOutletContext, useParams } from "react-router-dom";
import { ServerInstance, ServerInstanceApplicationInformation } from "../workers/connection.worker";
import { MouseEvent, useCallback, useMemo } from "react";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { ToggleSwitch } from "flowbite-react";
import ActionButton from "../components/ActionButton";
import useInstanceApplicationStore from "./instanceApplicationsStore";

function InstanceApplications() {

    let { instanceId } = useParams();
    let { instance } = useOutletContext() as {instance: ServerInstance};
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let serverInstanceApplications = useInstanceApplicationStore(state=>state.applications);

    let removeHandler = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
        if(!workers || !ready) throw new Error("Workers not initialized");
        let value = e.currentTarget.value;
        let security = instance.security;
        if(!security) throw new Error("Instance without security level information");
        let response = await workers.connection.removeApplication(value, instance.instance_id, security);
        if(response.ok !== true) {
            throw new Error('Error removing application: ' + response.err);
        }
    }, [workers, ready, instance]);

    let toggleApplication = useCallback((name: string, running: boolean)=>{
        if(!workers || !ready) throw new Error("workers not initialized");
        let security = instance.security;
        if(!security) throw new Error("No security level on instance");
        // console.debug("Toggle application %s to running?%s", name, running);
        let action = workers.connection.startApplication;
        if(!running) { action = workers.connection.stopApplication; }
        action(name, instance.instance_id, security)
            .then(response=>{
                console.debug("Toggle application response: ", response);
            })
            .catch(err=>console.error("Error toggling application ", err));
    }, [workers, ready, instance]);

    let applications = useMemo(()=>{
        if(!serverInstanceApplications) return [];
        let services = prepareApps(instance, serverInstanceApplications);

        return services.map(item=>{
            let noremove = item.labels?item.labels['noremove']==='true':false;

            return (
                <li key={item.name} 
                    className='grid grid-cols-4 md:grid-cols-12 odd:bg-amber-600 odd:bg-opacity-10 pt-1 pb-1 pl-2 pr-2 hover:bg-amber-500 hover:bg-opacity-40'>
                        <p className='col-span-2 md:col-span-5'>{item.name}</p>
                        <p className='col-span-2 md:col-span-3'>{item.version}</p>
                        <div className='col-span-2 md:col-span-1'>
                            {item.docker?
                                <ToggleSwitch checked={item.docker?.running || false} onChange={(checked)=>toggleApplication(item.name, checked)} />
                            :
                                <>Nginx</>
                            }
                        </div>
                        <div className='col-span-2 md:col-span-3 pb-2 md:pb-0'>
                            <ActionButton onClick={removeHandler} disabled={!ready||noremove} value={item.name}>Remove</ActionButton>
                        </div>
                </li>
            )
        })
    }, [instance, serverInstanceApplications, ready, removeHandler, toggleApplication]);

    return (
        <>
            <section>
                <h2 className='text-lg font-bold pt-4'>Applications</h2>

                <Link to={`/coupdoeil2/instances/${instanceId}/newApplication`}
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Install
                </Link>
                <Link to={`/coupdoeil2/instances/${instanceId}/passwords`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Passwords
                </Link>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4'>Applications</h2>

                {(ready && instance && serverInstanceApplications)?
                    <p>{applications.length} applications deployed</p>
                :
                    <p>Loading</p>
                }

                <div className='grid grid-cols-4 md:grid-cols-12'>
                    <p className='font-bold pt-4 pb-2 col-span-2 md:col-span-5'>Name</p>
                    <p className='font-bold pt-4 pb-2 col-span-3'>Version</p>
                    <p className='font-bold pt-4 pb-2 col-span-1 hidden md:block'>Status</p>
                    <p className='font-bold pt-4 pb-2 col-span-3 hidden md:block'>Actions</p>
                </div>
                <ul>
                    {applications}
                </ul>

            </section>
        </>
    );
}

export default InstanceApplications;

export type InstanceApp = {
    name: string,
    image?: string,
    version?: string,
    docker?: {
        running: boolean,
        preparing: boolean,
        replicas?: number,
    },
    labels?: {[key: string]: string} | null | undefined,
};

export function prepareApps(instance: ServerInstance, applications: ServerInstanceApplicationInformation): InstanceApp[] {
    let apps = {} as {[name: string]: InstanceApp};


    for(let appName of Object.keys(applications.services)) {
        let service = applications.services[appName];
        apps[appName] = {
            name: appName, 
            image: service.image,
            version: service.version,
            docker: {
                running: service.etat==='running', 
                preparing: service.etat==='preparing',
                replicas: service.replicas,
            },
            labels: service.labels,
        }
    }

    for(let app of applications.configured_applications) {
        let existing = apps[app.name] || {name: app.name};
        apps[app.name] = {...existing, version: app.version};
    }

    for(let app of applications.webapps) {
        let name = app.name;
        if(name) {
            let existing = apps[name] || {name};
            apps[name] = existing;
        }
    }

    let servicesCopy = [...Object.values(apps)];
    servicesCopy.sort((a: InstanceApp, b: InstanceApp)=>{
        return a.name.localeCompare(b.name)
    })

    return servicesCopy;
}
