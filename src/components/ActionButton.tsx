import { useCallback, useMemo, useState } from "react";
import { IconCheckSvg, IconXSvg } from "./Icons";

function ActionButton(props: {onClick: ()=>Promise<void>, disabled?: boolean | null, mainButton?: boolean, children: string}) {

    let { onClick, disabled, mainButton } = props;

    let [success, setSuccess] = useState(false);
    let [waiting, setWaiting] = useState(false);
    let [error, setError] = useState('');

    let [buttonClassName, Icon] = useMemo(()=>{
        if(success) return [
            'btn inline-block text-center bg-green-700 hover:bg-green-600 active:bg-green-500 disabled:bg-green-800', 
            <IconCheckSvg className='w-6 mr-2 fill-green-500 inline'/>
        ];
        if(error) return [
            'btn inline-block text-center bg-red-700 hover:bg-red-600 active:bg-red-500 disabled:bg-red-800', 
            <IconXSvg className='w-6 mr-2 fill-white inline'/>
        ];
        if(mainButton) return [
            'btn inline-block text-center bg-indigo-800 hover:bg-indigo-600 active:bg-indigo-500 disabled:bg-indigo-900', 
            <span className='ml-9'/>
        ];
        return [
            'btn inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800', 
            <span className='ml-9'/>
        ];
    }, [error, success, mainButton]);

    let clickHandler = useCallback(()=>{
        // Reset
        setSuccess(false);
        setWaiting(true);
        setError('');

        onClick()
            .then(()=>{
                setSuccess(true);
                setError('');
            })
            .catch(err=>{
                console.error("ActionButton Error", err);
                setError(''+err);
                setSuccess(false);
            })
            .finally(()=>setWaiting(false));

    }, [setSuccess, setWaiting, setError, onClick]);

    return (
        <button onClick={clickHandler} disabled={!!disabled || waiting}
            className={buttonClassName}>
                {props.children}
                {' '}
                {Icon}
        </button>
    )
}

export default ActionButton;
