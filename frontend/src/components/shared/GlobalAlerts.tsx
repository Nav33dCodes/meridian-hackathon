'use client';

import { useEffect, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { toast } from 'sonner';

export function GlobalAlerts() {
  const [connection, setConnection] = useState<any>(null);

  useEffect(() => {
    let newConnection: any = null;
    const connect = async () => {
      try {
        newConnection = new HubConnectionBuilder()
          .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5250'}/hubs/heat`)
          .configureLogging(LogLevel.Warning)
          .withAutomaticReconnect()
          .build();

        newConnection.on('ReceiveHeatAlert', (alert: any) => {
          // Show a high-priority toast when an Extreme risk comes in
          toast.error(`EXTREME HEAT ALERT: ${alert.locationName}`, {
            description: `Temperature spiked to ${alert.temperature.toFixed(1)}°C. Immediate monitoring advised.`,
            duration: 10000,
            style: {
              background: 'var(--risk-extreme)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
            }
          });
        });

        await newConnection.start();
        setConnection(newConnection);
      } catch (err) {
        console.error('SignalR Connection Error: ', err);
      }
    };

    connect();

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  return null; // Hidden component
}
