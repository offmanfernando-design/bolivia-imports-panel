/**
 * StatCard — tarjeta de métrica del dashboard
 *
 * Props:
 *   title   — etiqueta de la métrica
 *   value   — valor principal
 *   icon    — ícono (elemento JSX)
 *   accent  — color del ícono: "cyan" | "emerald" | "amber" | "neutral" (default)
 *             Prop opcional y retrocompatible — si no se pasa, usa "neutral"
 */
export default function StatCard({ title, value, icon, accent = "neutral" }) {

  const accentStyles = {
    cyan: `
      bg-cyan-50 text-cyan-600
      dark:bg-cyan-500/10 dark:text-cyan-400
      group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/20
    `,
    emerald: `
      bg-emerald-50 text-emerald-600
      dark:bg-emerald-500/10 dark:text-emerald-400
      group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20
    `,
    amber: `
      bg-amber-50 text-amber-600
      dark:bg-amber-500/10 dark:text-amber-400
      group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20
    `,
    neutral: `
      bg-neutral-100 text-neutral-500
      dark:bg-neutral-800 dark:text-neutral-400
      group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700
    `,
  }

  const iconStyle = accentStyles[accent] ?? accentStyles.neutral

  return (
    <div className="ui-card ui-fade-up group">

      <div className="flex items-start justify-between gap-4">

        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="ui-section-title truncate">
            {title}
          </p>
          <p className="
            text-3xl font-semibold tracking-tight
            text-neutral-900 dark:text-neutral-100
            leading-none
          ">
            {value}
          </p>
        </div>

        <div className={`
          flex items-center justify-center flex-shrink-0
          w-11 h-11
          rounded-xl
          transition-all duration-200
          ${iconStyle}
        `}>
          {icon}
        </div>

      </div>

    </div>
  )

}
