import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getProject } from '../api/projects';
import { getEnvironments } from '../api/environments';
import { getErrorGroups } from '../api/errorGroups';
import { ErrorBadge } from '../components/ErrorBadge';
import {
    Filter,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    CheckCircle,
    Ban,
    Eye,
    Loader2,
    RotateCcw
} from 'lucide-react';
import { safeFormatDistanceToNow } from '../utils/date';
import { useQuery } from '@tanstack/react-query';
import { useEnvironmentFilter } from '../hooks/useEnvironmentFilter';
import { useErrorGroupActions } from '../hooks/useErrorGroupActions';

export const ErrorGroups = () => {
    const { id } = useParams<{ id: string }>();
    const projectId = Number(id);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const { selectedEnvironmentId, setEnvironmentId } = useEnvironmentFilter();
    const { resolve, ignore, reopen } = useErrorGroupActions(projectId);

    // Filters from URL
    const statusParam = searchParams.get('status') as any || 'unresolved';
    const levelFilter = searchParams.get('level') || '';
    const sourceFilter = searchParams.get('source') || '';
    const pageParam = Number(searchParams.get('page')) || 1;
    const limit = 50;

    // Queries
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProject(projectId),
        enabled: !!projectId,
    });

    const { data: environments = [] } = useQuery({
        queryKey: ['environments', projectId],
        queryFn: () => getEnvironments(projectId),
        enabled: !!projectId,
    });

    const { data: errorGroups = [], isLoading } = useQuery({
        queryKey: ['error-groups', projectId, selectedEnvironmentId, statusParam, pageParam],
        queryFn: async () => {
            const groups = await getErrorGroups(projectId, {
                environmentId: selectedEnvironmentId || undefined,
                status: statusParam,
                limit,
                offset: (pageParam - 1) * limit
            });

            // Frontend filtering for Level and Source since backend doesn't support them on group list yet
            let filtered = groups;
            if (levelFilter) filtered = filtered.filter(g => g.level === levelFilter);
            if (sourceFilter) filtered = filtered.filter(g => g.source === sourceFilter);
            return filtered;
        },
        enabled: !!projectId,
    });

    const updateFilters = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '') {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        newParams.set('page', '1'); // Reset to page 1 on filter change
        setSearchParams(newParams);
    };

    const handleAction = async (e: React.MouseEvent, groupId: number, action: 'resolve' | 'ignore' | 'reopen') => {
        e.stopPropagation();
        if (action === 'resolve') await resolve(groupId);
        else if (action === 'ignore') await ignore(groupId);
        else if (action === 'reopen') await reopen(groupId);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved': return <CheckCircle size={18} className="text-emerald-500" />;
            case 'ignored': return <Ban size={18} className="text-slate-500" />;
            default: return <AlertCircle size={18} className="text-rose-500 animate-pulse-slow" />;
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
                        <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <ChevronRight size={14} />
                        <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">{project?.name}</Link>
                        <ChevronRight size={14} />
                        <span className="text-slate-300">Error Groups</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                Error Groups
                                <span className="text-sm font-mono bg-slate-800 text-slate-400 px-3 py-1 rounded-lg">
                                    {statusParam.toUpperCase()}
                                </span>
                            </h1>
                            <p className="text-slate-500 mt-2">Deduplicated incidents and recurring errors.</p>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                            <button
                                onClick={() => updateFilters({ status: 'unresolved' })}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusParam === 'unresolved' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Unresolved
                            </button>
                            <button
                                onClick={() => updateFilters({ status: 'resolved' })}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusParam === 'resolved' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Resolved
                            </button>
                            <button
                                onClick={() => updateFilters({ status: 'ignored' })}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusParam === 'ignored' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Ignored
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Filter size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
                    </div>

                    <select
                        value={selectedEnvironmentId || ''}
                        onChange={(e) => setEnvironmentId(e.target.value ? Number(e.target.value) : null)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    >
                        <option value="">All Environments</option>
                        {environments.map(env => (
                            <option key={env.id} value={env.id}>{env.name}</option>
                        ))}
                    </select>

                    <select
                        value={levelFilter}
                        onChange={(e) => updateFilters({ level: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    >
                        <option value="">All Levels</option>
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={(e) => updateFilters({ source: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    >
                        <option value="">All Sources</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                    </select>

                    <div className="md:ml-auto text-xs text-slate-500 font-mono">
                        Showing {errorGroups.length} groups
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[10px] uppercase font-black text-slate-600 bg-slate-950/50 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5 w-16">Status</th>
                                <th className="px-6 py-5">Error Message</th>
                                <th className="px-6 py-5 text-center">Hits</th>
                                <th className="px-6 py-5">Context</th>
                                <th className="px-6 py-5">Last Seen</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Loader2 size={40} className="animate-spin mx-auto text-blue-600" />
                                    </td>
                                </tr>
                            ) : errorGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                                                <CheckCircle size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">All Clear!</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">No error groups found for the selected filters. Your environments are breathing healthy.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                errorGroups.map((group) => (
                                    <tr
                                        key={group.id}
                                        className="group hover:bg-slate-800/30 transition-all cursor-pointer"
                                        onClick={() => navigate(`/projects/${projectId}/error-groups/${group.id}`)}
                                    >
                                        <td className="px-6 py-5 align-top">
                                            <div className="mt-1">{getStatusIcon(group.status)}</div>
                                        </td>
                                        <td className="px-6 py-5 align-top max-w-xl">
                                            <p className="text-white font-bold leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                                                {group.message}
                                            </p>
                                            {group.url && (
                                                <p className="text-[10px] text-slate-500 font-mono mt-2 truncate max-w-md">{group.url}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 align-top text-center">
                                            <span className="inline-flex flex-col items-center justify-center min-w-[3rem] py-1 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-black text-rose-500 font-mono">
                                                <span className="text-[9px] text-slate-500 uppercase font-black -mb-1">hits</span>
                                                {group.occurrence_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-tighter">
                                                        {group.environment_name || 'unknown'}
                                                    </span>
                                                </div>
                                                <ErrorBadge level={group.level as any} className="text-[10px] w-fit" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-white font-medium">{safeFormatDistanceToNow(group.last_seen)} ago</span>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold mt-1">First: {safeFormatDistanceToNow(group.first_seen)} ago</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {group.status === 'unresolved' ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleAction(e, group.id, 'resolve')}
                                                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20"
                                                            title="Resolve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleAction(e, group.id, 'ignore')}
                                                            className="p-2 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-all border border-slate-700"
                                                            title="Ignore"
                                                        >
                                                            <Ban size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={(e) => handleAction(e, group.id, 'reopen')}
                                                        className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all border border-blue-500/20"
                                                        title="Reopen"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/projects/${projectId}/error-groups/${group.id}`}
                                                    className="p-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-all border border-slate-700"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="mt-8 flex items-center justify-between p-6 bg-slate-900/30 rounded-3xl border border-slate-800/50">
                    <span className="text-sm text-slate-500 font-medium">
                        Showing Page <span className="text-white font-bold">{pageParam}</span>
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            disabled={pageParam === 1}
                            onClick={() => updateFilters({ page: String(pageParam - 1) })}
                            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={errorGroups.length < limit}
                            onClick={() => updateFilters({ page: String(pageParam + 1) })}
                            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
