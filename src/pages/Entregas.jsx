import { useState, useEffect, useRef, useCallback } from "react"
import { API_URL } from "../config/api"
import { normalizarUbicacion } from "../utils/ubicacion"

function formatFecha(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

const ZONA_LABEL = { local: "Local", terminal: "Terminal", desconocidos: "Desc." }
const ZONA_STYLE = {
  local:        { background: "var(--surface-2)", color: "var(--text-2)" },
  terminal:     { background: "var(--surface-3)", color: "var(--text-2)" },
  desconocidos: { background: "var(--surface-2)", color: "var(--text-3)" },
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
    ctx.strokeStyle = document.documentElement.classList.contains("dark") ? "#e5e5e5" : "#1a1a1a"
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
      height={320}
      className="w-full rounded-lg touch-none cursor-crosshair h-[240px] sm:h-[300px] lg:h-[320px]"
      style={{ touchAction: "none", border: "1px solid var(--border)", background: "var(--surface)" }}
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
      <div className="relative z-10 rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4 flex flex-col gap-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Firma digital
          </p>
          <button
            onClick={onClose}
            className="transition text-lg leading-none"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
            ✕
          </button>
        </div>
        <img
          src={url}
          alt="Firma digital"
          className="w-full rounded-lg"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        />
      </div>
    </div>
  )
}

// ─── Scanner / adjunto comprobante ────────────────────────────────────────────
function PaymentProofScanner({ file, onFile }) {
  const inputRef = useRef(null)

  function handleChange(e) {
    const f = e.target.files?.[0] || null
    onFile(f)
  }

  function handleRemove() {
    onFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-2">
      {file ? (
        <div className="relative rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}>
          {file.type.startsWith("image/") ? (
            <img src={URL.createObjectURL(file)} alt="Comprobante"
              className="w-full max-h-40 object-contain" />
          ) : (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-2)" }}>
              {file.name}
            </div>
          )}
          <button type="button" onClick={handleRemove}
            className="absolute top-1.5 right-1.5 text-xs px-2 py-0.5 rounded-lg transition"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
            Quitar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg py-4 text-sm transition"
          style={{ border: "2px dashed var(--border)", background: "var(--surface-2)", color: "var(--text-3)" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; }}>
          Tomar foto o adjuntar comprobante
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" capture="environment"
        className="hidden" onChange={handleChange} />
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
  const canvasRef                              = useRef(null)
  const [pagoMetodo,  setPagoMetodo]  = useState("")
  const [pagoCuenta,  setPagoCuenta]  = useState("")
  const [pagoNota,    setPagoNota]    = useState("")
  const [pagoFile,    setPagoFile]    = useState(null)

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
      if (pagoMetodo) {
        fd.append("pago_metodo", pagoMetodo)
        if (pagoCuenta.trim()) fd.append("pago_cuenta_receptora", pagoCuenta.trim())
        if (pagoNota.trim())   fd.append("pago_verificacion_nota", pagoNota.trim())
        if (pagoFile)          fd.append("pago_comprobante", pagoFile, pagoFile.name)
      }

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
      <div className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--text-3)" }}>
              Confirmar entrega
            </p>
            <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--text)" }}>
              {row.cliente_nombre}
            </h3>
            <p className="text-sm mt-0.5 leading-snug" style={{ color: "var(--text-3)" }}>
              {row.item_descripcion}
            </p>
          </div>
          <button onClick={onClose}
            className="transition text-lg leading-none flex-shrink-0 mt-0.5"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>✕</button>
        </div>

        <div className="rounded-lg px-4 py-3 grid grid-cols-2 gap-3 text-sm"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Cliente</p>
            <p className="font-medium" style={{ color: "var(--text)" }}>{row.cliente_nombre || "—"}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Teléfono</p>
            <p className="font-medium" style={{ color: "var(--text)" }}>{row.cliente_telefono || "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Ítem</p>
            <p className="leading-snug" style={{ color: "var(--text-2)" }}>{row.item_descripcion || "—"}</p>
          </div>
        </div>

        {done ? (
          <div className="rounded-lg px-4 py-3 text-sm font-medium"
            style={{ background: "var(--success-soft)", border: "1px solid var(--success)", color: "var(--success)" }}>
            Entrega registrada correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                Recibido por <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                className="ui-input"
                placeholder="Nombre completo"
                value={entregadoA}
                onChange={e => setEntregadoA(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                Observación (opcional)
              </label>
              <input
                className="ui-input"
                placeholder="Ej: Recibió con documento"
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
              />
            </div>

            {/* Sección de pago */}
            <div className="flex flex-col gap-3 pt-1"
              style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Registro de pago
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                  Método de pago
                </label>
                <select className="ui-input" value={pagoMetodo}
                  onChange={e => { setPagoMetodo(e.target.value); setPagoCuenta(""); setPagoFile(null) }}>
                  <option value="">— No registrar —</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {pagoMetodo && pagoMetodo !== "efectivo" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                      Cuenta / QR receptor
                    </label>
                    <input className="ui-input"
                      placeholder="Ej: 73XXXXXX — Nombre Receptor"
                      value={pagoCuenta}
                      onChange={e => setPagoCuenta(e.target.value)} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                      Comprobante de pago
                    </label>
                    <PaymentProofScanner file={pagoFile} onFile={setPagoFile} />
                  </div>
                </>
              )}

              {pagoMetodo && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                    Nota de verificación (opcional)
                  </label>
                  <input className="ui-input"
                    placeholder="Ej: Pago confirmado por cliente"
                    value={pagoNota}
                    onChange={e => setPagoNota(e.target.value)} />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                  Firma digital
                  <span className="ml-1.5 font-normal" style={{ color: "var(--text-3)" }}>(recomendada)</span>
                </label>
                {hasFirma && (
                  <button type="button" onClick={limpiarFirma}
                    className="text-xs transition"
                    style={{ color: "var(--text-3)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
                    Limpiar firma
                  </button>
                )}
              </div>
              <FirmaCanvas canvasRef={canvasRef} onHasFirma={setHasFirma} />
              {!hasFirma && (
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Firme en el recuadro con el dedo, lápiz o cursor.
                </p>
              )}
            </div>

            {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="ui-button-ghost flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="ui-button-success flex-1">
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
          className="ui-input md:max-w-md"
        />
        {!loading && (
          <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: "var(--text-3)" }}>
            {filtered.length} ítem{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg px-6 py-12 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {q.trim() ? "Sin resultados para la búsqueda." : "No hay ítems pendientes de entrega."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block ui-table" style={{ overflowX: "auto" }}>
            <table className="w-full text-sm" style={{ minWidth: "680px" }}>
              <thead>
                <tr>
                  {["Cliente", "Ítem", "REC", "Ubicación", "Zona", "Recibido", "Acción"].map(h => (
                    <th key={h} className="ui-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.item_id} className="ui-row">
                    <td className="ui-td">
                      <p className="font-medium whitespace-nowrap" style={{ color: "var(--text)" }}>
                        {row.cliente_nombre}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{row.cliente_telefono || "—"}</p>
                    </td>
                    <td className="ui-td max-w-[220px] truncate" title={row.item_descripcion}
                      style={{ color: "var(--text-2)" }}>
                      {row.item_descripcion}
                    </td>
                    <td className="ui-td whitespace-nowrap"
                      style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "var(--text-3)" }}>
                      {row.codigo_recepcion || "—"}
                    </td>
                    <td className="ui-td whitespace-nowrap"
                      style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", fontWeight: 600, color: "var(--text-2)" }}>
                      {normalizarUbicacion(row.ubicacion_codigo)}
                    </td>
                    <td className="ui-td">
                      {row.zona ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos}>
                          {ZONA_LABEL[row.zona] ?? row.zona}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="ui-td whitespace-nowrap text-xs" style={{ color: "var(--text-3)" }}>
                      {formatFecha(row.recibido_at)}
                    </td>
                    <td className="ui-td">
                      <button onClick={() => setModalRow(row)} className="ui-button-success ui-button-sm">
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
                className="rounded-xl px-4 pt-4 pb-3 space-y-3"
                style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div>
                  <p className="font-semibold text-[15px] leading-snug" style={{ color: "var(--text)" }}>{row.cliente_nombre}</p>
                  <p className="text-sm mt-0.5 leading-snug" style={{ color: "var(--text-2)" }}>
                    {row.item_descripcion}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.ubicacion_codigo && (
                    <span className="font-mono text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                      {normalizarUbicacion(row.ubicacion_codigo)}
                    </span>
                  )}
                  {row.zona && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos}>
                      {ZONA_LABEL[row.zona] ?? row.zona}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    {formatFecha(row.recibido_at)}
                  </p>
                  <button onClick={() => setModalRow(row)} className="ui-button-success ui-button-sm">
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
          className="ui-input flex-1 sm:max-w-md"
        />
        <div className="flex gap-1">
          {Object.entries(PERIODO_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handlePeriodo(key)}
              className={periodo === key ? "ui-button ui-button-sm" : "ui-button-ghost ui-button-sm"}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          {filtered.length} entrega{filtered.length !== 1 ? "s" : ""}
          {q.trim() ? " encontradas" : ` — ${PERIODO_LABELS[periodo]}`}
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg px-6 py-12 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {q.trim() ? "Sin resultados para la búsqueda." : "Sin entregas en este período."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block ui-table" style={{ overflowX: "auto" }}>
            <table className="w-full text-sm" style={{ minWidth: "740px" }}>
              <thead>
                <tr>
                  {["Cliente", "Ítem", "Entregado a", "REC / Ubic.", "Fecha", "Firma"].map(h => (
                    <th key={h} className="ui-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.entrega_id} className="ui-row">
                    <td className="ui-td">
                      <p className="font-medium whitespace-nowrap" style={{ color: "var(--text)" }}>
                        {row.cliente_nombre || "—"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{row.cliente_telefono || "—"}</p>
                    </td>
                    <td className="ui-td max-w-[200px] truncate" title={row.item_descripcion}
                      style={{ color: "var(--text-2)" }}>
                      {row.item_descripcion || "—"}
                    </td>
                    <td className="ui-td whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                      <p>{row.entregado_a}</p>
                      {row.observacion && (
                        <p className="text-xs mt-0.5 max-w-[160px] truncate" title={row.observacion}
                          style={{ color: "var(--text-3)" }}>
                          {row.observacion}
                        </p>
                      )}
                    </td>
                    <td className="ui-td">
                      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "var(--text-3)" }}>
                        {row.codigo_recepcion || "—"}
                      </p>
                      {row.ubicacion_codigo && (
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", fontWeight: 600, color: "var(--text-2)", marginTop: "2px" }}>
                          {normalizarUbicacion(row.ubicacion_codigo)}
                        </p>
                      )}
                    </td>
                    <td className="ui-td whitespace-nowrap text-xs" style={{ color: "var(--text-3)" }}>
                      {formatFecha(row.entregado_at)}
                    </td>
                    <td className="ui-td">
                      {row.firma_url ? (
                        <button onClick={() => setFirmaUrl(row.firma_url)}
                          className="ui-button-ghost ui-button-sm">
                          Ver firma
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>Sin firma</span>
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
                className="rounded-xl px-4 pt-4 pb-3 space-y-2"
                style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] leading-snug" style={{ color: "var(--text)" }}>
                      {row.cliente_nombre || "—"}
                    </p>
                    <p className="text-sm mt-0.5 leading-snug truncate" style={{ color: "var(--text-2)" }}>
                      {row.item_descripcion || "—"}
                    </p>
                  </div>
                  {row.firma_url ? (
                    <button
                      onClick={() => setFirmaUrl(row.firma_url)}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition"
                      style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>
                      Ver firma
                    </button>
                  ) : (
                    <span className="flex-shrink-0 text-xs pt-0.5" style={{ color: "var(--text-3)" }}>
                      Sin firma
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-3)" }}>
                  <span>→ {row.entregado_a}</span>
                  {row.ubicacion_codigo && (
                    <span className="font-mono font-semibold" style={{ color: "var(--text-2)" }}>
                      {normalizarUbicacion(row.ubicacion_codigo)}
                    </span>
                  )}
                  {row.zona && (
                    <span className="px-1.5 py-0.5 rounded-full font-medium"
                      style={ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos}>
                      {ZONA_LABEL[row.zona] ?? row.zona}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
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

// ─── Tab Pagos ────────────────────────────────────────────────────────────────
const VERIF_BADGE = {
  pendiente_verificacion: { label: "Pendiente",  bg: "var(--warning-soft)", color: "var(--warning)"  },
  verificado:             { label: "Verificado",  bg: "var(--success-soft)", color: "var(--success)"  },
  rechazado:              { label: "Rechazado",   bg: "var(--danger-soft)",  color: "var(--danger)"   },
  no_aplica:              { label: "No aplica",   bg: "var(--surface-3)",    color: "var(--text-3)"   },
}
const METODO_LABEL = { efectivo: "Efectivo", qr: "QR", transferencia: "Transferencia", otro: "Otro" }

function TabPagos() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [saving,  setSaving]  = useState(null) // entrega_item_id siendo guardado

  async function fetchPagos() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${API_URL}/operativo/entregas/pagos-resumen`)
      const json = await res.json()
      setRows(Array.isArray(json.data) ? json.data : [])
    } catch {
      setError("Error cargando pagos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPagos() }, [])

  async function handleVerificar(id, estado) {
    setSaving(id)
    try {
      const res  = await fetch(`${API_URL}/operativo/entregas/${id}/verificacion-pago`,
        { method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado }) })
      const json = await res.json()
      if (!res.ok) { alert(json.error || "Error al verificar"); return }
      setRows(prev => prev.map(r =>
        r.id === id
          ? { ...r, pago_verificacion_estado: json.data.pago_verificacion_estado, pago_verificado_at: json.data.pago_verificado_at }
          : r
      ))
    } catch {
      alert("Error de red")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg px-4 py-3 text-sm"
        style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
        {error}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg px-6 py-12 text-center"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          No hay pagos registrados en entregas todavía.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map(row => {
        const badge = VERIF_BADGE[row.pago_verificacion_estado] ?? VERIF_BADGE.pendiente_verificacion
        const isPending = row.pago_verificacion_estado === "pendiente_verificacion"
        return (
          <div key={row.id} className="rounded-xl p-4 flex flex-col gap-3"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[15px] leading-snug" style={{ color: "var(--text)" }}>
                  {row.cliente_nombre || "—"}
                </p>
                <p className="text-sm mt-0.5 leading-snug truncate" style={{ color: "var(--text-2)" }}>
                  {row.item_descripcion || "—"}
                </p>
              </div>
              <span className="flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            </div>

            {/* Pago info */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <p style={{ color: "var(--text-3)" }}>Método</p>
                <p className="font-medium mt-0.5" style={{ color: "var(--text-2)" }}>
                  {METODO_LABEL[row.pago_metodo] ?? row.pago_metodo ?? "—"}
                </p>
              </div>
              {row.payment_amount != null && (
                <div>
                  <p style={{ color: "var(--text-3)" }}>Monto</p>
                  <p className="font-medium mt-0.5" style={{ color: "var(--text)" }}>
                    {Number(row.payment_amount).toFixed(2)} Bs
                  </p>
                </div>
              )}
              {row.pago_cuenta_receptora && (
                <div className="col-span-2">
                  <p style={{ color: "var(--text-3)" }}>Cuenta receptora</p>
                  <p className="font-medium mt-0.5" style={{ color: "var(--text-2)" }}>{row.pago_cuenta_receptora}</p>
                </div>
              )}
              <div>
                <p style={{ color: "var(--text-3)" }}>Entregado a</p>
                <p className="font-medium mt-0.5" style={{ color: "var(--text-2)" }}>{row.entregado_a || "—"}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-3)" }}>Fecha</p>
                <p className="font-medium mt-0.5" style={{ color: "var(--text-2)" }}>
                  {formatFecha(row.entregado_at)}
                </p>
              </div>
            </div>

            {/* Comprobante */}
            {row.pago_comprobante_url && (
              <a href={row.pago_comprobante_url} target="_blank" rel="noopener noreferrer"
                className="text-xs underline transition"
                style={{ color: "var(--accent)" }}>
                Ver comprobante
              </a>
            )}

            {/* Nota verificación */}
            {row.pago_verificacion_nota && (
              <p className="text-xs italic" style={{ color: "var(--text-3)" }}>
                {row.pago_verificacion_nota}
              </p>
            )}

            {/* Acciones verificación */}
            {isPending && (
              <div className="flex gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => handleVerificar(row.id, "verificado")}
                  disabled={saving === row.id}
                  className="ui-button-success ui-button-sm flex-1">
                  {saving === row.id ? "..." : "Verificar pago"}
                </button>
                <button
                  onClick={() => handleVerificar(row.id, "rechazado")}
                  disabled={saving === row.id}
                  className="ui-button-ghost ui-button-sm"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                  Rechazar
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Entregas() {
  const [tab, setTab] = useState("pendientes")

  return (
    <div className="module-shell">

      {/* Header */}
      <div className="module-header">
        <p className="ui-section-title">Operación</p>
        <h1 className="ui-page-title">Entregas</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
          Entrega local de ítems recibidos en Bolivia
        </p>
      </div>

      <div className="module-body">
        <div className="panel flex-1">

          {/* Tabs */}
          <div className="panel-header" style={{ padding: "0", paddingLeft: "4px" }}>
            <div className="ui-tabs">
              {[
                { key: "pendientes", label: "Pendientes" },
                { key: "historial",  label: "Historial"  },
                { key: "pagos",      label: "Pagos"      },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`ui-tab ${tab === key ? "ui-tab-active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido */}
          <div className="scroll-area p-5">
            {tab === "pendientes" && <TabPendientes />}
            {tab === "historial"  && <TabHistorial />}
            {tab === "pagos"      && <TabPagos />}
          </div>

        </div>
      </div>

    </div>
  )
}
