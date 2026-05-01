import { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useCanvasStore } from '../store/canvasStore';
import { useToastStore } from '../../../../core/presentation/store/toastStore';
import { EditIcon } from '../../../../core/presentation/components/icons';
import type { Components } from 'react-markdown';

const formatRelativeTime = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString([], { dateStyle: 'medium' });
};

const countMetrics = (text: string) => {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const chars = text.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readingTime };
};

export const MarkdownCanvas = () => {
  const { document, isLoading, error, loadDocument, updateContent, clearError } =
    useCanvasStore();
  const { addToast } = useToastStore();
  const [localContent, setLocalContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [metrics, setMetrics] = useState({ words: 0, chars: 0, readingTime: 1 });
  const isInitialized = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    if (document && !isInitialized.current) {
      isInitialized.current = true;
      setLocalContent(document.content);
      setMetrics(countMetrics(document.content));
    }
  }, [document]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(async (contentToSave: string, showToast = true) => {
    if (!contentToSave.trim()) return;
    try {
      await updateContent(contentToSave);
      if (showToast) addToast('Document saved successfully');
    } catch {
      addToast('Failed to save document', 'error');
    }
  }, [updateContent, addToast]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setMetrics(countMetrics(newContent));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void handleSave(newContent, false);
    }, 1500);
  };

  const handleCancel = () => {
    const originalContent = document?.content ?? '';
    setLocalContent(originalContent);
    setMetrics(countMetrics(originalContent));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      void handleSave(localContent, true);
    }
  };

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
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-cream px-6 py-3">
        <h2 className="font-serif text-base font-medium truncate">
          {document?.title ?? 'Document'}
        </h2>
        <div className="flex items-center gap-1">
          {error && (
            <button
              onClick={clearError}
              className="mr-2 text-xs text-error underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-charcoal-warm transition-colors hover:bg-warm-sand"
              >
                Done
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-charcoal-warm transition-colors hover:bg-warm-sand hover:text-text"
            >
              <EditIcon className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative">
        {isLoading && !document ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-warm-silver">Loading…</p>
          </div>
        ) : isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Write your markdown here…"
            className="absolute inset-0 h-full w-full resize-none bg-transparent px-10 py-8 font-mono text-sm leading-relaxed text-text outline-none placeholder:text-olive-gray"
          />
        ) : (
          <div className="prose prose-sm max-w-none px-10 py-8 pb-32">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {localContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-2 flex items-center justify-between bg-card text-xs text-olive-gray shrink-0">
        <div>
          {document?.updatedAt && `Saved ${formatRelativeTime(document.updatedAt)}`}
          {isEditing && <span className="ml-2 text-olive-gray/60">· Auto-saving enabled</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>{metrics.words} words</span>
          <span>{metrics.chars} chars</span>
          <span>{metrics.readingTime} min read</span>
        </div>
      </div>
    </div>
  );
};
