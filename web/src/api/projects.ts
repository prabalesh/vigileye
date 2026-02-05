import client from './client';
import type { Project } from '../types';

export const getProjects = () => client.get<Project[]>('/api/projects');
export const createProject = (name: string) => client.post<Project>('/api/projects', { name });
export const getProject = (id: string) => client.get<Project>(`/api/projects/${id}`);
export const addProjectMember = (id: string, email: string, role: string) =>
    client.post(`/api/projects/${id}/members`, { user_email: email, role });
export const removeProjectMember = (projectId: string, userId: string) =>
    client.delete(`/api/projects/${projectId}/members/${userId}`);
