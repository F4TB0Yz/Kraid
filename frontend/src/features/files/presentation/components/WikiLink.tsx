import React from 'react';
import { useWorkspacePanelStore } from '../../../../core/presentation/store/workspacePanelStore';

interface WikiLinkProps {
  slug: string;
}

export const WikiLink: React.FC<WikiLinkProps> = ({ slug }) => {
  const { openTab } = useWorkspacePanelStore();

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    openTab({ kind: 'file', slug });
  };

  return (
    <a
      href={`#${slug}`}
      onClick={handleNavigate}
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors mx-1 no-underline border border-blue-500/20"
      title={`Go to ${slug}`}
    >
      {slug}
    </a>
  );
};
