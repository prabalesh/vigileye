import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getProject } from '../api/projects';
import { getEnvironments, createEnvironment } from '../api/environments';
import { getErrorGroups } from '../api/errorGroups';
import type { Project, Environment } from '../types';
import { Server, AlertCircle, Plus, Settings, Loader2, X, ChevronRight, Bell } from 'lucide-react';

export const ProjectOverview = () => {
    const { id } = useParams<{ id: string }>();
    const projectId = Number(id);

    const [project, setProject] = useState<Project | null>(null);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [errorCounts, setErrorCounts] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEnvName, setNewEnvName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [projRes, envRes] = await Promise.all([
                getProject(projectId),
                getEnvironments(projectId)
            ]);
            setProject(projRes);
            setEnvironments(envRes);

            // Fetch unresolved counts for each environment
            const counts: Record<number, number> = {};
            await Promise.all(envRes.map(async (env) => {
                const groups = await getErrorGroups(projectId, {
                    environmentId: env.id,
                    status: 'unresolved'
                });
                counts[env.id] = groups.length;
            }));
            setErrorCounts(counts);
        } catch (err) {
            console.error('Failed to fetch project data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateEnv = async (e: React.FormEvent) => {
        e.preventDefault();
        const nameRegex = /^[a-z0-9-]+$/;
        if (!nameRegex.test(newEnvName)) {
            alert('Environment name must be lowercase alphanumeric and hyphens only.');
            return;
        }

        try {
            setIsCreating(true);
            await createEnvironment(projectId, newEnvName);
            setNewEnvName('');
            setShowModal(false);
            await fetchData();
        } catch (err) {
            console.error('Failed to create environment:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const getBorderClass = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('prod')) return 'border-pink-500/50 from-pink-500/10 to-transparent';
        if (n.includes('staging')) return 'border-orange-500/50 from-orange-500/10 to-transparent';
        if (n.includes('dev')) return 'border-emerald-500/50 from-emerald-500/10 to-transparent';
        return 'border-indigo-500/50 from-indigo-500/10 to-transparent';
    };

    const totalUnresolved = Object.values(errorCounts).reduce((a, b) => a + b, 0);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="space-y-1">
                        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                            <ChevronRight size={14} />
                            <span className="text-slate-300">{project?.name || 'Project'}</span>
                        </nav>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            {project?.name}
                            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono uppercase tracking-wider">Project ID: {projectId}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                        >
                            <Plus size={20} />
                            <span>Add Environment</span>
                        </button>
                    </div>
                </div>

                {/* Environments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        environments.map((env) => (
                            <div
                                key={env.id}
                                className={`group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all overflow-hidden`}
                            >
                                {/* Visual border accent */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${getBorderClass(env.name)} opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity`} />
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${env.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                                            <h3 className="text-lg font-bold text-white">{env.name}</h3>
                                        </div>
                                        <Server size={20} className="text-slate-600" />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">Unresolved Groups</span>
                                            <span className={`text-lg font-mono font-bold ${errorCounts[env.id] > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                                                {errorCounts[env.id] || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <Link
                                            to={`/projects/${projectId}/error-groups?environment_id=${env.id}`}
                                            className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-sm font-bold rounded-xl transition-all"
                                        >
                                            <AlertCircle size={16} />
                                            <span>View Errors</span>
                                        </Link>
                                        <Link
                                            to={`/projects/${projectId}/environments/${env.id}/notifications`}
                                            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-blue-400 rounded-xl border border-transparent hover:border-blue-500/30 transition-all flex items-center justify-center"
                                            title="Setup Notifications"
                                        >
                                            <Bell size={18} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick Stats */}
                {!isLoading && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                                <AlertCircle size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Unresolved</p>
                                <p className="text-3xl font-black text-white font-mono">{totalUnresolved}</p>
                            </div>
                        </div>
                        <Link
                            to={`/projects/${projectId}/error-groups`}
                            className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2 group"
                        >
                            View All Error Groups
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Add Environment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">New Environment</h2>
                        <p className="text-slate-500 text-sm mb-8">Create a separate pipeline for your error logs.</p>

                        <form onSubmit={handleCreateEnv} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 ml-1">Environment Name</label>
                                <input
                                    type="text"
                                    value={newEnvName}
                                    onChange={(e) => setNewEnvName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-mono placeholder:font-sans"
                                    placeholder="e.g. production-east"
                                    autoFocus
                                    required
                                />
                                <p className="text-[10px] text-slate-500 ml-1 italic">Lowercase alphanumeric and hyphens only.</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-bold py-3.5 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newEnvName.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    {isCreating ? <Loader2 size={20} className="animate-spin" /> : <span>Create</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};
