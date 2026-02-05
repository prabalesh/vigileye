import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getProject } from '../api/projects';
import { getErrors } from '../api/errors';
import type { Project, ErrorLog } from '../types';
import { ErrorBadge } from '../components/ErrorBadge';
import { ChevronRight, Filter, Key, Copy, Check, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ProjectErrors = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState<string>('');
    const [sourceFilter, setSourceFilter] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, levelFilter, sourceFilter]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [projRes, errRes] = await Promise.all([
                getProject(id!),
                getErrors(id!, { level: levelFilter, source: sourceFilter })
            ]);
            setProject(projRes.data);
            setErrors(errRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const copyApiKey = () => {
        if (project) {
            navigator.clipboard.writeText(project.apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{project?.name || 'Project'}</h1>
                        <p className="text-slate-500 mt-1">Viewing all error logs and reports</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                        <div className="bg-slate-800 p-2 rounded-lg text-slate-400">
                            <Key size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Project API Key</p>
                            <p className="text-sm font-mono text-slate-300">
                                {project ? `••••-••••-${project.apiKey.slice(-4)}` : 'Loading...'}
                            </p>
                        </div>
                        <button
                            onClick={copyApiKey}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2 text-slate-400">
                        <Filter size={18} />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>

                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                        <option value="">All Levels</option>
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                        <option value="">All Sources</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                    </select>

                    <span className="text-slate-500 text-sm ml-auto">
                        Showing {errors.length} events
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase font-bold text-slate-500 bg-slate-950/50 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Loader2 size={32} className="animate-spin mx-auto text-blue-600" />
                                    </td>
                                </tr>
                            ) : errors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                                        No error logs found matching the criteria.
                                    </td>
                                </tr>
                            ) : (
                                errors.map((error) => (
                                    <tr
                                        key={error.id}
                                        className={`hover:bg-slate-800/50 transition-colors cursor-pointer group ${error.resolved ? 'opacity-50' : ''}`}
                                        onClick={() => window.location.href = `/projects/${id}/errors/${error.id}`}
                                    >
                                        <td className="px-6 py-4">
                                            {error.resolved ? (
                                                <span className="w-2 h-2 rounded-full bg-slate-700 inline-block"></span>
                                            ) : (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse inline-block shadow-[0_0_8px_rgba(37,99,235,0.8)]"></span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ErrorBadge level={error.level} />
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="text-white font-medium truncate">{error.message}</p>
                                            {error.url && <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{error.url}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-slate-400 uppercase">{error.source}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(error.timestamp))} ago
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight size={18} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};
