import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useForm } from 'react-hook-form';
import {
    Bell,
    ChevronRight,
    Loader2,
    Save,
    Send,
    Eye,
    EyeOff,
    Info,
    CheckCircle,
    AlertTriangle,
    MessageCircle,
    Server
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getNotificationSettings,
    updateNotificationSettings,
    testTelegramNotification
} from '../api/notifications';
import { getProject } from '../api/projects';
import { getEnvironments } from '../api/environments';
import { TelegramSetupGuide } from '../components/TelegramSetupGuide';
import type { NotificationSettings as SettingsType, Project, Environment } from '../types';

export const NotificationSettings = () => {
    const { id, envId } = useParams<{ id: string; envId: string }>();
    const projectId = Number(id);
    const environmentId = Number(envId);

    const [project, setProject] = useState<Project | null>(null);
    const [environment, setEnvironment] = useState<Environment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [isGuideCollapsed, setIsGuideCollapsed] = useState(true);
    const [isConfigured, setIsConfigured] = useState(false);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SettingsType>({
        defaultValues: {
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
        }
    });

    const isEnabled = watch('telegram.enabled');
    const thresholdEnabled = watch('telegram.triggers.threshold.enabled');

    useEffect(() => {
        if (projectId && environmentId) {
            fetchData();
        }
    }, [projectId, environmentId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [projRes, envsRes, settingsRes] = await Promise.all([
                getProject(projectId),
                getEnvironments(projectId),
                getNotificationSettings(projectId, environmentId)
            ]);

            setProject(projRes);
            const env = envsRes.find(e => e.id === environmentId) || null;
            setEnvironment(env);
            reset(settingsRes);

            // If bot_token and chat_id are present, consider it configured
            if (settingsRes.telegram.bot_token && settingsRes.telegram.chat_id) {
                setIsConfigured(true);
                setIsGuideCollapsed(true);
            } else {
                setIsGuideCollapsed(false);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const onSave = async (data: SettingsType) => {
        try {
            setIsSaving(true);
            await updateNotificationSettings(projectId, environmentId, data);
            toast.success('Settings saved successfully');
            if (data.telegram.bot_token && data.telegram.chat_id) {
                setIsConfigured(true);
            }
        } catch (err) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        try {
            setIsTesting(true);
            const res = await testTelegramNotification(projectId, environmentId);
            if (res.success) {
                toast.success('Test message sent! Check your Telegram group.');
            } else {
                toast.error(res.message || 'Failed to send test message');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to test notification');
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="space-y-1">
                        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                            <ChevronRight size={14} />
                            <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">{project?.name || 'Project'}</Link>
                            <ChevronRight size={14} />
                            <span className="text-slate-300">{environment?.name}</span>
                            <ChevronRight size={14} />
                            <span className="text-slate-300">Notifications</span>
                        </nav>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <Bell className="text-blue-500" size={32} />
                            Telegram Alerts
                        </h1>
                    </div>
                    {environment && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700">
                            <Server size={16} className="text-slate-500" />
                            <span className="text-sm font-black text-white">{environment.name}</span>
                        </div>
                    )}
                </div>

                {/* Setup Guide */}
                <TelegramSetupGuide
                    isCollapsed={isGuideCollapsed}
                    onToggle={() => setIsGuideCollapsed(!isGuideCollapsed)}
                />

                {/* Form */}
                <form onSubmit={handleSubmit(onSave)} className="space-y-8">
                    {/* Status Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${isEnabled ? 'bg-emerald-600/10 border-emerald-600/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    <MessageCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Telegram Channel</h3>
                                    <p className="text-slate-500 text-sm font-medium">Receive real-time alerts on your favorite platform.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                                <span className={`text-xs font-black uppercase tracking-widest px-3 ${isEnabled ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setValue('telegram.enabled', !isEnabled)}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${isEnabled ? 'bg-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-slate-800'}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 ${isEnabled ? 'translate-x-[1.75rem]' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {isConfigured ? (
                            <div className="bg-emerald-600/5 border border-emerald-600/20 rounded-2xl p-6 flex gap-4 items-center mb-10">
                                <CheckCircle className="text-emerald-500" size={24} />
                                <div>
                                    <p className="text-white font-bold text-sm">Bot is configured and ready.</p>
                                    <p className="text-emerald-400/60 text-xs font-medium">You can test the connection to ensure everything is working correctly.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-600/5 border border-amber-600/20 rounded-2xl p-6 flex gap-4 items-center mb-10">
                                <AlertTriangle className="text-amber-500" size={24} />
                                <div>
                                    <p className="text-white font-bold text-sm">Bot is not yet configured.</p>
                                    <p className="text-amber-400/60 text-xs font-medium">Follow the setup guide above to get your Bot Token and Chat ID.</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">Bot Token</label>
                                <div className="relative">
                                    <input
                                        type={showToken ? 'text' : 'password'}
                                        {...register('telegram.bot_token', {
                                            required: isEnabled ? 'Bot token is required' : false,
                                            pattern: {
                                                value: /^\d+:[A-Za-z0-9_-]+$/,
                                                message: 'Invalid token format (e.g. 12345:ABC...)'
                                            }
                                        })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-5 pr-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-mono text-sm"
                                        placeholder="123456:ABC-DEF..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowToken(!showToken)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                                    >
                                        {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.telegram?.bot_token && <p className="text-red-500 text-[10px] font-black uppercase ml-1 italic">{errors.telegram.bot_token.message}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">Chat ID</label>
                                <input
                                    type="text"
                                    {...register('telegram.chat_id', {
                                        required: isEnabled ? 'Chat ID is required' : false,
                                        pattern: {
                                            value: /^-?\d+$/,
                                            message: 'Chat ID must be a number'
                                        }
                                    })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-mono text-sm"
                                    placeholder="-1001234567890"
                                />
                                {errors.telegram?.chat_id && <p className="text-red-500 text-[10px] font-black uppercase ml-1 italic">{errors.telegram.chat_id.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Triggers Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <Bell className="text-blue-500" size={24} />
                                Notification Triggers
                            </h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">Select which events should trigger an alert to your team.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-start gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group">
                                <div className="pt-0.5">
                                    <input
                                        type="checkbox"
                                        {...register('telegram.triggers.new_error')}
                                        className="w-5 h-5 rounded-lg bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-600 transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold group-hover:text-blue-400 transition-colors">Notify on new unique errors</p>
                                    <p className="text-slate-500 text-xs">Alert the group whenever a previously unseen error pattern occurs.</p>
                                </div>
                            </label>

                            <div className={`p-5 rounded-2xl bg-slate-950 border border-slate-800 transition-all ${thresholdEnabled ? 'border-blue-600/30' : ''}`}>
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            {...register('telegram.triggers.threshold.enabled')}
                                            className="w-5 h-5 rounded-lg bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-600 transition-all"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold group-hover:text-blue-400 transition-colors">Notify when error threshold is reached</p>
                                        <p className="text-slate-500 text-xs">Alert if a high volume of errors occurs in a short period.</p>
                                    </div>
                                </label>

                                {thresholdEnabled && (
                                    <div className="mt-6 ml-9 pl-6 border-l-2 border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">Error Count</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    {...register('telegram.triggers.threshold.count', { required: thresholdEnabled, min: 1 })}
                                                    className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-black text-sm"
                                                />
                                                <span className="text-slate-500 text-xs font-bold italic">errors</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">Time Window</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    {...register('telegram.triggers.threshold.window_minutes', { required: thresholdEnabled, min: 1 })}
                                                    className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-black text-sm"
                                                />
                                                <span className="text-slate-500 text-xs font-bold italic">minutes</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <label className="flex items-start gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group">
                                <div className="pt-0.5">
                                    <input
                                        type="checkbox"
                                        {...register('telegram.triggers.spike_on_ignored')}
                                        className="w-5 h-5 rounded-lg bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-600 transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold group-hover:text-blue-400 transition-colors">Alert on ignored error spikes</p>
                                    <p className="text-slate-500 text-xs">Notify if an ignored error occurs at 100x its normal rate.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem]">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={isTesting || !isConfigured}
                                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-white px-6 py-3.5 rounded-2xl font-black transition-all active:scale-95 border border-slate-700"
                            >
                                {isTesting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                <span>Test Notification</span>
                            </button>
                            {!isConfigured && (
                                <div className="flex items-center gap-2 text-slate-500 italic">
                                    <Info size={14} />
                                    <span className="text-[10px] font-bold">Configure bot first to test</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-10 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Save Settings</span>
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};
