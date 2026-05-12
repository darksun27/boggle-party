import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(onMessage, onConnect) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  onMessageRef.current = onMessage;
  onConnectRef.current = onConnect;

  useEffect(() => {
    let reconnectTimer = null;

    function connect() {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}`;
      console.log('[WS] Connecting to', url);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setConnected(true);
        wsRef.current = ws;
        if (onConnectRef.current) {
          console.log('[WS] Calling onConnect callback');
          onConnectRef.current(ws);
        } else {
          console.log('[WS] No onConnect callback set');
        }
      };

      ws.onmessage = (e) => {
        console.log('[WS] Received:', e.data);
        try { onMessageRef.current(JSON.parse(e.data)); } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('[WS] Error:', e);
      };

      ws.onclose = (e) => {
        console.log('[WS] Closed, code:', e.code, 'reason:', e.reason);
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const send = useCallback((msg) => {
    console.log('[WS] Sending:', msg, 'readyState:', wsRef.current && wsRef.current.readyState);
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
