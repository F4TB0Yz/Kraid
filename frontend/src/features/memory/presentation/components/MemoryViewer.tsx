import { useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { MemoryFileList } from './MemoryFileList';
import { MemoryFileContent } from './MemoryFileContent';

export const MemoryViewer = () => {
  const { loadFiles } = useMemoryStore();

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  return (
    <div className="flex h-full w-full bg-card">
      <MemoryFileList />
      <MemoryFileContent />
    </div>
  );
};
