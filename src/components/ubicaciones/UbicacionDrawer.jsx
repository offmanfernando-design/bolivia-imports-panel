import { useEffect, useState } from "react"
import { API_URL } from "../../config/api"
import IdentificarDesconocido from "./IdentificarDesconocido"

const ZONA_LABEL = { local: "Local", terminal: "Terminal", desconocidos: "Desconocidos" }

function formatFecha(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatBs(val) {
  if (val == null) return null
  return `${Number(val).toFixed(2)} Bs`
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{ color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      {children}
    </span>
  )
}

function Campo({ label, value }) {
  if (value == null || value === "") return null
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
        {label}
      </p>
      <p className="text-xs leading-snug" style={{ color: "var(--text-2)" }}>
        {value}
      </p>
    </div>
  )
}

function ItemCard({ item }) {
  const tieneFinanciero =
    item.costo_interno_bs != null ||
    item.cobro_cliente_bs != null ||
    item.margen_bs        != null

  const medidaItems = []
  if (item.tipo_calculo === "kg") {
    if (item.peso_cliente != null) medidaItems.push(["Peso cliente", `${item.peso_cliente} kg`])
    if (item.peso_interno  != null) medidaItems.push(["Peso interno", `${item.peso_interno} kg`])
  } else if (item.tipo_calculo === "unidad" && item.unidades != null) {
    medidaItems.push(["Unidades", String(item.unidades)])
  }

  const hasReferencias = item.tracking_number || item.numero_orden || item.codigo_recepcion
  const hasOperativo   =
    item.categoria_nombre ||
    item.recibido_at ||
    item.fecha_entrega_proveedor ||
    medidaItems.length > 0

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
      {/* Header: cliente + producto */}
      <div className="px-4 py-3"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {item.cliente_nombre}
            </span>
            {item.cliente_telefono && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {item.cliente_telefono}
              </span>
            )}
          </div>
          <p className="text-sm leading-snug line-clamp-2" style={{ color: "var(--text-2)" }}>
            {item.item_descripcion}
            {item.cantidad_solicitada > 1 && (
              <span className="ml-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                ×{item.cantidad_solicitada}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex flex-col gap-3">

        {/* Referencias como chips */}
        {hasReferencias && (
          <div className="flex flex-wrap gap-1.5">
            {item.tracking_number  && <Chip>{item.tracking_number}</Chip>}
            {item.numero_orden     && <Chip>#{item.numero_orden}</Chip>}
            {item.codigo_recepcion && <Chip>{item.codigo_recepcion}</Chip>}
          </div>
        )}

        {/* Operativo: categoría, fechas, medida */}
        {hasOperativo && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <Campo label="Categoría"     value={item.categoria_nombre} />
            <Campo label="Recibido"      value={formatFecha(item.recibido_at)} />
            <Campo label="Entrega prov." value={formatFecha(item.fecha_entrega_proveedor)} />
            {medidaItems.map(([label, value]) => (
              <Campo key={label} label={label} value={value} />
            ))}
          </div>
        )}

        {/* Financiero discreto */}
        {tieneFinanciero && (
          <div className="pt-2.5 mt-0.5 grid grid-cols-3 gap-2"
            style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Costo
              </p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                {formatBs(item.costo_interno_bs) ?? "—"}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Cobro
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                {formatBs(item.cobro_cliente_bs) ?? "—"}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Margen
              </p>
              {item.margen_bs != null ? (
                <p className="text-xs font-semibold"
                  style={{ color: Number(item.margen_bs) > 0 ? "var(--success)" : Number(item.margen_bs) < 0 ? "var(--danger)" : "var(--text-3)" }}>
                  {Number(item.margen_bs) > 0 ? "+" : ""}{formatBs(item.margen_bs)}
                </p>
              ) : (
                <p className="text-xs" style={{ color: "var(--border-strong)" }}>—</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function UbicacionDrawer({ codigo }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  const esDesconocida = Boolean(codigo?.startsWith("D"))

  useEffect(() => {
    if (!codigo) return
    setLoading(true)
    setItems([])

    async function load() {
      try {
        if (esDesconocida) {
          const res  = await fetch(`${API_URL}/operativo/paquetes-desconocidos?estado=pendiente`)
          const json = await res.json()
          setItems((json.data || []).filter(p => p.ubicacion_codigo === codigo))
        } else {
          // Usa inventario como fuente de datos rica; filtra por código exacto
          const res  = await fetch(`${API_URL}/operativo/inventario?q=${encodeURIComponent(codigo)}`)
          const json = await res.json()
          const all  = Array.isArray(json.data) ? json.data : []
          setItems(all.filter(item => item.ubicacion_codigo === codigo))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [codigo, esDesconocida])

  function handleIdentificado(id) {
    setItems(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div className="p-5 flex flex-col gap-4">
        <div className="h-8 w-32 rounded-lg animate-pulse" style={{ background: "var(--surface-3)" }} />
        {[1, 2].map(i => (
          <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    )
  }

  /* ── Zona D: desconocidos ── */
  if (esDesconocida) {
    return (
      <div className="flex flex-col">

        {/* Header — sticky, padding-right clears the X button */}
        <div style={{
          position:     "sticky",
          top:          0,
          zIndex:       2,
          background:   "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
          padding:      "16px 56px 14px 20px",
        }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Ubicación
          </p>
          <p className="text-2xl font-bold font-mono mt-0.5" style={{ color: "var(--text)" }}>{codigo}</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Paquetes sin identificar</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--warning-soft)", color: "var(--warning)", border: "1px solid var(--warning-soft)" }}>
              Desconocidos
            </span>
            <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
              {items.length} {items.length === 1 ? "pendiente" : "pendientes"}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="py-12 text-center rounded-2xl flex flex-col items-center gap-2"
              style={{ border: "1px dashed var(--border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                Sin paquetes pendientes
              </p>
              <p className="text-xs max-w-[220px] leading-relaxed" style={{ color: "var(--text-3)" }}>
                Esta ubicación no tiene paquetes desconocidos pendientes.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map(pd => (
                <IdentificarDesconocido key={pd.id} desconocido={pd} onIdentificado={handleIdentificado} />
              ))}
            </div>
          )}
        </div>

      </div>
    )
  }

  /* ── Zonas normales ── */
  const zona = items[0]?.zona ?? null

  const ZONA_STYLE = {
    local:    { background: "var(--surface-3)", color: "var(--text-2)" },
    terminal: { background: "var(--accent-soft)", color: "var(--accent)" },
  }

  return (
    <div className="flex flex-col">

      {/* Header — sticky, padding-right clears the X button */}
      <div style={{
        position:     "sticky",
        top:          0,
        zIndex:       2,
        background:   "var(--surface-2)",
        borderBottom: "1px solid var(--border)",
        padding:      "16px 56px 14px 20px",
      }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Ubicación
        </p>
        <p className="text-2xl font-bold font-mono mt-0.5" style={{ color: "var(--text)" }}>{codigo}</p>
        <div className="flex items-center gap-2 mt-2">
          {zona && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={ZONA_STYLE[zona] ?? { background: "var(--surface-3)", color: "var(--text-3)" }}>
              {ZONA_LABEL[zona] ?? zona}
            </span>
          )}
          <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
            {items.length} {items.length === 1 ? "ítem" : "ítems"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {items.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Sin ítems en esta ubicación.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <ItemCard key={item.item_id ?? item.recepcion_id} item={item} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
