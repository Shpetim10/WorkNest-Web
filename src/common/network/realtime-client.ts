import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
}

export function createStompClient(): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${getApiBaseUrl()}/ws`),
    reconnectDelay: 5000,
    onStompError: (frame) => {
      console.error('[STOMP] error', frame.headers['message'], frame.body);
    },
  });

  // Called before every STOMP CONNECT frame — initial connect and every
  // automatic reconnect — so token rotation written by the Axios silent-refresh
  // path is always picked up without restarting the provider.
  client.beforeConnect = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  };

  return client;
}
