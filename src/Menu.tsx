import { Link } from 'react-router-dom';
import useConnectionStore from './connectionStore';

type MenuProps = {
    title: string,
    backLink?: boolean,
};

export default function HeaderMenu(props: MenuProps) {
    const recoveryMode = useConnectionStore(state => state.recoveryMode);
    const connectionReady = useConnectionStore(state => state.connectionAuthenticated);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700 px-6 py-3">
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                <div className='text-xl font-semibold text-white'>
                    {props.backLink ?
                        <Link to='/coupdoeil2' className="hover:text-slate-300 transition-colors">{props.title}</Link>
                        :
                        <span>{props.title}</span>
                    }
                </div>

                <div className="flex items-center space-x-4">
                    {recoveryMode && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                            Recovery Mode
                        </span>
                    )}
                    {!connectionReady && !recoveryMode && (
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                            Disconnected
                        </span>
                    )}
                </div>

                <div className='flex items-center'>
                    <a
                        href="/millegrilles"
                        className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <span>Exit Portal</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </header>
    );
}

