import { Link } from "react-router-dom";
import useConnectionStore from "../connectionStore";

function InstallSelect() {

    let installationMode = useConnectionStore(state=>state.installationMode);

    return (
        <>
            {installationMode?<></>:
                <Link to='/coupdoeil2'
                    className='btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800'>
                        Back
                </Link>
            }

            <h1 className='text-xl font-bold pt-4'>Installer</h1>

            <Instructions />

            <section>
                <SelectingInstallationType />
            </section>
        </>
    )
}

export default InstallSelect;

function Instructions() {
    let installationMode = useConnectionStore(state=>state.installationMode);
    if(!installationMode) return <></>;

    return (
        <section className='pt-4 pb-6'>
            <h2 className='text-lg font-bold'>Installing a new MilleGrilles instance server</h2>
            <p className='pb-2'>
                This is the installer application for MilleGrilles instances. You can complete the initial setup
                of a server instance from this page. After that use the other features in Coup D'Oeil 
                to install applications and customize instances and file managers.
            </p>
            <p>
                For new systems, you will have to create a master key. This key gives access to everything (data, user accounts, etc.)
                and is needed for system maintenance and for restoring backups. 
                Make sure you store it in a secure place and do not lose it.
            </p>

            <h3 className='font-bold pt-4'>Note on disaster recovery</h3>
            <p className='pt-2'>
                If your system crashed and you are trying to reinstall it, start with installing a protected instance 
                (option New system) with your existing master key. 
                Once the core system is working, you can try reconnecting all satellite instances (if any), relays and file managers. 
                Put the files file manager buckets and all .mgbak transaction files in place. Then you can use 
                the <Link to='/coudoeil2/domains/restore' className='font-bold underline text-blue-500'>Restore</Link> page
                to rebuild all domains.
            </p>
        </section>
    );
}

function SelectingInstallationType() {
    let installationMode = useConnectionStore(state=>state.installationMode);
    if(!installationMode) return <></>;

    return (
        <>
            <h2 className='text-lg font-bold'>Selecting the type of instance</h2>
            <p className='pb-2'>
                Select the kind of server instance you want to install.
            </p>

            <div className='grid grid-cols-12'>
                <p className='col-span-12 font-bold pt-2'>System core</p>
                <div className='col-span-3 text-right pt-2 pr-2'>
                    <Link to='/coupdoeil2/install/3protege'
                        className="btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900">
                            New system
                    </Link>
                </div>
                <p className='col-span-9'>
                    This is a protected level instance. There can be only one per system. It can do anything the other instances do.
                    Its main feature is the system bus (RabbitMQ) to which all modules and other instances connect.
                </p>

                <p className='col-span-12 font-bold pt-4'>Satellite instances (system support, optional)</p>
                <div className='col-span-3 text-right pt-2 pr-2'>
                    <button value='3.protege'
                        className="btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                            Private
                    </button>
                </div>
                <p className='col-span-9 pt-2'>
                    This is the default support type to host web applications and file managers. The private instance cannot host
                    secure databases and it is limited in its ability to process decrypted data.
                </p>

                <div className='col-span-3 text-right pt-2 pr-2'>
                    <button value='4.secure'
                        className="btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                            Secure
                    </button>
                </div>
                <p className='col-span-9 pt-2'>
                    This is the most secure instance type. It has no open server ports aside from the management interface. Web applications
                    cannot be installed and file managers on this instance cannot receive outside connections (but can act as a backup).
                    This instance is meant to handle database servers with their applications and to process decrypted data 
                    (e.g. full text indexing, stream transcoding, AI models, etc.).
                </p>

                <div className='col-span-3 text-right pt-2 pr-2'>
                    <button value='1.public'
                        className="btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                            Public
                    </button>
                </div>
                <p className='col-span-9 pt-2'>
                    This is the least secure instance type. It is only meant to handle outgoing connections from a potentially
                    insecure server in the cloud. It can act as a relay for secure instances.
                </p>
            </div>
        </>
    );
}
