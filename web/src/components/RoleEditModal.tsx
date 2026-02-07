import React, { useEffect, useState } from 'react';
import { X, Edit, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectMembers } from '../hooks/useProjectMembers';
import type { ProjectMember } from '../types';
import { checkLastAdmin } from '../api/team';

interface RoleEditModalProps {
    projectId: number;
    member: ProjectMember | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RoleEditModal: React.FC<RoleEditModalProps> = ({
    projectId,
    member,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { updateRole, isUpdating } = useProjectMembers(projectId);
    const [role, setRole] = useState<'admin' | 'member'>('member');
    const [isLastAdmin, setIsLastAdmin] = useState(false);
    const [checkingLastAdmin, setCheckingLastAdmin] = useState(false);

    useEffect(() => {
        if (member) {
            setRole(member.role);
            if (member.role === 'admin') {
                checkLastAdminStatus();
            } else {
                setIsLastAdmin(false);
            }
        }
    }, [member, isOpen]);

    const checkLastAdminStatus = async () => {
        if (!member) return;
        setCheckingLastAdmin(true);
        try {
            const res = await checkLastAdmin(projectId, member.user_id);
            setIsLastAdmin(res.is_last_admin);
        } catch (err) {
            console.error('Failed to check last admin status', err);
        } finally {
            setCheckingLastAdmin(false);
        }
    };

    if (!isOpen || !member) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLastAdmin && role === 'member') {
            toast.error('This is the last admin. At least one admin is required.');
            return;
        }

        try {
            await updateRole({ userId: member.user_id, role });
            toast.success('Role updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Failed to update role');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8">
                    <Edit size={32} />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">Edit Role</h2>
                <p className="text-slate-500 text-sm mb-8">Change permissions for <span className="text-white font-bold">{member.name}</span>.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Select Role</label>

                        <div
                            onClick={() => setRole('admin')}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${role === 'admin'
                                ? 'bg-blue-600/10 border-blue-600 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                        >
                            <div className="flex flex-col">
                                <span className="font-black">Admin</span>
                                <span className="text-xs opacity-60">Full access to project settings and team.</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === 'admin' ? 'border-blue-600' : 'border-slate-800'}`}>
                                {role === 'admin' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                            </div>
                        </div>

                        <div
                            onClick={() => !isLastAdmin && setRole('member')}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isLastAdmin ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600' :
                                role === 'member'
                                    ? 'bg-blue-600/10 border-blue-600 text-white cursor-pointer'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                                }`}
                        >
                            <div className="flex flex-col">
                                <span className="font-black">Member</span>
                                <span className="text-xs opacity-60">Can view error groups and logs.</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === 'member' ? 'border-blue-600' : 'border-slate-800'}`}>
                                {role === 'member' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                            </div>
                        </div>
                    </div>

                    {isLastAdmin && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-4 items-start">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-red-400 text-xs font-bold leading-relaxed">
                                This user is the last admin of this project. You must promote another member to admin before changing this user's role.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-colors active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating || (isLastAdmin && role === 'member') || checkingLastAdmin}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <span>Update</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
