import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProjectMembers,
    inviteMemberAPI,
    updateMemberRoleAPI,
    removeMemberAPI
} from '../api/team';

export function useProjectMembers(projectId: number) {
    const queryClient = useQueryClient();

    const { data: members, isLoading, error } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => getProjectMembers(projectId),
    });

    const inviteMutation = useMutation({
        mutationFn: (data: { email: string; role: string }) =>
            inviteMemberAPI(projectId, data.email, data.role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: (data: { userId: number; role: string }) =>
            updateMemberRoleAPI(projectId, data.userId, data.role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: (userId: number) => removeMemberAPI(projectId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
        },
    });

    return {
        members,
        isLoading,
        error,
        inviteMember: inviteMutation.mutateAsync,
        updateRole: updateRoleMutation.mutateAsync,
        removeMember: removeMutation.mutateAsync,
        isInviting: inviteMutation.isPending,
        isUpdating: updateRoleMutation.isPending,
        isRemoving: removeMutation.isPending,
    };
}
