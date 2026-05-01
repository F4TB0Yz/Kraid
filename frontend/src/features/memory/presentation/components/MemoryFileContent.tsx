import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useMemoryStore } from '../store/memoryStore';
import { EditIcon } from '../../../../core/presentation/components/icons';
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
      <div className="my-4 overflow-hidden rounded-lg border border-border">
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
      <code className={className} {...props}>{children}</code>
    );
  },
};

export const MemoryFileContent = () => {
  const { files, selectedFileId, isEditing, updateFile, setEditing } = useMemoryStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null;

  const [localContent, setLocalContent] = useState(selectedFile?.content ?? '');
  const [localTitle, setLocalTitle] = useState(selectedFile?.title ?? '');

  const handleSave = useCallback(async (content: string, title: string) => {
    if (!selectedFileId || !selectedFile) return;
    await updateFile(selectedFileId, {
      content,
      title: title !== selectedFile.title ? title : undefined,
    });
  }, [selectedFileId, selectedFile, updateFile]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void handleSave(e.target.value, localTitle);
    }, 1500);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
  };

  const toggleEdit = () => {
    const next = !isEditing;
    setEditing(next);
    if (next) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      void handleSave(localContent, localTitle);
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm-sand">
            <span className="text-lg text-olive-gray">📝</span>
          </div>
          <p className="text-sm text-olive-gray">Select a file to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-bg text-text">
      <div className="flex items-center justify-between border-b border-border-cream px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {isEditing ? (
            <input
              type="text"
              value={localTitle}
              onChange={handleTitleChange}
              className="rounded border border-border-warm bg-bg px-2 py-1 text-sm font-medium text-text outline-none focus:ring-2 focus:ring-accent"
            />
          ) : (
            <h2 className="truncate font-serif text-base font-medium">{selectedFile.title}</h2>
          )}
          <span className={`inline-block shrink-0 rounded px-2 py-0.5 text-xs font-medium ${typeBadgeStyles[selectedFile.type]}`}>
            {typeLabels[selectedFile.type]}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-olive-gray">{formatDate(selectedFile.lastModified)}</span>
          <button
            onClick={toggleEdit}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isEditing
                ? 'bg-accent text-ivory'
                : 'text-charcoal-warm hover:bg-warm-sand'
            }`}
          >
            <EditIcon className="h-3.5 w-3.5" />
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleContentChange}
            placeholder="Write your content here…"
            className="h-full w-full resize-none bg-transparent px-10 py-8 font-mono text-sm leading-relaxed text-text outline-none placeholder:text-olive-gray"
          />
        ) : (
          <div className="prose prose-sm max-w-none px-10 py-8 pb-32">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {localContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border-cream bg-card px-6 py-2 text-xs text-olive-gray">
        <span className="font-mono">{selectedFile.filename}</span>
        <span>{selectedFile.wordCount} words</span>
      </div>
    </div>
  );
};
