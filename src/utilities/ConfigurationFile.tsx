import { Link, useNavigate, useParams } from "react-router-dom";
import useWorkers from "../workers/workers";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import useConnectionStore from "../connectionStore";
import { ConfigurationPropertyItem, ConfigurationPropertyItemValue, RequestConfigurationGetPropertiesResponse } from "../workers/connection.worker";
import ActionButton from "../components/ActionButton";

function ConfigurationFile() {
    const navigate = useNavigate();
    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const {fileId} = useParams();

    const [file, setFile] = useState(null as RequestConfigurationGetPropertiesResponse | null);
    const [properties, setProperties] = useState(null as ConfigurationPropertyItem[] | null);
    const [editingProperty, setEditingProperty] = useState(null as ConfigurationPropertyItem | null);
    const [editingFile, setEditingFile] = useState(false);

    const handleNew = useCallback(()=>{
        // Create blank item
        setEditingProperty({file_id: fileId, key: '', value: {text: null, inumber: null, fnumber: null}} as ConfigurationPropertyItem);
    }, [setEditingProperty, fileId]);

    const handleEditFile = useCallback(()=>setEditingFile(true), [setEditingFile]);

    const handleEditProperty = useCallback((key: any)=>{
        // console.debug("Edit ", key);
        const propertyToEdit = properties?.filter(item=>item.key === key).pop();
        if(propertyToEdit) {
            // console.debug("Property to edit", propertyToEdit);
            setEditingProperty(propertyToEdit);
        }
    }, [properties, setEditingProperty]);

    const refreshHandler = useCallback(async () => {
        if(!ready) return;
        if(!fileId) throw new Error("FileId not provided");
        if(!workers) throw new Error("Connection not ready");
        const response = await workers.connection.requestConfigurationGetProperties(fileId);
        console.debug("File property detail response", response);
        const properties = response.list;
        properties.sort((a, b)=>{return a.key.localeCompare(b.key)});
        setProperties(properties);
        setFile(response);
    }, [workers, ready, fileId]);

    const returnHandler = useCallback((refresh: boolean | any)=>{
        setEditingProperty(null);
        setEditingFile(false);
        if(refresh === true) refreshHandler().catch(err=>console.error("Error refreshing list: ", err));
    }, [setEditingProperty, refreshHandler]);

    const deleteHandler = useCallback(async () => {
        if(!ready) throw new Error("Connection not ready");
        if(!workers) throw new Error("Connection not ready");
        if(!fileId) throw new Error("File_id not provided");
        const response = await workers.connection.configurationDeleteFile(fileId);
        if(!response.ok) throw new Error(`Error deleting file: ${response.err}`);
        navigate('..');
    }, [navigate, workers, ready, fileId]);

    useEffect(()=>{
        if(!ready || !fileId) return;
        if(!workers) throw new Error('workers not initialized');
        refreshHandler().catch(err=>console.error("Error refreshing list: ", err));
    }, [workers, ready, setProperties, setFile, fileId]);

    return (
        <>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <Link to='/coupdoeil2/configuration'
                        className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                        Back
                    </Link>
                    <h1 className='text-3xl font-bold text-white'>{file?.filename?file.filename:'Configuration file'}</h1>
                </div>
            </div>

            {editingProperty&&<EditingProperty file={file} value={editingProperty} returnHandler={returnHandler} />}
            {editingFile&&<EditingFile value={file} returnHandler={returnHandler} />}
            {(!editingProperty && !editingFile) && 
                <>
                    <section>
                        <button onClick={handleEditFile}
                            className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                            Edit File
                        </button>
                        <ActionButton onClick={refreshHandler} resetDelay={2000}>
                            Refresh
                        </ActionButton>
                        <button onClick={handleNew}
                            className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                            New Property
                        </button>
                    </section>

                    <FileInformation value={file} />

                    <PropertyList value={properties} handleEdit={handleEditProperty} />

                    <p className='pt-20 pb-2'>Danger zone</p>
                    <ActionButton onClick={deleteHandler} resetDelay={2000}>
                        Delete File
                    </ActionButton>
                </>
            }
        </>
    )
}

export default ConfigurationFile;

function FileInformation(props: {value: RequestConfigurationGetPropertiesResponse | null}) {
    const file = props.value;
    if(!file) return <p>Loading</p>;

    return (
        <div className='grid grid-cols-2 py-4'>
            <p className='font-bold'>Filename</p>
            <p>{file.filename}</p>
            <p className='font-bold'>Roles</p>
            <p>{file.roles && file.roles.join(', ')}</p>
            <p className='font-bold'>Domains</p>
            <p>{file.domains && file.domains.join(', ')}</p>
        </div>
    )
}

function PropertyList(props: {value: ConfigurationPropertyItem[] | null, handleEdit: any}) {
    const itemList = props.value;
    if(!itemList) return <></>;

    return (
        <div className='grid grid-cols-2'>
            <div className="col-span-2 lg:col-span-1 font-bold">Key</div>
            <div className='col-span-2 lg:col-span-1 font-bold'>Value</div>

            {itemList.map(item=><PropertyItem value={item} handleEdit={props.handleEdit} />)}
        </div>
    )
}

function PropertyItem(props: {value: ConfigurationPropertyItem, handleEdit: any}) {
    const key = props.value.key;
    const value = props.value.value;
    const handleEdit = props.handleEdit;

    const editCallback = useCallback(()=>handleEdit(key), [handleEdit, key]);

    if(!value) return <></>;
    const numberValueString = [value.inumber, value.fnumber].filter(item=>item!=null).join(',');

    return (
        <>
            <p onClick={editCallback}>
                {props.value.key}
            </p>
            <div>
                {numberValueString?<p>{numberValueString}</p>:<></>}
                {value?.text?<p className='whitespace-nowrap'>{value?.text}</p>:<></>}
            </div>
        </>
    )
}

function EditingProperty(props: {file: RequestConfigurationGetPropertiesResponse | null, value: ConfigurationPropertyItem | null, returnHandler: any}) {
    
    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const file = props.file;

    const [key, setKey] = useState('');
    const keyOnchange = useCallback((e: ChangeEvent<HTMLInputElement>) => setKey(e.currentTarget.value), [setKey]);
    const [text, setText] = useState('');
    const textOnchange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => setText(e.currentTarget.value), [setText]);
    const [iNumber, setINumber] = useState('');
    const iNumberOnchange = useCallback((e: ChangeEvent<HTMLInputElement>) => setINumber(e.currentTarget.value), [setINumber]);
    const [fNumber, setFNumber] = useState('');
    const fNumberOnchange = useCallback((e: ChangeEvent<HTMLInputElement>) => setFNumber(e.currentTarget.value), [setFNumber]);
    
    const returnHandler = props.returnHandler;

    const savePropertyHandler = useCallback(async ()=>{
        if(!ready) throw new Error("Connection not ready");
        if(!workers) throw new Error("Workers not defined");
        if(!file) throw new Error("File information not loaded");
        let textValue = text !== ''?text:null;
        let intNumber = null as number | null;
        let floatNumber = null as number | null;
        if(iNumber != '') {
            intNumber = parseInt(iNumber);
            if(isNaN(intNumber)) throw Error("Integer value incorrect");
        }
        if(fNumber != '') {
            floatNumber = parseFloat(fNumber);
            if(isNaN(floatNumber)) throw Error("Float value incorrect");
        }
        
        // Prepare the property values
        const newValues = {} as ConfigurationPropertyItemValue;
        if(textValue) newValues.text = textValue;
        if(intNumber) newValues.inumber = intNumber;
        if(floatNumber) newValues.fnumber = floatNumber;

        // Encrypt the values
        const secretKeyNopad = file?.secret_key?.replaceAll('=', '');
        const encryptedValue = await workers.encryption.encryptMessageMgs4ToBase64(newValues, ['CoreTopologie'], secretKeyNopad);
        delete encryptedValue?.digest;  // Remove unneeded values
        encryptedValue.cle_id = file.key_id;  // Assign the key_id for future reference
        // console.debug("Encrypted property value: ", encryptedValue);

        // Save the property
        const response = await workers.connection.configurationSetProperty(file.file_id, key, encryptedValue);
        if(!response.ok) {
            throw new Error(`Error saving property: ${response.err}`);
        }

        // Close edit screen
        returnHandler(true);
    }, [workers, ready, returnHandler, file, key, text, iNumber, fNumber]);

    const property = props.value;

    const deletePropertyHandler = useCallback(async () =>{
        if(!ready) throw new Error("Connection not ready");
        if(!workers) throw new Error("Connection not ready");
        if(!property) throw new Error("Property not provided");
        const {file_id, key} = property;
        const response = await workers.connection.configurationDeleteProperty(file_id, key);
        if(!response.ok) throw new Error(`Error deleting property: ${response.err}`);
        returnHandler(true);
    }, [workers, ready, property, returnHandler]);

    useEffect(()=>{
        setKey(property?.key || '');
        const value = property?.value;
        if(value) {
            setText(value.text || '');
            setINumber((value.inumber!=null)?value.inumber+'':'');
            setFNumber((value.fnumber!=null)?value.fnumber+'':'');
        }
    }, [property, setKey, setText, setINumber, setFNumber])
    
    return (
        <>
            <p>Editing property</p>

            <div className="grid grid-cols-3">
                <label htmlFor="key">Property Key</label>
                <input id="key" type="text" value={key} onChange={keyOnchange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />
                <label htmlFor="inumber">Integer</label>
                <input id="inumber" type="text" value={iNumber} onChange={iNumberOnchange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />
                <label htmlFor="fnumber">Float</label>
                <input id="fnumber" type="text" value={fNumber} onChange={fNumberOnchange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />
                <label htmlFor="text">Value text</label>
                <textarea id="text" rows={20} value={text} onChange={textOnchange}
                    className='col-span-3 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />

                <div className="col-span-2">
                    <ActionButton onClick={savePropertyHandler} mainButton={true} disabled={!ready}>
                        Save
                    </ActionButton>
                    <button onClick={props.returnHandler}
                            className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none'>
                        Cancel
                    </button>
                </div>
            </div>

            <p>Note on roles on domains: you can leave either empty. To use multiple roles/domains, separate them with a comma (,).</p>

            <p className="pt-20 pb-4">Danger zone</p>
            <ActionButton onClick={deletePropertyHandler} resetDelay={2000}>
                Delete Property
            </ActionButton>
        </>
    )
}

function EditingFile(props: {value: RequestConfigurationGetPropertiesResponse | null, returnHandler: any}) {
    const { value } = props;
    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);

    const [filename, setFilename] = useState('');
    const filenameOnchange = useCallback((e: ChangeEvent<HTMLInputElement>) => setFilename(e.currentTarget.value), [setFilename]);
    const [roles, setRoles] = useState('');
    const rolesOnchange = useCallback((e: ChangeEvent<HTMLInputElement>) => setRoles(e.currentTarget.value), [setRoles]);
    const [domains, setDomains] = useState('');
    const domainsOnChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setDomains(e.currentTarget.value), [setDomains]);

    const returnHandler = props.returnHandler;

    const createFileHandler = useCallback(async ()=>{
        if(!ready) throw new Error("Connection not ready");
        if(!workers) throw new Error("Connection not ready");
        if(!filename) throw new Error("Filename is required");
        if(!roles && !domains) throw new Error("Either roles or domains is required");
        if(!value) throw new Error("File handle not provided");

        const fileId = value.file_id;

        let roleList = null as string[] | null;
        if(roles) roleList = roles.split(',').map(item=>item.trim());
        let domainList = null as string[] | null;
        if(domains) domainList = domains.split(',').map(item=>item.trim());

        const response = await workers.connection.configurationUpdateFile(fileId, filename, roleList, domainList);
        console.debug("Create file response", response);
        if(!response.ok) {
            throw new Error(`Error creating configuration file: ${response.err}`);
        } else {
            returnHandler(true);
        }
    }, [workers, ready, returnHandler, value, filename, roles, domains]);

    useEffect(()=>{
        if(!value) return;
        setFilename(value.filename);
        if(value.roles) {
            setRoles(value.roles.join(','));
        } else {
            setRoles('')
        }
        if(value.domains) {
            setDomains(value.domains.join(','));
        } else {
            setDomains('');
        }

    }, [value, setFilename, setRoles, setDomains]);

    if(!value) return <p>No file provided</p>;

    return (
        <>
            <p>Editing file</p>
            <div className="grid grid-cols-3">
                <label htmlFor="filename">File name</label>
                <input id="filename" type="text" value={filename} onChange={filenameOnchange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />
                <label htmlFor="roles">Roles</label>
                <input id="roles" type="text" value={roles} onChange={rolesOnchange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />
                <label htmlFor="domains">Domains</label>
                <input id="domains" type="text" value={domains} onChange={domainsOnChange}
                    className='col-span-3 lg:col-span-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all' />

                <div className="col-span-2">
                    <ActionButton onClick={createFileHandler} mainButton={true} disabled={!ready}>
                        Save
                    </ActionButton>
                    <button onClick={returnHandler}
                            className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none'>
                        Cancel
                    </button>
                </div>
            </div>

            <p>Note on roles on domains: you can leave either empty. To use multiple roles/domains, separate them with a comma (,).</p>

        </>
    )
}