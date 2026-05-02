import React, { useState, useMemo } from 'react';
import { useFileStore } from '../store/fileStore';
import { useWorkspacePanelStore } from '../../../../core/presentation/store/workspacePanelStore';
import { FileTreeNode, typeConfig } from './FileTreeNode';
import { SearchIcon, PlusIcon } from '../../../../core/presentation/components/icons';
import type { FileType, FileTreeNode as FileTreeNodeType } from '../../domain/entities/KraidFile';
import { useFileWatcher } from '../hooks/useFileWatcher';

export const FileExplorer: React.FC = () => {
  useFileWatcher();
  
  const {
    tree,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    expandedNodes,
    toggleNode,
    selectedSlug,
    selectFile,
    createFile,
  } = useFileStore();
  
  const { openTab } = useWorkspacePanelStore();
  
  const handleSelect = (slug: string) => {
    selectFile(slug);
    openTab({ kind: 'file', slug });
  };

  const handleCreate = async () => {
    const title = window.prompt('New file name:');
    if (!title) return;
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) return;
    
    try {
      await createFile({
        slug,
        name: title,
        type: typeFilter || 'note',
        content: `# ${title}\n\n`
      });
      handleSelect(slug);
    } catch (e) {
      console.error(e);
    }
  };

  const filterTree = (nodes: FileTreeNodeType[], query: string, type: FileType | null): FileTreeNodeType[] => {
    if (!query && !type) return nodes;
    
    const q = query.toLowerCase();
    
    return nodes.map(node => {
      const matchName = node.name.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q);
      const matchType = !type || node.type === type;
      
      let filteredChildren: FileTreeNodeType[] = [];
      if (node.children) {
        filteredChildren = filterTree(node.children, query, type);
      }
      
      const hasMatchingChildren = filteredChildren.length > 0;
      
      if ((matchName && matchType) || hasMatchingChildren) {
        return { ...node, children: filteredChildren };
      }
      return null;
    }).filter(Boolean) as FileTreeNodeType[];
  };

  const filteredTree = useMemo(() => filterTree(tree, searchQuery, typeFilter), [tree, searchQuery, typeFilter]);

  return (
    <div className="w-[280px] h-full flex flex-col bg-[var(--surface-base)] border-r border-[var(--border-color)]">
      <div className="p-3 border-b border-[var(--border-color)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Explorer</h2>
          <button
            onClick={handleCreate}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded transition-colors"
            title="Create new file"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-[7px] w-3 h-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--surface-input)] text-[var(--text-primary)] text-[11px] font-mono rounded pl-7 pr-3 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--primary-base)]"
          />
        </div>
        
        <div className="flex flex-wrap gap-1">
          {(Object.entries(typeConfig) as [FileType, { color: string; label: string }][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                typeFilter === type ? config.color : 'text-[var(--text-muted)] bg-[var(--surface-input)] hover:text-[var(--text-primary)]'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {filteredTree.length === 0 ? (
          <div className="text-center text-[11px] font-mono text-[var(--text-muted)] p-4">No files found.</div>
        ) : (
          filteredTree.map(node => (
            <FileTreeNode
              key={node.slug}
              node={node}
              level={0}
              isExpanded={expandedNodes.has(node.slug)}
              isSelected={selectedSlug === node.slug}
              onToggle={toggleNode}
              onSelect={handleSelect}
              expandedNodes={expandedNodes}
              selectedSlug={selectedSlug}
            />
          ))
        )}
      </div>
    </div>
  );
};
