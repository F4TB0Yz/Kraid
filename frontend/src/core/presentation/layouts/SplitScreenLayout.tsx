import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, PanelRightIcon, BrainIcon } from '../components/icons';
import { Sidebar } from '../components/Sidebar';

type RightPanelMode = 'canvas' | 'memory' | 'closed';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  memoryPanel: React.ReactNode;
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  leftPanel,
  rightPanel,
  memoryPanel,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('closed');
  const [leftWidth, setLeftWidth] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setRightPanelMode('closed');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftWidth(Math.min(Math.max(newWidth, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const isRightPanelVisible = rightPanelMode !== 'closed';

  const handleCanvasToggle = () =>
    setRightPanelMode((prev) => (prev === 'canvas' ? 'closed' : 'canvas'));

  const handleMemoryToggle = () =>
    setRightPanelMode((prev) => (prev === 'memory' ? 'closed' : 'memory'));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg p-2 md:p-3 relative">
      <div
        className={`absolute inset-y-0 left-0 z-40 flex w-64 transform flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 m-2 md:m-3 rounded-2xl ring-1 ring-border-warm overflow-hidden bg-card">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex h-full flex-1 gap-3 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div
          style={{ width: isMobile || !isRightPanelVisible ? '100%' : `${leftWidth}%` }}
          className={`flex h-full flex-shrink-0 flex-col bg-card z-10 min-w-0 ${isDragging ? '' : 'transition-[width] duration-300 ease-in-out'} ${isRightPanelVisible ? 'will-change-[width]' : ''} rounded-none md:rounded-2xl ring-1 ring-border-warm overflow-hidden`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between bg-bg px-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-warm transition-colors hover:bg-warm-sand hover:text-text"
              aria-label="Toggle Sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCanvasToggle}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  rightPanelMode === 'canvas' ? 'bg-accent/10 text-accent' : 'text-charcoal-warm hover:bg-warm-sand hover:text-text'
                }`}
                aria-label="Toggle Canvas"
              >
                <PanelRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleMemoryToggle}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  rightPanelMode === 'memory' ? 'bg-accent/10 text-accent' : 'text-charcoal-warm hover:bg-warm-sand hover:text-text'
                }`}
                aria-label="Toggle Memory Viewer"
              >
                <BrainIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {leftPanel}
          </div>
        </div>

        {!isMobile && isRightPanelVisible && (
          <div
            className="flex items-center justify-center cursor-col-resize transition-colors z-20"
            style={{ width: '16px' }}
            onMouseDown={() => setIsDragging(true)}
          >
            <div className="h-10 w-0.5 rounded-full transition-colors bg-ring-warm/0 hover:bg-ring-warm/40" />
          </div>
        )}

        <div
          className={`min-w-0 flex-1 bg-card transition-all duration-300 ease-in-out rounded-none md:rounded-2xl ring-1 ring-border-warm overflow-hidden ${
            !isRightPanelVisible ? 'opacity-0 hidden' : 'opacity-100'
          }`}
        >
          {rightPanelMode === 'canvas' && rightPanel}
          {rightPanelMode === 'memory' && memoryPanel}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="absolute inset-0 z-30 bg-charcoal/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
