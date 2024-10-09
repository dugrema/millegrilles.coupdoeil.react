import { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import useInstanceStore from "../instances/instanceStore";
import useFileManagerStore, { FileManagerStore } from "./fileManagementStore";
import ActionButton from "../components/ActionButton";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";

function FileManagerConfiguration() {

    let { instanceId } = useParams();
    let workers = useWorkers();
    let ready = useConnectionStore(state=>state.connectionAuthenticated);
    let instances = useInstanceStore(state=>state.instances);
    let fileManagers = useFileManagerStore(state=>state.fileManagers);
    
    let [internalCommunicationUrl, setInternalCommunicationUrl] = useState('');
    let [publicFileUrl, setPublicFileUrl] = useState('');
    let [synchronizationActive, setSynchronizationActive] = useState(null as boolean | null);
    let [synchronizationInterval, setSynchronizationInterval] = useState(null as number | null);
    const storeType = 'millegrilles';

    let [instance, fileManager] = useMemo(()=>{
        if(!instances || !fileManagers || !instanceId) return [null, null];
        let instance = instances.filter(item=>item.instance_id === instanceId).pop();
        let fileManager = fileManagers.filter(item=>item.instance_id === instanceId).pop();
        return [instance, fileManager];
    }, [instances, fileManagers, instanceId]);

    let saveConfigurationHandler = useCallback(async () => {
        if(!workers || !ready) throw new Error('workers not initialzed');
        if(!instanceId) throw new Error("instanceId not provided");

        let command = {
            instance_id: instanceId, 
            type_store: storeType,
            consignation_url: internalCommunicationUrl, 
            url_download: publicFileUrl, 
            sync_actif: !!synchronizationActive, 
            sync_intervalle: toInt(synchronizationInterval),
        };
        
        let response = await workers.connection.setFileManagerConfiguration(command);

        // if(!response.ok) {
        //     throw new Error(response.err || 'Error');
        // }
    }, [workers, ready, instanceId, internalCommunicationUrl, publicFileUrl, synchronizationActive, synchronizationInterval]);

    useEffect(()=>{
        if(!fileManager) return;
        // Initialize values
        setInternalCommunicationUrl(fileManager.consignation_url || '');
        setPublicFileUrl(fileManager.url_download || '');
        setSynchronizationActive(!!fileManager.sync_actif);
        setSynchronizationInterval(fileManager.sync_intervalle || 86400);
    }, [instance, setInternalCommunicationUrl, setPublicFileUrl, setSynchronizationActive, setSynchronizationInterval]);

    return (
        <>
            <Link to={`/coupdoeil2/fileManagement/${instanceId}`}
                className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                    Back
            </Link>

            <h1 className='text-xl font-bold pt-4'>File manager configuration</h1>

            <p className='pt-2'>Server: {instance?.hostname}</p>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Communication parameters</h2>
                <CommunicationParameters fileManager={fileManager} 
                    internalCommunicationUrl={internalCommunicationUrl}
                    setInternalCommunicationUrl={setInternalCommunicationUrl} 
                    publicFileUrl={publicFileUrl}
                    setPublicFileUrl={setPublicFileUrl}
                    />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Primary server configuration</h2>
                <PrimaryInstanceParameters fileManager={fileManager}
                    synchronizationActive={synchronizationActive}
                    setSynchronizationActive={setSynchronizationActive}
                    synchronizationInterval={synchronizationInterval}
                    setSynchronizationInterval={setSynchronizationInterval} />
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>File storage</h2>
                <FileStorageConfiguration fileManager={fileManager}/>
            </section>

            <div className='w-full text-center pt-6'>
                <ActionButton onClick={saveConfigurationHandler} disabled={!ready}>Save changes</ActionButton>
            </div>

        </>
    )
}

export default FileManagerConfiguration;

type CommunicationParametersProps = {
    fileManager: FileManagerStore | null | undefined,
    internalCommunicationUrl: string,
    setInternalCommunicationUrl: Dispatch<string>,
    publicFileUrl: string,
    setPublicFileUrl: Dispatch<string>,
}

function CommunicationParameters(props: CommunicationParametersProps) {

    let {
        fileManager, 
        internalCommunicationUrl, setInternalCommunicationUrl,
        publicFileUrl, setPublicFileUrl,
    } = props;

    let internalCommunicationUrlOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setInternalCommunicationUrl(e.currentTarget.value), [setInternalCommunicationUrl]);
    let publicFileUrlOnChange = useCallback((e: ChangeEvent<HTMLInputElement>)=>setPublicFileUrl(e.currentTarget.value), [setPublicFileUrl]);

    return (
        <>
            <div className='grid grid-cols-1 md:grid-cols-3'>
                <p>Internal communication Url</p>
                <input type='url' value={internalCommunicationUrl} onChange={internalCommunicationUrlOnChange}
                    placeholder='Example: https://fichiers:1443, https://myserver.com:444'
                    className='text-black col-span-2' />
                <p>Public facing Url prefix (optional)</p>
                <input type='url' value={publicFileUrl} onChange={publicFileUrlOnChange}
                    placeholder='Example: https://cloudfront.amazon.com/files'
                    className='text-black col-span-2' />
            </div>
            <p>
                Notes
            </p>
            <ul className='list-disc'>
                <li className="ml-6 list-outside">
                    The internal address of the file manager is https://fichiers:1443. When using that Url, the file manager
                    will not be available for any server outside the docker instance. A primary server using the internal
                    address is not available for synchronization by secondary servers.
                </li>
                <li className="ml-6 list-outside">
                    For topologies where file managers need to be available from other server instances (e.g. primary with at least one secondary), 
                    use the publicly available nginx authenticated tls port, for example https://myserver.com:444.
                </li>
                <li className="ml-6 list-outside">
                    The public facing Url is optional. This is can be a server that is hosting the files 
                    (e.g. CDN like Amazon S3 or a plain static web server). The url must be the exact download path of the files so that
                    to download file abcd1234.zip the path would be (prefix in bold) : <span className='font-bold'>https://cdn.com/whatever/folder/is/needed</span>/abcd1234.zip.
                </li>
            </ul>

        </>
    );
}

type PrimaryInstanceParametersProps = {
    fileManager: FileManagerStore | null | undefined,
    synchronizationActive: boolean | null,
    setSynchronizationActive: Dispatch<boolean>,
    synchronizationInterval: number | null,
    setSynchronizationInterval: Dispatch<number|null>,
}

function PrimaryInstanceParameters(props: PrimaryInstanceParametersProps) {

    let {
        fileManager,
        synchronizationActive, setSynchronizationActive,
        synchronizationInterval, setSynchronizationInterval,
    } = props;

    let synchronizationActiveHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>setSynchronizationActive(e.currentTarget.checked), [setSynchronizationActive]);
    let synchronizationIntervalHandler = useCallback((e: ChangeEvent<HTMLInputElement>)=>{
        let value = e.currentTarget.value;
        console.debug("Value ", value)
        if(value === '') {
            setSynchronizationInterval(null);
        } else {
            let numberValue = Number.parseInt(value);
            if(!isNaN(numberValue)) {
                setSynchronizationInterval(numberValue);
            }
        }
    }, [setSynchronizationInterval]);

    return (
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5'>
            <label htmlFor='syncActive'>
                <input id='syncActive' type='checkbox' className='mr-2' checked={synchronizationActive||false} onChange={synchronizationActiveHandler}/>
                Synchronization active
            </label>
            <label htmlFor='syncInterval'>Synchronization interval (seconds)</label>
            <input id='syncInterval' type='number' value={synchronizationInterval||''} onChange={synchronizationIntervalHandler}
                placeholder='Example: 86400 for one day'
                className='text-black' />
        </div>
    );
}

function FileStorageConfiguration(props: {fileManager: FileManagerStore | null | undefined}) {
    return (
        <>
            <p>
                For now the only type of supported storage is on the MilleGrilles file manager's filesystem.
            </p>
            <p>
                File location: /var/lib/docker/volumes/millegrilles-consignation/_data
            </p>
        </>
    );
}

function toInt(val: string | number | null | undefined): number | null{
    if(val === '') return null;
    if(typeof(val) === 'string') return Number.parseInt(val);
    if(typeof(val) === 'number') return Math.floor(val);
    return null;
}
