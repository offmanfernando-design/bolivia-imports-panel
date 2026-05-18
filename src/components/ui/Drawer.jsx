import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Drawer — contenedor de paneles y modales
 *
 * Props:
 *   open      — boolean
 *   onClose   — función de cierre
 *   children  — contenido
 *   variant   — "modal" (default) | "side"
 */
export default function Drawer({ open, onClose, children, variant = "modal" }) {

  if (!open) return null;

  /* ── variant="side" — slide desde la derecha ──────────── */
  if (variant === "side") {
    return createPortal(
      <div className="fixed inset-0 z-[9999]">

        {/* Overlay */}
        <div
          onClick={onClose}
          className="absolute inset-0 ui-fade"
          style={{ background: "rgba(11,16,20,0.36)", backdropFilter: "blur(2px)" }}
        />

        {/* Panel */}
        <div
          className="absolute inset-y-0 right-0 w-full sm:w-[560px] flex flex-col overflow-hidden ui-slide-right"
          style={{
            background: "var(--surface)",
            borderLeft: "1px solid var(--border-strong)",
            boxShadow:  "var(--shadow-lg)",
          }}
        >
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>

      </div>,
      document.body
    );
  }

  /* ── variant="modal" — panel centrado ─────────────────── */
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 ui-fade"
      style={{ background: "rgba(11,16,20,0.36)", backdropFilter: "blur(2px)" }}
    >

      <div
        onClick={onClose}
        className="absolute inset-0"
      />

      <div
        className="relative flex flex-col overflow-hidden ui-scale-in"
        style={{
          background:    "var(--surface)",
          borderRadius:  "14px",
          border:        "1px solid var(--border-strong)",
          width:         "100%",
          maxWidth:      "800px",
          maxHeight:     "90vh",
          boxShadow:     "var(--shadow-lg)",
        }}
      >

        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full transition-colors"
          style={{
            width:      "30px",
            height:     "30px",
            background: "var(--surface-2)",
            color:      "var(--text-2)",
            border:     "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-3)";
            e.currentTarget.style.color      = "var(--text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
            e.currentTarget.style.color      = "var(--text-2)";
          }}
          aria-label="Cerrar"
        >
          <X size={13} />
        </button>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

      </div>

    </div>,
    document.body
  );

}
