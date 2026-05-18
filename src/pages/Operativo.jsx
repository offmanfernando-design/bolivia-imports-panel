import { useState } from "react"
import OperativoTable from "../components/operativo/OperativoTable"
import RecepcionCarga from "../components/operativo/RecepcionCarga"
import InventarioBolivia from "../components/operativo/InventarioBolivia"
import Drawer from "../components/ui/Drawer"
import PackageDrawer from "../components/packages/PackageDrawer"

const TABS = [
  { id: "transito",   label: "Confirmaciones" },
  { id: "carga",      label: "Carga Bolivia" },
  { id: "inventario", label: "Inventario Bolivia" },
]

export default function Operativo() {
  const [activeTab,          setActiveTab]          = useState("transito")
  const [selectedPackage,    setSelectedPackage]    = useState(null)
  const [drawerOpen,         setDrawerOpen]         = useState(false)
  const [inventarioReloadKey, setInventarioReloadKey] = useState(0)

  const openPackage = (pkg) => {
    setSelectedPackage(pkg)
    setDrawerOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Cabecera */}
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Operaciones
        </p>
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          Operativo
        </h2>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Seguimiento, recepción e inventario
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto scrollbar-none"
        style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors"
            style={activeTab === tab.id
              ? { color: "var(--text)", fontWeight: 600, borderBottom: "2px solid var(--accent)", marginBottom: "-1px" }
              : { color: "var(--text-3)", borderBottom: "2px solid transparent" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      <div>
        {activeTab === "transito" && (
          <OperativoTable onOpenPackage={openPackage} />
        )}
        {activeTab === "carga" && (
          <RecepcionCarga onRecepcionRegistrada={() => setInventarioReloadKey(k => k + 1)} />
        )}
        {activeTab === "inventario" && (
          <InventarioBolivia reloadKey={inventarioReloadKey} />
        )}
      </div>

      {/* Drawer — global, no depende del tab */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <PackageDrawer pkg={selectedPackage} />
      </Drawer>

    </div>
  )
}
