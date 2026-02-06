import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getProject } from '../api/projects';
import { getErrorDetail, resolveError } from '../api/errors';
import type { Project, ErrorLog } from '../types';
import { ErrorBadge } from '../components/ErrorBadge';
import { Clock, Globe, Code, User, Terminal, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const ErrorDetail = () => {
    const { id, errorId } = useParams<{ id: string; errorId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [errorLog, setErrorLog] = useState<ErrorLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (id && errorId) {
            fetchData();
        }
    }, [id, errorId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [projRes, errRes] = await Promise.all([
                getProject(Number(id)),
                getErrorDetail(Number(id), Number(errorId))
            ]);
            setProject(projRes);
            setErrorLog(errRes);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleResolve = async () => {
        if (!errorLog) return;
        try {
            setIsUpdating(true);
            await resolveError(Number(id), Number(errorId), !errorLog.resolved);
            setErrorLog({ ...errorLog, resolved: !errorLog.resolved });
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    if (!errorLog) {
        return (
            <Layout>
                <div className="text-center py-20 text-slate-500">
                    Error log not found.
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <nav className="flex items-center space-x-2 text-sm text-slate-500">
                            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                            <span>/</span>
                            <Link to={`/projects/${id}`} className="hover:text-white transition-colors">{project?.name}</Link>
                            <span>/</span>
                            <span className="text-slate-300">Error Details</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            Event #{errorLog.id}
                            <ErrorBadge level={errorLog.level} className="text-sm px-3 py-1" />
                        </h1>
                    </div>

                    <button
                        onClick={handleToggleResolve}
                        disabled={isUpdating}
                        className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all ${errorLog.resolved
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                            }`}
                    >
                        {isUpdating ? <Loader2 size={20} className="animate-spin" /> : (
                            errorLog.resolved ? <RotateCcw size={20} /> : <CheckCircle size={20} />
                        )}
                        <span>{errorLog.resolved ? 'Reopen Incident' : 'Mark Fixed'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                <Terminal size={120} />
                            </div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Message</h2>
                            <p className="text-xl font-medium text-white break-words leading-relaxed">
                                {errorLog.message}
                            </p>
                        </div>

                        {errorLog.stack ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-slate-400">
                                    <Code size={18} />
                                    <h2 className="text-sm font-bold uppercase tracking-wider">Stack Trace</h2>
                                </div>
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
                                    <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                                        {errorLog.stack}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-600">
                                No stack trace available for this event.
                            </div>
                        )}

                        {errorLog.extra_data && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-slate-400">
                                    <Terminal size={18} />
                                    <h2 className="text-sm font-bold uppercase tracking-wider">Extra Context</h2>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <pre className="text-xs font-mono text-blue-400 leading-relaxed">
                                        {JSON.stringify(errorLog.extra_data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Event Metadata</h2>

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Clock className="mt-1 text-slate-500" size={18} />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Occurred At</p>
                                        <p className="text-sm text-slate-300">{format(new Date(errorLog.timestamp), 'MMM d, yyyy HH:mm:ss')}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <Globe className="mt-1 text-slate-500" size={18} />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Source & Context</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">{errorLog.source}</span>
                                            {errorLog.method && <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">{errorLog.method}</span>}
                                            {errorLog.status_code && <span className={`text-xs font-mono px-2 py-0.5 rounded ${errorLog.status_code >= 400 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{errorLog.status_code}</span>}
                                        </div>
                                    </div>
                                </div>

                                {errorLog.url && (
                                    <div className="mt-2 text-xs truncate font-mono text-slate-500 border border-slate-800 bg-slate-950 p-2 rounded-lg">
                                        {errorLog.url}
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <User className="mt-1 text-slate-500" size={18} />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Affected User</p>
                                        <p className="text-sm text-slate-300">{errorLog.user_id || 'Anonymous User'}</p>
                                    </div>
                                </div>
                            </div>

                            {errorLog.user_agent && (
                                <div className="pt-4 border-t border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">User Agent</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-mono italic">
                                        {errorLog.user_agent}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
