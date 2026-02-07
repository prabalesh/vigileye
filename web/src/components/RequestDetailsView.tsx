import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronDown, ChevronUp, Code, Database } from 'lucide-react';
import toast from 'react-hot-toast';

interface RequestDetailsViewProps {
    body?: string;
    headers?: Record<string, string>;
}

export const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({ body, headers }) => {
    const [isBodyExpanded, setIsBodyExpanded] = useState(true);
    const [isHeadersExpanded, setIsHeadersExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const isJson = (str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    const formatJson = (str: string) => {
        try {
            return JSON.stringify(JSON.parse(str), null, 2);
        } catch (e) {
            return str;
        }
    };

    const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];

    return (
        <div className="space-y-6">
            {/* Request Body */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                <button
                    onClick={() => setIsBodyExpanded(!isBodyExpanded)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors border-b border-slate-800/50"
                >
                    <div className="flex items-center gap-3">
                        <Database size={16} className="text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Request Body</span>
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
                                        {isJson(body) ? formatJson(body) : body}
                                    </SyntaxHighlighter>
                                </div>
                            </>
                        ) : (
                            <div className="p-10 text-center text-slate-600 italic text-sm font-medium">
                                No request body captured.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Request Headers */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                <button
                    onClick={() => setIsHeadersExpanded(!isHeadersExpanded)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors border-b border-slate-800/50"
                >
                    <div className="flex items-center gap-3">
                        <Code size={16} className="text-indigo-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Request Headers</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {headers && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(JSON.stringify(headers, null, 2));
                                }}
                                className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Copy size={12} />
                                Copy All
                            </button>
                        )}
                        {isHeadersExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                    </div>
                </button>

                {isHeadersExpanded && (
                    <div className="p-4">
                        {headers && Object.keys(headers).length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-1/3">Header</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {Object.entries(headers).map(([key, value]) => (
                                            <tr key={key} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-3 align-top">
                                                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-400 transition-colors">{key}</span>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    {SENSITIVE_HEADERS.includes(key.toLowerCase()) ? (
                                                        <span className="text-[11px] font-black tracking-widest text-rose-500 italic opacity-80 uppercase">[REDACTED]</span>
                                                    ) : (
                                                        <span className="text-[11px] font-mono text-slate-300 break-all leading-relaxed">{value}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-slate-600 italic text-sm font-medium">
                                No headers available.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
