import { Link } from "react-router-dom";
import DecryptKeys from "./DecryptKeys";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { useCallback, useEffect, useState } from "react";

function KeyManagementOptions() {

    let [done, setDone] = useState(0);
    let doneOnChange = useCallback(()=>{setDone(new Date().getTime())}, [setDone]);

    return (
        <>
            <Link to='/coupdoeil2'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>KeyMaster</h1>

            <KeyInformation trigger={done} />

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Key decryption process</h2>
                <p className='pb-2'>
                    To fix any key that is not available to the system, enter the master key and click on start.
                </p>
                <DecryptKeys onChange={doneOnChange} />
            </section>
        </>
    );
}

export default KeyManagementOptions;

function KeyInformation(props: {trigger: number}) {

    let { trigger } = props;

    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let [count, setCount] = useState(null as number | null);

    useEffect(()=>{
        if(!workers || !ready) return;
        workers.connection.getNonDecryptableKeyCount()
            .then(response=>{
                if(typeof(response.compte) === 'number') setCount(response.compte);
                else setCount(null);
            })
            .catch(err=>console.error("Error loading undecipherable key count", err));
    }, [workers, ready, setCount, trigger]);

    return (
        <section>
            <h2 className='text-lg font-bold pt-4 pb-2'>Key information</h2>

            <div className='grid grid-cols-1 md:grid-cols-3'>
                <p>Number of undecipherable keys</p>
                <p>
                    {count!==null?
                        <>{count} keys</>
                    :
                        <>Loading ...</>
                    }
                </p>
            </div>

        </section>
    )
}
