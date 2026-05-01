import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useMemoryStore } from '../store/memoryStore';
import type { Components } from 'react-markdown';
import type { MemoryFileType } from '../../domain/entities/MemoryFile';

const typeLabels: Record<MemoryFileType, string> = {
  user: 'User',
  project: 'Project',
  feedback: 'Feedback',
  reference: 'Reference',
};

const typeBadgeStyles: Record<MemoryFileType, string> = {
  user: 'bg-blue-400/10 text-blue-600',
  project: 'bg-accent/10 text-accent',
  feedback: 'bg-amber-400/10 text-amber-700',
  reference: 'bg-emerald-500/10 text-emerald-700',
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !String(children).includes('\n');

    return !isInline ? (
      <div className="rounded-lg overflow-hidden border border-border my-4">
        <SyntaxHighlighter
          style={materialLight}
          language={match?.[1] || 'text'}
          PreTag="div"
          customStyle={{ margin: 0, background: 'transparent' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export const MemoryFileContent = () => {
  const { files, selectedFileId } = useMemoryStore();

  const selectedFile = useMemo(
    () => files.find((f) => f.id === selectedFileId) ?? null,
    [files, selectedFileId],
  );

  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <p className="text-sm text-olive-gray">Select a file to preview</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-bg text-text">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-base font-medium">{selectedFile.title}</h2>
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${typeBadgeStyles[selectedFile.type]}`}
          >
            {typeLabels[selectedFile.type]}
          </span>
        </div>
        <span className="text-xs text-olive-gray">
          {formatDate(selectedFile.lastModified)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="prose prose-sm max-w-none px-10 py-8 pb-32">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {selectedFile.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-card px-6 py-2 text-xs text-olive-gray shrink-0">
        <span className="font-mono">{selectedFile.filename}</span>
        <span>{selectedFile.wordCount} words</span>
      </div>
    </div>
  );
};
