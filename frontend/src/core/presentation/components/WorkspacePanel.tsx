import { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkspacePanelStore, type WorkspaceTabId, tabKey } from '../store/workspacePanelStore';
import { useCanvasStore } from '../../../features/canvas/presentation/store/canvasStore';
import { useFileStore } from '../../../features/files/presentation/store/fileStore';
import { useChatStore } from '../../../features/chat/presentation/store/chatStore';
import { CanvasDocumentView } from '../../../features/canvas/presentation/components/MarkdownCanvas';
import { FileContent } from '../../../features/files/presentation/components/FileContent';
import { FileExplorer } from '../../../features/files/presentation/components/FileExplorer';
import { FileIcon, BrainIcon, CloseIcon, PlusIcon } from './icons';

const WorkspaceTab = ({
  tabId,
  isActive,
  onSelect,
  onClose,
}: {
  tabId: WorkspaceTabId;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}) => {
  const canvasDocs = useCanvasStore((s) => s.documents);
  const files = useFileStore((s) => s.files);

  const title =
    tabId.kind === 'canvas'
      ? canvasDocs.find((d) => d.id === tabId.documentId)?.title ?? 'Untitled'
      : tabId.kind === 'file'
      ? files.find((f) => f.slug === tabId.slug)?.name ?? tabId.slug
      : 'Explorer';

  const Icon = tabId.kind === 'canvas' ? FileIcon : BrainIcon;
  const isMemory = tabId.kind === 'file' || tabId.kind === 'file-explorer';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={`group flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
        isActive
          ? 'border-b-2 border-accent text-accent'
          : 'text-charcoal-warm hover:text-text hover:bg-warm-sand'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate max-w-[100px]">{title}</span>
      {isMemory && (
        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium text-olive-gray bg-warm-sand">
          Agent
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="rounded p-0.5 text-warm-silver opacity-0 transition-opacity group-hover:opacity-100 hover:text-charcoal-warm"
      >
        <CloseIcon className="h-3 w-3" />
      </button>
    </div>
  );
};

export const WorkspacePanel = () => {
  const { openTabIds, activeTabId, focusTab, closeTab } = useWorkspacePanelStore();
  const { addDocument } = useCanvasStore();

  const { sendMessage } = useChatStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        addButtonRef.current &&
        !addButtonRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCanvasDoc = useCallback(async () => {
    setShowDropdown(false);
    await addDocument('Untitled');
    const newId = useCanvasStore.getState().activeDocumentId;
    if (newId) {
      focusTab({ kind: 'canvas', documentId: newId });
    }
  }, [addDocument, focusTab]);

  const handleMemoryFile = useCallback(() => {
    setShowDropdown(false);
    focusTab({ kind: 'file-explorer' });
  }, [focusTab]);


  const handleConsolidate = useCallback(() => {
    if (!activeTabId || activeTabId.kind !== 'canvas') return;
    const doc = useCanvasStore
      .getState()
      .documents.find((d) => d.id === activeTabId.documentId);
    if (!doc) return;
    const msg = `Consolidate this canvas document into memory:\n\nTitle: ${doc.title}\n\n${doc.content}`;
    void sendMessage(msg);
  }, [activeTabId, sendMessage]);

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      <div className="flex shrink-0 items-center border-b border-border-cream bg-card">
        <div className="flex flex-1 overflow-x-auto">
          {openTabIds.map((tabId) => (
            <WorkspaceTab
              key={tabKey(tabId)}
              tabId={tabId}
              isActive={activeTabId !== null && tabKey(tabId) === tabKey(activeTabId)}
              onSelect={() => focusTab(tabId)}
              onClose={() => closeTab(tabId)}
            />
          ))}
        </div>

        {activeTabId?.kind === 'canvas' && (
          <button
            onClick={handleConsolidate}
            className="flex shrink-0 items-center gap-1 px-3 py-2 text-xs font-medium text-olive-gray transition-colors hover:text-accent"
          >
            <BrainIcon className="h-3.5 w-3.5" />
            Consolidate
          </button>
        )}

        <div className="relative shrink-0">
          <button
            ref={addButtonRef}
            onClick={() => setShowDropdown((prev) => !prev)}
            className="px-3 py-2 text-xs text-olive-gray transition-colors hover:text-accent"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl bg-card shadow-lg ring-1 ring-border animate-scale-in"
            >
              <button
                onClick={handleCanvasDoc}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-charcoal-warm transition-colors hover:bg-warm-sand rounded-t-xl"
              >
                <FileIcon className="h-3.5 w-3.5" />
                Canvas Document
              </button>
              <button
                onClick={handleMemoryFile}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-charcoal-warm transition-colors hover:bg-warm-sand rounded-b-xl"
              >
                <BrainIcon className="h-3.5 w-3.5" />
                Memory Explorer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeTabId ? (
          activeTabId.kind === 'canvas' ? (
            <CanvasDocumentView
              key={`canvas:${activeTabId.documentId}`}
              documentId={activeTabId.documentId}
            />
          ) : activeTabId.kind === 'file' ? (
            <FileContent
              key={`file:${activeTabId.slug}`}
              slug={activeTabId.slug}
            />
          ) : (
            <FileExplorer
              key="file-explorer"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg">
            <p className="text-sm text-olive-gray">Open a tab to get started</p>
          </div>
        )}
      </div>

    </div>
  );
};
