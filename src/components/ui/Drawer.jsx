import { createPortal } from "react-dom"

export default function Drawer({ open, onClose, children }) {

  if (!open) return null

  return createPortal(

    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

      {/* OVERLAY */}

      <div
        onClick={onClose}
        className="
        absolute inset-0
        bg-black/40
        backdrop-blur-md
        transition-opacity duration-300
        "
      />

      {/* PANEL */}

      <div
        className="
        relative
        bg-white dark:bg-neutral-950
        rounded-2xl
        shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]
        border border-neutral-200 dark:border-neutral-800
        w-full
        h-full
        sm:h-[90vh]
        sm:w-[90vw]
        lg:w-[1000px]
        overflow-hidden
        animate-[fadeIn_.25s_ease]
        "
      >

        <div className="h-full overflow-y-auto p-8">
          {children}
        </div>

      </div>

    </div>,

    document.body

  )

}