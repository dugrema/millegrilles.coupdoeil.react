import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { certificates } from "millegrilles.cryptography";
import { Formatters } from "millegrilles.reactdeps.typescript";

import { DiskInformation, ServerInstance } from "../workers/connection.worker";
import useInstanceStore from "./instanceStore";

function ShowInstanceInformation() {

    const { instanceId } = useParams();
    const instances = useInstanceStore(state=>state.instances);

    const instance = useMemo(()=>{
        if(!instances) return {};
        // console.debug("Instances", instances);
        return instances.filter(item=>item.instance_id === instanceId).pop();
    }, [instances, instanceId]) as ServerInstance | null;
    
    return (
        <>
            <InstanceStorageInformation value={instance} />
        </>
    );
}

export default ShowInstanceInformation;

export function InstanceStorageInformation(props: {value: ServerInstance | null | undefined}) {
    const { value } = props;

    const mounts = useMemo(()=>{
        if(!value || !value.disk) return [];

        const sorted = [...value.disk];
        sorted.sort((a: DiskInformation, b: DiskInformation)=>{
            if(a === b) return 0;
            return a.mountpoint.localeCompare(b.mountpoint);
        })

        return value.disk.map(item=>{

            const usedPct = Math.floor(item.used / item.total * 100);

            return (
                <React.Fragment key={item.mountpoint}>
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
                </React.Fragment>
            )
        })
    }, [value]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4'>File storage</h2>
            <div className='grid grid-cols-6'>
                <p className='font-bold pb-2 col-span-3'>Mount</p>
                <p className='font-bold pb-2'>Total</p>
                <p className='font-bold pb-2'>Used</p>
                <p className='font-bold pb-2'>Free</p>
                {mounts}
            </div>
        </section>
    );
}

export function ShowCertificateInformation(props: {value: certificates.CertificateWrapper | null}) {

    const {value} = props;

    const expired = useMemo(()=>{
        const notAfter = value?.certificate?.notAfter;
        if(!notAfter) return false;  // No information
        return notAfter < new Date();
    }, [value]);

    if(!value) return <></>;

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 pb-4'>
            <p>Instance Id</p>
            <p>{value.extensions?.commonName}</p>
            <p>Exchanges</p>
            <p>{value.extensions?.exchanges?.join(', ')}</p>
            <p>Roles</p>
            <p>{value.extensions?.roles}</p>
            <p>Valid not before</p>
            <p><Formatters.FormatterDate value={value.certificate.notBefore.getTime()/1000} /></p>
            <p>Valid not after</p>
            <p className={expired?'text-red-500':''}>
                <Formatters.FormatterDate value={value.certificate.notAfter.getTime()/1000} />
                {expired?<> (Expired)</>:<></>}
            </p>
        </div>
    )
}
