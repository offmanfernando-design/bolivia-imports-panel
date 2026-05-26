import { useEffect, useRef } from "react";
import { API_URL } from "../config/api";

const EVENTS_URL = `${API_URL}/events`;

/**
 * Hook para recibir eventos en tiempo real vía Server-Sent Events.
 *
 * Uso:
 *   useRealtimeEvents((event) => {
 *     if (event.type === "item.updated") refetch();
 *     if (event.type === "inventory.updated") refetch();
 *   });
 *
 * Reconecta automáticamente si la conexión se cae.
 * Se limpia al desmontar el componente.
 */
export default function useRealtimeEvents(onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let es = null;
    let retryTimeout = null;
    let active = true;

    function connect() {
      if (!active) return;
      try {
        es = new EventSource(EVENTS_URL);

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            onEventRef.current?.(data);
          } catch {
            // Ignorar mensajes no JSON (pings con ": ping")
          }
        };

        es.onerror = () => {
          es?.close();
          es = null;
          if (active) {
            retryTimeout = setTimeout(connect, 3000);
          }
        };
      } catch {
        if (active) {
          retryTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      active = false;
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, []);
}
