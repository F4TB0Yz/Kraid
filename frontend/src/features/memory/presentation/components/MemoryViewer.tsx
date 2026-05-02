import { useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { MemoryFileList } from './MemoryFileList';
import { MemoryFileContent } from './MemoryFileContent';

export const MemoryViewer = () => {
  const { loadFiles, selectedFileId } = useMemoryStore();

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  return (
    <div className="flex h-full w-full flex-col bg-card overflow-hidden">
      {!selectedFileId ? (
        <div className="animate-fade-in flex h-full flex-col">
          <MemoryFileList />
        </div>
      ) : (
        <div className="animate-fade-in flex h-full flex-col">
          <MemoryFileContent key={selectedFileId} />
        </div>
      )}
    </div>
  );
};
