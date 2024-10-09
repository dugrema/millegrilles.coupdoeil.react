import { useMemo } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import useInstanceStore from "./instanceStore";
import { ServerInstance } from "../workers/connection.worker";
import { ConditionalFormatters } from "millegrilles.reactdeps.typescript";

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
                <ConditionalFormatters.FormatterConditionalDate value={instance?.date_presence} warn={360} error={1800} />
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
        </>
    )
}

export default InstanceDetail;
