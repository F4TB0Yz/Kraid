import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { API_BASE } from '../../../../core/config';

export const useFileWatcher = () => {
  const loadFiles = useFileStore((state) => state.loadFiles);
  const loadTree = useFileStore((state) => state.loadTree);

  useEffect(() => {
    void loadFiles();
    void loadTree();

    const eventSource = new EventSource(`${API_BASE}/api/files/stream`);

    eventSource.addEventListener('file_changed', () => {
      void loadFiles();
      void loadTree();
    });

    eventSource.onerror = (error) => {
      console.error('File event stream failed:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [loadFiles, loadTree]);
};
