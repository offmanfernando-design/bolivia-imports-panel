import { useState, useEffect, useRef } from "react"
import { API_URL } from "../config/api"
import Badge from "../components/ui/Badge"

function formatFecha(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}


export default function SolicitudesTerminal() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [q,       setQ]       = useState("")
  const debounceRef = useRef(null)

  useEffect(() => {
    fetch(`${API_URL}/receptores/solicitudes-terminal`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(json => { setRows(json.data); setLoading(false) })
      .catch(() => { setError("Error cargando solicitudes"); setLoading(false) })
  }, [])

  function handleSearch(val) {
    setQ(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQ(val), 200)
  }

  const filtered = q.trim()
    ? rows.filter(r => {
        const term = q.toLowerCase()
        return (
          (r.cliente_nombre    || "").toLowerCase().includes(term) ||
          (r.destino           || "").toLowerCase().includes(term) ||
          (r.referencia        || "").toLowerCase().includes(term) ||
          (r.nombre_receptor   || "").toLowerCase().includes(term) ||
          (r.telefono_receptor || "").toLowerCase().includes(term)
        )
      })
    : rows

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            Solicitudes Terminal
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Datos enviados desde el formulario de coordinación de envío
          </p>
        </div>
        {!loading && !error && (
          <span className="text-sm text-neutral-400 dark:text-neutral-500 flex-shrink-0">
            {filtered.length} {filtered.length === 1 ? "solicitud" : "solicitudes"}
          </span>
        )}
      </div>

      {/* BÚSQUEDA */}
      <input
        placeholder="Buscar por cliente, destino, referencia, receptor o teléfono..."
        value={q}
        onChange={e => handleSearch(e.target.value)}
        className="w-full md:max-w-md px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200
          placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
      />

      {/* LOADING */}
      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30
          px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-800 px-6 py-12 text-center">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {q.trim() ? "Sin resultados para la búsqueda." : "No hay solicitudes registradas aún."}
          </p>
        </div>
      )}

      {/* TABLA DESKTOP */}
      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-xl border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700
                  text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Recoge</th>
                  <th className="px-4 py-3 text-left font-medium">Receptor / CI</th>
                  <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium">Destino</th>
                  <th className="px-4 py-3 text-left font-medium">Transportadora</th>
                  <th className="px-4 py-3 text-left font-medium">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {filtered.map(row => (
                  <tr key={row.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition-colors">
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatFecha(row.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-100">
                      {row.cliente_nombre || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge type={row.recoge_quien === "cliente" ? "info" : "default"}>
                        {row.recoge_quien === "cliente" ? "Cliente" : "Tercero"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {row.recoge_quien === "tercero"
                        ? (row.nombre_receptor || "—")
                        : (row.referencia      || "—")}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {row.recoge_quien === "tercero" ? (row.telefono_receptor || "—") : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {row.destino || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {row.transportadora || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge type={row.tiene_comprobante ? "success" : "pendiente"}>
                        {row.tiene_comprobante ? "Sí" : "No"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — fichas operativas */}
          <div className="md:hidden space-y-2">
            {filtered.map(row => {
              const esTercero    = row.recoge_quien === "tercero"
              const tieneExtra   = row.transportadora || row.observaciones
              return (
                <div key={row.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-700
                    bg-white dark:bg-neutral-800 px-4 pt-4 pb-3 space-y-3">

                  {/* Bloque 1 — cliente + destino + badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[15px] leading-snug
                        text-neutral-800 dark:text-neutral-100 truncate">
                        {row.cliente_nombre || "Sin nombre"}
                      </p>
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-0.5">
                        {row.destino}
                      </p>
                    </div>
                    <div className="flex-shrink-0 pt-0.5">
                      <Badge type={row.tiene_comprobante ? "success" : "pendiente"}>
                        {row.tiene_comprobante ? "Recibido" : "Sin comprobante"}
                      </Badge>
                    </div>
                  </div>

                  {/* Bloque 2 — entrega */}
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-neutral-400 dark:text-neutral-500">Entrega: </span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {esTercero ? "Tercero" : "Cliente"}
                      </span>
                    </p>
                    {esTercero && row.nombre_receptor && (
                      <p>
                        <span className="text-neutral-400 dark:text-neutral-500">Receptor: </span>
                        <span className="text-neutral-700 dark:text-neutral-300">{row.nombre_receptor}</span>
                      </p>
                    )}
                    {row.telefono_receptor && (
                      <p>
                        <span className="text-neutral-400 dark:text-neutral-500">Tel: </span>
                        <span className="text-neutral-700 dark:text-neutral-300">{row.telefono_receptor}</span>
                      </p>
                    )}
                    {row.referencia && (
                      <p>
                        <span className="text-neutral-400 dark:text-neutral-500">CI: </span>
                        <span className="text-neutral-700 dark:text-neutral-300">{row.referencia}</span>
                      </p>
                    )}
                  </div>

                  {/* Bloque 3 — adicional, solo si existe */}
                  {tieneExtra && (
                    <div className="space-y-1 text-sm border-t border-neutral-100
                      dark:border-neutral-700 pt-3">
                      {row.transportadora && (
                        <p>
                          <span className="text-neutral-400 dark:text-neutral-500">Transportadora: </span>
                          <span className="text-neutral-700 dark:text-neutral-300">{row.transportadora}</span>
                        </p>
                      )}
                      {row.observaciones && (
                        <p>
                          <span className="text-neutral-400 dark:text-neutral-500">Nota: </span>
                          <span className="text-neutral-600 dark:text-neutral-400">{row.observaciones}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer — fecha */}
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {formatFecha(row.created_at)}
                  </p>

                </div>
              )
            })}
          </div>
        </>
      )}

    </div>
  )
}
