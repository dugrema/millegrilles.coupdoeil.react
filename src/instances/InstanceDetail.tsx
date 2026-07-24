import { useMemo } from "react";

import { Link, Outlet, useParams } from "react-router-dom";

import useInstanceStore from "./instanceStore";
import { ManagerStatusV2 } from "../workers/typesInstance";

function InstanceDetail() {

    const { instanceId } = useParams();
    const instances = useInstanceStore(state=>state.instances);

    const instance = useMemo(()=>{
        if(!instances) return {};
        // console.debug("Instances", instances);
        return instances.filter(item=>item.instance_id === instanceId).pop();
    }, [instances, instanceId]) as ManagerStatusV2 | null;

    return (
        <div className="p-4 space-y-4">
            <Link to='/coupdoeil2/instances'
                className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
            </Link>
            <h1 className='text-xl font-bold pt-4'>Server instance {instance?.system_state?.host?.hostname}</h1>

            <nav>
                <Link to={`/coupdoeil2/instances/${instanceId}`}
                    className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                    Information
                </Link>
                <Link to={`/coupdoeil2/instances/${instanceId}/passwords`}
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Passwords
                </Link>
                <Link to={`/coupdoeil2/instances/${instanceId}/configure`}
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Configure
                </Link>
            </nav>


            <Outlet context={{instance}} />
        </div>

    )
}

export default InstanceDetail;
