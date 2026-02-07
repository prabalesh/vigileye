import React from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Info, ExternalLink } from 'lucide-react';

interface TelegramSetupGuideProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export const TelegramSetupGuide: React.FC<TelegramSetupGuideProps> = ({
    isCollapsed,
    onToggle
}) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 transition-all duration-500">
            <button
                onClick={onToggle}
                className="w-full px-10 py-8 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <MessageCircle size={24} />
                    </div>
                    <div className="text-left">
                        <h2 className="text-xl font-black text-white">Setup Instructions</h2>
                        <p className="text-slate-500 text-sm">Follow these steps to connect your Telegram bot.</p>
                    </div>
                </div>
                <div className="text-slate-500">
                    {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                </div>
            </button>

            {!isCollapsed && (
                <div className="px-10 pb-10 space-y-10 animate-in slide-in-from-top-4 duration-300">
                    {/* Step 1 */}
                    <div className="relative pl-12 border-l border-slate-800 space-y-4">
                        <div className="absolute -left-4 top-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm border-4 border-slate-900 shadow-lg shadow-blue-600/20">
                            1
                        </div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            Create Your Telegram Bot
                        </h3>
                        <div className="space-y-3 text-slate-400 leading-relaxed font-medium">
                            <p>1. Open Telegram and search for <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">@BotFather <ExternalLink size={12} /></a></p>
                            <p>2. Send the command: <code className="bg-slate-950 px-2 py-1 rounded-md text-emerald-400 font-mono text-sm border border-slate-800">/newbot</code></p>
                            <p>3. Choose a name and username for your bot (e.g., "MyApp Alerts")</p>
                            <p>4. Copy the <span className="text-white font-bold">API Token</span> provided by BotFather</p>
                        </div>
                        <div className="bg-blue-600/5 border border-blue-600/20 p-4 rounded-2xl flex gap-4 items-start">
                            <Info className="text-blue-500 shrink-0" size={18} />
                            <p className="text-blue-400/80 text-xs font-bold leading-relaxed italic">
                                The token looks like: <code className="text-slate-300 font-mono">123456:ABC-DEF1234ghIKl-abcDEF</code>. Keep this token secret!
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative pl-12 border-l border-slate-800 space-y-4">
                        <div className="absolute -left-4 top-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm border-4 border-slate-900 shadow-lg shadow-blue-600/20">
                            2
                        </div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            Create Group & Get Chat ID
                        </h3>
                        <div className="space-y-3 text-slate-400 leading-relaxed font-medium">
                            <p>1. Create a <span className="text-white font-bold">new Telegram group</span> or open an existing one</p>
                            <p>2. Add your team members to the group</p>
                            <p>3. <span className="text-white font-bold">Add your bot</span> to the group (search by its username)</p>
                            <p>4. Temporarily add <span className="text-white font-bold">@VigileEyeHelperBot</span> to the group</p>
                            <p>5. In the group, send the command: <code className="bg-slate-950 px-2 py-1 rounded-md text-emerald-400 font-mono text-sm border border-slate-800">/chatid</code></p>
                            <p>6. The helper bot will reply with your <span className="text-white font-bold">Chat ID</span></p>
                            <p>7. Copy the Chat ID (e.g., <code className="text-slate-300 font-mono">-1001234567890</code>)</p>
                            <p>8. You can now remove @VigileEyeHelperBot from the group</p>
                        </div>
                        <div className="bg-emerald-600/5 border border-emerald-600/20 p-4 rounded-2xl flex gap-4 items-start">
                            <Info className="text-emerald-500 shrink-0" size={18} />
                            <p className="text-emerald-400/80 text-xs font-bold leading-relaxed italic">
                                Important: The Chat ID usually starts with -100 for groups.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
