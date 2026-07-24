import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import useWorkers from "../workers/workers";
import useConnectionStore from "../connectionStore";
import { PasswordDict, ServerInstance } from "../workers/connection.worker";

function InstanceApplicationPasswords() {
    const { instance } = useOutletContext() as {instance: ServerInstance};

    return (
        <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
            <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                <span className='mr-2'>🔑</span> Application passwords
            </h2>
            <ApplicationPasswords instance={instance} />
        </section>
    )
}

export default InstanceApplicationPasswords;


function ApplicationPasswords(props: {instance: ServerInstance | null}) {

    const { instance } = props;

    const workers = useWorkers();
    const ready = useConnectionStore(state=>state.connectionAuthenticated);

    const [secretCopied, setSecretCopied] = useState(null as string | null);

    const copyClipboard = useCallback((name: string, value: string) => {
        navigator.clipboard.writeText(value);
        setSecretCopied(name);
    }, [setSecretCopied]);

    useEffect(() => {
        if(!secretCopied) return;
        const timeout = setTimeout(() => setSecretCopied(null), 3_000);
        return () => {
            clearTimeout(timeout);
        }
    }, [secretCopied]);

    const [secrets, setSecrets] = useState(null as PasswordDict | null);

    const secretRows = useMemo(() => {
        if(!secrets) return [];
        const fileNames = Object.keys(secrets).sort((a, b) => a.localeCompare(b));

        return fileNames.map(filename => {
            const secretValue = secrets[filename] || 'N/A';
            const isCopied = filename === secretCopied;

            return (
                <tr key={filename} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{filename}</td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            <code className={`px-2 py-1 rounded bg-slate-900 text-slate-400 text-xs break-all ${isCopied ? 'text-amber-400 ring-1 ring-amber-400/50' : ''}`}>
                                {secretValue}
                            </code>
                            <button
                                onClick={() => copyClipboard(filename, secretValue)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    isCopied 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </td>
                </tr>
            );
        });
    }, [secrets, secretCopied, copyClipboard]);

    useEffect(() => {
        if(!workers || !ready || !instance?.securite) return;
        const security = instance.securite;
        if(!security) throw new Error("instance security is not defined");

        workers.connection.getApplicationPasswords(instance.instance_id, security)
            .then(response => {
                if(response.secrets) setSecrets(response.secrets);
                else {
                    console.error("getApplicationPasswords Error retrieving passwords", response);
                }
            })
            .catch(err => console.error("getApplicationPasswords Error", err));
    }, [workers, ready, instance]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-4 py-3">Key</th>
                        <th className="px-4 py-3">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {secretRows.length > 0 ? (
                        secretRows
                    ) : (
                        <tr>
                            <td colSpan={2} className="px-4 py-8 text-center text-slate-400">No passwords found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}


