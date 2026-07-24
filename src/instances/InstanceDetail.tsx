import { useMemo } from "react";

import { Link, Outlet, useParams } from "react-router-dom";

import useInstanceStore from "./instanceStore";
import { ServerInstance } from "../workers/connection.worker";
import { ConditionalFormatters } from "millegrilles.reactdeps.typescript";
import { ManagerStatusV2 } from "../workers/typesInstance";

function InstanceDetail() {

    const { instanceId } = useParams();
    const instances = useInstanceStore(state=>state.instances);

    const instance = useMemo(()=>{
        if(!instances) return {};
        console.debug("Instances", instances);
        return instances.filter(item=>item.instance_id === instanceId).pop();
    }, [instances, instanceId]) as ManagerStatusV2 | null;

    return (
        <>
            <Link to='/coupdoeil2/instances'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>
            <h1 className='text-xl font-bold pt-4'>Server instance {instance?.system_state?.host?.hostname}</h1>

            <section className='grid grid-cols-2 pt-2 pb-4'>
                <p>Last presence</p>
                {instance?.timestamp}
                {/* <ConditionalFormatters.FormatterConditionalDate value={instance?.timestamp} warn={60} error={600} /> */}
            </section>

            <nav>
                <Link to={`/coupdoeil2/instances/${instanceId}`}
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Information
                </Link>
                <Link to={`/coupdoeil2/instances/${instanceId}/passwords`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Passwords
                </Link>
                <Link to={`/coupdoeil2/instances/${instanceId}/configure`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Configure
                </Link>
            </nav>

            <Outlet context={{instance}} />
        </>
    )
}

export default InstanceDetail;
