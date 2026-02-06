import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getProject } from '../api/projects';
import { getEnvironments, regenerateApiKey, createEnvironment, deleteEnvironment } from '../api/environments';
import {
    Plus,
    Key,
    RefreshCw,
    Trash2,
    Loader2,
    ChevronRight,
    Copy,
    Check,
    AlertTriangle,
    Server,
    X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const EnvironmentsTable = () => {
    const { id } = useParams<{ id: string }>();
    const projectId = Number(id);
    const queryClient = useQueryClient();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newEnvName, setNewEnvName] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Queries
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProject(projectId),
        enabled: !!projectId,
    });

    const { data: environments = [], isLoading } = useQuery({
        queryKey: ['environments', projectId],
        queryFn: () => getEnvironments(projectId),
        enabled: !!projectId,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (name: string) => createEnvironment(projectId, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['environments', projectId] });
            toast.success('Environment created');
            setIsCreateModalOpen(false);
            setNewEnvName('');
        },
        onError: () => toast.error('Failed to create environment')
    });

    const deleteMutation = useMutation({
        mutationFn: (envId: number) => deleteEnvironment(projectId, envId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['environments', projectId] });
            toast.success('Environment deleted');
        },
        onError: () => toast.error('Failed to delete environment')
    });

    const regenerateMutation = useMutation({
        mutationFn: (envId: number) => regenerateApiKey(projectId, envId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['environments', projectId] });
            toast.success('API Key regenerated');
        },
        onError: () => toast.error('Failed to regenerate API Key')
    });

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDelete = (envId: number, envName: string) => {
        if (window.confirm(`Are you sure you want to delete the "${envName}" environment? This action cannot be undone.`)) {
            deleteMutation.mutate(envId);
        }
    };

    const handleRegenerate = (envId: number, envName: string) => {
        if (window.confirm(`Regenerating the API key for "${envName}" will immediately invalidate the old one. Continue?`)) {
            regenerateMutation.mutate(envId);
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-10">
                    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
                        <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <ChevronRight size={14} />
                        <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">{project?.name}</Link>
                        <ChevronRight size={14} />
                        <span className="text-slate-300">Environments</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                Environments
                            </h1>
                            <p className="text-slate-500 mt-2">Manage API keys and deployment targets for this project.</p>
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <Plus size={20} />
                            <span>New Environment</span>
                        </button>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 mb-8 flex gap-4 items-start">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                        <Key size={20} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">Authentication Guide</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Use these API keys in your SDK configuration to route errors to the correct environment.
                            Never share your production keys in publicly accessible frontend code.
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-[10px] uppercase font-black text-slate-600 bg-slate-950/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-8 py-6">Environment</th>
                                    <th className="px-8 py-6">API Key</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 font-medium">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <Loader2 size={40} className="animate-spin mx-auto text-blue-600" />
                                        </td>
                                    </tr>
                                ) : environments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                                                    <Server size={32} />
                                                </div>
                                                <h3 className="text-xl font-bold text-white">No environments yet</h3>
                                                <p className="text-sm text-slate-500">Add your first environment to start monitoring errors.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    environments.map((env) => (
                                        <tr key={env.id} className="group hover:bg-slate-800/20 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-lg font-black text-white">{env.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3 group/key">
                                                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 shadow-inner">
                                                        <code className="text-xs font-mono text-slate-400 tracking-wider">
                                                            {env.api_key.slice(0, 12)}••••••••••••••••
                                                        </code>
                                                        <button
                                                            onClick={() => handleCopy(env.api_key)}
                                                            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white"
                                                            title="Copy API Key"
                                                        >
                                                            {copiedKey === env.api_key ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleRegenerate(env.id, env.name)}
                                                        disabled={regenerateMutation.isPending}
                                                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
                                                        title="Regenerate Key"
                                                    >
                                                        {regenerateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                                        <span>Rotate key</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(env.id, env.name)}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 active:scale-95"
                                                        title="Delete Environment"
                                                    >
                                                        {deleteMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Dangerous Zone */}
                {environments.length > 0 && (
                    <div className="mt-12 p-8 border border-rose-500/10 bg-rose-500/5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Security Notice</h3>
                                <p className="text-slate-500 text-sm max-w-lg mt-1">
                                    Rotating API keys will cause any systems using the old key to fail immediately.
                                    Always ensure you have updated your secrets before confirming.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-md p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8">
                            <Plus size={32} />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">New Environment</h2>
                        <p className="text-slate-500 text-sm mb-8">Define a new deployment target like 'Staging' or 'Prod'.</p>

                        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newEnvName); }} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Environment Name</label>
                                <input
                                    type="text"
                                    value={newEnvName}
                                    onChange={(e) => setNewEnvName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black"
                                    placeholder="e.g. Production"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-colors active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || !newEnvName.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <span>Create</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};
