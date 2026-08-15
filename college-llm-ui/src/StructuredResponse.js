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
        <div className="relative my-6 rounded-xl overflow-hidden bg-gray-100 border border-gray-300 shadow-sm group/code">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-200/80 border-b border-gray-300">
                <span className="text-xs font-mono text-black font-semibold uppercase tracking-widest">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-black hover:bg-gray-300 transition-colors bg-transparent rounded-md"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-green-600" />
                            <span className="text-green-600 font-bold">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} className="text-black" />
                            <span className="text-black">Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-4 overflow-x-auto text-sm leading-relaxed text-black font-mono">
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
                <code className="bg-gray-100 text-black border border-gray-200 px-1.5 py-0.5 rounded text-sm font-mono font-medium" {...props}>
                    {children}
                </code>
            );
        },
        table: ({ children }) => (
            <div className="my-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        {children}
                    </table>
                </div>
            </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
        th: ({ children }) => (
            <th className="px-5 py-3.5 font-bold text-black uppercase tracking-wider text-[11px] border-b border-gray-200">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className="px-5 py-4 border-b border-gray-100 text-black transition-colors hover:bg-gray-50">
                {children}
            </td>
        ),
        h1: ({ children }) => <h1 className="text-3xl font-bold mt-10 mb-6 text-black tracking-tight border-b pb-2 border-gray-200">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-black tracking-tight flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-blue-500"></span>
            {children}
        </h2>,
        h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-black tracking-tight">{children}</h3>,
        p: ({ children }) => <p className="leading-relaxed mb-5 text-black last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="space-y-3 mb-6 list-none">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-3 mb-6 list-decimal pl-5 text-black">{children}</ol>,
        li: ({ children }) => (
            <li className="flex gap-3 text-black">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0"></span>
                <span className="leading-relaxed">{children}</span>
            </li>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50 px-6 py-4 my-6 italic text-black rounded-r-xl shadow-sm">
                {children}
            </blockquote>
        ),
        hr: () => <hr className="my-10 border-t border-gray-200" />,
    }), []);

    return (
        <div className="markdown-container animate-in fade-in duration-700">
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
