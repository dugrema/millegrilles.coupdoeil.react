import { useCallback, useEffect, useState } from "react";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { useNavigate } from "react-router-dom";
import { ConfigurationFileItem } from "../workers/connection.worker";
import { formatDate } from '../utilities/dateUtils';

function ConfigurationFileList() {
    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const navigate = useNavigate();

    const [list, setList] = useState(null as ConfigurationFileItem[] | null);

    const newFileHandler = useCallback(()=>{
        navigate('newFile')
    }, [navigate]);

    useEffect(()=>{
        if(!ready) return;
        if(!workers) throw new Error('workers not initialized');
        workers.connection.requestConfigurationGetFiles().then(async response => {
            console.debug("Response", response);

            const list = response.list;
            list.sort((a, b)=>{return a.filename.localeCompare(b.filename)});

            setList(list);
        });
    }, [workers, ready, setList]);


    return (
        <>
            <p>Configuration file list</p>

            <ConfigurationFileListTable value={list} />

            <button onClick={newFileHandler}
                    className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                New File
            </button>
        </>
    );
}

export default ConfigurationFileList;

function ConfigurationFileListTable(props: {value: ConfigurationFileItem[] | null}) {
    if(!props.value) return <></>;

    return (
        <div className='grid grid-cols-4'>
            <div>Filename</div>
            <div>Roles</div>
            <div>Domains</div>
            <div>Last modified</div>

            {props.value.map(item=><ConfigurationItemRender value={item} />)}
        </div>
    )
}

function ConfigurationItemRender(props: {value: ConfigurationFileItem}) {
    const item = props.value;
    return (
        <>
            <div>{item.filename}</div>
            <div>{item.roles?item.roles.join(','):''}</div>
            <div>{item.domains?item.domains.join(','):''}</div>
            <div>{formatDate(item.last_modified as any, false)}</div>
        </>
    )
}
