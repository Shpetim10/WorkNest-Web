'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { createStompClient } from '@/common/network/realtime-client';

interface RealtimeContextValue {
  client: Client | null;
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ client: null, connected: false });

export function useRealtimeClient(): RealtimeContextValue {
  return useContext(RealtimeContext);
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  // Keep a stable ref so the cleanup closure can deactivate the right instance
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const stompClient = createStompClient();

    stompClient.onConnect = () => {
      setConnected(true);
      // Expose the connected client to consumers
      setClient(stompClient);
    };

    stompClient.onDisconnect = () => {
      setConnected(false);
    };

    stompClient.onWebSocketClose = () => {
      setConnected(false);
    };

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      clientRef.current?.deactivate();
      clientRef.current = null;
      setClient(null);
      setConnected(false);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ client, connected }}>
      {children}
    </RealtimeContext.Provider>
  );
}
