import { useMemo } from "react";
import { DiskInformation, ServerInstance } from "../workers/connection.worker";
import { Formatters } from "millegrilles.reactdeps.typescript";
import { useParams } from "react-router-dom";
import useInstanceStore from "./instanceStore";

function InstanceInformation() {

    let { instanceId } = useParams();
    let instances = useInstanceStore(state=>state.instances);

    let instance = useMemo(()=>{
        if(!instances) return {};
        console.debug("Instances", instances);
        return instances.filter(item=>item.instance_id === instanceId).pop();
    }, [instances, instanceId]) as ServerInstance | null;
    
    return (
        <section>
            <h2 className='text-lg font-bold pt-4'>File storage</h2>
            <div className='grid grid-cols-6'>
                <p className='font-bold pb-2 col-span-3'>Mount</p>
                <p className='font-bold pb-2'>Total</p>
                <p className='font-bold pb-2'>Used</p>
                <p className='font-bold pb-2'>Free</p>
                <InstanceStorageInformation value={instance} />
            </div>
        </section>
    );
}

export default InstanceInformation;

export function InstanceStorageInformation(props: {value: ServerInstance | null | undefined}) {
    let { value } = props;

    let mounts = useMemo(()=>{
        if(!value || !value.disk) return [];

        let sorted = [...value.disk];
        sorted.sort((a: DiskInformation, b: DiskInformation)=>{
            if(a === b) return 0;
            return a.mountpoint.localeCompare(b.mountpoint);
        })

        return value.disk.map(item=>{

            let usedPct = Math.floor(item.used / item.total * 100);

            return (
                <>
                    <p className="col-span-3">{item.mountpoint}</p>
                    <div className="col-span-1">
                        <Formatters.FormatteurTaille value={item.total} />
                    </div>
                    <div className="w-11/12 mt-1 h-4 text-xs bg-gray-200 rounded-full dark:bg-gray-700">
                        <div className="h-4 bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{width: usedPct+'%'}}> {usedPct}%</div>
                    </div>
                    <div className="col-span-1">
                        (<Formatters.FormatteurTaille value={item.free} />)
                    </div>
                </>
            )
        })
    }, [value]);

    return <>{mounts}</>;
}
