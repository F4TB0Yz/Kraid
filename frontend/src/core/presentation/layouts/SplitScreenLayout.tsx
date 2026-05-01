import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, PanelRightIcon } from '../components/icons';
import { Sidebar } from '../components/Sidebar';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  leftPanel,
  rightPanel,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(42); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCanvasOpen(false);
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
      // Constrain width between 20% and 80%
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg relative">
      {/* Sidebar Overlay (Mobile) / Push (Desktop) */}
      <div 
        className={`absolute inset-y-0 left-0 z-40 flex w-64 transform flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className={`flex h-full flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div
          style={{ width: isMobile || !canvasOpen ? '100%' : `${leftWidth}%` }}
          className="flex h-full flex-shrink-0 flex-col bg-card z-10 transition-[width] duration-300 ease-in-out"
        >
          {/* Left Panel Top Toolbar */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-charcoal-warm transition-colors hover:bg-warm-sand hover:text-text"
              aria-label="Toggle Sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setCanvasOpen(!canvasOpen)}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                canvasOpen ? 'bg-accent/10 text-accent' : 'text-charcoal-warm hover:bg-warm-sand hover:text-text'
              }`}
              aria-label="Toggle Canvas"
            >
              <PanelRightIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {leftPanel}
          </div>
        </div>
        
        {/* Draggable Divider */}
        {!isMobile && canvasOpen && (
          <div
            className="w-1 cursor-col-resize hover:bg-accent/50 active:bg-accent transition-colors z-20 flex items-center justify-center"
            onMouseDown={() => setIsDragging(true)}
          >
            <div className="h-8 w-1 rounded-full bg-border" />
          </div>
        )}

        {/* Right Panel (Canvas) */}
        <div 
          className={`min-w-0 flex-1 bg-bg transition-all duration-300 ease-in-out ${
            !canvasOpen ? 'opacity-0 hidden' : 'opacity-100'
          }`}
        >
          {rightPanel}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="absolute inset-0 z-30 bg-charcoal/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
