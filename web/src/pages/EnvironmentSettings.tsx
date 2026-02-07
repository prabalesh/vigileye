import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEnvironment } from '../api/environments';
import { NotificationSettingsPanel } from '../components/notifications/NotificationSettingsPanel';
import { NotificationHistory } from '../components/notifications/NotificationHistory';
import { Layout } from '../components/Layout';
import type { Environment } from '../types';
import { ChevronRight, Loader2, Settings, History, Server, Shield } from 'lucide-react';

export const EnvironmentSettings: React.FC = () => {
    const { id, envId } = useParams<{ id: string; envId: string }>();
    const projectId = Number(id);
    const environmentId = Number(envId);

    const [environment, setEnvironment] = useState<Environment | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

    useEffect(() => {
        loadEnvironment();
    }, [projectId, environmentId]);

    const loadEnvironment = async () => {
        try {
            setLoading(true);
            const data = await getEnvironment(projectId, environmentId);
            setEnvironment(data);
        } catch (error) {
            console.error('Failed to load environment:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 size={48} className="animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    if (!environment) {
        return (
            <Layout>
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                    <p className="text-slate-500 font-black text-xl">Environment not found</p>
                    <Link to={`/projects/${projectId}`} className="text-blue-500 hover:underline mt-4 inline-block font-bold">
                        Back to Project
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Breadcrumbs & Header */}
                <div className="mb-10 space-y-4">
                    <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <ChevronRight size={12} />
                        <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">Project</Link>
                        <ChevronRight size={12} />
                        <span className="text-slate-300">{environment.name}</span>
                        <ChevronRight size={12} />
                        <span className="text-white">Settings</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-lg shadow-blue-600/5">
                                <Settings size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white">{environment.name} Settings</h1>
                                <p className="text-slate-500 font-medium text-sm mt-1 flex items-center gap-2">
                                    <Server size={14} className="text-slate-600" />
                                    Configure alerts and notification triggers for this environment.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2 rounded-2xl">
                            <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-2">
                                <Shield size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Tabs */}
                <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl w-fit mb-10">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-500 hover:text-white hover:bg-slate-900'
                            }`}
                    >
                        <Settings size={16} />
                        Config
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-500 hover:text-white hover:bg-slate-900'
                            }`}
                    >
                        <History size={16} />
                        History
                    </button>
                </div>

                {/* Content Section */}
                <div className="animate-in fade-in duration-500">
                    {activeTab === 'settings' ? (
                        <NotificationSettingsPanel
                            projectId={projectId}
                            environment={environment}
                            onUpdate={loadEnvironment}
                        />
                    ) : (
                        <NotificationHistory
                            projectId={projectId}
                            environmentId={environment.id}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
};
