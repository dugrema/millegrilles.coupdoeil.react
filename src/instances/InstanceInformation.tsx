import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import useInstanceStore from "./instanceStore";
import { ManagerStatusV2 } from "../workers/typesInstance";
import { useTimeTick } from '../hooks/useTimeTick';
import { formatDate } from '../utilities/dateUtils';

// --- Helpers ---

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

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

const ProgressBar = ({ value, max, colorClass = "bg-indigo-600" }: { value: number, max: number, colorClass?: string }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="w-full bg-slate-700 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

// --- Components ---

function ShowInstanceInformation() {
    const { instanceId } = useParams<{ instanceId: string }>();
    const instances = useInstanceStore(state => state.instances);

    const instance = useMemo(() => {
        if (!instances || !instanceId) return null;
        return instances.find(item => item.instance_id === instanceId) as ManagerStatusV2 | undefined;
    }, [instances, instanceId]);

    if (!instance) {
        return (
            <div className="p-4 text-red-500">
                Instance not found.
            </div>
        );
    }

    const { system_state, timestamp, securite, supprime } = instance;
    const state = system_state;

    const now = useTimeTick(60000);
    const lastSeenSeconds = Math.floor((now - new Date(timestamp).getTime()) / 1000);
    const lastSeenMinutes = Math.floor(lastSeenSeconds / 60);

    const isCpuWarning = state.cpu_usage_percent > 80;
    const isMemWarning = (state.memory.used / state.memory.total) > 0.8;
    const isSwapWarning = (state.swap.used / state.swap.total) > 0.2;
    const isDiskWarning = state.disk.some(d => (d.used / d.total) > 0.9);
    const isLagging = lastSeenMinutes > 3;
    const isFailed = lastSeenSeconds > 1200;

    let status = 'ACTIVE';
    let statusColor = 'bg-green-900 text-green-200';

    if (supprime) {
        status = 'DELETING';
        statusColor = 'bg-red-900 text-red-200';
    } else if (isFailed) {
        status = 'FAILED';
        statusColor = 'bg-red-900 text-red-200';
    } else if (isCpuWarning || isLagging || isMemWarning || isSwapWarning || isDiskWarning) {
        status = 'WARN';
        statusColor = 'bg-yellow-900 text-yellow-200';
    }

    return (
        <div className="space-y-6 pt-4">
            {/* Summary Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor}`}>
                            {status}
                        </span>
                        <span className="text-sm font-medium">{securite}</span>
                    </div>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">Uptime</p>
                    <p className="text-lg font-bold mt-1">{formatDuration(state.uptime_seconds)}</p>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">CPU Usage</p>
                    <p className={`text-lg font-bold mt-1 ${isCpuWarning ? 'text-red-500' : ''}`}>{state.cpu_usage_percent.toFixed(1)}%</p>
                    <div className="mt-2">
                        <ProgressBar value={state.cpu_usage_percent} max={100} colorClass="bg-orange-500" />
                    </div>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">Last Seen</p>
                    <p className={`text-sm font-medium mt-1 ${isLagging ? 'text-red-500' : ''}`}>{formatDate(timestamp)}</p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resource Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-slate-700 pb-2">Resources</h2>
                    
                    {/* Memory */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Memory</span>
                            <div className={`flex items-baseline gap-1 ${isMemWarning ? 'text-red-500' : 'text-slate-400'}`}><span>{formatBytes(state.memory.used)} / {formatBytes(state.memory.total)}</span><span className="font-mono w-12 text-right">({Math.round((state.memory.used / state.memory.total) * 100)}%)</span></div>
                        </div>
                        <ProgressBar value={state.memory.used} max={state.memory.total} />
                    </div>

                    {/* Swap */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Swap</span>
                            <div className={`flex items-baseline gap-1 ${isSwapWarning ? 'text-red-500' : 'text-slate-400'}`}><span>{formatBytes(state.swap.used)} / {formatBytes(state.swap.total)}</span><span className="font-mono w-12 text-right">({Math.round((state.swap.used / state.swap.total) * 100)}%)</span></div>
                        </div>
                        <ProgressBar value={state.swap.used} max={state.swap.total} colorClass="bg-yellow-500" />
                    </div>

                    {/* Disk Usage */}
                    <div className="space-y-4 pt-2">
                        <p className="text-sm font-medium text-slate-400">Disk Partitions</p>
                        <div className="space-y-4">
                            {state.disk.map((disk, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-mono">{disk.mountpoint}</span>
                                        <div className={`flex items-baseline gap-1 ${(disk.used / disk.total) > 0.9 ? 'text-red-500' : 'text-slate-400'}`}><span>{formatBytes(disk.used)} / {formatBytes(disk.total)}</span><span className="font-mono w-12 text-right">({Math.round((disk.used / disk.total) * 100)}%)</span></div>
                                    </div>
                                    <ProgressBar value={disk.used} max={disk.total} colorClass="bg-blue-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Network & Host Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-slate-700 pb-2">Network & Host</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm text-slate-400">Hostnames</p>
                            <div className="text-sm space-y-1">
                                {state.host?.hostname ? <p className="font-medium">{state.host.hostname}</p> : <p className="text-slate-500 italic">N/A</p>}
                                {state.host?.ip_addresses.map((ip, idx) => (
                                    <p key={idx} className="font-mono text-xs">{ip}</p>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-slate-400">Load Average</p>
                            <div className="flex gap-2">
                                {state.load_average.map((load, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-slate-700 rounded text-sm font-mono">
                                        {load.toFixed(2)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-400">Network Traffic</p>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-800/50 p-3 rounded border border-slate-700/50">
                            <div>
                                <p className="text-xs text-slate-500">Sent</p>
                                <p className="font-mono">{formatBytes(state.network.bytes_sent)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Received</p>
                                <p className="font-mono">{formatBytes(state.network.bytes_recv)}</p>
                            </div>
                            <div className={(state.network.errin || state.network.errout)?"text-red-400":""}>
                                <p className="text-xs text-slate-500">Errors (In/Out)</p>
                                <p className="font-mono">{state.network.errin} / {state.network.errout}</p>
                            </div>
                            <div className={(state.network.dropin || state.network.dropout)?"text-orange-400":""}>
                                <p className="text-xs text-slate-500">Drops (In/Out)</p>
                                <p className="font-mono">{state.network.dropin} / {state.network.dropout}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-400">Open Ports</p>
                        <div className="flex flex-wrap gap-2">
                            {state.host?.ports ? Object.entries(state.host.ports)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([port, p]) => (
                                    <span key={port} className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">
                                        {port}:{p}
                                    </span>
                                )) : <span className="text-sm text-slate-500 italic">No port info available</span>}
                        </div>
                    </div>
                </section>
            </div>

            {/* Advanced Metrics */}
            {state.disk_io && (
                <section className="space-y-4 pt-4 border-t border-slate-700">
                    <h2 className="text-lg font-semibold">Disk I/O</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700 text-center">
                            <p className="text-xs text-slate-500 uppercase">Read</p>
                            <p className="font-bold text-lg">{formatBytes(state.disk_io.read_bytes)}</p>
                        </div>
                        <div className="p-3 bg-slate-800 rounded border border-slate-700 text-center">
                            <p className="text-xs text-slate-500 uppercase">Write</p>
                            <p className="font-bold text-lg">{formatBytes(state.disk_io.write_bytes)}</p>
                        </div>
                        <div className="p-3 bg-slate-800 rounded border border-slate-700 text-center">
                            <p className="text-xs text-slate-500 uppercase">Read Count</p>
                            <p className="font-bold text-lg">{state.disk_io.read_count}</p>
                        </div>
                        <div className="p-3 bg-slate-800 rounded border border-slate-700 text-center">
                            <p className="text-xs text-slate-500 uppercase">Write Count</p>
                            <p className="font-bold text-lg">{state.disk_io.write_count}</p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default ShowInstanceInformation;
