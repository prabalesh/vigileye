import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clock, AlertCircle, Check, Copy, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResponseDetailsViewProps {
    statusCode?: number;
    responseTimeMs?: number;
    body?: string;
}

export const ResponseDetailsView: React.FC<ResponseDetailsViewProps> = ({
    statusCode,
    responseTimeMs,
    body
}) => {
    const [isBodyExpanded, setIsBodyExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusColor = (code?: number) => {
        if (!code) return 'text-slate-500 border-slate-700 bg-slate-800';
        if (code >= 500) return 'text-rose-500 border-rose-500/20 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
        if (code >= 400) return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
        return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
    };

    const isJson = (str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    const formatBody = (str: string) => {
        if (!str) return '';
        const truncated = str.length > 500;
        const displayStr = truncated ? str.slice(0, 500) : str;

        try {
            if (isJson(displayStr)) {
                return JSON.stringify(JSON.parse(displayStr), null, 2);
            }
            return displayStr;
        } catch (e) {
            return displayStr;
        }
    };

    const isTruncated = body && body.length > 500;

    return (
        <div className="space-y-6">
            {/* Status & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Status Code</p>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-xl font-black text-sm border font-mono ${getStatusColor(statusCode)}`}>
                            {statusCode || 'N/A'}
                        </span>
                        {statusCode && statusCode >= 400 && (
                            <AlertCircle size={14} className={statusCode >= 500 ? 'text-rose-500' : 'text-amber-500'} />
                        )}
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Response Time</p>
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" />
                        <span className="text-xl font-black text-white font-mono">
                            {responseTimeMs ? `${responseTimeMs.toLocaleString()}ms` : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Response Body */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                <button
                    onClick={() => setIsBodyExpanded(!isBodyExpanded)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors border-b border-slate-800/50"
                >
                    <div className="flex items-center gap-3">
                        <Terminal size={16} className="text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Response Body</span>
                    </div>
                    {isBodyExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                {isBodyExpanded && (
                    <div className="relative group">
                        {body ? (
                            <>
                                <button
                                    onClick={() => handleCopy(body)}
                                    className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all z-10 opacity-0 group-hover:opacity-100"
                                    title="Copy Body"
                                >
                                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                                <div className="max-h-[400px] overflow-auto">
                                    <SyntaxHighlighter
                                        language={isJson(body) ? 'json' : 'text'}
                                        style={atomDark}
                                        customStyle={{
                                            background: 'transparent',
                                            padding: '1.5rem',
                                            fontSize: '12px',
                                            lineHeight: '1.6',
                                            margin: 0
                                        }}
                                    >
                                        {formatBody(body)}
                                    </SyntaxHighlighter>
                                </div>
                                {isTruncated && (
                                    <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex items-center justify-between">
                                        <p className="text-[10px] italic text-slate-500 font-bold uppercase tracking-tight">
                                            [TRUNCATED] Showing first 500 characters
                                        </p>
                                        <p className="text-[10px] text-slate-600 font-mono">
                                            Total size: {(body.length / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-10 text-center text-slate-600 italic text-sm font-medium">
                                No response body captured.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
