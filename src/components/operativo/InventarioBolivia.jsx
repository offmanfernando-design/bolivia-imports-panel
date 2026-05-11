import { useState, useEffect, useRef } from "react"
import { API_URL } from "../../config/api"

function formatFecha(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatBs(val) {
  if (val == null) return "—"
  return `${Number(val).toFixed(2)} Bs`
}

const ZONA_LABEL = { local: "Local", terminal: "Terminal", desconocidos: "Desc." }
const ZONA_COLOR = {
  local:        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  terminal:     "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  desconocidos: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
}

function Campo({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="ui-label">{label}</p>
      <p className={`text-sm text-neutral-900 dark:text-neutral-100 ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  )
}

function DetalleItem({ row, onClose }) {
  const medida = row.tipo_calculo === "kg"
    ? `${row.peso_cliente ?? "—"} kg cliente / ${row.peso_interno ?? "—"} kg interno`
    : `${row.unidades ?? "—"} unidades`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-neutral-950
        border border-neutral-200 dark:border-neutral-800
        rounded-t-2xl sm:rounded-2xl shadow-2xl
        max-h-[90vh] overflow-y-auto
        p-6 flex flex-col gap-5
      ">

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="ui-section-title">Ítem recibido</p>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {row.item_descripcion}
              {row.cantidad_solicitada > 1 && (
                <span className="ml-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
                  ×{row.cantidad_solicitada}
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition text-lg leading-none flex-shrink-0 mt-0.5"
          >
            ✕
          </button>
        </div>

        <section className="flex flex-col gap-3">
          <p className="ui-subsection-title">Cliente</p>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nombre" value={row.cliente_nombre} />
            <Campo label="Teléfono" value={row.cliente_telefono} />
            <Campo label="Tracking" value={row.tracking_number} mono />
            <Campo label="Orden" value={row.numero_orden} mono />
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <p className="ui-subsection-title">Recepción</p>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Código REC" value={row.codigo_recepcion} mono />
            <Campo label="Fecha Bolivia" value={formatFecha(row.recibido_at)} />
            <Campo label="Ubicación" value={row.ubicacion_codigo} mono />
            <div className="flex flex-col gap-0.5">
              <p className="ui-label">Zona</p>
              {row.zona ? (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium self-start ${ZONA_COLOR[row.zona] ?? ZONA_COLOR.desconocidos}`}>
                  {ZONA_LABEL[row.zona] ?? row.zona}
                </span>
              ) : <p className="text-sm text-neutral-900 dark:text-neutral-100">—</p>}
            </div>
            <Campo label="Categoría" value={row.categoria_nombre} />
            <Campo label="Tipo cálculo" value={row.tipo_calculo} />
          </div>
          <Campo label="Medida" value={medida} />
          {row.notas && <Campo label="Notas" value={row.notas} />}
        </section>

        <section className="flex flex-col gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <p className="ui-subsection-title">Financiero</p>
          <div className="grid grid-cols-3 gap-3">
            <Campo label="Costo interno" value={formatBs(row.costo_interno_bs)} />
            <Campo label="Cobro cliente" value={formatBs(row.cobro_cliente_bs)} />
            <div className="flex flex-col gap-0.5">
              <p className="ui-label">Margen</p>
              <p className={`text-sm font-semibold ${
                row.margen_bs > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : row.margen_bs < 0
                    ? "text-red-500"
                    : "text-neutral-500"
              }`}>
                {formatBs(row.margen_bs)}
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

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

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="ui-section-title">Operativo</p>
          <h2 className="ui-page-title">Inventario Bolivia</h2>
        </div>
        {!loading && (
          <p className="text-xs text-neutral-400">{rows.length} ítem{rows.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="ui-input max-w-md"
          placeholder="Cliente, tracking, REC, descripción, ubicación..."
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

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && rows.length === 0 && !error && (
        <p className="text-sm text-neutral-400">Sin resultados.</p>
      )}

      {rows.length > 0 && (
        <div className="ui-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium">Tracking</th>
                <th className="text-left px-4 py-3 font-medium">Orden</th>
                <th className="text-left px-4 py-3 font-medium">Ítem</th>
                <th className="text-left px-4 py-3 font-medium">REC</th>
                <th className="text-left px-4 py-3 font-medium">Ubicación</th>
                <th className="text-left px-4 py-3 font-medium">Zona</th>
                <th className="text-left px-4 py-3 font-medium">Recepción Bolivia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {rows.map((row) => (
                <tr
                  key={row.item_id}
                  className="ui-row cursor-pointer"
                  onClick={() => setSelected(row)}
                >
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                    {row.cliente_nombre}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {row.cliente_telefono || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                    {row.tracking_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                    {row.numero_orden || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 max-w-[200px] truncate" title={row.item_descripcion}>
                    {row.item_descripcion}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500 whitespace-nowrap">
                    {row.codigo_recepcion || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                    {row.ubicacion_codigo || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.zona ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONA_COLOR[row.zona] ?? ZONA_COLOR.desconocidos}`}>
                        {ZONA_LABEL[row.zona] ?? row.zona}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                    {formatFecha(row.recibido_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetalleItem row={selected} onClose={() => setSelected(null)} />
      )}

    </div>
  )
}
