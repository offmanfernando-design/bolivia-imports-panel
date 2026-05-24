// En producción (build sin VITE_API_URL) usa ruta relativa → funciona con cualquier host/dominio
// En desarrollo con VITE_API_URL definida en .env.development → apunta al backend local
export const API_URL = import.meta.env.VITE_API_URL || "/api"
