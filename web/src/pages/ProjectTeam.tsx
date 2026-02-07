import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { getProject } from '../api/projects';
import type { Project, ProjectMember } from '../types';
import {
    Users,
    UserPlus,
    Crown,
    Edit,
    Trash2,
    ChevronRight,
    Loader2,
    Calendar,
    Mail,
    Shield
} from 'lucide-react';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { RoleEditModal } from '../components/RoleEditModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';

export const ProjectTeam = () => {
    const { id } = useParams<{ id: string }>();
    const projectId = Number(id);

    const [project, setProject] = useState<Project | null>(null);
    const { user } = useAuthStore();
    const { members = [], isLoading, removeMember } = useProjectMembers(projectId);

    const currentUserMember = members.find(m => m.user_id === user?.id);
    const isAdmin = currentUserMember?.role === 'admin';

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<ProjectMember | null>(null);

    useEffect(() => {
        if (projectId) {
            getProject(projectId).then(setProject).catch(console.error);
        }
    }, [projectId]);

    const handleRemoveMember = async (member: ProjectMember) => {
        if (member.role === 'admin') {
            const adminCount = members.filter(m => m.role === 'admin').length;
            if (adminCount <= 1) {
                toast.error('Cannot remove the last admin');
                return;
            }
        }

        if (confirm(`Remove ${member.name} from project?`)) {
            try {
                await removeMember(member.user_id);
                toast.success('Member removed');
            } catch (err) {
                toast.error('Failed to remove member');
            }
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="space-y-1">
                        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                            <ChevronRight size={14} />
                            <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">{project?.name || 'Project'}</Link>
                            <ChevronRight size={14} />
                            <span className="text-slate-300">Team</span>
                        </nav>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <Users className="text-blue-500" size={32} />
                            Team Management
                        </h1>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
                        >
                            <UserPlus size={20} />
                            <span>Invite Member</span>
                        </button>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-blue-600" />
                    </div>
                ) : members.length <= 1 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-20 text-center shadow-2xl">
                        <div className="bg-slate-800 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-600">
                            <Users size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">Solo mode</h2>
                        <p className="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
                            You are the only member. Invite team members to collaborate and manage this project together.
                        </p>
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="text-blue-500 hover:text-blue-400 font-black flex items-center gap-2 mx-auto active:scale-95 transition-all"
                        >
                            Invite your first teammate <ChevronRight size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Member</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Joined Date</th>
                                        {isAdmin && <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.user_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-lg border border-slate-700">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold">{member.name}</div>
                                                        <div className="text-slate-500 text-sm flex items-center gap-1">
                                                            <Mail size={12} />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {member.role === 'admin' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black border border-blue-500/20">
                                                        <Crown size={12} />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-black border border-slate-700">
                                                        <Shield size={12} />
                                                        Member
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-slate-400 text-sm flex items-center gap-1.5 font-medium">
                                                    <Calendar size={14} className="text-slate-600" />
                                                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setSelectedMemberForEdit(member)}
                                                            className="p-2 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-400 rounded-xl transition-all border border-slate-700 hover:border-blue-500/30"
                                                            title="Edit Role"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveMember(member)}
                                                            className="p-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-400 rounded-xl transition-all border border-slate-700 hover:border-red-500/30 disabled:opacity-50"
                                                            title="Remove Member"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <InviteMemberModal
                projectId={projectId}
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={() => { }}
            />

            <RoleEditModal
                projectId={projectId}
                member={selectedMemberForEdit}
                isOpen={!!selectedMemberForEdit}
                onClose={() => setSelectedMemberForEdit(null)}
                onSuccess={() => { }}
            />
        </Layout>
    );
};
