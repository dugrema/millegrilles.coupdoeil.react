import { useEffect, useMemo } from "react";
import {proxy} from 'comlink';

import { Link, Outlet, useParams } from "react-router-dom";

import useInstanceStore from "./instanceStore";
import { ServerInstance, ServerInstanceApplicationSubscriptionMessage } from "../workers/connection.worker";
import { ConditionalFormatters, SubscriptionMessage } from "millegrilles.reactdeps.typescript";
import useInstanceApplicationStore from "./instanceApplicationsStore";
import useWorkers, { AppWorkers } from "../workers/workers";
import useConnectionStore from "../connectionStore";

function InstanceDetail() {

    let { instanceId } = useParams();
    let instances = useInstanceStore(state=>state.instances);

    let instance = useMemo(()=>{
        if(!instances) return {};
        console.debug("Instances", instances);
        return instances.filter(item=>item.instance_id === instanceId).pop();
    }, [instances, instanceId]) as ServerInstance | null;

    return (
        <>
            <Link to='/coupdoeil2/instances'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>
            <h1 className='text-xl font-bold pt-4'>Server instance {instance?.hostname}</h1>

            <section className='grid grid-cols-2 pt-2 pb-4'>
                <p>Last presence</p>
                <ConditionalFormatters.FormatterConditionalDate value={instance?.timestamp} warn={60} error={600} />
            </section>

            <nav>
                <Link to={`/coupdoeil2/instances/${instanceId}`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Applications
                </Link>
                <Link to={`/coupdoeil2/instances/${instanceId}/info`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Information
                </Link>
                <Link to={`/coupdoeil2/instances/${instanceId}/configure`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Configure
                </Link>
            </nav>

            <Outlet context={{instance}} />

            <ApplicationsInstanceListener />
        </>
    )
}

export default InstanceDetail;

/**
 * Used to load and listen to application events for this instance. Uses the InstancesStore to store information.
 * @returns 
 */
function ApplicationsInstanceListener() {

    let {instanceId} = useParams();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    
    let clear = useInstanceApplicationStore(state=>state.clear);
    let setApplications = useInstanceApplicationStore(state=>state.setApplications);

    useEffect(()=>{
        if(!workers || !ready || !instanceId) return;
        console.debug("Load applications for instance %s", instanceId);

        return () => {  }
    }, [workers, ready, instanceId]);

    let applicationEventsCb = useMemo(()=>{
        if(!workers || !instanceId) return null;
        return proxy((event: SubscriptionMessage)=>{
            if(!workers || !instanceId) throw new Error("Workers/instanceId not available");
            processEvent(workers, instanceId, event, setApplications)
        })
    }, [workers, setApplications, instanceId]);

    useEffect(()=>{
        if(!ready || !applicationEventsCb || !instanceId) return;
        if(!workers) throw new Error('workers not initialized');

        // Register listener
        workers.connection.subscribeInstanceApplicationEvents(applicationEventsCb)
            .catch(err=>console.error("Error subscribing to chat conversation events", err));

        // Load domains
        workers.connection.getInstanceApplicationsList(instanceId)
            .then(response=>{
                if(response.ok !== true) {
                    console.error("Error loading domain list: %O", response);
                    return;
                }
                let applicationsUpdate = {
                    instance_id: response.instance_id,
                    configured_applications: response.configured_applications,
                    services: response.services,
                    containers: response.containers,
                    webapps: response.webapps,
                };
                console.debug("Initial applications list", applicationsUpdate);
                setApplications(applicationsUpdate);
            })
            .catch(err=>console.error("Error loading domain list", err));

        // Cleanup
        return () => { 
            console.debug("Clear application store"); 
            clear();

            // Unsubscribe listener
            if(workers && applicationEventsCb) {
                workers.connection.unsubscribeInstanceApplicationEvents(applicationEventsCb)
                    .catch(err=>console.error("Error unsubscribing from chat conversation events", err));
            }
        }
    }, [ready, workers, instanceId, applicationEventsCb, setApplications, clear]);

    return <></>
}

function processEvent(workers: AppWorkers, instanceId: string, event: SubscriptionMessage, setApplications: (applications: any) => void) {
    console.debug("process event: ", event)
    let content = event.message.content;
    if(!content) throw new Error("message .content is missing");
    let messageInstanceId = content?.__certificate?.extensions?.commonName;
    let original = content['__original'];
    let timestamp = original?.estampille;

    if(messageInstanceId !== instanceId) return;  // Mismatch, not the correct instanceId

    let action = event.routingKey.split('.').pop();
    if(action === 'presenceInstanceApplications') {
        if(!timestamp) throw new Error("Missing timestamp from message");
        let eventApplication = event as ServerInstanceApplicationSubscriptionMessage;
        let message = eventApplication.message;
        console.debug("Application event: ", eventApplication)
        let applicationsUpdate = {
            instance_id: instanceId,
            configured_applications: message.configured_applications,
            services: message.services,
            containers: message.containers,
            webapps: message.webapps,
        };
        console.debug("Applications update", applicationsUpdate);
        setApplications(applicationsUpdate);
    }
}
