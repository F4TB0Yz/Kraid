import React from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '../../../../core/presentation/components/icons';
import type { FileTreeNode as FileTreeNodeType, FileType } from '../../domain/entities/KraidFile';

export const typeConfig: Record<FileType, { color: string; label: string }> = {
  profile: { color: 'text-purple-400 bg-purple-400/10', label: 'Profile' },
  project: { color: 'text-blue-400 bg-blue-400/10', label: 'Project' },
  task: { color: 'text-green-400 bg-green-400/10', label: 'Task' },
  note: { color: 'text-yellow-400 bg-yellow-400/10', label: 'Note' },
  reference: { color: 'text-indigo-400 bg-indigo-400/10', label: 'Reference' },
  feedback: { color: 'text-rose-400 bg-rose-400/10', label: 'Feedback' },
};

interface FileTreeNodeProps {
  node: FileTreeNodeType;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (slug: string) => void;
  onSelect: (slug: string) => void;
  expandedNodes: Set<string>;
  selectedSlug: string | null;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  expandedNodes,
  selectedSlug,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const config = typeConfig[node.type];

  return (
    <div className="w-full flex flex-col font-mono text-[11px]">
      <div
        className={`flex items-center py-1.5 pr-2 cursor-pointer hover:bg-[var(--surface-hover)] select-none transition-colors ${
          isSelected ? 'bg-[var(--surface-active)] border-l border-white/20' : 'border-l border-transparent'
        }`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={() => onSelect(node.slug)}
      >
        <div
          className="w-4 h-4 flex items-center justify-center mr-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onToggle(node.slug);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />
          ) : (
            <span className="w-3 h-3" /> // spacer
          )}
        </div>
        
        <div className={`mr-2 w-2 h-2 rounded-full ${config.color.split(' ')[1]}`} />
        <span className={`truncate ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`} title={node.name}>
          {node.name}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.slug}
              node={child}
              level={level + 1}
              isExpanded={expandedNodes.has(child.slug)}
              isSelected={selectedSlug === child.slug}
              onToggle={onToggle}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              selectedSlug={selectedSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
};
