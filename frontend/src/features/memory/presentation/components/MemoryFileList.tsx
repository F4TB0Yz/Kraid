import { useState, useMemo } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { SearchIcon } from '../../../../core/presentation/components/icons';
import type { MemoryFileType } from '../../domain/entities/MemoryFile';

const FILE_TYPES: Array<{ label: string; value: MemoryFileType | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'User', value: 'user' },
  { label: 'Project', value: 'project' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Reference', value: 'reference' },
];

const typeStyles: Record<MemoryFileType, { dot: string; badge: string }> = {
  user: { dot: 'bg-blue-400', badge: 'bg-blue-400/10 text-blue-600' },
  project: { dot: 'bg-accent', badge: 'bg-accent/10 text-accent' },
  feedback: { dot: 'bg-amber-400', badge: 'bg-amber-400/10 text-amber-700' },
  reference: { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-700' },
};

const typeLabels: Record<MemoryFileType, string> = {
  user: 'User',
  project: 'Project',
  feedback: 'Feedback',
  reference: 'Reference',
};

const formatRelativeTime = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString([], { dateStyle: 'medium' });
};

export const MemoryFileList = () => {
  const { files, selectedFileId, selectFile } = useMemoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MemoryFileType | 'all'>('all');

  const filteredFiles = useMemo(() => {
    let result = files;
    if (activeFilter !== 'all') {
      result = result.filter((f) => f.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(lower) ||
          f.filename.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [files, activeFilter, searchQuery]);

  return (
    <div className="flex w-[280px] shrink-0 flex-col border-r border-border-cream bg-card">
      <div className="border-b border-border-cream px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text">Memory Files</h3>
          <span className="rounded-full bg-warm-sand px-2 py-0.5 text-xs text-olive-gray">
            {files.length}
          </span>
        </div>
      </div>

      <div className="border-b border-border-cream px-4 py-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-warm" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-bg border border-border px-9 py-2 text-sm text-text placeholder-charcoal-warm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex gap-1.5 border-b border-border-cream px-4 py-2.5 flex-wrap">
        {FILE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveFilter(t.value)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              activeFilter === t.value
                ? 'bg-accent/10 text-accent'
                : 'text-charcoal-warm hover:bg-warm-sand hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-charcoal-warm">
            {searchQuery || activeFilter !== 'all' ? 'No matching files' : 'No files yet'}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 px-2 py-2">
            {filteredFiles.map((file) => {
              const styles = typeStyles[file.type];
              return (
                <button
                  key={file.id}
                  onClick={() => selectFile(file.id)}
                  className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selectedFileId === file.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-charcoal-warm hover:bg-warm-sand hover:text-text'
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {file.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight ${styles.badge}`}
                      >
                        {typeLabels[file.type]}
                      </span>
                      <span className="text-[11px] text-olive-gray">
                        {formatRelativeTime(file.lastModified)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
