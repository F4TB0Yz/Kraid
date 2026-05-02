import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useMemoryStore } from '../store/memoryStore';
import { EditIcon } from '../../../../core/presentation/components/icons';
import type { Components } from 'react-markdown';

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
  const { files, selectedFileId, selectFile, isEditing, updateFile, setEditing } = useMemoryStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null;

  const [localContent, setLocalContent] = useState(selectedFile?.content ?? '');

  const handleSave = useCallback(async (content: string) => {
    if (!selectedFileId || !selectedFile) return;
    await updateFile(selectedFileId, { content });
  }, [selectedFileId, selectedFile, updateFile]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void handleSave(e.target.value);
    }, 1500);
  };

  const toggleEdit = () => {
    const next = !isEditing;
    setEditing(next);
    if (next) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      void handleSave(localContent);
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
      <div className="flex items-center justify-between border-b border-border-cream px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectFile(null)}
            className="rounded px-2 py-1 text-xs font-medium text-olive-gray transition-colors hover:bg-warm-sand hover:text-charcoal-warm"
          >
            ← Back
          </button>
          <h2 className="truncate font-serif text-base font-medium text-text">
            {selectedFile?.title}
          </h2>
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
          <div className="h-full px-10 py-8">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={handleContentChange}
              placeholder="Write your content here…"
              className="h-full w-full resize-none bg-transparent outline-none prose font-mono text-sm leading-relaxed text-text placeholder:text-olive-gray"
            />
          </div>
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
