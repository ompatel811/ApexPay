import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

export function useWebSocket() {
  const { token, user } = useAuthStore();
  const { addMessage, updateMessage, setTyping } = useChatStore();
  const socketRef = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!token || isConnectedRef.current) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        isConnectedRef.current = true;
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MESSAGE') {
            addMessage(data.payload);
          } else if (data.type === 'MESSAGE_EDITED' || data.type === 'MESSAGE_DELETED' || data.type === 'REACTION') {
            updateMessage(data.payload);
          } else if (data.type === 'TYPING') {
            setTyping(data.payload.conversationId, data.payload.userId, data.payload.typing);
          }
        } catch {
          // ignore non-json
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        isConnectedRef.current = false;
        setIsConnected(false);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error', err);
      };
    } catch (err) {
      console.error('[WebSocket] Failed to initialize', err);
    }
  }, [token, addMessage, updateMessage, setTyping]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.send(JSON.stringify({
        action: 'typing',
        conversationId,
        userId: user?.id,
        typing: isTyping
      }));
    }
  };

  return { isConnected, sendTyping };
}
