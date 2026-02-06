import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getProject } from '../api/projects';
import { getErrorGroup, getGroupOccurrences } from '../api/errorGroups';
import { ErrorBadge } from '../components/ErrorBadge';
import {
    Clock,
    Globe,
    Code,
    User,
    Terminal,
    CheckCircle,
    RotateCcw,
    Loader2,
    ChevronRight,
    Ban,
    Link as LinkIcon,
    Calendar,
    ChevronDown,
    ChevronUp,
    Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useQuery } from '@tanstack/react-query';
import { useErrorGroupActions } from '../hooks/useErrorGroupActions';

export const ErrorGroupDetail = () => {
    const { id, groupId } = useParams<{ id: string; groupId: string }>();
    const projectId = Number(id);
    const gId = Number(groupId);

    const [expandedOccurrence, setExpandedOccurrence] = useState<number | null>(null);
    const { resolve, ignore, reopen } = useErrorGroupActions(projectId);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Queries
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProject(projectId),
        enabled: !!projectId,
    });

    const { data: group, isLoading: isGroupLoading } = useQuery({
        queryKey: ['error-group', projectId, gId],
        queryFn: () => getErrorGroup(projectId, gId),
        enabled: !!projectId && !!gId,
    });

    const { data: occurrences = [], isLoading: isOccLoading } = useQuery({
        queryKey: ['error-group-occurrences', projectId, gId],
        queryFn: () => getGroupOccurrences(projectId, gId, 50),
        enabled: !!projectId && !!gId,
    });

    const handleAction = async (action: 'resolve' | 'ignore' | 'reopen') => {
        setIsActionLoading(true);
        try {
            if (action === 'resolve') await resolve(gId);
            else if (action === 'ignore') await ignore(gId);
            else if (action === 'reopen') await reopen(gId);
        } finally {
            setIsActionLoading(false);
        }
    };

    const isLoading = isGroupLoading || isOccLoading;

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    if (!group) {
        return (
            <Layout>
                <div className="text-center py-20 text-slate-500">
                    Error group not found.
                </div>
            </Layout>
        );
    }

    const uniqueUsers = new Set(occurrences.map(o => o.user_id).filter(Boolean)).size;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3">
                        <nav className="flex items-center space-x-2 text-sm text-slate-500">
                            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                            <ChevronRight size={14} />
                            <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">{project?.name}</Link>
                            <ChevronRight size={14} />
                            <Link to={`/projects/${projectId}/error-groups`} className="hover:text-white transition-colors">Error Groups</Link>
                            <ChevronRight size={14} />
                            <span className="text-slate-300">Issue Detail</span>
                        </nav>

                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-2xl font-black text-white leading-tight max-w-2xl">
                                {group.message}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${group.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    group.status === 'ignored' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                                        'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse-slow'
                                    }`}>
                                    {group.status}
                                </span>
                                <ErrorBadge level={group.level as any} className="px-3" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {group.status === 'unresolved' ? (
                            <>
                                <button
                                    onClick={() => handleAction('resolve')}
                                    disabled={isActionLoading}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    <span>Resolve</span>
                                </button>
                                <button
                                    onClick={() => handleAction('ignore')}
                                    disabled={isActionLoading}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 disabled:opacity-50"
                                >
                                    {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />}
                                    <span>Ignore</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleAction('reopen')}
                                disabled={isActionLoading}
                                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                                <span>Reopen Issue</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Error Details Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-slate-800/50 bg-slate-900/50">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                                    <Terminal size={14} className="text-blue-500" />
                                    Error Message
                                </h2>
                                <p className="text-lg font-medium text-white leading-relaxed break-words font-mono">
                                    {group.message}
                                </p>
                            </div>

                            {group.stack && (
                                <div className="p-8 space-y-4 bg-slate-950/20">
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Code size={14} className="text-blue-500" />
                                        Stack Trace
                                    </h2>
                                    <div className="rounded-2xl overflow-hidden border border-slate-800/60 shadow-inner">
                                        <SyntaxHighlighter
                                            language="javascript"
                                            style={atomDark}
                                            customStyle={{
                                                background: 'transparent',
                                                padding: '1.5rem',
                                                fontSize: '0.75rem',
                                                lineHeight: '1.6',
                                                margin: 0
                                            }}
                                        >
                                            {group.stack}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Occurrences Timeline */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    Occurrence Timeline
                                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-slate-500 rounded-lg">Last 50</span>
                                </h2>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                                    <Activity size={14} className="animate-pulse text-rose-500" />
                                    Real-time tracking
                                </div>
                            </div>

                            <div className="space-y-3">
                                {occurrences.map((occ) => (
                                    <div
                                        key={occ.id}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group/item transition-all"
                                    >
                                        <div
                                            className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30"
                                            onClick={() => setExpandedOccurrence(expandedOccurrence === occ.id ? null : occ.id)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock size={16} />
                                                    <span className="text-xs font-mono">{format(new Date(occ.timestamp), 'HH:mm:ss.SSS')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500 border-l border-slate-800 pl-6">
                                                    <User size={14} />
                                                    <span className="text-xs font-medium">{occ.user_id || 'unauthenticated'}</span>
                                                </div>
                                                {occ.url && (
                                                    <div className="hidden md:flex items-center gap-2 text-slate-500 border-l border-slate-800 pl-6 max-w-[200px]">
                                                        <LinkIcon size={14} />
                                                        <span className="text-[10px] font-mono truncate">{occ.url}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {occ.status_code && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border font-mono ${occ.status_code >= 400 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        }`}>
                                                        {occ.status_code}
                                                    </span>
                                                )}
                                                {expandedOccurrence === occ.id ? <ChevronUp size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-600" />}
                                            </div>
                                        </div>

                                        {expandedOccurrence === occ.id && (
                                            <div className="px-6 pb-6 pt-2 border-t border-slate-800/50 bg-slate-950/20">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-800 pb-2">User Context</h4>
                                                        <div className="space-y-3 font-mono text-[11px]">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">User Agent:</span>
                                                                <span className="text-slate-300 text-right max-w-[150px] truncate">{occ.user_agent || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Method:</span>
                                                                <span className="text-blue-400 font-bold">{occ.method || 'GET'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Request ID:</span>
                                                                <span className="text-slate-300">{occ.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-800 pb-2">Extra Data</h4>
                                                        {occ.extra_data ? (
                                                            <pre className="text-[10px] font-mono text-emerald-400 bg-slate-950 p-4 rounded-xl border border-slate-800/50 overflow-x-auto">
                                                                {JSON.stringify(occ.extra_data, null, 2)}
                                                            </pre>
                                                        ) : (
                                                            <p className="text-[10px] italic text-slate-500 p-4 bg-slate-950/50 rounded-xl">No supplementary data attached.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Metadata */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none -mr-4 -mt-4">
                                <Activity size={80} />
                            </div>

                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-slate-800 pb-4">Issue Summary</h2>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Occurrences</p>
                                        <p className="text-2xl font-black text-rose-500 font-mono">{group.occurrence_count}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Affected Users</p>
                                        <p className="text-2xl font-black text-white font-mono">{uniqueUsers}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-slate-800">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="mt-1 text-slate-500 shrink-0" size={16} />
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-600">First Seen</p>
                                            <p className="text-xs text-slate-300 font-medium leading-relaxed">{format(new Date(group.first_seen), "MMM d, yyyy 'at' h:mm a")}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <RotateCcw className="mt-1 text-slate-500 shrink-0" size={16} />
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-600">Last Seen</p>
                                            <p className="text-xs text-white font-bold leading-relaxed">{format(new Date(group.last_seen), "MMM d, yyyy 'at' h:mm a")}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Globe className="mt-1 text-slate-500 shrink-0" size={16} />
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-600">Environment</p>
                                            <span className="inline-block mt-1 text-[10px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter">
                                                {group.environment_name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Frequency Trend Placeholder */}
                        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
                            <Activity size={32} className="mx-auto text-slate-700 opacity-50" />
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Trend Analysis</h3>
                            <p className="text-xs text-slate-600 italic">Frequency visualization module scheduled for next release.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
