import client from './client';
import type { ErrorGroup, ErrorLog } from '../types';

export async function getErrorGroups(
    projectId: number,
    filters?: {
        environmentId?: number,
        status?: 'unresolved' | 'resolved' | 'ignored',
        limit?: number,
        offset?: number
    }
): Promise<ErrorGroup[]> {
    const response = await client.get<ErrorGroup[]>(`/api/projects/${projectId}/error-groups`, {
        params: {
            environment_id: filters?.environmentId,
            status: filters?.status,
            limit: filters?.limit,
            offset: filters?.offset
        }
    });
    return response.data;
}

export async function getErrorGroup(projectId: number, groupId: number): Promise<ErrorGroup> {
    const response = await client.get<ErrorGroup>(`/api/projects/${projectId}/error-groups/${groupId}`);
    return response.data;
}

export async function getGroupOccurrences(
    projectId: number,
    groupId: number,
    limit?: number,
    offset?: number
): Promise<ErrorLog[]> {
    const response = await client.get<ErrorLog[]>(`/api/projects/${projectId}/error-groups/${groupId}/occurrences`, {
        params: { limit, offset }
    });
    return response.data;
}

export async function resolveErrorGroup(projectId: number, groupId: number): Promise<ErrorGroup> {
    const response = await client.patch<ErrorGroup>(`/api/projects/${projectId}/error-groups/${groupId}/resolve`);
    return response.data;
}

export async function ignoreErrorGroup(projectId: number, groupId: number): Promise<ErrorGroup> {
    const response = await client.patch<ErrorGroup>(`/api/projects/${projectId}/error-groups/${groupId}/ignore`);
    return response.data;
}

export async function reopenErrorGroup(projectId: number, groupId: number): Promise<ErrorGroup> {
    const response = await client.patch<ErrorGroup>(`/api/projects/${projectId}/error-groups/${groupId}/reopen`);
    return response.data;
}
