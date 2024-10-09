import { useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useInstanceStore, { ServerInstanceStore } from "../instances/instanceStore";
import useFileManagerStore, { FileManagerStore } from "./fileManagementStore";
import { Formatters } from "millegrilles.reactdeps.typescript";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import ActionButton from "../components/ActionButton";
import { InstanceStorageInformation } from "../instances/InstanceInformation";

function FileManagerInformation() {

    let navigate = useNavigate();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let { instanceId } = useParams();
    let instances = useInstanceStore(state=>state.instances);
    let fileManagers = useFileManagerStore(state=>state.fileManagers);
    
    let [instance, fileManager] = useMemo(()=>{
        if(!instances || !fileManagers || !instanceId) return [null, null];
        let instance = instances.filter(item=>item.instance_id === instanceId).pop();
        let fileManager = fileManagers.filter(item=>item.instance_id === instanceId).pop();
        return [instance, fileManager];
    }, [instances, fileManagers, instanceId]);

    let removeHandler = useCallback(async ( )=> {
        if(!workers || !ready) throw new Error("workers not initialized");
        if(!instanceId) throw new Error("instanceId not provided");
        let response = await workers.connection.removeFileManager(instanceId);
        if(!response.ok) throw new Error(response.err || "Error");
        navigate('/coupdoeil2/fileManagement');
    }, [workers, ready, instanceId, navigate]);

    return (
        <>
            <Link to='/coupdoeil2/fileManagement'
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>File manager information</h1>

            <p className='pt-2'>Server: {instance?.hostname}</p>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Server instance information</h2>
                <InstanceInformation instance={instance} fileManager={fileManager} />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Configuration sections</h2>
                <Link to={`/coupdoeil2/fileManagement/${instanceId}/configure`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Configure
                </Link>
                <Link to={`/coupdoeil2/fileManagement/${instanceId}/backup`}
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Backup
                </Link>
            </section>

            <section className='pt-10'>
                <h2 className='text-lg font-bold pt-4 pb-2'>Remove file manager</h2>
                <p>
                    Click on this button to remove the file manager from the list. The configuration is kept 
                    and will be re-used if you bring it back up on the same instance at a later date.
                </p>
                <ActionButton onClick={removeHandler} disabled={!ready || !instanceId}>
                    Remove
                </ActionButton>
            </section>

        </>
    );
}

export default FileManagerInformation;

function InstanceInformation(props: {instance: ServerInstanceStore | null | undefined, fileManager: FileManagerStore | null | undefined}) {

    let { instance, fileManager } = props;

    let principal = fileManager?.principal || {}
    let orphelins = fileManager?.orphelin || {}
    let manquant = fileManager?.manquant || {}

    let taillePrincipal = principal.taille || 0;
    let tailleOrphelins = orphelins.taille || 0;
    let tailleTotale = taillePrincipal + tailleOrphelins;

    let nombrePrincipal = principal.nombre || 0;
    let nombreOrphelins = orphelins.nombre || 0;
    let nombreManquants = manquant.nombre || 0;
    let nombreTotal = nombrePrincipal + nombreOrphelins;


    return (
        <>
            <h3 className='font-bold pb-4'>Stats</h3>

            <div className='grid grid-cols-1 md:grid-cols-3'>
                <p>Instance Id</p>
                <p className='col-span-2'>{instance?.instance_id}</p>

                <p className='pt-2 pb-1 font-bold'></p>
                <p className='pt-2 pb-1 font-bold'>Count</p>
                <p className='pt-2 pb-1 font-bold'>Size</p>

                <p>Active files</p>
                <p className=''>{nombrePrincipal}</p>
                <p className=''><Formatters.FormatteurTaille value={taillePrincipal} /></p>
                <p>Orphan files</p>
                <p className=''>{nombreOrphelins}</p>
                <p className=''><Formatters.FormatteurTaille value={tailleOrphelins} /></p>
                <p>Total</p>
                <p className=''>{nombreTotal}</p>
                <p className=''><Formatters.FormatteurTaille value={tailleTotale} /></p>
                <p>Missing files</p>
                <p className='col-span-2'>{nombreManquants}</p>
            </div>

            <h3 className='font-bold pt-4 pb-4'>Storage</h3>
            <div className='grid grid-cols-6'>
                <p className='font-bold pb-2 col-span-3'>Mount</p>
                <p className='font-bold pb-2'>Total</p>
                <p className='font-bold pb-2'>Used</p>
                <p className='font-bold pb-2'>Free</p>
                <InstanceStorageInformation value={instance} />
            </div>
        </>
    );
}
