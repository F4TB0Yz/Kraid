import React from 'react';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftWidth?: string;
  showRightPanel?: boolean;
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  leftPanel,
  rightPanel,
  leftWidth = '35%',
  showRightPanel = true,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      <div style={{ width: leftWidth }} className="flex-shrink-0 border-r border-border">
        {leftPanel}
      </div>
      {showRightPanel && <div className="flex-1">{rightPanel}</div>}
    </div>
  );
};
