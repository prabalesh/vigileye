import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ProjectCard } from '../components/ProjectCard';
import { getProjects, createProject } from '../api/projects';
import type { Project } from '../types';
import { Plus, X, Loader2 } from 'lucide-react';

export const Dashboard = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim()) return;

        try {
            setIsCreating(true);
            await createProject(projectName);
            setProjectName('');
            setShowModal(false);
            fetchProjects();
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Your Projects</h1>
                    <p className="text-slate-500 mt-1">Manage your monitoring targets</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-20 text-center">
                    <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plus size={32} className="text-slate-600" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No projects yet</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Get started by creating your first project to monitor error logs.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-500 hover:text-blue-400 font-medium"
                    >
                        Create your first project →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    placeholder="e.g. My Website API"
                                    autoFocus
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !projectName.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
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
