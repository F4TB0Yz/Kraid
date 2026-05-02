import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useFileStore } from '../store/fileStore';
import { WikiLink } from './WikiLink';
import { EditIcon, CheckIcon, TrashIcon } from '../../../../core/presentation/components/icons';

interface FileContentProps {
  slug: string;
}

export const FileContent: React.FC<FileContentProps> = ({ slug }) => {
  const { readFile, updateFile, deleteFile } = useFileStore();
  const [file, setFile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    readFile(slug).then(f => {
      if (mounted) {
        setFile(f);
        setEditContent(f.content);
        setIsLoading(false);
      }
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, [slug, readFile]);

  if (isLoading) return <div className="p-4 text-xs text-[var(--text-muted)]">Loading...</div>;
  if (!file) return <div className="p-4 text-xs text-red-400">File not found</div>;

  const handleSave = async () => {
    try {
      const updated = await updateFile(slug, { content: editContent });
      setFile(updated);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this file?')) {
      await deleteFile(slug);
    }
  };

  // Pre-process wiki links to markdown links
  const processedContent = file.content.replace(/\[\[([a-zA-Z0-9_-]+)\]\]/g, '[wiki:$1](#wiki-$1)');

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--surface-base)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-base font-bold text-[var(--text-primary)]">{file.name}</h1>
          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
            {file.type} • {file.wordCount} words • {new Date(file.lastModified).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button onClick={handleSave} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors" title="Save">
              <CheckIcon className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-1.5 bg-[var(--surface-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors" title="Edit">
              <EditIcon className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleDelete} className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded transition-colors" title="Delete">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full h-full min-h-[300px] bg-[var(--surface-input)] text-[var(--text-primary)] text-[13px] leading-relaxed font-mono p-4 rounded outline-none resize-none border border-[var(--border-color)] focus:border-[var(--primary-base)] transition-colors"
          />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-a:text-blue-400 prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, href, children, ...props }: any) => {
                  if (href?.startsWith('#wiki-')) {
                    const linkedSlug = href.replace('#wiki-', '');
                    return <WikiLink slug={linkedSlug} />;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {!isEditing && file.backlinks.length > 0 && (
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--surface-panel)]">
          <h3 className="text-[10px] font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Backlinks</h3>
          <div className="flex flex-wrap gap-2">
            {file.backlinks.map((bl: string) => (
              <WikiLink key={bl} slug={bl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
