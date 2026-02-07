import client from './client';
import type { NotificationSettings, NotificationHistoryItem } from '../types';

export async function getNotificationSettings(projectId: number, envId: number): Promise<NotificationSettings> {
    const response = await client.get(`/api/projects/${projectId}/environments/${envId}`);
    const env = response.data;
    return env.settings?.notifications || {
        telegram: {
            enabled: false,
            bot_token: '',
            chat_id: '',
            triggers: {
                new_error: true,
                threshold: { enabled: false, count: 10, window_minutes: 5 },
                spike_on_ignored: false
            }
        }
    };
}

export async function updateNotificationSettings(
    projectId: number,
    envId: number,
    settings: NotificationSettings
): Promise<void> {
    await client.patch(`/api/projects/${projectId}/environments/${envId}`, {
        settings: { notifications: settings }
    });
}

export async function testTelegramNotification(
    projectId: number,
    envId: number
): Promise<{ success: boolean; message: string }> {
    const response = await client.post(`/api/projects/${projectId}/environments/${envId}/notifications/test`);
    return response.data;
}

export async function getNotificationHistory(
    projectId: number,
    envId: number
): Promise<NotificationHistoryItem[]> {
    const response = await client.get(`/api/projects/${projectId}/environments/${envId}/notifications/history`);
    return response.data;
}
