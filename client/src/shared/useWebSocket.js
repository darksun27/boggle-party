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
      const ws = new WebSocket(`${proto}//${window.location.host}`);

      ws.onopen = () => {
        setConnected(true);
        wsRef.current = ws;
        if (onConnectRef.current) onConnectRef.current(ws);
      };

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
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
