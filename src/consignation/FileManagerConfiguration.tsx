import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import useInstanceStore from "../instances/instanceStore";
import useFileManagerStore, { FileManagerStore } from "./fileManagementStore";

function FileManagerConfiguration() {

    let { instanceId } = useParams();
    let instances = useInstanceStore(state=>state.instances);
    let fileManagers = useFileManagerStore(state=>state.fileManagers);
    
    let [instance, fileManager] = useMemo(()=>{
        if(!instances || !fileManagers || !instanceId) return [null, null];
        let instance = instances.filter(item=>item.instance_id === instanceId).pop();
        let fileManager = fileManagers.filter(item=>item.instance_id === instanceId).pop();
        return [instance, fileManager];
    }, [instances, fileManagers, instanceId]);

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
                <CommunicationParameters fileManager={fileManager}/>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>Primary server configuration</h2>
                <PrimaryInstanceParameters fileManager={fileManager}/>
            </section>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>File storage</h2>
                <FileStorageConfiguration fileManager={fileManager}/>
            </section>

            <div className='w-full text-center pt-6'>
                <button
                    className='btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900'>
                        Save changes
                </button>
            </div>

        </>
    )
}

export default FileManagerConfiguration;

function CommunicationParameters(props: {fileManager: FileManagerStore | null | undefined}) {
    return (
        <>
            <div className='grid grid-cols-1 md:grid-cols-3'>
                <p>Internal communication Url</p>
                <input type='url' 
                    placeholder='Example: https://fichiers:1443, https://myserver.com:444'
                    className='text-black col-span-2' />
                <p>Public facing Url prefix (optional)</p>
                <input type='url' 
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

function PrimaryInstanceParameters(props: {fileManager: FileManagerStore | null | undefined}) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5'>
            <label htmlFor='syncActive'>
                <input id='syncActive' type='checkbox' className='mr-2' />
                Synchronization active
            </label>
            <label htmlFor='syncInterval'>Synchronization interval (seconds)</label>
            <input id='syncInterval' type='number' 
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
