import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useCanvasStore } from '../store/canvasStore';
import { FileText } from 'lucide-react';

export const MarkdownCanvas: React.FC = () => {
  const { document, isLoading, error, loadDocument, clearError } =
    useCanvasStore();

  useEffect(() => {
    if (!document) {
      loadDocument();
    }
  }, [document, loadDocument]);

  if (isLoading && !document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
        <button onClick={clearError} className="text-sm underline mt-2">
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 overflow-y-auto w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <FileText size={20} className="text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {document?.title || 'Document'}
        </h2>
      </div>
      <article className="prose prose-sm max-w-none">
        <ReactMarkdown>{document?.content || ''}</ReactMarkdown>
      </article>
    </div>
  );
};
