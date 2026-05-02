import { useState, useRef, useEffect } from 'react';
import { MenuIcon, PanelRightIcon } from '../components/icons';
import { Sidebar } from '../components/Sidebar';
import { StatusBar } from '../components/StatusBar';
import { WorkspacePanel } from '../components/WorkspacePanel';
import { useSidebarStore } from '../store/sidebarStore';
import { useWorkspacePanelStore } from '../store/workspacePanelStore';

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  leftPanel,
}) => {
  const [leftWidth, setLeftWidth] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { sidebarOpen, toggleSidebar } = useSidebarStore();
  const { isOpen, togglePanel } = useWorkspacePanelStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      useWorkspacePanelStore.getState().closePanel();
    }
  }, [isMobile]);

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

  const isRightPanelVisible = isOpen;

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-bg p-2 md:p-3 relative">
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`
            flex shrink-0 flex-col overflow-hidden transition-[width,opacity,transform] duration-300 ease-in-out z-40
            ${isMobile
              ? 'fixed inset-y-0 left-0 h-full'
              : 'relative h-full'
            }
            ${sidebarOpen
              ? (isMobile ? 'w-64 translate-x-0' : 'w-64 opacity-100')
              : (isMobile ? 'w-64 -translate-x-full' : 'w-0 opacity-0')
            }
          `}
        >
          <div className="m-2 flex-1 overflow-hidden rounded-2xl bg-card ring-1 ring-border-warm md:my-3 md:ml-3 md:mr-0">
            <Sidebar onClose={() => isMobile && useSidebarStore.getState().closeSidebar()} />
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex flex-1 gap-3 pb-7 transition-all duration-300 ease-in-out ml-0"
        >
          <div
            style={{ width: isMobile || !isRightPanelVisible ? '100%' : `${leftWidth}%` }}
            className={`flex min-w-0 flex-shrink-0 flex-col overflow-hidden bg-transparent ${
              isDragging ? '' : 'transition-[width] duration-300 ease-in-out'
            } ${isRightPanelVisible ? 'will-change-[width]' : ''}`}
          >
            <div className="flex h-14 shrink-0 items-center justify-between bg-transparent px-3">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-warm transition-colors hover:bg-warm-sand hover:text-text"
                aria-label="Toggle Sidebar"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={togglePanel}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    isOpen ? 'bg-accent/10 text-accent' : 'text-charcoal-warm hover:bg-warm-sand hover:text-text'
                  }`}
                  aria-label="Toggle Workspace"
                >
                  <PanelRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
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
            <WorkspacePanel />
          </div>
        </div>

        {isMobile && sidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-charcoal/20 backdrop-blur-sm"
            onClick={() => useSidebarStore.getState().closeSidebar()}
          />
        )}
      </div>
      <StatusBar />
    </div>
  );
};
