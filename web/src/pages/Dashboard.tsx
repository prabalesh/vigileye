import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ProjectCard } from '../components/ProjectCard';
import { getProjects, createProject } from '../api/projects';
import { Plus, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const Dashboard = () => {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [projectName, setProjectName] = useState('');

    // Query
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    // Mutation
    const createMutation = useMutation({
        mutationFn: (name: string) => createProject(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Project created');
            setShowModal(false);
            setProjectName('');
        },
        onError: () => toast.error('Failed to create project')
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim()) return;
        createMutation.mutate(projectName);
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Your Projects</h1>
                    <p className="text-slate-500 mt-1">Manage your monitoring targets</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    <span>New Project</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-20 text-center shadow-2xl">
                    <div className="bg-slate-800 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-600">
                        <Plus size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">No projects yet</h2>
                    <p className="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
                        Get started by creating your first project to monitor error logs and performance metrics across environments.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-500 hover:text-blue-400 font-black flex items-center gap-2 mx-auto active:scale-95 transition-all"
                    >
                        Create your first project <ChevronRight size={18} />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8">
                            <Plus size={32} />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">Create Project</h2>
                        <p className="text-slate-500 text-sm mb-8">Set up a new monitoring workspace.</p>

                        <form onSubmit={handleCreate} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Project Name</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black"
                                    placeholder="e.g. My Global API"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-colors active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || !projectName.trim()}
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

// Add missing import for ChevronRight in the empty state
import { ChevronRight } from 'lucide-react';
