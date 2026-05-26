import { useState, useEffect, useRef } from "react"
import { API_URL } from "../config/api"
import Badge from "../components/ui/Badge"

const METODOS = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "qr",            label: "QR" },
  { value: "transferencia", label: "Transferencia" },
]

function formatBs(val) {
  if (val == null) return "—"
  return `${Number(val).toFixed(2)} Bs`
}

function formatFecha(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

const ZONA_LABEL = { local: "Local", terminal: "Terminal", desconocidos: "Desc." }
const ZONA_STYLE = {
  local:        { background: "var(--surface-3)", color: "var(--text-2)" },
  terminal:     { background: "var(--accent-soft)", color: "var(--accent)" },
  desconocidos: { background: "var(--surface-2)", color: "var(--text-3)" },
}

function esSantaCruz(departamento) {
  return (departamento || "").toLowerCase().includes("santa")
}

function normalizarTelefonoWhatsApp(value) {
  const tel = String(value || "").replace(/\D/g, "")
  if (!tel) return ""
  if (tel.startsWith("591")) return tel
  if (tel.length === 8) return `591${tel}`
  return tel
}

// Quita ceros decimales innecesarios: 96.00 → 96, 0.200 → 0.2, 50.0000 → 50
function fmt(val) {
  if (val == null) return "?"
  return parseFloat(Number(val).toFixed(2)).toString()
}

function lineaCosto(item) {
  const monto = Number(item.cobro_cliente_bs || 0)
  if (item.tipo_calculo === "kg" && item.peso_cobrado && item.tarifa_cliente && item.tipo_cambio_cliente) {
    return `Costo: ${fmt(item.peso_cobrado)} kg × ${fmt(item.tarifa_cliente)} × ${fmt(item.tipo_cambio_cliente)} = ${fmt(monto)} Bs`
  }
  if (item.tipo_calculo === "unidad" && item.unidades && item.tarifa_cliente && item.tipo_cambio_cliente) {
    return `Costo: ${item.unidades} unidad × ${fmt(item.tarifa_cliente)} × ${fmt(item.tipo_cambio_cliente)} = ${fmt(monto)} Bs`
  }
  return `Precio: ${fmt(monto)} Bs`
}

async function generarMensaje(row, itemsCliente) {
  const nombre     = row.cliente_nombre
  const esMultiple = itemsCliente.length > 1
  const sc         = esSantaCruz(row.departamento_destino)

  let msg = `Hola ${nombre},\n\n`

  if (sc) {
    msg += esMultiple
      ? "Tus pedidos llegaron a nuestra oficina en Santa Cruz.\n\n"
      : "Tu pedido llegó a nuestra oficina en Santa Cruz.\n\n"
  } else {
    msg += esMultiple
      ? "Tus pedidos ya se encuentran disponibles para envío.\n\n"
      : "Tu pedido ya se encuentra disponible para envío.\n\n"
  }

  msg += esMultiple ? "Detalle:\n\n" : "Producto:\n\n"

  let total = 0
  itemsCliente.forEach((item, i) => {
    const monto = Number(item.cobro_cliente_bs || 0)
    total += monto
    if (esMultiple) msg += `${i + 1}) `
    msg += `${item.item_descripcion}\n${lineaCosto(item)}\n\n`
  })

  if (esMultiple) {
    msg += `Total a pagar: ${fmt(total)} Bs\n\n`
  }

  if (sc) {
    msg += "Pago: QR o efectivo (solo Bs)\n\n"
    msg += "Horario:\nLunes - Viernes 09:30-12:00 / 14:30-18:00\nSabados 09:30-12:00\n\n"
    msg += "Ubicación:\nhttps://maps.app.goo.gl/gZSwDVJryLSwL8xZ7\n\n"
  } else {
    let linkFormulario = null
    try {
      const res  = await fetch(`${API_URL}/cobros/link-formulario/${row.cliente_id}`)
      const data = await res.json()
      if (data.link) linkFormulario = data.link
    } catch {
      // sin link disponible
    }

    if (linkFormulario) {
      msg += `Para coordinar el envío a terminal, completa tus datos en este formulario:\n${linkFormulario}\n\n`
    } else {
      msg += "Por favor envíanos estos datos por este chat:\nDESTINATARIO:\nDESTINO:\nCELULAR:\n\n"
    }
  }

  msg += "— Bolivia Imports"
  return msg
}

function ModalCobro({ row, onClose, onSaved }) {
  const [amount, setAmount] = useState(
    row.cobro_cliente_bs ? String(Number(row.cobro_cliente_bs).toFixed(2)) : ""
  )
  const [method, setMethod] = useState("efectivo")
  const [note, setNote]     = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Ingresá un monto válido")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/cobros/items/${row.recepcion_id}/cobrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed, method, note: note.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Error al registrar cobro")
        return
      }
      onSaved()
    } catch {
      setError("Error de red")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="ui-section-title">Registrar cobro</p>
            <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--text)" }}>
              {row.item_descripcion}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{row.cliente_nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="transition text-lg leading-none flex-shrink-0 mt-0.5"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="ui-label">Monto (Bs)</label>
            <input
              className="ui-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder={row.cobro_cliente_bs ? `Sugerido: ${formatBs(row.cobro_cliente_bs)}` : "0.00"}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="ui-label">Método de pago</label>
            <select
              className="ui-select"
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              {METODOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="ui-label">
              Observación <span className="text-neutral-400 font-normal">(opcional)</span>
            </label>
            <input
              className="ui-input"
              type="text"
              placeholder="Referencia, nota..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-ghost flex-1"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ui-button flex-1"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cobro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Cobros() {
  const [q, setQ]                   = useState("")
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [cobrando, setCobrando]     = useState(null)
  const [enviando, setEnviando]     = useState(null)
  const [recordando, setRecordando] = useState(null)
  const [tab, setTab]               = useState("pending")
  const debounceRef                 = useRef(null)

  async function fetchItems(query) {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${API_URL}/cobros/items?q=${encodeURIComponent(query)}`)
      const json = await res.json()
      setRows(Array.isArray(json.data) ? json.data : [])
    } catch {
      setError("Error al cargar cobros")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems("") }, [])

  function handleChange(e) {
    const val = e.target.value
    setQ(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(val), 350)
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      clearTimeout(debounceRef.current)
      fetchItems(q)
    }
  }

  async function abrirWhatsApp(row) {
    if (enviando === row.recepcion_id) return
    setEnviando(row.recepcion_id)
    try {
      const itemsCliente = rows.filter(
        r => r.cliente_id === row.cliente_id && r.payment_status === "pending"
      )
      const tel = normalizarTelefonoWhatsApp(row.cliente_telefono)
      if (!tel) {
        console.warn("Sin teléfono válido para", row.cliente_nombre)
        return
      }
      const msg = await generarMensaje(row, itemsCliente)
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank")
      try {
        const patchRes = await fetch(`${API_URL}/cobros/items/${row.recepcion_id}/enviado`, {
          method: "PATCH",
        })
        if (patchRes.ok) {
          setRows(prev => prev.map(r =>
            r.recepcion_id === row.recepcion_id
              ? { ...r, payment_status: "sent" }
              : r
          ))
        } else {
          console.error("No se pudo marcar cobro como enviado:", await patchRes.text())
        }
      } catch (patchErr) {
        console.error("Error al marcar cobro como enviado:", patchErr)
      }
    } catch {
      // silencioso — el mensaje no se pudo generar
    } finally {
      setEnviando(null)
    }
  }

  async function recordarCobro(row) {
    if (recordando === row.recepcion_id) return
    setRecordando(row.recepcion_id)
    try {
      const tel = normalizarTelefonoWhatsApp(row.cliente_telefono)
      if (!tel) return
      const baseMsg = await generarMensaje(row, [row])
      const prefix = "Hola, te recordamos que tienes un cobro pendiente correspondiente a tu pedido.\n\n"
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(prefix + baseMsg)}`, "_blank")
    } catch {
      // silencioso
    } finally {
      setRecordando(null)
    }
  }

  const pending  = rows.filter(r => r.payment_status === "pending")
  const sent     = rows.filter(r => r.payment_status === "sent")
  const finished = rows.filter(r => r.payment_status === "paid" || r.payment_status === "confirmed")

  return (
    <div className="module-shell">

      {/* Header */}
      <div className="module-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="ui-section-title">Finanzas</p>
            <h2 className="ui-page-title">Cobros</h2>
          </div>
          {!loading && rows.length > 0 && (
            <div className="flex items-center gap-2">
              {pending.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium tabular-nums"
                  style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
                >
                  {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
                </span>
              )}
              {sent.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium tabular-nums"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {sent.length} enviado{sent.length !== 1 ? "s" : ""}
                </span>
              )}
              {finished.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium tabular-nums"
                  style={{ background: "var(--success-soft)", color: "var(--success)" }}
                >
                  {finished.length} confirmado{finished.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="module-body">
        <div className="panel flex-1">

          {/* Búsqueda + Tabs */}
          <div className="panel-header flex flex-col gap-3" style={{ paddingBottom: "0" }}>
            <div className="flex gap-2">
              <input
                className="ui-input flex-1 max-w-md"
                placeholder="Cliente, tracking, REC, descripción..."
                value={q}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
              <button
                className="ui-button whitespace-nowrap"
                onClick={() => { clearTimeout(debounceRef.current); fetchItems(q) }}
                disabled={loading}
              >
                {loading ? "..." : "Buscar"}
              </button>
            </div>
            <div style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", maxWidth: "100%" }}>
              {[
                { key: "pending",  label: "Pendientes",     count: pending.length  },
                { key: "sent",     label: "Cobro enviado",  count: sent.length     },
                { key: "finished", label: "Pago confirmado", count: finished.length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    flex:          "0 0 auto",
                    whiteSpace:    "nowrap",
                    padding:       "14px 16px",
                    fontSize:      "13px",
                    fontWeight:    tab === key ? 600 : 400,
                    color:         tab === key ? "var(--text)" : "var(--text-3)",
                    background:    "transparent",
                    border:        "none",
                    borderBottom:  tab === key ? "2px solid var(--accent)" : "2px solid transparent",
                    cursor:        "pointer",
                    transition:    "color 0.15s",
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{
                      marginLeft:  "6px",
                      fontSize:    "10px",
                      fontWeight:  600,
                      padding:     "1px 5px",
                      borderRadius:"4px",
                      background:  tab === key ? "var(--accent-soft)" : "var(--surface-3)",
                      color:       tab === key ? "var(--accent)" : "var(--text-3)",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="scroll-area p-5 flex flex-col gap-5">

            {/* Error */}
            {error && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            {/* Skeleton carga inicial */}
            {loading && rows.length === 0 && (
              <div className="flex flex-col gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[88px] rounded-xl animate-pulse"
                    style={{ background: "var(--surface-2)" }}
                  />
                ))}
              </div>
            )}

            {/* ── TAB PENDIENTES ─────────────────────────── */}
            {!loading && tab === "pending" && (
              <>
                {pending.length === 0 && (
                  <div
                    className="flex items-center justify-center py-16 rounded-xl text-sm"
                    style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}
                  >
                    {rows.length === 0 ? "Sin ítems cobrables." : "No hay ítems pendientes de cobro."}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
                  {pending.map(row => (
                    <div
                      key={row.recepcion_id}
                      style={{
                        display:       "flex",
                        flexDirection: "column",
                        background:    "var(--surface, #ffffff)",
                        border:        "1px solid var(--border, #d5dbe2)",
                        borderRadius:  "12px",
                        minWidth:      0,
                        width:         "100%",
                      }}
                    >
                      {/* ── HEADER: cliente · teléfono/ciudad | monto ── */}
                      <div style={{
                        display:        "flex",
                        justifyContent: "space-between",
                        alignItems:     "flex-start",
                        gap:            "12px",
                        padding:        "16px 18px 14px",
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.cliente_nombre}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-3)", lineHeight: 1.4 }}>
                            {[row.cliente_telefono, row.departamento_destino].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <span style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "var(--text)", fontFamily: "'Geist Mono', 'Courier New', monospace", letterSpacing: "-0.01em", flexShrink: 0 }}>
                          {formatBs(row.cobro_cliente_bs)}
                        </span>
                      </div>

                      {/* ── DETALLE: descripción | tracking+ubicación+zona ── */}
                      <div style={{ borderTop: "1px solid var(--border, #d5dbe2)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5, flex: "1 1 220px", minWidth: 0 }}>
                          {row.item_descripcion || "—"}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: "0 1 auto", maxWidth: "100%" }}>
                          <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", color: "var(--text-3)" }}>
                            {row.tracking_number || "Sin tracking"}
                          </span>
                          {row.ubicacion_codigo ? (
                            <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", fontWeight: 600, color: "var(--text-2)" }}>
                              {row.ubicacion_codigo}
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Sin ubicación</span>
                          )}
                          {row.zona && (
                            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", fontWeight: 500, ...(ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos) }}>
                              {ZONA_LABEL[row.zona] ?? row.zona}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── FOOTER: botón ── */}
                      <div style={{
                        borderTop:    "1px solid var(--border, #d5dbe2)",
                        background:   "var(--surface-2, #e9eef2)",
                        padding:      "12px 18px",
                        display:      "flex",
                        gap:          "8px",
                        borderRadius: "0 0 12px 12px",
                      }}>
                        <button
                          className="ui-button ui-button-sm"
                          style={{ flexShrink: 0 }}
                          onClick={() => abrirWhatsApp(row)}
                          disabled={enviando === row.recepcion_id}
                        >
                          {enviando === row.recepcion_id ? "..." : "Cobrar por WhatsApp"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── TAB COBRO ENVIADO ──────────────────────── */}
            {!loading && tab === "sent" && (
              <>
                {sent.length === 0 && (
                  <div
                    className="flex items-center justify-center py-16 rounded-xl text-sm"
                    style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}
                  >
                    Sin cobros enviados todavía.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
                  {sent.map(row => (
                    <div
                      key={row.recepcion_id}
                      style={{
                        display:       "flex",
                        flexDirection: "column",
                        background:    "var(--surface, #ffffff)",
                        border:        "1px solid var(--border, #d5dbe2)",
                        borderRadius:  "12px",
                        minWidth:      0,
                        width:         "100%",
                      }}
                    >
                      {/* ── HEADER ── */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", padding: "16px 18px 14px" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--text-2)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.cliente_nombre}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-3)", lineHeight: 1.4 }}>
                            {[row.cliente_telefono, row.departamento_destino].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <span style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--text-2)", fontFamily: "'Geist Mono', 'Courier New', monospace" }}>
                            {formatBs(row.cobro_cliente_bs)}
                          </span>
                          <Badge type="info">Enviado</Badge>
                        </div>
                      </div>

                      {/* ── DETALLE ── */}
                      <div style={{ borderTop: "1px solid var(--border, #d5dbe2)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)", lineHeight: 1.5, flex: "1 1 220px", minWidth: 0 }}>
                          {row.item_descripcion || "—"}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: "0 1 auto", maxWidth: "100%" }}>
                          <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", color: "var(--text-3)" }}>
                            {row.tracking_number || "Sin tracking"}
                          </span>
                          {row.ubicacion_codigo ? (
                            <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", fontWeight: 600, color: "var(--text-2)" }}>
                              {row.ubicacion_codigo}
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Sin ubicación</span>
                          )}
                          {row.zona && (
                            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", fontWeight: 500, ...(ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos) }}>
                              {ZONA_LABEL[row.zona] ?? row.zona}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── FOOTER: botones ── */}
                      <div style={{ borderTop: "1px solid var(--border, #d5dbe2)", background: "var(--surface-2, #e9eef2)", padding: "12px 18px", display: "flex", gap: "8px", justifyContent: "flex-end", borderRadius: "0 0 12px 12px" }}>
                        <button
                          className="ui-button-ghost ui-button-sm"
                          style={{ flexShrink: 0 }}
                          onClick={() => recordarCobro(row)}
                          disabled={recordando === row.recepcion_id}
                        >
                          {recordando === row.recepcion_id ? "..." : "Recordar cobro"}
                        </button>
                        <button
                          className="ui-button ui-button-sm"
                          style={{ flexShrink: 0 }}
                          onClick={() => setCobrando(row)}
                        >
                          Confirmar pago
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── TAB PAGO CONFIRMADO ────────────────── */}
            {!loading && tab === "finished" && (
              <>
                {finished.length === 0 && (
                  <div
                    className="flex items-center justify-center py-16 rounded-xl text-sm"
                    style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}
                  >
                    Sin pagos confirmados.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
                  {finished.map(row => (
                    <div
                      key={row.recepcion_id}
                      style={{
                        display:       "flex",
                        flexDirection: "column",
                        background:    "var(--surface, #ffffff)",
                        border:        "1px solid var(--border, #d5dbe2)",
                        borderRadius:  "12px",
                        minWidth:      0,
                        width:         "100%",
                      }}
                    >
                      {/* Header */}
                      <div style={{
                        display:        "flex",
                        justifyContent: "space-between",
                        alignItems:     "flex-start",
                        gap:            "12px",
                        padding:        "16px 18px",
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-2)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.cliente_nombre}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
                            {[row.cliente_telefono, row.departamento_destino].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <span style={{ fontWeight: 500, fontSize: "13px", color: "var(--text-3)", fontFamily: "'Geist Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
                            {formatBs(row.cobro_cliente_bs)}
                          </span>
                          <Badge type="success">Pagado</Badge>
                        </div>
                      </div>

                      {/* Detalle */}
                      <div style={{ borderTop: "1px solid var(--border, #d5dbe2)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)", lineHeight: 1.5, flex: "1 1 220px", minWidth: 0 }}>
                          {row.item_descripcion || "—"}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: "0 1 auto", maxWidth: "100%" }}>
                          {row.tracking_number && (
                            <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", color: "var(--text-3)" }}>
                              {row.tracking_number}
                            </span>
                          )}
                          {row.ubicacion_codigo && (
                            <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", fontWeight: 600, color: "var(--text-2)" }}>
                              {row.ubicacion_codigo}
                            </span>
                          )}
                          {row.zona && (
                            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", fontWeight: 500, ...(ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos) }}>
                              {ZONA_LABEL[row.zona] ?? row.zona}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer: método + fecha */}
                      <div style={{
                        borderTop:    "1px solid var(--border, #d5dbe2)",
                        background:   "var(--surface-2, #e9eef2)",
                        padding:      "10px 18px",
                        display:      "flex",
                        alignItems:   "center",
                        gap:          "12px",
                        borderRadius: "0 0 12px 12px",
                      }}>
                        {row.payment_method && (
                          <span style={{ fontSize: "11px", color: "var(--text-3)", textTransform: "capitalize" }}>
                            {row.payment_method}
                          </span>
                        )}
                        {row.paid_at && (
                          <span style={{ fontSize: "11px", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                            {formatFecha(row.paid_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>{/* scroll-area */}
        </div>{/* panel */}
      </div>{/* module-body */}

      {cobrando && (
        <ModalCobro
          row={cobrando}
          onClose={() => setCobrando(null)}
          onSaved={() => {
            setCobrando(null)
            fetchItems(q)
          }}
        />
      )}

    </div>
  )
}
