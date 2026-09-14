"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none text-inherit space-y-4 font-sans text-sm sm:text-base leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-xl sm:text-2xl font-black text-inherit tracking-tight mt-6 mb-3 pb-2 border-b border-black/10 dark:border-white/10"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg sm:text-xl font-extrabold text-inherit tracking-tight mt-6 mb-3 flex items-center gap-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-base sm:text-lg font-bold text-inherit mt-4 mb-2"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-sm sm:text-base font-bold text-inherit mt-3 mb-1"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="leading-relaxed sm:leading-loose text-inherit/90 mb-3" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1.5 my-3 pl-2 text-inherit/90" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-3 pl-2 text-inherit/90" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="p-4 my-4 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-inherit italic"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-2xl border border-black/10 dark:border-white/10">
              <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-black/5 dark:bg-white/5 font-extrabold text-inherit border-b border-black/10 dark:border-white/10" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="p-3 font-extrabold text-inherit" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-3 border-t border-black/5 dark:border-white/5" {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            const isBlock = Boolean(className);
            return isBlock ? (
              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-3 border border-slate-800">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400"
                {...props}
              >
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-6 border-black/10 dark:border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
