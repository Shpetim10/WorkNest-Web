'use client';

import { useEffect, useRef } from 'react';
import { StompSubscription } from '@stomp/stompjs';
import { useRealtimeClient } from '@/common/providers/RealtimeProvider';
import { RealtimeEventEnvelope } from '@/common/types/realtime';

export function useRealtimeSubscription(
  destination: string | null,
  onMessage: (envelope: RealtimeEventEnvelope) => void,
) {
  const { client, connected } = useRealtimeClient();
  // Stable ref so the effect closure always calls the latest handler
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!client || !connected || !destination) return;

    let sub: StompSubscription | null = null;

    try {
      sub = client.subscribe(destination, (msg) => {
        try {
          onMessageRef.current(JSON.parse(msg.body) as RealtimeEventEnvelope);
        } catch {
          console.warn('[STOMP] unparseable message', msg.body);
        }
      });
    } catch (err) {
      console.error('[STOMP] subscribe error', err);
    }

    return () => {
      sub?.unsubscribe();
    };
  }, [client, connected, destination]);
}
