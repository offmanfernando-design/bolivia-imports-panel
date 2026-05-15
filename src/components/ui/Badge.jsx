/**
 * Badge — indicador de estado semántico
 *
 * Tipos existentes (no eliminar):
 *   almacen, en_almacen, ruta, entregado, pagado, pendiente,
 *   recibido_bolivia, warning, success, info, default
 *
 * Tipos nuevos agregados:
 *   en_transito, reparto, recibido, warehouse, compra_registrada,
 *   solicitud, empresa, error
 *
 * Prop dot (opcional): muestra un punto de color antes del texto
 */
export default function Badge({ type, children, dot = false }) {

  const styles = {

    /* ── Logístico: completado / positivo ─────────────────── */

    entregado: `
      bg-emerald-50 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,
    pagado: `
      bg-emerald-50 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,
    recibido: `
      bg-emerald-50 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,
    recibido_bolivia: `
      bg-emerald-50 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,
    success: `
      bg-emerald-50 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,
    compra_registrada: `
      bg-emerald-50 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,

    /* ── Logístico: proceso / tránsito / información ─────── */

    ruta: `
      bg-cyan-50 text-cyan-700 border-cyan-200
      dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20
    `,
    en_transito: `
      bg-cyan-50 text-cyan-700 border-cyan-200
      dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20
    `,
    reparto: `
      bg-cyan-50 text-cyan-700 border-cyan-200
      dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20
    `,
    info: `
      bg-cyan-50 text-cyan-700 border-cyan-200
      dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20
    `,

    /* ── Logístico: pendiente / atención / warehouse ────────
       NOTA: pendiente es amber (atención, no error).
             Solo "error" / "critico" van en rojo.           */

    pendiente: `
      bg-amber-50 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,
    almacen: `
      bg-amber-50 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,
    en_almacen: `
      bg-amber-50 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,
    warehouse: `
      bg-amber-50 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,
    warning: `
      bg-amber-50 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,

    /* ── Error / crítico ────────────────────────────────────── */

    error: `
      bg-red-50 text-red-700 border-red-200
      dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20
    `,

    /* ── Referencia interna / solicitud ─────────────────────── */

    solicitud: `
      bg-indigo-50 text-indigo-700 border-indigo-200
      dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20
    `,

    /* ── Comprado por empresa ────────────────────────────────── */

    empresa: `
      bg-purple-50 text-purple-700 border-purple-200
      dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20
    `,

    /* ── Neutral / sin estado relevante ─────────────────────── */

    default: `
      bg-neutral-100 text-neutral-600 border-neutral-200
      dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700
    `,

  }

  const base = styles[type] ?? styles.default

  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5
        text-[11px] font-medium
        rounded-full
        border
        transition-colors duration-150
        ${base}
      `}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
      )}
      {children}
    </span>
  )

}
