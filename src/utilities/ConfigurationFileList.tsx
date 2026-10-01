import { useCallback, useEffect } from "react";
import useConnectionStore from "../connectionStore";
import useWorkers from "../workers/workers";
import { useNavigate } from "react-router-dom";

function ConfigurationFileList() {
    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);
    const navigate = useNavigate();

    const newFileHandler = useCallback(()=>{
        navigate('newFile')
    }, [navigate]);

    useEffect(()=>{
        if(!ready) return;
        if(!workers) throw new Error('workers not initialized');
        workers.connection.requestConfigurationGetFiles().then(async response => {
            console.debug("Response", response);
        });
    }, [workers, ready]);


    return (
        <>
            <p>Configuration file list</p>
            <button onClick={newFileHandler}
                    className='inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200'>
                New File
            </button>
        </>
    );
}

export default ConfigurationFileList;
