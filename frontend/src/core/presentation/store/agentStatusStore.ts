import { create } from 'zustand';

export type AgentStatus = 'idle' | 'thinking' | 'running_tool' | 'streaming';

interface AgentStatusState {
  status: AgentStatus;
  activeTool: string | null;
  modelName: string;
  contextFiles: number;
  gitBranch: string;
  setStatus: (status: AgentStatus) => void;
  setActiveTool: (tool: string | null) => void;
  setModelName: (name: string) => void;
  setContextFiles: (count: number) => void;
}

export const useAgentStatusStore = create<AgentStatusState>((set) => ({
  status: 'idle',
  activeTool: null,
  modelName: 'Kraid',
  contextFiles: 0,
  gitBranch: 'main',
  setStatus: (status) => set({ status }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setModelName: (modelName) => set({ modelName }),
  setContextFiles: (contextFiles) => set({ contextFiles }),
}));
