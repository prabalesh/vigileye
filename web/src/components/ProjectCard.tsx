import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { ChevronRight, Clock, Server, Layers } from 'lucide-react';
import { safeFormatDistanceToNow } from '../utils/date';
import { useQuery } from '@tanstack/react-query';
import { getErrorGroups } from '../api/errorGroups';

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
    const { data: unresolvedGroups } = useQuery({
        queryKey: ['error-groups', project.id, 'unresolved'],
        queryFn: () => getErrorGroups(project.id, { status: 'unresolved' }),
    });

    const envCount = project.environments?.length || 0;
    const unresolvedCount = unresolvedGroups?.length || 0;

    return (
        <Link
            to={`/projects/${project.id}`}
            className="group block bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all duration-300 relative overflow-hidden"
        >
            {/* Hover Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                        {project.name}
                    </h3>
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <Clock size={12} className="mr-1.5" />
                        {safeFormatDistanceToNow(project.created_at)} ago
                    </div>
                </div>
                <div className="p-2 bg-slate-800 rounded-xl text-slate-500 group-hover:text-blue-400 transition-colors">
                    <ChevronRight size={20} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Server size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Environments</span>
                    </div>
                    <p className="text-lg font-black text-white font-mono">{envCount}</p>
                </div>

                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 group-hover:border-rose-500/20 transition-colors">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Layers size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Unresolved</span>
                    </div>
                    <p className={`text-lg font-black font-mono ${unresolvedCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {unresolvedCount}
                    </p>
                </div>
            </div>
        </Link>
    );
};
