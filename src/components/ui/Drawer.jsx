import { createPortal } from "react-dom"

/**
 * Drawer — contenedor de paneles y modales
 *
 * Props:
 *   open      — boolean
 *   onClose   — función de cierre
 *   children  — contenido
 *   variant   — "modal" (default) | "side"
 *
 * variant="modal"  → panel centrado con scale-in (comportamiento actual)
 * variant="side"   → side panel desde la derecha con slide-right
 *
 * Retrocompatible: sin variant, se comporta exactamente igual que antes.
 */
export default function Drawer({ open, onClose, children, variant = "modal" }) {

  if (!open) return null

  if (variant === "side") {
    return createPortal(

      <div className="fixed inset-0 z-[9999]">

        {/* OVERLAY */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />

        {/* SIDE PANEL */}
        <div className="
          absolute inset-y-0 right-0
          w-full sm:w-[540px]
          bg-white dark:bg-neutral-900
          border-l border-neutral-200 dark:border-neutral-800
          flex flex-col overflow-hidden
          ui-slide-right
        "
          style={{ boxShadow: "-20px 0 60px -15px rgba(0,0,0,0.15)" }}
        >
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>

      </div>,

      document.body
    )
  }

  /* ── variant="modal" — comportamiento por defecto ───────── */
  return createPortal(

    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

      {/* OVERLAY */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* PANEL */}
      <div className="
        relative
        bg-white dark:bg-neutral-900
        rounded-2xl
        border border-neutral-200 dark:border-neutral-800
        w-full h-full
        sm:h-[90vh] sm:w-[90vw]
        lg:w-[1000px]
        overflow-hidden
        ui-scale-in
      "
        style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.4)" }}
      >
        <div className="h-full overflow-y-auto p-8">
          {children}
        </div>
      </div>

    </div>,

    document.body
  )

}
