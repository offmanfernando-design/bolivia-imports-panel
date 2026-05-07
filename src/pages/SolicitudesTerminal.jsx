import { useState, useEffect, useRef } from "react"
import { API_URL } from "../config/api"
import Badge from "../components/ui/Badge"

function formatFecha(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// ─── Modal: Confirmar envío ───────────────────────────────────────────────────
function ModalConfirmarEnvio({ row, onClose, onSaved }) {
  const [nota,    setNota]    = useState("")
  const [foto,    setFoto]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const fd = new FormData()
      if (nota.trim()) fd.append("nota_envio", nota.trim())
      if (foto)        fd.append("foto_envio", foto)

      const res = await fetch(
        `${API_URL}/receptores/solicitudes-terminal/${row.id}/marcar-enviado`,
        { method: "PATCH", body: fd }
      )
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Error al confirmar envío")
        return
      }
      onSaved(row.id, json.data)
    } catch {
      setError("Error de red")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md
        bg-white dark:bg-neutral-950
        border border-neutral-200 dark:border-neutral-800
        rounded-t-2xl sm:rounded-2xl shadow-2xl
        p-6 flex flex-col gap-5">

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium
              text-neutral-400 dark:text-neutral-500">
              Confirmar envío
            </p>
            <h3 className="text-base font-semibold
              text-neutral-900 dark:text-neutral-100 mt-0.5">
              {row.cliente_nombre || "Sin nombre"}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.destino}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600
              dark:hover:text-neutral-200 transition text-lg leading-none
              flex-shrink-0 mt-0.5">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Foto del paquete (opcional)
            </label>
            {foto ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate flex-1">
                  {foto.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFoto(null)}
                  className="text-xs text-neutral-400 hover:text-red-500 transition flex-shrink-0">
                  Quitar
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
                border border-dashed border-neutral-300 dark:border-neutral-600
                text-sm text-neutral-400 dark:text-neutral-500
                hover:border-neutral-400 dark:hover:border-neutral-500 cursor-pointer transition">
                Adjuntar foto
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => setFoto(e.target.files[0] || null)}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Nota (opcional)
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200
                dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900
                text-sm text-neutral-800 dark:text-neutral-200
                focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
              placeholder="Observación del envío"
              value={nota}
              onChange={e => setNota(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200
                dark:border-neutral-700 text-sm font-medium
                text-neutral-600 dark:text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100
                text-sm font-semibold text-white dark:text-neutral-900
                hover:opacity-90 disabled:opacity-50 transition">
              {saving ? "Guardando..." : "Confirmar envío"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

// ─── Modal: Cargar / actualizar guía ─────────────────────────────────────────
function ModalCargarGuia({ row, onClose, onSaved }) {
  const [guia,   setGuia]   = useState(row.numero_guia || "")
  const [nota,   setNota]   = useState(row.nota_guia   || "")
  const [foto,   setFoto]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const yaTieneGuia = !!(row.guia_at)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!guia.trim() && !foto) {
      setError("Ingresa el número de guía o adjunta una foto de la guía")
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      if (guia.trim()) fd.append("numero_guia", guia.trim())
      if (nota.trim()) fd.append("nota_guia",   nota.trim())
      if (foto)        fd.append("foto_guia",   foto)

      const res = await fetch(
        `${API_URL}/receptores/solicitudes-terminal/${row.id}/cargar-guia`,
        { method: "PATCH", body: fd }
      )
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Error al guardar guía")
        return
      }
      onSaved(row.id, json.data)
    } catch {
      setError("Error de red")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md
        bg-white dark:bg-neutral-950
        border border-neutral-200 dark:border-neutral-800
        rounded-t-2xl sm:rounded-2xl shadow-2xl
        p-6 flex flex-col gap-5">

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium
              text-neutral-400 dark:text-neutral-500">
              {yaTieneGuia ? "Actualizar guía" : "Cargar guía"}
            </p>
            <h3 className="text-base font-semibold
              text-neutral-900 dark:text-neutral-100 mt-0.5">
              {row.cliente_nombre || "Sin nombre"}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.destino}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600
              dark:hover:text-neutral-200 transition text-lg leading-none
              flex-shrink-0 mt-0.5">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Número de guía (opcional)
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200
                dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900
                text-sm text-neutral-800 dark:text-neutral-200
                focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
              placeholder="Ej: TER-9901"
              value={guia}
              onChange={e => setGuia(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Foto de la guía (opcional)
            </label>
            {foto ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate flex-1">
                  {foto.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFoto(null)}
                  className="text-xs text-neutral-400 hover:text-red-500 transition flex-shrink-0">
                  Quitar
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
                border border-dashed border-neutral-300 dark:border-neutral-600
                text-sm text-neutral-400 dark:text-neutral-500
                hover:border-neutral-400 dark:hover:border-neutral-500 cursor-pointer transition">
                {row.foto_guia_url ? "Reemplazar foto" : "Adjuntar foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => setFoto(e.target.files[0] || null)}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Nota (opcional)
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200
                dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900
                text-sm text-neutral-800 dark:text-neutral-200
                focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
              placeholder="Observación de la guía"
              value={nota}
              onChange={e => setNota(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200
                dark:border-neutral-700 text-sm font-medium
                text-neutral-600 dark:text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100
                text-sm font-semibold text-white dark:text-neutral-900
                hover:opacity-90 disabled:opacity-50 transition">
              {saving ? "Guardando..." : yaTieneGuia ? "Actualizar" : "Guardar guía"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

// ─── Helpers de filtro por fecha ──────────────────────────────────────────────
function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function hace30dias() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SolicitudesTerminal() {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [q,         setQ]         = useState("")
  const [tab,       setTab]       = useState("pendiente")
  const [filtroFecha, setFiltroFecha] = useState("mes")
  const [modalRow,  setModalRow]  = useState(null)
  const [modalGuia, setModalGuia] = useState(null)
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

  function handleSaved(id, data) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    setModalRow(null)
    setModalGuia(null)
  }

  const porTab = rows.filter(r => r.estado === tab)

  const porFecha = tab === "enviado"
    ? porTab.filter(r => {
        if (filtroFecha === "todas") return true
        const fecha = r.enviado_at ? new Date(r.enviado_at) : null
        if (!fecha) return false
        if (filtroFecha === "mes")   return fecha >= startOfMonth()
        if (filtroFecha === "30d")   return fecha >= hace30dias()
        return true
      })
    : porTab

  const filtered = q.trim()
    ? porFecha.filter(r => {
        const term = q.toLowerCase()
        return (
          (r.cliente_nombre    || "").toLowerCase().includes(term) ||
          (r.destino           || "").toLowerCase().includes(term) ||
          (r.referencia        || "").toLowerCase().includes(term) ||
          (r.nombre_receptor   || "").toLowerCase().includes(term) ||
          (r.telefono_receptor || "").toLowerCase().includes(term)
        )
      })
    : porFecha

  const countPendiente = rows.filter(r => r.estado === "pendiente").length
  const countEnviado   = rows.filter(r => r.estado === "enviado").length

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Solicitudes Terminal
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Datos enviados desde el formulario de coordinación de envío
        </p>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2">
        {[
          { key: "pendiente", label: "Pendientes", count: countPendiente },
          { key: "enviado",   label: "Enviadas",   count: countEnviado   },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${tab === t.key
                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}>
            {t.label}
            {!loading && (
              <span className={`ml-1.5 text-xs ${tab === t.key ? "opacity-70" : "opacity-60"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* FILTRO FECHA (solo en Enviadas) */}
      {tab === "enviado" && (
        <div className="flex items-center gap-2">
          {[
            { key: "mes",   label: "Este mes"       },
            { key: "30d",   label: "Últimos 30 días" },
            { key: "todas", label: "Todas"           },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroFecha(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition
                ${filtroFecha === f.key
                  ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100"
                  : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

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
            {q.trim()
              ? "Sin resultados para la búsqueda."
              : tab === "pendiente"
                ? "No hay solicitudes pendientes."
                : "No hay solicitudes enviadas en este período."}
          </p>
        </div>
      )}

      {/* TABLA DESKTOP */}
      {!loading && !error && filtered.length > 0 && (
        <>
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
                  <th className="px-4 py-3 text-left font-medium">Destino</th>
                  <th className="px-4 py-3 text-left font-medium">Comprobante</th>
                  {tab === "enviado" && (
                    <th className="px-4 py-3 text-left font-medium">Guía</th>
                  )}
                  <th className="px-4 py-3 text-left font-medium">Acción</th>
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
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {row.destino || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {tab === "enviado" ? (
                        <Badge type="success">Despachado</Badge>
                      ) : (
                        <Badge type={row.tiene_comprobante ? "success" : "pendiente"}>
                          {row.tiene_comprobante ? "Comprobante" : "Sin comprobante"}
                        </Badge>
                      )}
                    </td>
                    {tab === "enviado" && (
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                        {row.numero_guia || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {tab === "pendiente" && (
                        <button
                          onClick={() => setModalRow(row)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-neutral-900 dark:bg-neutral-100
                            text-white dark:text-neutral-900
                            hover:opacity-80 transition">
                          Confirmar envío
                        </button>
                      )}
                      {tab === "enviado" && (
                        <button
                          onClick={() => setModalGuia(row)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium
                            border border-neutral-300 dark:border-neutral-600
                            text-neutral-600 dark:text-neutral-400
                            hover:bg-neutral-100 dark:hover:bg-neutral-700 transition">
                          {row.guia_at ? "Actualizar guía" : "Cargar guía"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — fichas operativas */}
          <div className="md:hidden space-y-2">
            {filtered.map(row => {
              const esTercero  = row.recoge_quien === "tercero"
              const tieneExtra = row.transportadora || row.observaciones
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
                      {tab === "enviado" ? (
                        <Badge type="success">Despachado</Badge>
                      ) : (
                        <Badge type={row.tiene_comprobante ? "success" : "pendiente"}>
                          {row.tiene_comprobante ? "Comprobante" : "Sin comprobante"}
                        </Badge>
                      )}
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

                  {/* Bloque 3 — adicional */}
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

                  {/* Guía si enviada */}
                  {row.estado === "enviado" && (row.numero_guia || row.guia_at) && (
                    <div className="space-y-1 text-sm border-t border-neutral-100
                      dark:border-neutral-700 pt-3">
                      {row.numero_guia && (
                        <p>
                          <span className="text-neutral-400 dark:text-neutral-500">Guía: </span>
                          <span className="text-neutral-700 dark:text-neutral-300 font-medium">{row.numero_guia}</span>
                        </p>
                      )}
                      {row.guia_at && (
                        <p>
                          <span className="text-neutral-400 dark:text-neutral-500">Cargada: </span>
                          <span className="text-neutral-500 dark:text-neutral-400">{formatFecha(row.guia_at)}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer: fecha + botón de acción */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {formatFecha(row.created_at)}
                    </p>
                    {row.estado === "pendiente" && (
                      <button
                        onClick={() => setModalRow(row)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium
                          bg-neutral-900 dark:bg-neutral-100
                          text-white dark:text-neutral-900
                          hover:opacity-80 transition">
                        Confirmar envío
                      </button>
                    )}
                    {row.estado === "enviado" && (
                      <button
                        onClick={() => setModalGuia(row)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium
                          border border-neutral-300 dark:border-neutral-600
                          text-neutral-600 dark:text-neutral-400
                          hover:bg-neutral-100 dark:hover:bg-neutral-700 transition">
                        {row.guia_at ? "Actualizar guía" : "Cargar guía"}
                      </button>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        </>
      )}

      {/* MODALES */}
      {modalRow && (
        <ModalConfirmarEnvio
          row={modalRow}
          onClose={() => setModalRow(null)}
          onSaved={handleSaved}
        />
      )}
      {modalGuia && (
        <ModalCargarGuia
          row={modalGuia}
          onClose={() => setModalGuia(null)}
          onSaved={handleSaved}
        />
      )}

    </div>
  )
}
