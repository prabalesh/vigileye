import client from './client';
import type { Environment } from '../types';

export async function getEnvironments(projectId: number): Promise<Environment[]> {
    const response = await client.get<Environment[]>(`/api/projects/${projectId}/environments`);
    return response.data;
}

export async function createEnvironment(projectId: number, name: string): Promise<Environment> {
    const response = await client.post<Environment>(`/api/projects/${projectId}/environments`, { name });
    return response.data;
}

export async function updateEnvironment(projectId: number, envId: number, data: { name?: string, is_active?: boolean }): Promise<Environment> {
    const response = await client.patch<Environment>(`/api/projects/${projectId}/environments/${envId}`, data);
    return response.data;
}

export async function deleteEnvironment(projectId: number, envId: number): Promise<void> {
    await client.delete(`/api/projects/${projectId}/environments/${envId}`);
}

export async function regenerateApiKey(projectId: number, envId: number): Promise<{ api_key: string }> {
    const response = await client.post<{ api_key: string }>(`/api/projects/${projectId}/environments/${envId}/regenerate-key`);
    return response.data;
}
