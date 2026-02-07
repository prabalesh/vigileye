import React from 'react';
import { useForm } from 'react-hook-form';
import { X, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectMembers } from '../hooks/useProjectMembers';

interface InviteMemberModalProps {
    projectId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface InviteFormData {
    email: string;
    role: 'admin' | 'member';
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    projectId,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { inviteMember, isInviting } = useProjectMembers(projectId);
    const { register, handleSubmit, formState: { errors }, reset } = useForm<InviteFormData>({
        defaultValues: {
            role: 'member'
        }
    });

    if (!isOpen) return null;

    const onSubmit = async (data: InviteFormData) => {
        try {
            await inviteMember(data);
            toast.success('Member invited successfully');
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.error('User not found. They need to register first.');
            } else if (error.response?.status === 409) {
                toast.error('User is already a member.');
            } else {
                toast.error('Failed to invite member');
            }
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
                    <UserPlus size={32} />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">Invite Member</h2>
                <p className="text-slate-500 text-sm mb-8">Add a new collaborator to your project.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Email Address</label>
                        <input
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black"
                            placeholder="colleague@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-2 font-bold">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Project Role</label>
                        <select
                            {...register('role', { required: true })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black appearance-none"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                        <p className="text-slate-500 text-xs mt-2">Admins can manage members and environment settings.</p>
                    </div>

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
                            disabled={isInviting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {isInviting ? <Loader2 size={20} className="animate-spin" /> : <span>Invite</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
