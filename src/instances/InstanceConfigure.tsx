import { useCallback } from "react";
import { useParams } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";

function InstanceConfigure() {

    let { instanceId } = useParams();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);

    let deleteInstanceHandler = useCallback(async () => {
        if(!ready) return;
        if(!workers) throw new Error("workers not initialized");
        if(!instanceId) throw new Error("instanceId not provided");
        let response = await workers.connection.deleteInstance(instanceId)
        if(response.ok !== true) throw new Error("Error deleting instance: " + response);
    }, [workers, ready, instanceId]);

    return (
        <>
            <section>
                <h2 className='text-lg font-bold pt-4'>Configure</h2>
            </section>

            <section className='pt-10'>
                <h2 className='text-lg font-bold pt-4'>Danger zone</h2>
                <ActionButton onClick={deleteInstanceHandler} disabled={!ready || !instanceId}>
                        Delete instance
                </ActionButton>

            </section>
        </>
    )
};

export default InstanceConfigure;
