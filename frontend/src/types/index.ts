// All TypeScript types matching the backend DTOs

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';

export interface HeatReading {
  id: string;
  locationId: string;
  locationName: string;
  temperatureCelsius: number;
  temperatureFahrenheit: number;
  humidityPercent: number;
  heatIndexCelsius: number;
  riskLevel: RiskLevel;
  riskColor: string;
  resolution: string;
  latitude: number;
  longitude: number;
  measuredAt: string;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  latestReading?: HeatReading;
}

export interface HeatAnalysis {
  locationId: string;
  locationName: string;
  currentTemp: number;
  averageTemp: number;
  peakTemp: number;
  riskLevel: string;
  riskColor: string;
  aiInsight: string;
  trendPoints: TrendPoint[];
  analyzedAt: string;
}

export interface TrendPoint {
  timestamp: string;
  temperature: number;
}

export interface Correlation {
  locationA: string;
  locationB: string;
  coefficient: number;
  interpretation: string;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  locationName?: string;
  overallRisk: string;
  averageTemperatureCelsius: number;
  peakTemperatureCelsius: number;
  generatedBy: string;
  modelUsed?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalLocations: number;
  extremeRiskCount: number;
  highRiskCount: number;
  globalAverageTemp: number;
  latestReadings: HeatReading[];
  generatedAt: string;
}

export interface AgentQueryRequest {
  query: string;
  location?: string;
  stream?: boolean;
}
