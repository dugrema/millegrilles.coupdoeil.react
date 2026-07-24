import React, { useMemo } from 'react';
import { Link } from "react-router-dom";
import useInstanceStore from "./instanceStore";
import { ManagerStatusV2 } from '../workers/typesInstance';

const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(" ");
};

function InstanceList() {
    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
            <Link to='/coupdoeil2'
                className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
            </Link>


                <h1 className='text-xl font-bold'>Instances</h1>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-x-4 gap-y-4 p-4 bg-slate-800 rounded-lg border border-slate-700'>
                {/* Headers */}
                <p className='font-bold pb-2'>Instance</p>
                <p className='font-bold pb-2 text-center sm:text-left'>Security</p>
                <p className='font-bold pb-2 text-center sm:text-left'>Status</p>
                <p className='font-bold pb-2 text-center sm:text-left'>Last Seen</p>
                <p className='font-bold pb-2 text-center sm:text-left'>CPU</p>
                <p className='font-bold pb-2 text-center sm:text-left'>Uptime</p>
                
                <ShowList />
            </div>
        </div>
    );
}

function ShowList() {
    const instances = useInstanceStore(state => state.instances);

    const sortedInstances = useMemo(() => {
        if (!instances) return [];
        
        return [...instances].sort((a, b) => {
            const hostnameA = a?.system_state?.host?.hostname || '';
            const hostnameB = b?.system_state?.host?.hostname || '';
            if (hostnameA === hostnameB) {
                return a.instance_id.localeCompare(b.instance_id);
            }
            return hostnameA.localeCompare(hostnameB);
        });
    }, [instances]);

    return (
        <>
            {sortedInstances.map(item => {
                const hostname = item?.system_state?.host?.hostname || item.instance_id;
                const status = item.supprime ? 'DELETING' : 'ACTIVE';
                const statusColor = item.supprime ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200';

                return (
                    <React.Fragment key={item.instance_id}>
                        <Link 
                            className='underline font-bold truncate block' 
                            to={`/coupdoeil2/instances/${item.instance_id}`}
                            title={hostname}
                        >
                            {hostname}
                        </Link>
                        <div className='text-sm'>{item.securite}</div>
                        <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>
                                {status}
                            </span>
                        </div>
                        <div className='text-sm text-slate-400'>{new Date(item.timestamp).toLocaleString()}</div>
                        <div className='text-sm font-mono'>{item.system_state?.cpu_usage_percent.toFixed(1)}%</div>
                        <div className='text-sm text-slate-400'>{formatDuration(item.system_state?.uptime_seconds || 0)}</div>
                    </React.Fragment>
                );
            })}
        </>
    );
}

export default InstanceList;

