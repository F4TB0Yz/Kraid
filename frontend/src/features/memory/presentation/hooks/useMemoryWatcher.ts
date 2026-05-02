import { useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';

export const useMemoryWatcher = () => {
  const loadFiles = useMemoryStore((state) => state.loadFiles);

  useEffect(() => {
    void loadFiles();

    const eventSource = new EventSource('http://localhost:8000/api/memory/stream');

    eventSource.addEventListener('memory_changed', () => {
      void loadFiles();
    });

    eventSource.onerror = (error) => {
      console.error('Memory event stream failed:', error);
      // EventSource auto-reconnects by default
    };

    return () => {
      eventSource.close();
    };
  }, [loadFiles]);
};
