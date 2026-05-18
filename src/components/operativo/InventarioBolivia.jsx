import { useState, useEffect, useRef, useMemo } from "react"
import { API_URL } from "../../config/api"

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

const ZONA_LABEL = { local: "Local", terminal: "Terminal", desconocidos: "Desc." }
const ZONA_STYLE = {
  local:        { background: "var(--surface-3)", color: "var(--text-2)" },
  terminal:     { background: "var(--accent-soft)", color: "var(--accent)" },
  desconocidos: { background: "var(--surface-2)", color: "var(--text-3)" },
}

function ZonaPill({ zona }) {
  if (!zona) return <span className="text-xs" style={{ color: "var(--text-3)" }}>—</span>
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={ZONA_STYLE[zona] ?? ZONA_STYLE.desconocidos}>
      {ZONA_LABEL[zona] ?? zona}
    </span>
  )
}

function MargenVal({ margen }) {
  if (margen == null) return <span style={{ color: "var(--border-strong)" }}>—</span>
  const n = Number(margen)
  return (
    <span className="text-[11px] font-semibold"
      style={{ color: n > 0 ? "var(--success)" : n < 0 ? "var(--danger)" : "var(--text-3)" }}>
      {n > 0 ? "+" : ""}{formatBs(margen)}
    </span>
  )
}


/* ── Sección del modal ───────────────────────────────────── */
function Sección({ titulo, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function CampoGrid({ items }) {
  const visible = items.filter(([, v]) => v != null && v !== "")
  if (!visible.length) return null
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {visible.map(([label, value, mono]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            {label}
          </p>
          <p className={`text-sm leading-snug ${mono ? "font-mono" : ""}`} style={{ color: "var(--text-2)" }}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ── Modal detalle ───────────────────────────────────────── */
function DetalleItem({ row, onClose }) {

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

        {/* ── Header sticky ── */}
        <div className="sticky top-0 z-10 px-6 py-4"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-3)" }}>
                Producto
              </p>
              <h3 className="text-base font-bold leading-tight" style={{ color: "var(--text)" }}>
                {row.item_descripcion}
                {row.cantidad_solicitada > 1 && (
                  <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-3)" }}>×{row.cantidad_solicitada}</span>
                )}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>{row.cliente_nombre}</span>
                {row.cliente_telefono && (
                  <span className="text-sm" style={{ color: "var(--text-3)" }}>{row.cliente_telefono}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface-3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
            >✕</button>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Ubicación */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Ubicación</p>
              <p className="text-xl font-bold font-mono leading-none" style={{ color: "var(--text)" }}>
                {row.ubicacion_codigo || "—"}
              </p>
            </div>
            <ZonaPill zona={row.zona} />
          </div>

          {/* Referencias */}
          <Sección titulo="Referencias">
            <CampoGrid items={[
              ["Tracking",  row.tracking_number,                              true],
              ["Orden",     row.numero_orden ? `#${row.numero_orden}` : null, true],
              ["Recepción", row.codigo_recepcion,                             true],
            ]} />
          </Sección>

          {/* Operativo */}
          <Sección titulo="Operativo">
            <CampoGrid items={[
              ["Recibido Bolivia",  formatFecha(row.recibido_at),             false],
              ["Entrega proveedor", formatFecha(row.fecha_entrega_proveedor), false],
              ["Categoría",        row.categoria_nombre,                      false],
              ["Tipo cálculo",     row.tipo_calculo,                          false],
            ]} />
          </Sección>

          {/* Medidas */}
          {(
            (row.tipo_calculo === "kg"      && (row.peso_cliente != null || row.peso_interno != null)) ||
            (row.tipo_calculo === "unidad"  && row.unidades != null) ||
            row.notas
          ) && (
            <Sección titulo="Medidas">
              {row.tipo_calculo === "kg" && (
                <>
                  <CampoGrid items={[
                    ["Peso cliente", row.peso_cliente != null ? `${row.peso_cliente} kg` : null, false],
                    ["Peso interno", row.peso_interno != null ? `${row.peso_interno} kg` : null, false],
                  ]} />
                  {row.peso_cliente != null && row.peso_interno == null && (
                    <p className="text-[11px] italic" style={{ color: "var(--text-3)" }}>Sin peso interno registrado</p>
                  )}
                </>
              )}
              {row.tipo_calculo === "unidad" && row.unidades != null && (
                <CampoGrid items={[["Unidades", String(row.unidades), false]]} />
              )}
              {row.notas && (
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Notas</p>
                  <p className="text-sm leading-snug" style={{ color: "var(--text-2)" }}>{row.notas}</p>
                </div>
              )}
            </Sección>
          )}

          {/* Financiero */}
          {(row.costo_interno_bs != null || row.cobro_cliente_bs != null) && (
            <Sección titulo="Financiero">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Costo interno", value: formatBs(row.costo_interno_bs) },
                  { label: "Cobro cliente", value: formatBs(row.cobro_cliente_bs) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl px-3 py-2.5 flex flex-col gap-1"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>{value ?? "—"}</p>
                  </div>
                ))}
                <div className="rounded-xl px-3 py-2.5 flex flex-col gap-1"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Margen</p>
                  <MargenVal margen={row.margen_bs} />
                </div>
              </div>
            </Sección>
          )}

        </div>
      </div>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────── */
export default function InventarioBolivia({ reloadKey = 0 }) {
  const [q, setQ]               = useState("")
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)
  const debounceRef             = useRef(null)

  async function fetchInventario(query) {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${API_URL}/operativo/inventario?q=${encodeURIComponent(query)}`)
      const json = await res.json()
      setRows(Array.isArray(json.data) ? json.data : [])
    } catch {
      setError("Error al cargar inventario")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventario(q)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  function handleChange(e) {
    const val = e.target.value
    setQ(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchInventario(val), 350)
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      clearTimeout(debounceRef.current)
      fetchInventario(q)
    }
  }

  /* Métricas rápidas */
  const stats = useMemo(() => {
    if (!rows.length) return null
    const local    = rows.filter(r => r.zona === "local").length
    const terminal = rows.filter(r => r.zona === "terminal").length
    return { total: rows.length, local, terminal }
  }, [rows])

  return (
    <div className="flex flex-col gap-5">

      {/* Header + buscador */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Inventario Bolivia
        </h3>
        <div className="flex items-center gap-2">
          <input
            className="ui-input w-64 sm:w-80"
            placeholder="Cliente, tracking, REC, descripción..."
            value={q}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <button
            className="ui-button whitespace-nowrap"
            onClick={() => { clearTimeout(debounceRef.current); fetchInventario(q) }}
            disabled={loading}
          >
            {loading ? "..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      {stats && !loading && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
            <span className="font-semibold" style={{ color: "var(--text-2)" }}>{stats.total}</span> ítems en inventario
          </span>
          {stats.local > 0 && (
            <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
              <span className="font-semibold">{stats.local}</span> local
            </span>
          )}
          {stats.terminal > 0 && (
            <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
              <span className="font-semibold">{stats.terminal}</span> terminal
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm rounded-xl p-3"
          style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-[60px] rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="py-16 text-center text-sm rounded-2xl"
          style={{ color: "var(--text-3)", border: "1px dashed var(--border)" }}>
          {q ? "Sin resultados para la búsqueda." : "No hay ítems en inventario."}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          {/* ─── Tabla desktop ─────────────────────────────── */}
          <div className="hidden md:block">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Cliente", "Producto", "Referencias", "Ubicación · Zona", "Fechas"].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "var(--text-3)" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: "none" }}>
                  {rows.map((row, ri) => (
                    <tr
                      key={row.item_id}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer transition-colors"
                      style={{ borderTop: ri > 0 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Cliente */}
                      <td className="px-4 py-3 whitespace-nowrap align-top">
                        <p className="font-semibold leading-snug" style={{ color: "var(--text)" }}>
                          {row.cliente_nombre}
                        </p>
                        {row.cliente_telefono && (
                          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{row.cliente_telefono}</p>
                        )}
                      </td>

                      {/* Producto */}
                      <td className="px-4 py-3 max-w-[210px] align-top">
                        <p className="leading-snug line-clamp-2" title={row.item_descripcion} style={{ color: "var(--text-2)" }}>
                          {row.item_descripcion}
                          {row.cantidad_solicitada > 1 && (
                            <span className="ml-1.5" style={{ color: "var(--text-3)" }}>×{row.cantidad_solicitada}</span>
                          )}
                        </p>
                        {row.categoria_nombre && (
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{row.categoria_nombre}</p>
                        )}
                      </td>

                      {/* Referencias */}
                      <td className="px-4 py-3 whitespace-nowrap align-top">
                        {row.tracking_number && (
                          <p className="font-mono text-xs leading-snug" style={{ color: "var(--text-2)" }}>{row.tracking_number}</p>
                        )}
                        {row.numero_orden && (
                          <p className="text-[11px] font-mono" style={{ color: "var(--text-3)" }}>#{row.numero_orden}</p>
                        )}
                        {row.codigo_recepcion && (
                          <p className="text-[11px] font-mono" style={{ color: "var(--text-3)" }}>{row.codigo_recepcion}</p>
                        )}
                        {!row.tracking_number && !row.numero_orden && !row.codigo_recepcion && (
                          <span className="text-xs" style={{ color: "var(--border-strong)" }}>—</span>
                        )}
                      </td>

                      {/* Ubicación · Zona */}
                      <td className="px-4 py-3 whitespace-nowrap align-top">
                        <p className="font-mono font-bold text-base leading-snug" style={{ color: "var(--text)" }}>
                          {row.ubicacion_codigo || "—"}
                        </p>
                        <div className="mt-1">
                          <ZonaPill zona={row.zona} />
                        </div>
                      </td>

                      {/* Fechas */}
                      <td className="px-4 py-3 whitespace-nowrap align-top">
                        {formatFecha(row.recibido_at) ? (
                          <div className="flex flex-col gap-0.5 mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Recibido</span>
                            <span className="text-xs" style={{ color: "var(--text-2)" }}>{formatFecha(row.recibido_at)}</span>
                          </div>
                        ) : null}
                        {row.fecha_entrega_proveedor ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Entrega prov.</span>
                            <span className="text-xs" style={{ color: "var(--text-3)" }}>{formatFecha(row.fecha_entrega_proveedor)}</span>
                          </div>
                        ) : null}
                        {!formatFecha(row.recibido_at) && !row.fecha_entrega_proveedor && (
                          <span className="text-xs" style={{ color: "var(--border-strong)" }}>—</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Cards mobile ──────────────────────────────── */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <button
                key={row.item_id}
                type="button"
                onClick={() => setSelected(row)}
                className="w-full text-left rounded-2xl overflow-hidden transition-shadow"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="px-4 py-3 flex items-start justify-between gap-3"
                  style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{row.cliente_nombre}</p>
                    {row.numero_orden && (
                      <p className="text-[11px] font-mono" style={{ color: "var(--text-3)" }}>#{row.numero_orden}</p>
                    )}
                  </div>
                  <ZonaPill zona={row.zona} />
                </div>
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  <p className="text-sm line-clamp-2" style={{ color: "var(--text-2)" }}>
                    {row.item_descripcion}
                    {row.cantidad_solicitada > 1 && (
                      <span className="ml-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>×{row.cantidad_solicitada}</span>
                    )}
                  </p>
                  {row.tracking_number && (
                    <p className="font-mono text-xs" style={{ color: "var(--text-3)" }}>{row.tracking_number}</p>
                  )}
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-3"
                  style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                  <span className="font-mono text-xs font-bold" style={{ color: "var(--text)" }}>
                    {row.ubicacion_codigo || "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    <ZonaPill zona={row.zona} />
                    <span className="text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>
                      {formatFecha(row.recibido_at) ?? "—"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <DetalleItem row={selected} onClose={() => setSelected(null)} />
      )}

    </div>
  )
}
