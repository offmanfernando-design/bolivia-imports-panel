/**
 * Badge — indicador de estado semántico
 *
 * Tonos (basados en tokens CSS Premium Slate Ops):
 *   neutral  → surface-2 / text-2           (default, contadores)
 *   accent   → accent-soft / accent-2        (en tránsito, en proceso)
 *   success  → success-soft / success        (recibida, completado)
 *   warning  → warning-soft / warning        (pendiente, atención)
 *   danger   → danger-soft / danger          (crítico, vencido)
 *
 * Tipos legacy (retrocompatibilidad):
 *   almacen, en_almacen, warehouse, pendiente  → warning
 *   entregado, pagado, recibido, recibido_bolivia, success, compra_registrada → success
 *   ruta, en_transito, reparto, info  → accent
 *   error  → danger
 *   solicitud  → accent
 *   empresa  → accent (teal distingue empresa vs cliente)
 *   default  → neutral
 *
 * Prop dot (opcional): muestra un punto de color antes del texto
 * Prop variant (opcional): "sm" | "square" para tamaño/forma alternativa
 */
export default function Badge({ type, children, dot = false, variant }) {

  const toneMap = {
    /* ── Éxito / completado ── */
    entregado:        "success",
    pagado:           "success",
    recibido:         "success",
    recibido_bolivia: "success",
    success:          "success",
    compra_registrada:"success",

    /* ── Proceso / tránsito ── */
    ruta:             "accent",
    en_transito:      "accent",
    reparto:          "accent",
    info:             "accent",
    solicitud:        "accent",
    empresa:          "accent",

    /* ── Atención / pendiente ── */
    pendiente:        "warning",
    almacen:          "warning",
    en_almacen:       "warning",
    warehouse:        "warning",
    warning:          "warning",

    /* ── Error / crítico ── */
    error:            "danger",

    /* ── Neutral ── */
    default:          "neutral",
  };

  const tone = toneMap[type] ?? "neutral";

  const toneStyles = {
    neutral: {
      background: "var(--surface-2)",
      color:      "var(--text-2)",
    },
    accent: {
      background: "var(--accent-soft)",
      color:      "var(--accent-2)",
    },
    success: {
      background: "var(--success-soft)",
      color:      "var(--success)",
    },
    warning: {
      background: "var(--warning-soft)",
      color:      "var(--warning)",
    },
    danger: {
      background: "var(--danger-soft)",
      color:      "var(--danger)",
    },
  };

  const style = toneStyles[tone];

  const isSmall  = variant === "sm";
  const isSquare = variant === "square";

  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           "5px",
        padding:       isSmall ? "2px 7px" : "3px 9px",
        borderRadius:  isSquare ? "4px" : "99px",
        fontSize:      isSmall ? "10.5px" : "11.5px",
        fontWeight:    600,
        lineHeight:    1.3,
        letterSpacing: isSquare ? "0.04em" : undefined,
        textTransform: isSquare ? "uppercase" : undefined,
        whiteSpace:    "nowrap",
        background:    style.background,
        color:         style.color,
      }}
    >
      {dot && (
        <span
          style={{
            width:        "5px",
            height:       "5px",
            borderRadius: "50%",
            background:   "currentColor",
            flexShrink:   0,
            opacity:      0.8,
          }}
        />
      )}
      {children}
    </span>
  );
}
