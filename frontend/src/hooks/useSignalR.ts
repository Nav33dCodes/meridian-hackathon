import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSignalR() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5250';

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${url}/hubs/heat`)
      .withAutomaticReconnect()
      .build();

    // Listen for full heat reading payload to do manual zero-latency cache updates
    connection.on('ReceiveHeatReading', (reading: any) => {
      // Update dashboard cache
      queryClient.setQueryData(['dashboard'], (oldData: any) => {
        if (!oldData || !oldData.latestReadings) return oldData;

        const newReadings = [...oldData.latestReadings];
        const existingIndex = newReadings.findIndex(r => r.locationId === reading.locationId);
        if (existingIndex >= 0) newReadings[existingIndex] = reading;
        else newReadings.unshift(reading);

        // Recalculate stats
        const extremeRiskCount = newReadings.filter(r => r.riskLevel === 'Extreme').length;
        const highRiskCount = newReadings.filter(r => r.riskLevel === 'High').length;
        const globalAverageTemp = newReadings.reduce((sum, r) => sum + r.temperatureCelsius, 0) / newReadings.length;

        return {
          ...oldData,
          latestReadings: newReadings,
          extremeRiskCount,
          highRiskCount,
          globalAverageTemp,
          totalLocations: newReadings.length
        };
      });

      // Update locations cache if needed (less critical for instant UI, but good for sync)
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    });

    connection.on('HeatReadingsUpdated', () => {
      // Legacy fallback
    });

    // Fallback: If connection drops and reconnects, we might have missed events, so refetch everything
    connection.onreconnected(() => {
      console.log('SignalR Reconnected! Refetching stale data...');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    });

    connection.start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.error('SignalR Connection Error: ', err));

    return () => {
      connection.stop();
    };
  }, [queryClient]);
}
