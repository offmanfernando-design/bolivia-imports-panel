export default function Badge({ type, children }) {

  const styles = {

    almacen: `
      bg-yellow-100 text-yellow-700 border-yellow-200
      dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20
    `,

    ruta: `
      bg-blue-100 text-blue-700 border-blue-200
      dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20
    `,

    entregado: `
      bg-green-100 text-green-700 border-green-200
      dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20
    `,

    pagado: `
      bg-green-100 text-green-700 border-green-200
      dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20
    `,

    pendiente: `
      bg-red-100 text-red-700 border-red-200
      dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20
    `

  }

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
      ${styles[type]}
      `}
    >

      {children}

    </span>

  )

}