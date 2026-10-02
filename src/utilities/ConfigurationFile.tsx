import { Link, useParams } from "react-router-dom";
import useWorkers from "../workers/workers";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import useConnectionStore from "../connectionStore";
import { ConfigurationPropertyItem, ConfigurationPropertyItemValue, RequestConfigurationGetPropertiesResponse } from "../workers/connection.worker";
import ActionButton from "../components/ActionButton";

function ConfigurationFile() {

    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const {fileId} = useParams();

    const [file, setFile] = useState(null as RequestConfigurationGetPropertiesResponse | null);
    const [properties, setProperties] = useState(null as ConfigurationPropertyItem[] | null);
    const [editing, setEditing] = useState(null as ConfigurationPropertyItem | null);

    const handleNew = useCallback(()=>{
        // Create blank item
        setEditing({file_id: fileId, key: '', value: {text: null, inumber: null, fnumber: null}} as ConfigurationPropertyItem);
    }, [setEditing, fileId]);

    const handleEdit = useCallback((key: any)=>{
        // console.debug("Edit ", key);
        const propertyToEdit = properties?.filter(item=>item.key === key).pop();
        if(propertyToEdit) {
            // console.debug("Property to edit", propertyToEdit);
            setEditing(propertyToEdit);
        }
    }, [properties, setEditing])

    useEffect(()=>{
        if(!ready || !fileId) return;
        if(!workers) throw new Error('workers not initialized');
        workers.connection.requestConfigurationGetProperties(fileId).then(async response => {
            // console.debug("Response", response);
            const properties = response.list;
            properties.sort((a, b)=>{return a.key.localeCompare(b.key)});
            setProperties(properties);
            setFile(response);
        });
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

            {editing?
                <Editing file={file} value={editing} cancelHandler={()=>setEditing(null)} />
            :
                <>
                    <button onClick={handleNew}
                        className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                        New Property
                    </button>

                    <PropertyList value={properties} handleEdit={handleEdit} />
                </>
            }
        </>
    )
}

export default ConfigurationFile;

function PropertyList(props: {value: ConfigurationPropertyItem[] | null, handleEdit: any}) {
    const itemList = props.value;
    if(!itemList) return <></>;

    return (
        <div className='grid grid-cols-2'>
            <div className="col-span-2 lg:col-span-1">Key</div>
            <div className='col-span-2 lg:col-span-1'>Value</div>

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

function Editing(props: {file: RequestConfigurationGetPropertiesResponse | null, value: ConfigurationPropertyItem | null, cancelHandler: any}) {
    
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
    
    const cancelHandler = props.cancelHandler;

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
        cancelHandler();
    }, [workers, ready, cancelHandler, file, key, text, iNumber, fNumber]);

    const property = props.value;
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
            <p>Editing</p>

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
                    <button onClick={props.cancelHandler}
                            className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none'>
                        Cancel
                    </button>
                </div>
            </div>

            <p>Note on roles on domains: you can leave either empty. To use multiple roles/domains, separate them with a comma (,).</p>
        </>
    )
}

