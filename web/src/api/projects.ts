import client from './client';
import type { Project } from '../types';

export async function getProjects(): Promise<Project[]> {
    const response = await client.get<Project[]>('/api/projects');
    return response.data;
}

export async function createProject(name: string): Promise<Project> {
    const response = await client.post<Project>('/api/projects', { name });
    return response.data;
}

export async function getProject(id: number): Promise<Project> {
    const response = await client.get<Project>(`/api/projects/${id}`);
    return response.data;
}

export async function addProjectMember(id: number, email: string, role: string): Promise<void> {
    await client.post(`/api/projects/${id}/members`, { user_email: email, role });
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
    await client.delete(`/api/projects/${projectId}/members/${userId}`);
}
