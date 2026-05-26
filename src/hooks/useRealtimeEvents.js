import { useEffect, useRef } from "react";
import { subscribeRealtime, unsubscribeRealtime } from "../lib/realtimeClient";

/**
 * Hook para recibir eventos en tiempo real vía Server-Sent Events.
 *
 * Usa una sola conexión SSE global compartida por toda la app.
 * No abre una nueva conexión por componente — solo registra un listener.
 *
 * Uso:
 *   useRealtimeEvents((event) => {
 *     if (event.type === "item.updated") refetch();
 *     if (event.type === "inventory.updated") refetch();
 *   });
 *
 * Se limpia automáticamente al desmontar el componente.
 */
export default function useRealtimeEvents(onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const listener = (data) => {
      onEventRef.current?.(data);
    };

    subscribeRealtime(listener);

    return () => {
      unsubscribeRealtime(listener);
    };
  }, []);
}
