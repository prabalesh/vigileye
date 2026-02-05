import client from './client';
import type { ErrorLog } from '../types';

export const getErrors = (projectId: string, params: any) =>
    client.get<ErrorLog[]>(`/api/projects/${projectId}/errors`, { params });

export const getErrorDetail = (projectId: string, errorId: string) =>
    client.get<ErrorLog>(`/api/projects/${projectId}/errors/${errorId}`);

export const resolveError = (projectId: string, errorId: string, resolved: boolean) =>
    client.patch(`/api/projects/${projectId}/errors/${errorId}`, { resolved });
