/**
 * Normaliza códigos de ubicación para visualización.
 *
 * Los datos en DB usan T5/T6 (estantes físicos 5 y 6 del depósito terminal).
 * En el sistema se muestran como T1/T2 para simplificar la nomenclatura.
 *
 * No modifica la base de datos — solo afecta rendering.
 * SQL de corrección permanente disponible si se decide migrar la DB.
 */
export function normalizarUbicacion(codigo) {
  if (!codigo) return "—"
  return String(codigo)
    .replace(/^T5(-|$)/i, "T1$1")
    .replace(/^T6(-|$)/i, "T2$1")
}

/**
 * Desnormaliza un código de ubicación para enviar al backend.
 * Convierte T1→T5, T2→T6 (inverso de normalizarUbicacion).
 * Usar antes de llamar al API con un código que el usuario editó.
 */
export function desnormalizarUbicacion(codigo) {
  if (!codigo) return codigo
  return String(codigo)
    .replace(/^T1(-|$)/i, "T5$1")
    .replace(/^T2(-|$)/i, "T6$1")
}
