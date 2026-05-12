import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let reconnectTimer = null;
    let ws = null;

    function connect() {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}`);

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        try { onMessageRef.current(JSON.parse(e.data)); } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
