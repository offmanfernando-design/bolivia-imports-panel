export default function Badge({ type, children }) {

  const styles = {

    /* ---- estados logísticos ---- */

    almacen: `
      bg-amber-100 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,

    en_almacen: `
      bg-amber-100 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,

    ruta: `
      bg-blue-100 text-blue-700 border-blue-200
      dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20
    `,

    entregado: `
      bg-emerald-100 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,

    pagado: `
      bg-emerald-100 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,

    pendiente: `
      bg-red-100 text-red-700 border-red-200
      dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20
    `,

    recibido_bolivia: `
      bg-blue-100 text-blue-700 border-blue-200
      dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20
    `,

    /* ---- genéricos ---- */

    warning: `
      bg-amber-100 text-amber-700 border-amber-200
      dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
    `,

    success: `
      bg-emerald-100 text-emerald-700 border-emerald-200
      dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
    `,

    info: `
      bg-blue-100 text-blue-700 border-blue-200
      dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20
    `,

    default: `
      bg-neutral-100 text-neutral-600 border-neutral-200
      dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700
    `,

  }

  const base = styles[type] ?? styles.default

  return (

    <span
      className={`
      inline-flex
      items-center
      px-2.5 py-1
      text-xs
      font-medium
      rounded-md
      border
      transition-colors
      ${base}
      `}
    >

      {children}

    </span>

  )

}
