import client from './client';
import type { ProjectMember } from '../types';

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    const response = await client.get(`/api/projects/${projectId}/members`);
    return response.data;
}

export async function inviteMember(projectId: number, email: string, role: string): Promise<ProjectMember> {
    const response = await client.post(`/api/projects/${projectId}/members`, { email, role });
    return response.data;
}

export async function updateMemberRole(projectId: number, userId: number, role: string): Promise<ProjectMember> {
    const response = await client.patch(`/api/projects/${projectId}/members/${userId}`, { role });
    return response.data;
}

export async function removeMember(projectId: number, userId: number): Promise<void> {
    await client.delete(`/api/projects/${projectId}/members/${userId}`);
}

export async function checkLastAdmin(projectId: number, userId: number): Promise<{ is_last_admin: boolean }> {
    const response = await client.get(`/api/projects/${projectId}/members/check-last-admin/${userId}`);
    return response.data;
}
