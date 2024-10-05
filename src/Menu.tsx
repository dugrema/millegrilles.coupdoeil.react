import { Link } from 'react-router-dom';

import useConnectionStore from './connectionStore';
import { useMemo } from 'react';

type MenuProps = {
    title: string,
    backLink?: boolean,
};

export default function HeaderMenu(props: MenuProps) {

    let installationMode = useConnectionStore(state=>state.installationMode);
    let connectionReady = useConnectionStore(state=>state.connectionAuthenticated);

    let cssDisconnected = useMemo(()=>{
        if(connectionReady) return '';
        if(installationMode === true) return ' bg-amber-700';
        return ' bg-red-500';
    }, [connectionReady, installationMode]);

    return (
        <header className={'fixed pl-2 pr-2 pt-2 top-0 transition grid grid-cols-2 md:grid-cols-3 w-full' + cssDisconnected}>
            <div className='text-lg font-bold underline'>
                {props.backLink?
                    <Link to='/coupdoeil2'>{props.title}</Link>
                    :
                    <span>{props.title}</span>
                }
            </div>
            <div className='hidden md:block text-center'>
                {installationMode?
                    <p className='font-bold'>Installation mode</p>
                :<></>}
            </div>
            <div className='text-right text-lg font-bold underline'>
                <a href="/millegrilles">Portal</a>
            </div>
        </header>
    );
}
