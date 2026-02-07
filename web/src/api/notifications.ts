import client from './client';
import type { NotificationSettings } from '../types';

export async function getNotificationSettings(projectId: number, envId: number): Promise<NotificationSettings> {
    const response = await client.get(`/api/projects/${projectId}/environments/${envId}`);
    // Parsing settings from environment response
    const settings = response.data.settings ? JSON.parse(response.data.settings) : {};
    return settings.notifications || {
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
    // Fetch existing environment to merge settings (or just overwrite if that's the intention)
    // The user body requirement: { settings: { notifications: { telegram: {...} } } }
    // Note: Backend stores settings as a JSON string
    await client.patch(`/api/projects/${projectId}/environments/${envId}`, {
        settings: JSON.stringify({ notifications: settings })
    });
}

export async function testTelegramNotification(
    projectId: number,
    envId: number
): Promise<{ success: boolean; message: string }> {
    const response = await client.post(`/api/projects/${projectId}/environments/${envId}/notifications/test`);
    return response.data;
}
