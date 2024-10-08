import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { PasswordDict, ServerInstance } from "../workers/connection.worker";

function InstanceApplicationPasswords() {

    let { instanceId } = useParams();
    let { instance } = useOutletContext() as {instance: ServerInstance};

    return (
        <>
            <section>
                <h2 className='text-lg font-bold pt-4'>Applications</h2>

                <Link to={`/coupdoeil2/instances/${instanceId}`}
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Back
                </Link>

            </section>

            <section>
                <h2 className='text-lg font-bold pt-4'>Application passwords</h2>
                <ApplicationPasswords instance={instance} />
            </section>
        </>
    )
}

export default InstanceApplicationPasswords;


function ApplicationPasswords(props: {instance: ServerInstance | null}) {

    let { instance } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [secrets, setSecrets] = useState(null as PasswordDict | null);

    let secretList = useMemo(()=>{
        if(!secrets) return [];
        let fileNames = Object.keys(secrets);
        fileNames.sort((a: string, b: string)=>{return a.localeCompare(b)});

        return fileNames.map(filename=>{
            if(!secrets) return 'N/A';
            let secretValue = secrets[filename] || 'N/A';
            let multiline = secretValue.indexOf('\n') > 0;

            if(multiline ){
                return (
                    <React.Fragment key={filename}>
                        <p className='col-span-6'>{filename}</p>
                        <pre className='col-span-6 pt-2 pb-6'>{secretValue}</pre>
                    </React.Fragment>
                )
            }
            return (
                <React.Fragment key={filename}>
                    <p className='col-span-2'>{filename}</p>
                    <p className='col-span-4'>{secretValue}</p>
                </React.Fragment>
            )
        });
    }, [secrets])

    useEffect(()=>{
        if(!workers || !ready || !instance?.securite) return // Workers not initialized;
        let security = instance.securite;
        if(!security) throw new Error("instance security is not defined");

        workers.connection.getApplicationPasswords(instance.instance_id, security)
            .then(response=>{
                if(response.secrets) setSecrets(response.secrets);
                else {
                    console.error("getApplicationPasswords Error retrieving passwords", response);
                }
            })
            .catch(err=>console.error("getApplicationPasswords Error", err));
    }, [workers, ready, instance, setSecrets]);

    return (
        <div className='grid grid-cols-6'>
            {secretList}
        </div>
    );
}

