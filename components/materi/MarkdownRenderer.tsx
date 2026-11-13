"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { sanitizeMathContent } from "@/lib/math-sanitizer";

export { sanitizeMathContent };

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isCompact?: boolean;
}

export default function MarkdownRenderer({
  content,
  className,
  isCompact = false,
}: MarkdownRendererProps) {
  const sanitizedContent = sanitizeMathContent(content);
  return (
    <div
      className={`prose prose-slate max-w-none text-inherit font-sans ${
        isCompact
          ? "space-y-2 text-xs sm:text-sm leading-relaxed"
          : "space-y-4 text-sm sm:text-base leading-relaxed"
      } ${className || ""}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className={
                isCompact
                  ? "text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1"
                  : "text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-5 mb-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-800"
              }
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className={
                isCompact
                  ? "text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-2.5 mb-1 flex items-center gap-1.5"
                  : "text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-5 mb-2 flex items-center gap-2"
              }
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className={
                isCompact
                  ? "text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1"
                  : "text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 mt-3.5 mb-1.5"
              }
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className={
                isCompact
                  ? "text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-1.5 mb-0.5"
                  : "text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2.5 mb-1"
              }
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className={
                isCompact
                  ? "leading-relaxed text-inherit font-normal mb-2 last:mb-0 text-xs sm:text-sm"
                  : "leading-relaxed text-inherit font-normal mb-3 text-sm sm:text-base"
              }
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className={
                isCompact
                  ? "list-disc list-inside space-y-1 my-2 pl-1 text-inherit text-xs sm:text-sm font-normal"
                  : "list-disc list-inside space-y-1.5 my-3 pl-2 text-inherit text-sm sm:text-base font-normal"
              }
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className={
                isCompact
                  ? "list-decimal list-inside space-y-1 my-2 pl-1 text-inherit text-xs sm:text-sm font-normal"
                  : "list-decimal list-inside space-y-1.5 my-3 pl-2 text-inherit text-sm sm:text-base font-normal"
              }
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className={
                isCompact
                  ? "p-3 my-2 rounded-xl bg-amber-50/60 text-amber-900/80 dark:text-amber-200/90 text-xs italic leading-relaxed border-0 [&>p]:italic [&>p]:text-xs [&>p]:mb-1 last:[&>p]:mb-0"
                  : "p-4 my-3.5 rounded-xl bg-amber-50/60 text-amber-900/80 dark:text-amber-200/90 text-xs sm:text-sm italic leading-relaxed border-0 [&>p]:italic [&>p]:text-xs [&>p]:sm:text-sm [&>p]:mb-1.5 last:[&>p]:mb-0"
              }
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div
              className={`overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 ${
                isCompact ? "my-3" : "my-4"
              }`}
            >
              <table
                className={`w-full text-left border-collapse ${
                  isCompact ? "text-xs" : "text-xs sm:text-sm"
                }`}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className="bg-black/5 dark:bg-white/5 font-extrabold text-inherit border-b border-black/10 dark:border-white/10"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th className={isCompact ? "p-2 font-extrabold text-inherit" : "p-3 font-extrabold text-inherit"} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className={isCompact ? "p-2 border-t border-black/5 dark:border-white/5" : "p-3 border-t border-black/5 dark:border-white/5"} {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            const isBlock = Boolean(className);
            return isBlock ? (
              <pre
                className={
                  isCompact
                    ? "p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-2 border border-slate-800"
                    : "p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-3 border border-slate-800"
                }
              >
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className={
                  isCompact
                    ? "px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                    : "px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400"
                }
                {...props}
              >
                {children}
              </code>
            );
          },
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-slate-900 dark:text-white" {...props} />
          ),
          b: ({ node, ...props }) => (
            <b className="font-extrabold text-slate-900 dark:text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic font-medium text-slate-800 dark:text-slate-200" {...props} />
          ),
          i: ({ node, ...props }) => (
            <i className="italic font-medium text-slate-800 dark:text-slate-200" {...props} />
          ),
          hr: () => (
            <hr
              className={`border-black/10 dark:border-white/10 ${
                isCompact ? "my-3" : "my-6"
              }`}
            />
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
