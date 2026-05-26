/**
 * Conexión SSE global compartida para toda la app.
 *
 * - Una sola instancia EventSource activa por aplicación.
 * - Los componentes se suscriben/desuscriben sin abrir conexiones nuevas.
 * - Se conecta al montar el primer suscriptor, se desconecta al quedar sin ninguno.
 * - Reconecta automáticamente si la conexión se cae (onerror + timeout).
 *
 * Uso (desde useRealtimeEvents u otro hook):
 *   subscribeRealtime(listener)    → recibe { type, ...data } por cada evento SSE
 *   unsubscribeRealtime(listener)  → limpia al desmontar el componente
 */

import { API_URL } from "../config/api";

const EVENTS_URL = `${API_URL}/events`;

let es            = null;   // única instancia EventSource
let retryTimeout  = null;   // handle del setTimeout de reconexión
const listeners   = new Set();

function connect() {
  if (es) return; // ya hay una conexión activa o reconectando

  try {
    es = new EventSource(EVENTS_URL);

    es.onmessage = (e) => {
      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        // Ignorar pings y mensajes no-JSON (": ping", ": connected")
        return;
      }
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (err) {
          console.error("[realtime] error en listener:", err);
        }
      }
    };

    es.onerror = () => {
      console.warn("[realtime] conexión perdida, reconectando en 3s…");
      es?.close();
      es = null;
      if (listeners.size > 0) {
        retryTimeout = setTimeout(connect, 3000);
      }
    };
  } catch (err) {
    console.warn("[realtime] no se pudo abrir EventSource:", err);
    es = null;
    if (listeners.size > 0) {
      retryTimeout = setTimeout(connect, 5000);
    }
  }
}

function disconnect() {
  clearTimeout(retryTimeout);
  retryTimeout = null;
  es?.close();
  es = null;
}

/**
 * Registra un listener para recibir eventos SSE.
 * Abre la conexión si aún no existe.
 */
export function subscribeRealtime(listener) {
  listeners.add(listener);
  if (!es) connect();
}

/**
 * Elimina un listener registrado.
 * Cierra la conexión si no queda ningún suscriptor.
 */
export function unsubscribeRealtime(listener) {
  listeners.delete(listener);
  if (listeners.size === 0) {
    disconnect();
  }
}
