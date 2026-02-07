import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getProjectMembers,
    inviteMember as inviteMemberAPI,
    updateMemberRole as updateMemberRoleAPI,
    removeMember as removeMemberAPI
} from '../api/team';

export function useProjectMembers(projectId: number) {
    const queryClient = useQueryClient();

    const { data: members, isLoading, error } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => getProjectMembers(projectId),
    });

    const inviteMember = async (email: string, role: string) => {
        await inviteMemberAPI(projectId, email, role);
        queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    };

    const updateRole = async (userId: number, role: string) => {
        await updateMemberRoleAPI(projectId, userId, role);
        queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    };

    const removeMember = async (userId: number) => {
        await removeMemberAPI(projectId, userId);
        queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    };

    return {
        members,
        isLoading,
        error,
        inviteMember,
        updateRole,
        removeMember
    };
}
