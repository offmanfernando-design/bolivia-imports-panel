import { useState } from "react"
import OperativoTable from "../components/operativo/OperativoTable"
import RecepcionCarga from "../components/operativo/RecepcionCarga"
import InventarioBolivia from "../components/operativo/InventarioBolivia"
import Drawer from "../components/ui/Drawer"
import PackageDrawer from "../components/packages/PackageDrawer"

const TABS = [
  { id: "transito",    label: "Confirmaciones" },
  { id: "incidencias", label: "Incidencias Warehouse" },
  { id: "carga",       label: "Carga Bolivia" },
  { id: "inventario",  label: "Inventario Bolivia" },
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
    <div className="module-shell">

      {/* Cabecera */}
      <div className="module-header">
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

      {/* Panel único con tabs + contenido */}
      <div className="module-body">
        <div className="panel flex-1">

          {/* Tabs */}
          <div className="panel-header flex gap-0 overflow-x-auto" style={{ paddingBottom: "0" }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
                style={activeTab === tab.id
                  ? { color: "var(--text)", fontWeight: 600, borderBottom: "2px solid var(--accent)" }
                  : { color: "var(--text-3)", borderBottom: "2px solid transparent" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido del tab activo */}
          <div className="scroll-area p-5">
            {activeTab === "transito" && (
              <OperativoTable onOpenPackage={openPackage} soloConfirmados={false} />
            )}
            {activeTab === "incidencias" && (
              <OperativoTable onOpenPackage={openPackage} soloIncidencias={true} />
            )}
            {activeTab === "carga" && (
              <RecepcionCarga onRecepcionRegistrada={() => setInventarioReloadKey(k => k + 1)} />
            )}
            {activeTab === "inventario" && (
              <InventarioBolivia reloadKey={inventarioReloadKey} />
            )}
          </div>

        </div>
      </div>

      {/* Drawer — global, no depende del tab */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <PackageDrawer pkg={selectedPackage} />
      </Drawer>

    </div>
  )
}
