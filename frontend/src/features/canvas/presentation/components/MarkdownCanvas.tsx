import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useCanvasStore } from '../store/canvasStore';
import { useToastStore } from '../../../../core/presentation/store/toastStore';
import { CloseIcon } from '../../../../core/presentation/components/icons';
import { Skeleton, TextSkeleton } from '../../../../core/presentation/components/Skeleton';
import type { Components } from 'react-markdown';
import type { Document } from '../../domain/entities/Document';

type ViewMode = 'preview' | 'edit' | 'split';

const countMetrics = (text: string) => {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const chars = text.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readingTime };
};

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

const DocumentTab = ({
  doc,
  isActive,
  onSelect,
  onClose,
}: {
  doc: Document;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}) => (
  <button
    onClick={onSelect}
    className={`group flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
      isActive
        ? 'border-b-2 border-accent text-accent'
        : 'text-charcoal-warm hover:text-text hover:bg-warm-sand'
    }`}
  >
    <span className="truncate max-w-[100px]">{doc.title}</span>
    <button
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="rounded p-0.5 text-warm-silver opacity-0 transition-opacity group-hover:opacity-100 hover:text-charcoal-warm"
    >
      <CloseIcon className="h-3 w-3" />
    </button>
  </button>
);

const CanvasDocumentView = ({ documentId }: { documentId: string }) => {
  const { documents, isLoading, error, loadDocuments, setActiveDocument, updateContent, clearError } = useCanvasStore();
  const { addToast } = useToastStore();
  const [localContent, setLocalContent] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [metrics, setMetrics] = useState({ words: 0, chars: 0, readingTime: 1 });
  const prevDocIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDoc = useMemo(
    () => documents.find((d) => d.id === documentId) ?? null,
    [documents, documentId],
  );

  useEffect(() => {
    setActiveDocument(documentId);
  }, [documentId, setActiveDocument]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (activeDoc && prevDocIdRef.current !== documentId) {
      prevDocIdRef.current = documentId;
      setLocalContent(activeDoc.content);
      setMetrics(countMetrics(activeDoc.content));
    }
  }, [activeDoc, documentId]);

  useEffect(() => {
    if (viewMode === 'edit' || viewMode === 'split') {
      textareaRef.current?.focus();
    }
  }, [viewMode, documentId]);

  const handleSave = useCallback(async (contentToSave: string, showToast = true) => {
    if (!contentToSave.trim()) return;
    try {
      await updateContent(contentToSave);
      if (showToast) addToast('Document saved');
    } catch {
      addToast('Failed to save', 'error');
    }
  }, [updateContent, addToast]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setMetrics(countMetrics(newContent));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void handleSave(newContent, false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      void handleSave(localContent, true);
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex h-full flex-col bg-bg p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <TextSkeleton lines={5} />
      </div>
    );
  }

  if (!activeDoc) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <p className="text-sm text-olive-gray">Document not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <div className="flex shrink-0 items-center justify-between border-b border-border-cream px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('preview')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'preview' ? 'bg-accent text-ivory' : 'text-charcoal-warm hover:bg-warm-sand'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setViewMode('edit')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'edit' ? 'bg-accent text-ivory' : 'text-charcoal-warm hover:bg-warm-sand'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'split' ? 'bg-accent text-ivory' : 'text-charcoal-warm hover:bg-warm-sand'
            }`}
          >
            Split
          </button>
        </div>
        {error && (
          <button onClick={clearError} className="text-xs text-error underline-offset-2 hover:underline">
            Dismiss
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'flex-1'} border-r border-border-cream`}>
            <div className="flex-1 overflow-y-auto">
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Write your markdown here…"
                className="h-full w-full resize-none bg-transparent px-6 py-5 font-mono text-sm leading-relaxed text-text outline-none placeholder:text-olive-gray"
              />
            </div>
            <div className="shrink-0 border-t border-border-cream px-4 py-1.5 text-xs text-olive-gray">
              {metrics.words} words · {metrics.chars} chars · {metrics.readingTime} min read
            </div>
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`overflow-y-auto ${viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
            <div className="prose prose-sm max-w-none px-6 py-5 pb-32">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {localContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { CanvasDocumentView };

export const MarkdownCanvas = () => {
  const { documents, activeDocumentId, isLoading, loadDocuments, addDocument, removeDocument, setActiveDocument } = useCanvasStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleNewDoc = async () => {
    await addDocument('Untitled');
    addToast('New document created');
  };

  const handleCloseDoc = (id: string) => {
    removeDocument(id);
    addToast('Document closed');
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex h-full flex-col bg-bg p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <TextSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <div className="flex shrink-0 items-center border-b border-border-cream bg-card">
        <div className="flex flex-1 overflow-x-auto">
          {documents.map((doc) => (
            <DocumentTab
              key={doc.id}
              doc={doc}
              isActive={doc.id === activeDocumentId}
              onSelect={() => setActiveDocument(doc.id)}
              onClose={() => handleCloseDoc(doc.id)}
            />
          ))}
        </div>
        <button
          onClick={handleNewDoc}
          className="px-3 py-2 text-xs text-olive-gray transition-colors hover:text-accent shrink-0"
        >
          + New
        </button>
      </div>
      {activeDocumentId ? (
        <CanvasDocumentView documentId={activeDocumentId} />
      ) : (
        <div className="flex h-full items-center justify-center bg-bg">
          <p className="text-sm text-olive-gray">Select a document</p>
        </div>
      )}
    </div>
  );
};
