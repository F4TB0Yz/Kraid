import { useState, useRef, useEffect } from 'react';
import { MenuIcon, PanelRightIcon, BrainIcon } from '../components/icons';
import { Sidebar } from '../components/Sidebar';
import { StatusBar } from '../components/StatusBar';

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
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-bg p-2 md:p-3 relative">
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 z-40 flex w-64 transform flex-col transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="m-2 flex-1 overflow-hidden rounded-2xl bg-card ring-1 ring-border-warm md:m-3">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        <div
          ref={containerRef}
          className={`flex flex-1 gap-3 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'md:ml-64' : 'ml-0'
          }`}
        >
          <div
            style={{ width: isMobile || !isRightPanelVisible ? '100%' : `${leftWidth}%` }}
            className={`flex min-w-0 flex-shrink-0 flex-col overflow-hidden rounded-none bg-card md:rounded-2xl ${
              isDragging ? '' : 'transition-[width] duration-300 ease-in-out'
            } ${isRightPanelVisible ? 'will-change-[width]' : ''} ring-1 ring-border-warm`}
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
              className="z-20 flex cursor-col-resize items-center justify-center transition-colors"
              style={{ width: '16px' }}
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="h-10 w-0.5 rounded-full transition-colors hover:bg-ring-warm/40 bg-ring-warm/0" />
            </div>
          )}

          <div
            className={`min-w-0 flex-1 overflow-hidden rounded-none bg-card transition-all duration-300 ease-in-out md:rounded-2xl ring-1 ring-border-warm ${
              !isRightPanelVisible ? 'hidden opacity-0' : 'opacity-100'
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
      <StatusBar />
    </div>
  );
};
