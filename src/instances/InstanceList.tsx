import React from 'react';
import { Link } from "react-router-dom";
import useInstanceStore from "./instanceStore";
import { useMemo } from "react";
import { ServerInstance } from "../workers/connection.worker";
import { ConditionalFormatters } from 'millegrilles.reactdeps.typescript';

function InstanceList() {
    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>Instances</h1>

            <section>

                <h2 className='text-lg font-bold pt-4 pb-2'>Actions on instances</h2>

                <button
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Associate new
                </button>

                <button
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Configure
                </button>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Instance list</h2>
                <div className='grid grid-cols-1 sm:grid-cols-4'>
                    <p className='font-bold pb-2 sm:col-span-2'>Instance name</p>
                    <p className='font-bold pb-2'>Last presence</p>
                    <p className='font-bold pb-2'>Security level</p>
                    <ShowList />
                </div>
            </section>
        </>
    );
}

export default InstanceList;

function ShowList() {
    let instances = useInstanceStore(state=>state.instances);

    let sortedInstances = useMemo(()=>{
        if(!instances) return [];
        let instanceCopy = [...instances];

        instanceCopy.sort((a: ServerInstance, b: ServerInstance)=>{
            if(a === b) return 0;
            if(!a) return 1;
            if(!b) return -1;
            if(a.hostname === b.hostname) return 0;
            let hostnameA = a.hostname || '';
            let comp = hostnameA.localeCompare(b.hostname);
            if(comp !== 0) return comp;
            return a.instance_id.localeCompare(b.instance_id);
        });

        return instanceCopy.map(item=>{
            return (
                <React.Fragment key={item.instance_id}>
                    <Link className='sm:col-span-2 underline font-bold' to={`/coupdoeil2/instances/${item.instance_id}`}>
                        {item.hostname || item.instance_id}
                    </Link>
                    <ConditionalFormatters.FormatterConditionalDate value={item.date_presence} warn={360} error={1800} />
                    <p className='pb-2 sm:pb-0'>{item.securite}</p>
                </React.Fragment>
            )
        });
    }, [instances]);

    return <>{sortedInstances}</>
}

