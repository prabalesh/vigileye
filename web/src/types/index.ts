export interface User {
    id: number;
    email: string;
    name: string;
}

export interface Project {
    id: number;
    name: string;
    apiKey: string;
    ownerId: number;
    createdAt: string;
}

export type ErrorLevel = 'error' | 'warn' | 'info';
export type ErrorSource = 'frontend' | 'backend';

export interface ErrorLog {
    id: number;
    projectId: number;
    timestamp: string;
    source: ErrorSource;
    level: ErrorLevel;
    message: string;
    stack?: string;
    url?: string;
    method?: string;
    userAgent?: string;
    userId?: string;
    statusCode?: number;
    extraData?: any;
    resolved: boolean;
    createdAt: string;
}
