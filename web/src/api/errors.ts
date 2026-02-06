import client from './client';
import type { ErrorLog } from '../types';

export async function getErrors(
    projectId: number,
    filters?: {
        level?: string,
        source?: string,
        environmentId?: number,
        errorGroupId?: number,
        limit?: number,
        offset?: number
    }
): Promise<ErrorLog[]> {
    const response = await client.get<ErrorLog[]>(`/api/projects/${projectId}/errors`, {
        params: {
            level: filters?.level,
            source: filters?.source,
            environment_id: filters?.environmentId,
            error_group_id: filters?.errorGroupId,
            limit: filters?.limit,
            offset: filters?.offset
        }
    });
    return response.data;
}

export async function getErrorDetail(projectId: number, errorId: number): Promise<ErrorLog> {
    const response = await client.get<ErrorLog>(`/api/projects/${projectId}/errors/${errorId}`);
    return response.data;
}

export async function resolveError(projectId: number, errorId: number, resolved: boolean): Promise<void> {
    await client.patch(`/api/projects/${projectId}/errors/${errorId}`, { resolved });
}
