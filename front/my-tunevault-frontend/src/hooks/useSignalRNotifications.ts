import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { NotificationItem } from '../types';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5067/api').replace(/\/api.*$/, '');
const HUB_URL = `${API_ORIGIN}/notification-hub`;

export function useSignalRNotifications(
  isAuthenticated: boolean,
  onNotification: (notification: NotificationItem) => void
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // SignalR WebSocket không gửi Authorization header → dùng query string
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (payload: NotificationItem) => {
      onNotification(payload);
    });

    connection.start().catch((err) => {
      console.warn('[SignalR] Connection failed:', err);
    });

    connectionRef.current = connection;

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}
