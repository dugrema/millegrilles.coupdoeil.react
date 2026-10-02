import { MouseEvent, useCallback, useMemo, useState } from "react";
import { IconCheckSvg, IconCompactDiscSvg, IconXSvg } from "./Icons";

type ActionButtonProps = {
    onClick: (e: MouseEvent<HTMLButtonElement>)=>Promise<void>, 
    disabled?: boolean | null, 
    mainButton?: boolean, 
    forceErrorStatus?: boolean, 
    children: string,
    name?: string | undefined,
    value?: string | undefined,
    resetDelay?: number | null,
};

function ActionButton(props: ActionButtonProps) {

    const { onClick, disabled, mainButton, forceErrorStatus, name, value, resetDelay } = props;

    const [success, setSuccess] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');
    const [resetTimeout, setResetTimeout]  = useState(null as number | null);

    const [buttonClassName, Icon] = useMemo(()=>{
        if(error || forceErrorStatus) return [
            'inline-flex items-center justify-center px-4 py-2 bg-red-800 border border-red-700 text-white hover:bg-red-700 hover:scale-105 active:bg-red-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none', 
            <IconXSvg className='w-5 mr-2 fill-white'/>
        ];
        if(success) return [
            'inline-flex items-center justify-center px-4 py-2 bg-green-800 border border-green-700 text-white hover:bg-green-700 hover:scale-105 active:bg-green-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none', 
            <IconCheckSvg className='w-5 mr-2 fill-white'/>
        ];
        if(mainButton) return [
            'inline-flex items-center justify-center px-4 py-2 bg-indigo-800 border border-indigo-700 text-white hover:bg-indigo-700 hover:scale-105 active:bg-indigo-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none', 
            waiting?<IconCompactDiscSvg className='w-5 mr-2 fill-white animate-spin' />:<></>
        ];
        return [
            'inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none', 
            waiting?<IconCompactDiscSvg className='w-5 mr-2 fill-slate-500 animate-spin' />:<></>
        ];
    }, [error, forceErrorStatus, success, mainButton, waiting]);

    const resetButton = useCallback(()=>{
        if(resetTimeout) clearTimeout(resetTimeout);
        setResetTimeout(null);
        setSuccess(false);
        setError('');
        setWaiting(false);
    }, [resetTimeout, setResetTimeout, setSuccess, setError, setWaiting]);

    const clickHandler = useCallback((e: MouseEvent<HTMLButtonElement>)=>{
        // Reset
        resetButton()
        setWaiting(true);

        onClick(e)
            .then(()=>{
                setSuccess(true);
                setError('');
            })
            .catch(err=>{
                console.error("ActionButton Error", err);
                setError(''+err);
                setSuccess(false);
            })
            .finally(()=>{
                setWaiting(false);
                if(resetDelay) setResetTimeout(setTimeout(resetButton, resetDelay))
            });

    }, [setSuccess, setWaiting, setError, setResetTimeout, resetButton, onClick]);

    return (
        <button onClick={clickHandler} disabled={!!disabled || waiting} name={name} value={value}
            className={buttonClassName}>
                {props.children}
                {' '}
                {Icon}
        </button>
    )
}

export default ActionButton;
