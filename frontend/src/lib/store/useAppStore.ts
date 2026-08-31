import { create } from 'zustand';
import type { Location, DashboardSummary } from '@/types';

interface AppState {
  selectedLocation: Location | null;
  dashboard: DashboardSummary | null;
  isAgentStreaming: boolean;
  agentMessages: AgentMessage[];
  /** Thermal Vision: re-skins the app as an infrared sensor feed. Toggled with `T`. */
  thermal: boolean;
  setThermal: (val: boolean) => void;
  toggleThermal: () => void;
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
  // Starts false to match the server-rendered HTML; ThermalController reconciles
  // it with the stored preference on mount, after the pre-paint script has
  // already set the attribute so there is no flash.
  thermal: false,
  setThermal: (val) => set({ thermal: val }),
  toggleThermal: () => set((s) => ({ thermal: !s.thermal })),
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setDashboard: (data) => set({ dashboard: data }),
  setAgentStreaming: (val) => set({ isAgentStreaming: val }),
  addAgentMessage: (msg) => set((s) => ({ agentMessages: [...s.agentMessages, msg] })),
  clearAgentMessages: () => set({ agentMessages: [] }),
}));
