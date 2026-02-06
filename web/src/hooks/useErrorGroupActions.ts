import { useQueryClient } from '@tanstack/react-query';
import { resolveErrorGroup, ignoreErrorGroup, reopenErrorGroup } from '../api/errorGroups';
import { toast } from 'react-hot-toast';

export function useErrorGroupActions(projectId: number) {
    const queryClient = useQueryClient();

    const resolve = async (groupId: number) => {
        try {
            await resolveErrorGroup(projectId, groupId);
            queryClient.invalidateQueries({ queryKey: ['error-groups', projectId] });
            toast.success('Error group resolved');
        } catch (err) {
            toast.error('Failed to resolve error group');
        }
    };

    const ignore = async (groupId: number) => {
        try {
            await ignoreErrorGroup(projectId, groupId);
            queryClient.invalidateQueries({ queryKey: ['error-groups', projectId] });
            toast.success('Error group ignored');
        } catch (err) {
            toast.error('Failed to ignore error group');
        }
    };

    const reopen = async (groupId: number) => {
        try {
            await reopenErrorGroup(projectId, groupId);
            queryClient.invalidateQueries({ queryKey: ['error-groups', projectId] });
            toast.success('Error group reopened');
        } catch (err) {
            toast.error('Failed to reopen error group');
        }
    };

    return { resolve, ignore, reopen };
}
