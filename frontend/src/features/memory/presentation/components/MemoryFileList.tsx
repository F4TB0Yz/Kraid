import { useState, useMemo } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { SearchIcon, PlusIcon } from '../../../../core/presentation/components/icons';
import type { MemoryFileType } from '../../domain/entities/MemoryFile';
import { Skeleton } from '../../../../core/presentation/components/Skeleton';

const FILE_TYPES: Array<{ label: string; value: MemoryFileType | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Profile', value: 'profile' },
  { label: 'Projects', value: 'projects' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'References', value: 'references' },
];

const typeLabels: Record<MemoryFileType, string> = {
  profile: 'Profile',
  projects: 'Projects',
  feedback: 'Feedback',
  references: 'References',
};

const newTypeOptions: Array<{ label: string; value: MemoryFileType }> = [
  { label: 'Profile', value: 'profile' },
  { label: 'Projects', value: 'projects' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'References', value: 'references' },
];

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

const NewMemoryModal = ({ onClose, onCreate }: { onClose: () => void; onCreate: (type: MemoryFileType, title: string) => void }) => {
  const [type, setType] = useState<MemoryFileType>('user');
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(type, title.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 rounded-2xl bg-card p-5 shadow-xl ring-1 ring-border animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 font-serif text-base font-medium text-text">New Memory</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal-warm">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Architecture Decision"
              className="w-full rounded-lg border border-border-warm bg-bg px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-accent placeholder:text-olive-gray"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal-warm">Type</label>
            <div className="flex gap-1.5">
              {newTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    type === opt.value
                      ? 'bg-accent text-ivory'
                      : 'bg-warm-sand text-charcoal-warm hover:bg-border-warm'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs font-medium text-charcoal-warm transition-colors hover:bg-warm-sand">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim()} className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-ivory transition-colors hover:bg-coral disabled:opacity-40">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MemoryFileList = () => {
  const { files, selectFile, isLoading, addFile } = useMemoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MemoryFileType | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);

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

  const handleCreate = async (type: MemoryFileType, title: string) => {
    await addFile(type, title);
  };

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
            className="w-full rounded-lg border border-border bg-bg px-9 py-2 text-sm text-text placeholder-charcoal-warm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 border-b border-border-cream px-4 py-2.5">
        <div className="flex flex-wrap gap-1.5">
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
        <button
          onClick={() => setShowNewModal(true)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-olive-gray transition-colors hover:bg-accent/10 hover:text-accent"
          title="New Memory"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && files.length === 0 ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-charcoal-warm">No files yet</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-2 text-xs text-accent transition-colors hover:text-coral"
            >
              Create your first memory
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-2 py-2">
            {filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => selectFile(file.id)}
                className="group flex w-full flex-col items-start gap-1 border-b border-border-cream px-4 py-3 text-left transition-colors hover:bg-warm-sand"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate font-serif text-sm font-medium text-text">
                    {file.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-warm-silver">
                    {formatRelativeTime(file.lastModified)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-olive-gray capitalize">
                    {typeLabels[file.type]}
                  </span>
                  <span className="text-warm-silver">·</span>
                  <span className="font-mono text-[10px] text-stone-gray">
                    {file.filename}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showNewModal && (
        <NewMemoryModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};
