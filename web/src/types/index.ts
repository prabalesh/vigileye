export interface User {
    id: number;
    email: string;
    name: string;
}

export interface Environment {
    id: number;
    project_id: number;
    name: string;
    api_key: string;
    settings: Record<string, any>;
    is_active: boolean;
    created_at: string;
}

export interface ErrorGroup {
    id: number;
    project_id: number;
    environment_id: number;
    environment_name?: string;
    fingerprint: string;
    message: string;
    stack?: string;
    url?: string;
    source: string;
    level: ErrorLevel;
    first_seen: string;
    last_seen: string;
    occurrence_count: number;
    status: 'unresolved' | 'resolved' | 'ignored';
    resolved_at?: string;
    resolved_by?: number;
    created_at: string;
}

export interface ErrorLog {
    id: number;
    project_id: number;
    environment_id: number;
    error_group_id: number;
    timestamp: string;
    source: string;
    level: ErrorLevel;
    message: string;
    stack?: string;
    url?: string;
    method?: string;
    user_agent?: string;
    user_id?: string;
    status_code?: number;
    extra_data?: Record<string, any>;
    resolved: boolean;
    created_at: string;
}

export interface Project {
    id: number;
    name: string;
    owner_id: number;
    created_at: string;
    environments?: Environment[];
}

export interface ProjectMember {
    user_id: number;
    email: string;
    name: string;
    role: 'admin' | 'member';
    created_at: string;
}

export type ErrorLevel = 'error' | 'warn' | 'info';
export type ErrorSource = 'frontend' | 'backend';
