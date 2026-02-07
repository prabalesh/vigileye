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
    request_body?: string;
    request_headers?: Record<string, string>;
    response_body?: string;
    response_time_ms?: number;
    resolved: boolean;
    created_at: string;
}

export interface ThresholdTrigger {
    enabled: boolean;
    count: number;
    window_minutes: number;
}

export interface NotificationTriggers {
    new_error: boolean;
    threshold: ThresholdTrigger;
    spike_on_ignored: boolean;
}

export interface TelegramNotification {
    enabled: boolean;
    bot_token: string;
    chat_id: string;
    triggers: NotificationTriggers;
}

export interface NotificationSettings {
    telegram: TelegramNotification;
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
