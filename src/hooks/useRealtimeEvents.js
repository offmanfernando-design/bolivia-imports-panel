import { useEffect, useLayoutEffect, useRef } from "react";
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

  // Sincronizar ref después de cada render (sin causar re-renders)
  useLayoutEffect(() => {
    onEventRef.current = onEvent;
  });

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
