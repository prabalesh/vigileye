import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
    return (
        <Link
            to={`/projects/${project.id}`}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-500 transition-colors">
                    {project.name}
                </h3>
                <ChevronRight size={20} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
            </div>

            <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-400">
                    <Clock size={16} className="mr-2" />
                    <span>Created {formatDistanceToNow(new Date(project.createdAt))} ago</span>
                </div>
                <div className="flex items-center text-sm text-slate-400">
                    <AlertCircle size={16} className="mr-2" />
                    <span>API Key: {project.apiKey.slice(0, 8)}...</span>
                </div>
            </div>
        </Link>
    );
};
