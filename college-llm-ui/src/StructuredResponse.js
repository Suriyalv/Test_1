import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

const CodeBlock = ({ language, content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-4 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-sm group/code">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800 border-b border-slate-700">
                <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors rounded"
                >
                    {copied ? (
                        <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold text-[11px]">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy size={13} />
                            <span className="text-[11px]">Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-3.5 overflow-x-auto text-xs sm:text-sm leading-relaxed text-slate-100 font-mono">
                <code>{content}</code>
            </div>
        </div>
    );
};

const StructuredResponse = ({ text }) => {
    const components = useMemo(() => ({
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const content = String(children).replace(/\n$/, '');

            if (!inline && match) {
                return <CodeBlock language={match[1]} content={content} />;
            }
            if (!inline && content.includes('\n')) {
                return <CodeBlock language="text" content={content} />;
            }
            return (
                <code className="bg-brand-50 text-brand-700 border border-brand-100 px-1.5 py-0.5 rounded text-xs font-mono font-semibold" {...props}>
                    {children}
                </code>
            );
        },
        table: ({ children }) => (
            <div className="my-4 overflow-hidden rounded-2xl border border-brand-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                        {children}
                    </table>
                </div>
            </div>
        ),
        thead: ({ children }) => <thead className="bg-brand-50/70 border-b border-brand-200">{children}</thead>,
        th: ({ children }) => (
            <th className="px-4 py-2.5 font-bold text-brand-700 uppercase tracking-wider text-[11px]">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-slate-100 text-slate-800 transition-colors hover:bg-brand-50/40">
                {children}
            </td>
        ),
        h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-extrabold mt-6 mb-3 text-brand-700 tracking-tight border-b pb-1.5 border-brand-100 font-display">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg sm:text-xl font-bold mt-5 mb-2.5 text-cyan-700 tracking-tight flex items-center gap-2 font-display">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-brand-500 to-cyan-500 inline-block"></span>
            {children}
        </h2>,
        h3: ({ children }) => <h3 className="text-base sm:text-lg font-bold mt-4 mb-2 text-slate-900 tracking-tight font-display">{children}</h3>,
        p: ({ children }) => <p className="leading-relaxed mb-3 text-slate-800 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="space-y-1.5 mb-3.5 list-none pl-1">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1.5 mb-3.5 list-decimal pl-5 text-slate-800">{children}</ol>,
        li: ({ children }) => (
            <li className="flex gap-2 text-slate-800 leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 shrink-0"></span>
                <span className="flex-1">{children}</span>
            </li>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-500 bg-brand-50/50 px-4 py-2.5 my-3.5 italic text-brand-700 rounded-r-lg">
                {children}
            </blockquote>
        ),
        hr: () => <hr className="my-6 border-t border-brand-100" />,
    }), []);

    return (
        <div className="markdown-container">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
};

export default StructuredResponse;

