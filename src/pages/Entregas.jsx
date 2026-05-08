import { useState, useEffect, useRef, useCallback } from "react"
import { API_URL } from "../config/api"

function formatFecha(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

const ZONA_LABEL = { local: "Local", terminal: "Terminal", desconocidos: "Desc." }
const ZONA_BADGE = {
  local:        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  terminal:     "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  desconocidos: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
}

// ─── Canvas de firma ──────────────────────────────────────────────────────────
function FirmaCanvas({ canvasRef, onHasFirma }) {
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const src  = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  function startDraw(e) {
    e.preventDefault()
    drawing.current = true
    lastPos.current = getPos(e, canvasRef.current)
  }

  function draw(e) {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")
    const pos    = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth   = 2
    ctx.lineCap     = "round"
    ctx.lineJoin    = "round"
    ctx.stroke()
    lastPos.current = pos
    onHasFirma(true)
  }

  function endDraw(e) {
    e.preventDefault()
    drawing.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={180}
      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600
        bg-white dark:bg-neutral-900 touch-none cursor-crosshair"
      style={{ touchAction: "none" }}
      onMouseDown={startDraw}  onMouseMove={draw}  onMouseUp={endDraw}  onMouseLeave={endDraw}
      onTouchStart={startDraw} onTouchMove={draw}  onTouchEnd={endDraw}
      onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerLeave={endDraw}
    />
  )
}

// ─── Modal ver firma ──────────────────────────────────────────────────────────
function ModalFirma({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-neutral-950
        border border-neutral-200 dark:border-neutral-800
        rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Firma digital
          </p>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition text-lg leading-none">
            ✕
          </button>
        </div>
        <img
          src={url}
          alt="Firma digital"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white"
        />
      </div>
    </div>
  )
}

// ─── Modal confirmar entrega ───────────────────────────────────────────────────
function ModalEntrega({ row, onClose, onEntregado }) {
  const [entregadoA,  setEntregadoA]  = useState(row.cliente_nombre || "")
  const [observacion, setObservacion] = useState("")
  const [hasFirma,    setHasFirma]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)
  const [done,        setDone]        = useState(false)
  const canvasRef = useRef(null)

  function limpiarFirma() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
    setHasFirma(false)
  }

  const getBlob = useCallback(() =>
    new Promise(resolve => {
      const canvas = canvasRef.current
      if (!canvas || !hasFirma) return resolve(null)
      canvas.toBlob(blob => resolve(blob), "image/png")
    }), [hasFirma])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!entregadoA.trim()) {
      setError("El nombre de quien recibe es requerido")
      return
    }
    setSaving(true)
    try {
      const blob = await getBlob()
      const fd   = new FormData()
      fd.append("entregado_a", entregadoA.trim())
      if (observacion.trim()) fd.append("observacion", observacion.trim())
      if (blob) fd.append("firma", blob, "firma.png")

      const res  = await fetch(`${API_URL}/operativo/inventario/${row.item_id}/entregar`,
        { method: "PATCH", body: fd })
      const json = await res.json()
      if (!res.ok) { setError(json.error || "Error al registrar entrega"); return }
      setDone(true)
      onEntregado(row.item_id)
    } catch {
      setError("Error de red")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg
        bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800
        rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto
        p-6 flex flex-col gap-5">

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">
              Confirmar entrega
            </p>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {row.cliente_nombre}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
              {row.item_descripcion}
            </p>
          </div>
          <button onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200
              transition text-lg leading-none flex-shrink-0 mt-0.5">✕</button>
        </div>

        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900
          border border-neutral-200 dark:border-neutral-800
          px-4 py-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-neutral-400 mb-0.5">Cliente</p>
            <p className="font-medium text-neutral-800 dark:text-neutral-100">{row.cliente_nombre || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-0.5">Teléfono</p>
            <p className="font-medium text-neutral-800 dark:text-neutral-100">{row.cliente_telefono || "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-neutral-400 mb-0.5">Ítem</p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-snug">{row.item_descripcion || "—"}</p>
          </div>
        </div>

        {done ? (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40
            border border-emerald-200 dark:border-emerald-800
            px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            Entrega registrada correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Recibido por <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200
                  dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900
                  text-sm text-neutral-800 dark:text-neutral-200
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
                placeholder="Nombre completo"
                value={entregadoA}
                onChange={e => setEntregadoA(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Observación (opcional)
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200
                  dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900
                  text-sm text-neutral-800 dark:text-neutral-200
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
                placeholder="Ej: Recibió con documento"
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Firma digital
                  <span className="ml-1.5 text-neutral-400 font-normal">(recomendada)</span>
                </label>
                {hasFirma && (
                  <button type="button" onClick={limpiarFirma}
                    className="text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition">
                    Limpiar firma
                  </button>
                )}
              </div>
              <FirmaCanvas canvasRef={canvasRef} onHasFirma={setHasFirma} />
              {!hasFirma && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Firme en el recuadro con el dedo, lápiz o cursor.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200
                  dark:border-neutral-700 text-sm font-medium
                  text-neutral-600 dark:text-neutral-400
                  hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700
                  text-sm font-semibold text-white disabled:opacity-50 transition">
                {saving ? "Guardando..." : "Confirmar entrega"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Tab Pendientes ───────────────────────────────────────────────────────────
function TabPendientes() {
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [q,        setQ]        = useState("")
  const [modalRow, setModalRow] = useState(null)
  const debounceRef             = useRef(null)

  async function fetchItems(query) {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${API_URL}/operativo/entregas/pendientes?q=${encodeURIComponent(query)}`)
      const json = await res.json()
      setRows(Array.isArray(json.data) ? json.data : [])
    } catch {
      setError("Error cargando ítems")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems("") }, [])

  function handleSearch(val) {
    setQ(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(val), 350)
  }

  function handleEntregado(itemId) {
    setRows(prev => prev.filter(r => r.item_id !== itemId))
    setTimeout(() => setModalRow(null), 600)
  }

  const filtered = q.trim()
    ? rows.filter(r => {
        const t = q.toLowerCase()
        return (
          (r.cliente_nombre   || "").toLowerCase().includes(t) ||
          (r.item_descripcion || "").toLowerCase().includes(t) ||
          (r.tracking_number  || "").toLowerCase().includes(t) ||
          (r.ubicacion_codigo || "").toLowerCase().includes(t) ||
          (r.codigo_recepcion || "").toLowerCase().includes(t)
        )
      })
    : rows

  return (
    <div className="flex flex-col gap-4">
      {/* Búsqueda */}
      <div className="flex items-center gap-2">
        <input
          placeholder="Buscar por cliente, ítem, tracking, REC, ubicación..."
          value={q}
          onChange={e => handleSearch(e.target.value)}
          className="w-full md:max-w-md px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200
            placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
        />
        {!loading && (
          <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0">
            {filtered.length} ítem{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800
          bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-800 px-6 py-12 text-center">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {q.trim() ? "Sin resultados para la búsqueda." : "No hay ítems pendientes de entrega."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block rounded-xl border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700
                  text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Ítem</th>
                  <th className="px-4 py-3 text-left font-medium">REC</th>
                  <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                  <th className="px-4 py-3 text-left font-medium">Zona</th>
                  <th className="px-4 py-3 text-left font-medium">Recibido</th>
                  <th className="px-4 py-3 text-left font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {filtered.map(row => (
                  <tr key={row.item_id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
                        {row.cliente_nombre}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{row.cliente_telefono || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 max-w-[220px] truncate"
                      title={row.item_descripcion}>
                      {row.item_descripcion}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 whitespace-nowrap">
                      {row.codigo_recepcion || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold
                      text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {row.ubicacion_codigo || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.zona ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONA_BADGE[row.zona] ?? ZONA_BADGE.desconocidos}`}>
                          {ZONA_LABEL[row.zona] ?? row.zona}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                      {formatFecha(row.recibido_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setModalRow(row)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium
                          bg-emerald-600 hover:bg-emerald-700 text-white transition">
                        Entregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-2">
            {filtered.map(row => (
              <div key={row.item_id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700
                  bg-white dark:bg-neutral-800 px-4 pt-4 pb-3 space-y-3">
                <div>
                  <p className="font-semibold text-[15px] leading-snug
                    text-neutral-800 dark:text-neutral-100">{row.cliente_nombre}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 leading-snug">
                    {row.item_descripcion}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.ubicacion_codigo && (
                    <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {row.ubicacion_codigo}
                    </span>
                  )}
                  {row.zona && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONA_BADGE[row.zona] ?? ZONA_BADGE.desconocidos}`}>
                      {ZONA_LABEL[row.zona] ?? row.zona}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {formatFecha(row.recibido_at)}
                  </p>
                  <button onClick={() => setModalRow(row)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-emerald-600 hover:bg-emerald-700 text-white transition">
                    Entregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalRow && (
        <ModalEntrega
          row={modalRow}
          onClose={() => setModalRow(null)}
          onEntregado={handleEntregado}
        />
      )}
    </div>
  )
}

// ─── Tab Historial ────────────────────────────────────────────────────────────
const PERIODO_LABELS = { "60d": "Últ. 60 días", mes: "Este mes", todas: "Todas" }

function TabHistorial() {
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [q,        setQ]        = useState("")
  const [periodo,  setPeriodo]  = useState("60d")
  const [firmaUrl, setFirmaUrl] = useState(null)

  async function fetchHistorial(p) {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${API_URL}/operativo/entregas/historial?periodo=${p}`)
      const json = await res.json()
      setRows(Array.isArray(json.data) ? json.data : [])
    } catch {
      setError("Error cargando historial")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistorial("60d") }, [])

  function handlePeriodo(p) {
    setPeriodo(p)
    fetchHistorial(p)
  }

  const filtered = q.trim()
    ? rows.filter(r => {
        const t = q.toLowerCase()
        return (
          (r.cliente_nombre   || "").toLowerCase().includes(t) ||
          (r.cliente_telefono || "").toLowerCase().includes(t) ||
          (r.item_descripcion || "").toLowerCase().includes(t) ||
          (r.tracking_number  || "").toLowerCase().includes(t) ||
          (r.numero_orden     || "").toLowerCase().includes(t) ||
          (r.codigo_recepcion || "").toLowerCase().includes(t) ||
          (r.entregado_a      || "").toLowerCase().includes(t)
        )
      })
    : rows

  return (
    <div className="flex flex-col gap-4">
      {/* Controles: búsqueda + periodo */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          placeholder="Buscar cliente, ítem, entregado a, tracking..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="flex-1 sm:max-w-md px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200
            placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
        />
        <div className="flex gap-1">
          {Object.entries(PERIODO_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handlePeriodo(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap
                ${periodo === key
                  ? "bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-neutral-400">
          {filtered.length} entrega{filtered.length !== 1 ? "s" : ""}
          {q.trim() ? " encontradas" : ` — ${PERIODO_LABELS[periodo]}`}
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800
          bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-800 px-6 py-12 text-center">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {q.trim() ? "Sin resultados para la búsqueda." : "Sin entregas en este período."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block rounded-xl border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700
                  text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Ítem</th>
                  <th className="px-4 py-3 text-left font-medium">Entregado a</th>
                  <th className="px-4 py-3 text-left font-medium">REC / Ubic.</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium">Firma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {filtered.map(row => (
                  <tr key={row.entrega_id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
                        {row.cliente_nombre || "—"}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{row.cliente_telefono || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 max-w-[200px] truncate"
                      title={row.item_descripcion}>
                      {row.item_descripcion || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      <p>{row.entregado_a}</p>
                      {row.observacion && (
                        <p className="text-xs text-neutral-400 mt-0.5 max-w-[160px] truncate"
                          title={row.observacion}>
                          {row.observacion}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-neutral-500">{row.codigo_recepcion || "—"}</p>
                      {row.ubicacion_codigo && (
                        <p className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">
                          {row.ubicacion_codigo}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                      {formatFecha(row.entregado_at)}
                    </td>
                    <td className="px-4 py-3">
                      {row.firma_url ? (
                        <button
                          onClick={() => setFirmaUrl(row.firma_url)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium
                            border border-neutral-200 dark:border-neutral-700
                            text-neutral-600 dark:text-neutral-400
                            hover:bg-neutral-100 dark:hover:bg-neutral-700 transition">
                          Ver firma
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          Sin firma
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-2">
            {filtered.map(row => (
              <div key={row.entrega_id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700
                  bg-white dark:bg-neutral-800 px-4 pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] leading-snug
                      text-neutral-800 dark:text-neutral-100">
                      {row.cliente_nombre || "—"}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 leading-snug truncate">
                      {row.item_descripcion || "—"}
                    </p>
                  </div>
                  {row.firma_url ? (
                    <button
                      onClick={() => setFirmaUrl(row.firma_url)}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium
                        border border-neutral-200 dark:border-neutral-700
                        text-neutral-600 dark:text-neutral-400
                        hover:bg-neutral-100 dark:hover:bg-neutral-700 transition">
                      Ver firma
                    </button>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500 pt-0.5">
                      Sin firma
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>→ {row.entregado_a}</span>
                  {row.ubicacion_codigo && (
                    <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                      {row.ubicacion_codigo}
                    </span>
                  )}
                  {row.zona && (
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${ZONA_BADGE[row.zona] ?? ZONA_BADGE.desconocidos}`}>
                      {ZONA_LABEL[row.zona] ?? row.zona}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {formatFecha(row.entregado_at)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {firmaUrl && <ModalFirma url={firmaUrl} onClose={() => setFirmaUrl(null)} />}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Entregas() {
  const [tab, setTab] = useState("pendientes")

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Entregas
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Entrega local de ítems recibidos en Bolivia
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700 pb-0">
        {[
          { key: "pendientes", label: "Pendientes" },
          { key: "historial",  label: "Historial"  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition
              ${tab === key
                ? "text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-800 dark:border-neutral-200"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "pendientes" ? <TabPendientes /> : <TabHistorial />}

    </div>
  )
}
