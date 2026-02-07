import React, { useState, useEffect } from 'react';
import { getNotificationHistory } from '../../api/notifications';
import type { NotificationHistoryItem } from '../../types';
import { Loader2, Bell, AlertCircle, Clock, Hash } from 'lucide-react';

interface Props {
    projectId: number;
    environmentId: number;
}

export const NotificationHistory: React.FC<Props> = ({ projectId, environmentId }) => {
    const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [projectId, environmentId]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await getNotificationHistory(projectId, environmentId);
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-20 text-center shadow-2xl">
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600 mx-auto mb-6">
                    <Bell size={40} />
                </div>
                <p className="text-white font-black text-xl mb-2">No notifications sent yet</p>
                <p className="text-slate-500 font-medium max-w-xs mx-auto">
                    Notifications will appear here once error alerts are triggered for this environment.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Error Message</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Level</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Occurrences</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Notifications</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Last Notified</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {history.map((item) => (
                            <tr key={item.error_group_id} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                                            <AlertCircle size={16} className="text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-white max-w-md truncate">{item.message}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span
                                        className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-full border ${item.level === 'error'
                                            ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                            : item.level === 'warn'
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                            }`}
                                    >
                                        {item.level}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg text-slate-300 font-mono text-xs">
                                        <Hash size={12} className="text-slate-500" />
                                        {item.occurrence_count}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 rounded-lg text-blue-400 font-mono text-xs border border-blue-600/10">
                                        <Bell size={12} className="text-blue-500" />
                                        {item.notification_count}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                                            <Clock size={12} className="text-slate-500" />
                                            {new Date(item.last_notified_at).toLocaleDateString()}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {new Date(item.last_notified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
