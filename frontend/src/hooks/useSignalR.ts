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

    connection.on('HeatReadingsUpdated', () => {
      console.log('Real-time update received: Heat readings ingested!');
      toast.success('Live update: New heat data ingested!');

      // Invalidate relevant queries to trigger an immediate background refetch
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
