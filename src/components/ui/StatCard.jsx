/**
 * StatCard — tarjeta de KPI del dashboard
 *
 * Props:
 *   title   — etiqueta de la métrica (kicker mono)
 *   value   — valor principal
 *   icon    — ícono (elemento JSX)
 *   accent  — "teal" | "success" | "warning" | "neutral"
 */
export default function StatCard({ title, value, icon, accent = "neutral" }) {

  const lineColors = {
    teal:    "var(--accent)",
    cyan:    "var(--accent)",      // alias legacy
    success: "var(--success)",
    emerald: "var(--success)",     // alias legacy
    warning: "var(--warning)",
    amber:   "var(--warning)",     // alias legacy
    neutral: "var(--text-3)",
  };

  const iconBgColors = {
    teal:    "var(--accent-soft)",
    cyan:    "var(--accent-soft)",
    success: "var(--success-soft)",
    emerald: "var(--success-soft)",
    warning: "var(--warning-soft)",
    amber:   "var(--warning-soft)",
    neutral: "var(--surface-2)",
  };

  const iconTextColors = {
    teal:    "var(--accent)",
    cyan:    "var(--accent)",
    success: "var(--success)",
    emerald: "var(--success)",
    warning: "var(--warning)",
    amber:   "var(--warning)",
    neutral: "var(--text-2)",
  };

  const lineColor    = lineColors[accent]    ?? lineColors.neutral;
  const iconBgColor  = iconBgColors[accent]  ?? iconBgColors.neutral;
  const iconTxtColor = iconTextColors[accent] ?? iconTextColors.neutral;

  return (
    <div
      className="relative overflow-hidden ui-fade-up"
      style={{
        background:    "var(--surface)",
        border:        "1px solid var(--border)",
        borderRadius:  "10px",
        padding:       "18px",
        boxShadow:     "var(--shadow-sm)",
        transition:    "border-color 140ms ease-out, box-shadow 140ms ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.boxShadow   = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow   = "var(--shadow-sm)";
      }}
    >
      {/* Línea de acento superior */}
      <div
        className="absolute top-0 left-[18px] w-8 rounded-b-full"
        style={{ height: "2.5px", background: lineColor }}
      />

      <div className="flex items-end justify-between gap-4 mt-1">

        <div className="flex flex-col gap-2 min-w-0">
          <p
            className="uppercase truncate"
            style={{
              fontFamily:    "'Geist Mono', ui-monospace, monospace",
              fontSize:      "10.5px",
              fontWeight:    600,
              letterSpacing: "0.14em",
              color:         "var(--text-3)",
            }}
          >
            {title}
          </p>
          <p
            className="leading-none tabular-nums"
            style={{
              fontSize:      "26px",
              fontWeight:    600,
              letterSpacing: "-0.025em",
              color:         "var(--text)",
            }}
          >
            {value}
          </p>
        </div>

        <div
          className="flex items-center justify-center flex-shrink-0 rounded-xl"
          style={{
            width:      "42px",
            height:     "42px",
            background: iconBgColor,
            color:      iconTxtColor,
          }}
        >
          {icon}
        </div>

      </div>
    </div>
  );

}
