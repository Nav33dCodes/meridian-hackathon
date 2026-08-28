import { create } from 'zustand';
import type { Location, DashboardSummary } from '@/types';

interface AppState {
  selectedLocation: Location | null;
  dashboard: DashboardSummary | null;
  isAgentStreaming: boolean;
  agentMessages: AgentMessage[];
  setSelectedLocation: (location: Location | null) => void;
  setDashboard: (data: DashboardSummary) => void;
  setAgentStreaming: (val: boolean) => void;
  addAgentMessage: (msg: AgentMessage) => void;
  clearAgentMessages: () => void;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useAppStore = create<AppState>((set) => ({
  selectedLocation: null,
  dashboard: null,
  isAgentStreaming: false,
  agentMessages: [],
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setDashboard: (data) => set({ dashboard: data }),
  setAgentStreaming: (val) => set({ isAgentStreaming: val }),
  addAgentMessage: (msg) => set((s) => ({ agentMessages: [...s.agentMessages, msg] })),
  clearAgentMessages: () => set({ agentMessages: [] }),
}));
