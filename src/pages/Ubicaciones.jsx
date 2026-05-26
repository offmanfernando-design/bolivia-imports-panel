import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { API_URL } from "../config/api"
import Drawer from "../components/ui/Drawer"
import UbicacionDrawer from "../components/ubicaciones/UbicacionDrawer"
import { normalizarUbicacion } from "../utils/ubicacion"
import useRealtimeEvents from "../hooks/useRealtimeEvents"

/* ── Lógica de agrupación (sin cambios) ─────────────────────── */

function agruparPorEstante(items) {
  const estantes = {}
  items.forEach((u) => {
    const match = u.codigo.match(/^([A-Z]\d+)-(F\d+)$/)
    if (!match) return
    const estante = match[1]
    const fila    = match[2]
    if (!estantes[estante]) estantes[estante] = []
    estantes[estante].push({ fila, paquetes: u.paquetes, codigo: u.codigo })
  })
  return estantes
}

/* ── Estilos de ocupación basados en tokens ─────────────────── */

function getRowStyle(paquetes) {
  const n = Number(paquetes)
  if (n === 0) return {
    background:  "var(--surface-2)",
    border:      "1px solid var(--border)",
    color:       "var(--text-3)",
  }
  if (n <= 5) return {
    background:  "var(--surface)",
    border:      "1px solid var(--border-strong)",
    color:       "var(--text-2)",
  }
  // 6+ ítems: ocupada pero neutro — sin accent para no confundir con búsqueda/hover
  return {
    background:  "var(--surface)",
    border:      "1px solid var(--border-strong)",
    color:       "var(--text)",
  }
}

function getChipStyle(paquetes) {
  const n = Number(paquetes)
  if (n === 0) return { color: "var(--text-3)", fontWeight: 400 }
  if (n <= 5)  return { color: "var(--text-2)", fontWeight: 600 }
  // 6+ ítems: texto fuerte pero neutro
  return { color: "var(--text)", fontWeight: 700 }
}

function paquetesLabel(paquetes) {
  const n = Number(paquetes)
  if (n === 0) return "Libre"
  return `${n} ítem${n === 1 ? "" : "s"}`
}

/* ── Card de estante ─────────────────────────────────────────── */

function ColumnaEstante({ estante, filas, onSelect, matchesPorUbicacion = {}, hasSearch = false }) {
  const filasOrdenadas = [...filas].sort((a, b) =>
    Number(a.fila.slice(1)) - Number(b.fila.slice(1))
  )
  const totalPaquetes = filas.reduce((s, f) => s + (Number(f.paquetes) || 0), 0)
  const filasOcupadas = filas.filter(f => Number(f.paquetes) > 0).length

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background:   "var(--surface)",
        border:       "1px solid var(--border-strong)",
        borderRadius: "10px",
        boxShadow:    "var(--shadow-sm)",
      }}
    >
      {/* Header del estante */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ background: "var(--surface-3)", borderBottom: "1px solid var(--border-strong)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="font-semibold tracking-wide"
            style={{ fontSize: "13px", color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}
          >
            {normalizarUbicacion(estante)}
          </span>
          {filasOcupadas > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "var(--accent-soft)", color: "var(--accent-2)" }}
            >
              {filasOcupadas}/{filas.length}
            </span>
          )}
        </div>
        <span
          className="tabular-nums"
          style={{
            fontSize:   "11px",
            fontFamily: "'Geist Mono', monospace",
            color:      totalPaquetes > 0 ? "var(--text-2)" : "var(--text-3)",
            fontWeight: totalPaquetes > 0 ? 600 : 400,
          }}
        >
          {totalPaquetes > 0 ? `${totalPaquetes} ítem${totalPaquetes === 1 ? "" : "s"}` : "Vacío"}
        </span>
      </div>

      {/* Filas */}
      <div className="p-2 flex flex-col gap-1">
        {filasOrdenadas.map((f) => {
          const coincidencias = hasSearch ? (matchesPorUbicacion[f.codigo] || []) : []
          const shown = coincidencias.slice(0, 2)
          const extra = coincidencias.length - shown.length
          const isMatch = hasSearch && coincidencias.length > 0
          const rowStyle = getRowStyle(f.paquetes)
          const chipStyle = isMatch
            ? { color: "var(--accent)", fontWeight: 700 }
            : getChipStyle(f.paquetes)

          return (
            <button
              key={f.fila}
              type="button"
              onClick={() => onSelect(f.codigo)}
              className="ubicacion-cell flex flex-col gap-1 items-stretch text-left rounded-md cursor-pointer"
              style={{
                ...rowStyle,
                // Accent solo en coincidencia de búsqueda activa
                ...(isMatch && {
                  background:  "var(--accent-soft)",
                  border:      "1px solid var(--accent)",
                  color:       "var(--accent)",
                }),
                padding:      "8px 10px",
                borderRadius: "6px",
                transition:   "background 120ms ease-out, border-color 120ms ease-out",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-semibold tabular-nums"
                  style={{ fontSize: "12px", color: "inherit", fontFamily: "'Geist Mono', monospace" }}
                >
                  {f.fila}
                </span>
                <span
                  className="text-[11px] tabular-nums"
                  style={chipStyle}
                >
                  {paquetesLabel(f.paquetes)}
                </span>
              </div>

              {shown.length > 0 && (
                <div
                  className="flex flex-col gap-0.5 pt-1 mt-0.5"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {shown.map((item, i) => {
                    const parts = [item.cliente_nombre, item.item_descripcion, item.codigo_recepcion].filter(Boolean)
                    return (
                      <p
                        key={i}
                        className="truncate"
                        style={{ fontSize: "10px", lineHeight: 1.4, color: "var(--text-3)" }}
                      >
                        {parts.join(" · ")}
                      </p>
                    )
                  })}
                  {extra > 0 && (
                    <p style={{ fontSize: "10px", color: "var(--text-3)" }}>+{extra} más</p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Resumen de zona ─────────────────────────────────────────── */

function ZonaSummary({ items }) {
  const total    = items.reduce((s, u) => s + (Number(u.paquetes) || 0), 0)
  const ocupadas = items.filter(u => Number(u.paquetes) > 0).length
  return (
    <span
      className="tabular-nums"
      style={{ fontSize: "11px", color: "var(--text-3)" }}
    >
      {total} {total === 1 ? "paquete" : "paquetes"} · {ocupadas}/{items.length} ocupadas
    </span>
  )
}

/* ── Cabecera de sección ─────────────────────────────────────── */

function ZonaHeader({ title, items }) {
  return (
    <div className="flex items-center justify-between">
      <p
        className="font-semibold uppercase"
        style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      "10.5px",
          letterSpacing: "0.12em",
          color:         "var(--text-3)",
        }}
      >
        {title}
      </p>
      <ZonaSummary items={items} />
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────── */

export default function Ubicaciones() {
  const [data,       setData]       = useState([])
  const [inventario, setInventario] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search,     setSearch]     = useState("")

  const load = useCallback(async () => {
    try {
      const [ubicRes, invRes] = await Promise.all([
        fetch(`${API_URL}/operativo/ubicaciones`),
        fetch(`${API_URL}/operativo/inventario?q=`),
      ])
      const [ubicJson, invJson] = await Promise.all([
        ubicRes.json(),
        invRes.json(),
      ])
      setData(ubicJson.data || [])
      setInventario(Array.isArray(invJson.data) ? invJson.data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // SSE: refrescar ubicaciones cuando cambia el inventario
  const sseDebounce = useRef(null)
  useRealtimeEvents((ev) => {
    const RELEVANTES = ["item.updated", "item.received", "item.reverted", "inventory.updated"]
    if (RELEVANTES.includes(ev.type)) {
      clearTimeout(sseDebounce.current)
      sseDebounce.current = setTimeout(load, 500)
    }
  })

  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()

    const directCodigos = new Set(
      data
        .filter(u =>
          u.codigo.toLowerCase().includes(q) ||
          (u.zona && u.zona.toLowerCase().includes(q))
        )
        .map(u => u.codigo)
    )

    const indexCodigos = new Set(
      inventario
        .filter(item =>
          (item.cliente_nombre   && item.cliente_nombre.toLowerCase().includes(q))   ||
          (item.cliente_telefono && item.cliente_telefono.toLowerCase().includes(q)) ||
          (item.item_descripcion && item.item_descripcion.toLowerCase().includes(q)) ||
          (item.tracking_number  && item.tracking_number.toLowerCase().includes(q))  ||
          (item.numero_orden     && item.numero_orden.toLowerCase().includes(q))     ||
          (item.codigo_recepcion && item.codigo_recepcion.toLowerCase().includes(q)) ||
          (item.ubicacion_codigo && item.ubicacion_codigo.toLowerCase().includes(q))
        )
        .map(item => item.ubicacion_codigo)
        .filter(Boolean)
    )

    const codigos = new Set([...directCodigos, ...indexCodigos])
    return data.filter(u => codigos.has(u.codigo))
  }, [data, inventario, search])

  const matchesPorUbicacion = useMemo(() => {
    if (!search.trim()) return {}
    const q = search.toLowerCase()
    const map = {}
    inventario.forEach(item => {
      if (!item.ubicacion_codigo) return
      const isMatch =
        (item.cliente_nombre   && item.cliente_nombre.toLowerCase().includes(q))   ||
        (item.cliente_telefono && item.cliente_telefono.toLowerCase().includes(q)) ||
        (item.item_descripcion && item.item_descripcion.toLowerCase().includes(q)) ||
        (item.tracking_number  && item.tracking_number.toLowerCase().includes(q))  ||
        (item.numero_orden     && item.numero_orden.toLowerCase().includes(q))     ||
        (item.codigo_recepcion && item.codigo_recepcion.toLowerCase().includes(q))
      if (isMatch) {
        if (!map[item.ubicacion_codigo]) map[item.ubicacion_codigo] = []
        map[item.ubicacion_codigo].push(item)
      }
    })
    return map
  }, [inventario, search])

  // CAJA-* son ubicaciones únicas: se excluyen de local/terminal para no contaminar el grid E/T
  const cajas        = filteredData.filter((u) => u.codigo.startsWith("CAJA-"))
  const local        = filteredData.filter((u) => u.zona === "local"        && !u.codigo.startsWith("CAJA-"))
  const terminal     = filteredData.filter((u) => u.zona === "terminal"     && !u.codigo.startsWith("CAJA-"))
  const desconocidos = filteredData.filter((u) => u.zona === "desconocidos" && !u.codigo.startsWith("CAJA-"))

  const estantesLocal    = agruparPorEstante(local)
  const estantesTerminal = agruparPorEstante(terminal)

  function abrirDrawer(codigo) {
    setSelected(codigo)
    setDrawerOpen(true)
  }

  if (loading) {
    return (
      <div className="module-shell">
        <div className="module-header">
          <p className="ui-section-title">Operación</p>
          <h2 className="ui-page-title">Ubicaciones</h2>
        </div>
        <div className="module-body">
          <div className="panel flex-1">
            <div className="scroll-area p-5 flex flex-col gap-4">
              <div className="h-[38px] w-full max-w-sm rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-40 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="module-shell">

      {/* Panel único con buscador arriba */}
      <div className="module-body">
        <div className="panel flex-1">

          {/* Buscador fijo arriba */}
          <div className="panel-header">
            <input
              type="text"
              placeholder="Buscar por cliente, tracking, producto, orden, REC, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ui-input"
            />
          </div>

          <div className="scroll-area p-5 flex flex-col gap-8">

      {/* Local — Santa Cruz */}
      {Object.keys(estantesLocal).length > 0 && (
        <div className="flex flex-col gap-3">
          <ZonaHeader title="Local — Santa Cruz" items={local} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(estantesLocal)
              .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
              .map(([estante, filas]) => (
                <ColumnaEstante
                  key={estante}
                  estante={estante}
                  filas={filas}
                  onSelect={abrirDrawer}
                  matchesPorUbicacion={matchesPorUbicacion}
                  hasSearch={Boolean(search.trim())}
                />
              ))
            }
          </div>
        </div>
      )}

      {/* Terminal — Envíos a departamentos */}
      {Object.keys(estantesTerminal).length > 0 && (
        <div className="flex flex-col gap-3">
          <ZonaHeader title="Terminal — Departamentos" items={terminal} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(estantesTerminal)
              .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
              .map(([estante, filas]) => (
                <ColumnaEstante
                  key={estante}
                  estante={estante}
                  filas={filas}
                  onSelect={abrirDrawer}
                  matchesPorUbicacion={matchesPorUbicacion}
                  hasSearch={Boolean(search.trim())}
                />
              ))
            }
          </div>
        </div>
      )}

      {/* Cajas — Celulares */}
      {cajas.length > 0 && (
        <div className="flex flex-col gap-3">
          <ZonaHeader title="Cajas" items={cajas} />
          <div className="flex gap-2 flex-wrap">
            {[...cajas].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((u) => {
              const n     = Number(u.paquetes)
              const label = u.codigo === "CAJA-LOCAL"
                ? "Caja Local"
                : u.codigo === "CAJA-TERMINAL"
                  ? "Caja Terminal"
                  : u.codigo
              return (
                <button
                  key={u.codigo}
                  type="button"
                  onClick={() => abrirDrawer(u.codigo)}
                  className="flex flex-col items-start gap-1 rounded-md transition-all cursor-pointer"
                  style={{
                    ...getRowStyle(u.paquetes),
                    padding:  "10px 16px",
                    minWidth: "110px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85" }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
                >
                  <span
                    className="font-semibold"
                    style={{ fontSize: "12px", color: "inherit", fontFamily: "'Geist Mono', monospace" }}
                  >
                    {label}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: "10px", ...getChipStyle(n) }}>
                    {paquetesLabel(u.paquetes)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Desconocidos */}
      {desconocidos.length > 0 && (
        <div className="flex flex-col gap-3">
          <ZonaHeader title="Desconocidos" items={desconocidos} />
          <div className="flex gap-2 flex-wrap">
            {desconocidos
              .sort((a, b) => a.codigo.localeCompare(b.codigo))
              .map((u) => {
                const n = Number(u.paquetes)
                return (
                  <button
                    key={u.codigo}
                    type="button"
                    onClick={() => abrirDrawer(u.codigo)}
                    className="flex flex-col items-center gap-1 rounded-md transition-all cursor-pointer"
                    style={{
                      ...getRowStyle(u.paquetes),
                      padding:      "10px 14px",
                      minWidth:     "68px",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    <span
                      className="font-semibold tabular-nums"
                      style={{ fontSize: "12px", fontFamily: "'Geist Mono', monospace", color: "inherit" }}
                    >
                      {u.codigo}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: "10px", ...getChipStyle(n) }}
                    >
                      {paquetesLabel(u.paquetes)}
                    </span>
                  </button>
                )
              })
            }
          </div>
        </div>
      )}

      {/* Empty state */}
      {search && local.length === 0 && terminal.length === 0 && desconocidos.length === 0 && cajas.length === 0 && (
        <div
          className="py-16 text-center text-sm"
          style={{
            color:        "var(--text-3)",
            border:       "1px dashed var(--border)",
            borderRadius: "10px",
          }}
        >
          Sin ubicaciones para &ldquo;{search}&rdquo;
        </div>
      )}

          </div>{/* scroll-area */}
        </div>{/* panel */}
      </div>{/* module-body */}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <UbicacionDrawer codigo={selected} />
      </Drawer>

    </div>
  )
}
