import { useCallback, useEffect, useState } from "react";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { Link, useNavigate } from "react-router-dom";
import { ConfigurationFileItem } from "../workers/connection.worker";
import { formatDate } from '../utilities/dateUtils';
import ActionButton from "../components/ActionButton";

function ConfigurationFileList() {
    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const navigate = useNavigate();

    const [list, setList] = useState(null as ConfigurationFileItem[] | null);

    const newFileHandler = useCallback(()=>{
        navigate('newFile')
    }, [navigate]);

    const refreshList = useCallback(async () =>{
        if(!ready) return;
        if(!workers) throw new Error('workers not initialized');
        workers.connection.requestConfigurationGetFiles().then(async response => {
            console.debug("Response", response);

            const list = response.list;
            list.sort((a, b)=>{return a.filename.localeCompare(b.filename)});

            setList(list);
        });
    }, [workers, ready, setList])

    useEffect(()=>{
        if(!ready) return;
        if(!workers) throw new Error('workers not initialized');
        refreshList()
            .catch(err=>console.error("Error refreshing list", err));
    }, [workers, ready, refreshList]);

    return (
        <>
            <p className='pb-6'>Configuration file list</p>

            <ConfigurationFileListTable value={list} />

            <div className='pt-6 space-x-4'>
                <button onClick={newFileHandler}
                        className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                    New File
                </button>
                <ActionButton onClick={refreshList} resetDelay={2000}>
                    Refresh
                </ActionButton>
            </div>
        </>
    );
}

export default ConfigurationFileList;

function ConfigurationFileListTable(props: {value: ConfigurationFileItem[] | null}) {
    if(!props.value) return <></>;

    return (
        <div className='grid grid-cols-4'>
            <div className='font-bold pb-2'>Filename</div>
            <div className='font-bold pb-2'>Roles</div>
            <div className='font-bold pb-2'>Domains</div>
            <div className='font-bold pb-2'>Last modified</div>

            {props.value.map(item=><ConfigurationItemRender value={item} />)}
        </div>
    )
}

function ConfigurationItemRender(props: {value: ConfigurationFileItem}) {
    const item = props.value;
    return (
        <>
            <Link to={item.file_id}>{item.filename}</Link>
            <div>{item.roles?item.roles.join(','):''}</div>
            <div>{item.domains?item.domains.join(','):''}</div>
            <div>{formatDate(item.last_modified as any, false)}</div>
        </>
    )
}
