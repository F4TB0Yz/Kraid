import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useMemoryStore } from '../store/memoryStore';
import { EditIcon } from '../../../../core/presentation/components/icons';
import type { Components } from 'react-markdown';

const parseMemoryContent = (rawContent: string) => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = rawContent.match(frontmatterRegex);

  if (!match) return { metadata: {} as Record<string, string>, body: rawContent };

  const metadata: Record<string, string> = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      metadata[key.trim()] = rest.join(':').trim();
    }
  });

  return { metadata, body: match[2].trim() };
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

export const MemoryFileContent = ({ onBack }: { onBack?: () => void }) => {
  const { files, selectedFileId, selectFile, isEditing, updateFile, setEditing } = useMemoryStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null;

  const [localContent, setLocalContent] = useState(selectedFile?.content ?? '');
  const prevSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedFile && selectedFile.id !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedFile.id;
      setLocalContent(selectedFile.content);
    }
  // Only sync when file ID changes, not on every file content update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile?.id]);

  const { metadata, body } = parseMemoryContent(localContent);

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
    <div className="flex min-h-0 flex-1 flex-col bg-transparent text-text">
      <div className="flex flex-col border-b border-border-cream px-6 py-5">
        <button
          onClick={() => onBack ? onBack() : selectFile(null)}
          className="mb-4 self-start rounded px-2 py-1 text-xs font-medium text-olive-gray transition-colors hover:bg-warm-sand hover:text-charcoal-warm"
        >
          ← Back
        </button>
        <h2 className="font-serif text-2xl font-medium text-text">
          {metadata.name || selectedFile.title}
        </h2>
        {metadata.description && (
          <p className="mt-2 text-sm text-stone-gray font-sans">
            {metadata.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-border-cream px-6 py-3">
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
          <div className="prose prose-sm max-w-none px-6 py-8 pb-32">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {body}
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
