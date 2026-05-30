import { useState, useEffect, useRef, useMemo } from "react"
import { API_URL } from "../config/api"
import Badge from "../components/ui/Badge"
import useRealtimeEvents from "../hooks/useRealtimeEvents"
import { normalizarUbicacion } from "../utils/ubicacion"

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

function formatDateTime(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
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

// Formato boliviano para resumen: Bs 1.234,50
function fmtBs(val) {
  const n = Number(val || 0)
  return "Bs " + n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
      // Pasar los recepcion_item_ids de esta remesa para vínculo exacto
      const recepcionIds = itemsCliente.map(i => i.recepcion_id).filter(Boolean)
      const itemsQuery   = recepcionIds.length > 0 ? `?items=${recepcionIds.join(",")}` : ""
      const res  = await fetch(`${API_URL}/cobros/link-formulario/${row.cliente_id}${itemsQuery}`)
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
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [cobrando, setCobrando]     = useState(null)
  const [enviando, setEnviando]     = useState(null)
  const [recordando, setRecordando] = useState(null)
  const [tab, setTab]               = useState("pending")
  const [rowsVoid, setRowsVoid]     = useState([])
  const [loadingVoid, setLoadingVoid] = useState(false)
  const [anulandoId, setAnulandoId]       = useState(null) // id con confirm expandido
  const [anulaMotivo, setAnulaMotivo]     = useState("")
  const [anulaLoading, setAnulaLoading]   = useState(false)
  const [anulaError, setAnulaError]       = useState(null)
  const [revertiendoId, setRevertiendoId] = useState(null)
  const [revertError, setRevertError]     = useState(null)
  const [expandedClientes, setExpandedClientes] = useState(new Set())
  const [enviandoCliente, setEnviandoCliente]   = useState(null)
  const [expandedDetalles, setExpandedDetalles] = useState(new Set())
  const debounceRef                 = useRef(null)

  async function fetchItems(query, desde, hasta) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query || "" })
      if (desde) params.set("fecha_desde", desde)
      if (hasta) params.set("fecha_hasta", hasta)
      const res  = await fetch(`${API_URL}/cobros/items?${params}`)
      const json = await res.json()
      setRows(Array.isArray(json.data) ? json.data : [])
    } catch {
      setError("Error al cargar cobros")
    } finally {
      setLoading(false)
    }
  }

  async function fetchVoid() {
    setLoadingVoid(true)
    try {
      const res  = await fetch(`${API_URL}/cobros/items?status=void`)
      const json = await res.json()
      setRowsVoid(Array.isArray(json.data) ? json.data : [])
    } catch {
      // silencioso — el listado simplemente queda vacío
    } finally {
      setLoadingVoid(false)
    }
  }

  useEffect(() => { fetchItems("", "", "") }, [])

  // Cargar anulados al entrar al tab
  useEffect(() => { if (tab === "void") fetchVoid() }, [tab])

  // Actualizar automáticamente cuando otro operador cambia un cobro
  useRealtimeEvents((event) => {
    if (event.type === "cobros.updated") {
      fetchItems(q, fechaDesde, fechaHasta)
      if (tab === "void") fetchVoid()
    }
  })

  function handleChange(e) {
    const val = e.target.value
    setQ(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(val, fechaDesde, fechaHasta), 350)
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      clearTimeout(debounceRef.current)
      fetchItems(q, fechaDesde, fechaHasta)
    }
  }

  function handleFechaDesde(e) {
    const val = e.target.value
    setFechaDesde(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(q, val, fechaHasta), 350)
  }

  function handleFechaHasta(e) {
    const val = e.target.value
    setFechaHasta(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(q, fechaDesde, val), 350)
  }

  function limpiarFechas() {
    setFechaDesde("")
    setFechaHasta("")
    fetchItems(q, "", "")
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

      // Marcar como enviados TODOS los ítems del cliente incluidos en el mensaje
      const ids = itemsCliente.map(i => i.recepcion_id)
      try {
        const patchRes = await fetch(`${API_URL}/cobros/items/enviado-lote`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        })
        if (patchRes.ok) {
          const idsSet = new Set(ids)
          setRows(prev => prev.map(r =>
            idsSet.has(r.recepcion_id)
              ? { ...r, payment_status: "sent" }
              : r
          ))
        } else {
          console.error("No se pudo marcar cobros como enviados:", await patchRes.text())
        }
      } catch (patchErr) {
        console.error("Error al marcar cobros como enviados:", patchErr)
      }
    } catch {
      // silencioso — el mensaje no se pudo generar
    } finally {
      setEnviando(null)
    }
  }

  async function abrirWhatsAppCliente(group) {
    if (enviandoCliente === group.cliente_id) return
    setEnviandoCliente(group.cliente_id)
    try {
      // Reutiliza abrirWhatsApp con el primer ítem del grupo.
      // abrirWhatsApp ya detecta y marca todos los pending del mismo cliente.
      await abrirWhatsApp(group.items[0])
    } finally {
      setEnviandoCliente(null)
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

  async function confirmarAnular(row) {
    if (anulaLoading) return
    setAnulaLoading(true)
    setAnulaError(null)
    try {
      const res = await fetch(`${API_URL}/cobros/items/${row.recepcion_id}/anular`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: anulaMotivo.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAnulaError(json.error || "Error al anular el cobro")
        return
      }
      // Quitar el ítem de la lista local
      setRows(prev => prev.filter(r => r.recepcion_id !== row.recepcion_id))
      setAnulandoId(null)
      setAnulaMotivo("")
    } catch {
      setAnulaError("Error de red")
    } finally {
      setAnulaLoading(false)
    }
  }

  function abrirAnular(recepcionId) {
    setAnulandoId(recepcionId)
    setAnulaMotivo("")
    setAnulaError(null)
  }

  function cancelarAnular() {
    setAnulandoId(null)
    setAnulaMotivo("")
    setAnulaError(null)
  }

  async function revertirCobro(row) {
    if (!window.confirm("¿Revertir este cobro anulado a pendientes?")) return
    setRevertiendoId(row.recepcion_id)
    setRevertError(null)
    try {
      const res  = await fetch(`${API_URL}/cobros/items/${row.recepcion_id}/revertir`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!res.ok) { setRevertError(json.error || "Error al revertir"); return }
      setRowsVoid(prev => prev.filter(r => r.recepcion_id !== row.recepcion_id))
      await fetchItems(q, fechaDesde, fechaHasta)
      setTab("pending")
    } catch {
      setRevertError("Error de red")
    } finally {
      setRevertiendoId(null)
    }
  }

  const pending       = rows.filter(r => r.payment_status === "pending")
  const sent          = rows.filter(r => r.payment_status === "sent")
  const paidOnly      = rows.filter(r => r.payment_status === "paid")
  const confirmedOnly = rows.filter(r => r.payment_status === "confirmed")
  // Totales financieros — calculados sobre todos los rows cargados
  const _sum = (arr, field) => arr.reduce((a, r) => a + Number(r[field] || 0), 0)
  const pendingAmount       = _sum(pending,       "cobro_cliente_bs")
  const sentAmount          = _sum(sent,          "cobro_cliente_bs")
  const paidOnlyAmount      = _sum(paidOnly,      "payment_amount")
  const confirmedOnlyAmount = _sum(confirmedOnly, "payment_amount")
  const totalAmount         = _sum(rows,          "cobro_cliente_bs")

  // Pendientes agrupados por cliente
  const groupedPending = useMemo(() => {
    const map = new Map()
    for (const row of rows) {
      if (row.payment_status !== "pending") continue
      const cid = row.cliente_id
      if (!map.has(cid)) {
        map.set(cid, {
          cliente_id:           cid,
          cliente_nombre:       row.cliente_nombre,
          cliente_telefono:     row.cliente_telefono,
          departamento_destino: row.departamento_destino,
          items:                [],
          total_bs:             0,
        })
      }
      const g = map.get(cid)
      g.items.push(row)
      g.total_bs += Number(row.cobro_cliente_bs || 0)
    }
    return Array.from(map.values())
  }, [rows])

  function toggleExpanded(clienteId) {
    setExpandedClientes(prev => {
      const next = new Set(prev)
      if (next.has(clienteId)) next.delete(clienteId)
      else next.add(clienteId)
      return next
    })
  }

  function toggleDetalle(recepcionId) {
    setExpandedDetalles(prev => {
      const next = new Set(prev)
      if (next.has(recepcionId)) next.delete(recepcionId)
      else next.add(recepcionId)
      return next
    })
  }

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
              {paidOnly.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium tabular-nums"
                  style={{ background: "var(--success-soft)", color: "var(--success)" }}
                >
                  {paidOnly.length} registrado{paidOnly.length !== 1 ? "s" : ""}
                </span>
              )}
              {confirmedOnly.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium tabular-nums"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {confirmedOnly.length} cerrado{confirmedOnly.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="module-body">

        {/* ─ Resumen financiero ───────────────────────────────── */}
        {!loading && (
          <div
            className="grid grid-cols-2 lg:grid-cols-5 gap-2.5"
            style={{ marginBottom: "16px" }}
          >
            {[
              { key: "pendiente",  label: "Pendiente de cobro", amount: pendingAmount,       count: pending.length,       color: "var(--warning)"  },
              { key: "enviado",    label: "Cobro enviado",      amount: sentAmount,          count: sent.length,          color: "var(--accent)"   },
              { key: "cobrado",    label: "Pago registrado",    amount: paidOnlyAmount,      count: paidOnly.length,      color: "var(--success)"  },
              { key: "cerrado",    label: "Pago cerrado",       amount: confirmedOnlyAmount, count: confirmedOnly.length, color: "var(--accent)",   subtitle: "Cerrado por entrega" },
              { key: "total",      label: "Total en cobros",    amount: totalAmount,         count: rows.length,          color: "var(--text-2)",   subtitle: "Pendientes + enviados + registrados" },
            ].map(card => (
              <div
                key={card.key}
                style={{
                  background:    "var(--surface)",
                  border:        "1px solid var(--border)",
                  borderRadius:  "10px",
                  padding:       "14px 16px",
                  display:       "flex",
                  flexDirection: "column",
                  gap:           "3px",
                }}
              >
                <p style={{
                  margin: 0, fontSize: "10px", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.10em",
                  color: "var(--text-3)", fontFamily: "'Geist Mono', monospace",
                }}>
                  {card.label}
                </p>
                <p style={{
                  margin: 0, fontSize: "18px", fontWeight: 700,
                  color: card.color, fontFamily: "'Geist Mono', monospace",
                  letterSpacing: "-0.01em", lineHeight: 1.2, marginTop: "2px",
                }}>
                  {fmtBs(card.amount)}
                </p>
                <p style={{
                  margin: 0, fontSize: "11px", color: "var(--text-3)", marginTop: "4px",
                }}>
                  {card.count} ítem{card.count !== 1 ? "s" : ""}
                </p>
                {card.subtitle && (
                  <p style={{
                    margin: 0, fontSize: "9px", color: "var(--text-3)", marginTop: "3px",
                    lineHeight: 1.3, opacity: 0.75,
                  }}>
                    {card.subtitle}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="panel flex-1">

          {/* Búsqueda + Tabs */}
          <div className="panel-header flex flex-col gap-3" style={{ paddingBottom: "0" }}>
            <div className="flex gap-2 flex-wrap">
              <input
                className="ui-input flex-1 max-w-md"
                placeholder="Cliente, tracking, REC, descripción..."
                value={q}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
              <button
                className="ui-button whitespace-nowrap"
                onClick={() => { clearTimeout(debounceRef.current); fetchItems(q, fechaDesde, fechaHasta) }}
                disabled={loading}
              >
                {loading ? "..." : "Buscar"}
              </button>
            </div>
            {/* Filtro de fechas */}
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-1.5">
                <label style={{ fontSize: "11px", color: "var(--text-3)", whiteSpace: "nowrap" }}>Desde</label>
                <input
                  type="date"
                  className="ui-input"
                  style={{ fontSize: "12px", padding: "5px 8px", width: "140px" }}
                  value={fechaDesde}
                  onChange={handleFechaDesde}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label style={{ fontSize: "11px", color: "var(--text-3)", whiteSpace: "nowrap" }}>Hasta</label>
                <input
                  type="date"
                  className="ui-input"
                  style={{ fontSize: "12px", padding: "5px 8px", width: "140px" }}
                  value={fechaHasta}
                  onChange={handleFechaHasta}
                />
              </div>
              {(fechaDesde || fechaHasta) && (
                <button
                  className="ui-button-ghost"
                  style={{ fontSize: "11px", padding: "4px 10px", color: "var(--text-3)" }}
                  onClick={limpiarFechas}
                >
                  ✕ Limpiar fechas
                </button>
              )}
            </div>
            <div style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", maxWidth: "100%" }}>
              {[
                { key: "pending",   label: "Pendientes",      count: pending.length       },
                { key: "sent",      label: "Cobro enviado",   count: sent.length          },
                { key: "paid",      label: "Pago registrado", count: paidOnly.length      },
                { key: "confirmed", label: "Pago cerrado",    count: confirmedOnly.length },
                { key: "void",      label: "Anulados",        count: rowsVoid.length      },
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

            {/* ── TAB PENDIENTES — agrupado por cliente ──── */}
            {!loading && tab === "pending" && (
              <>
                {groupedPending.length === 0 && (
                  <div
                    className="flex items-center justify-center py-16 rounded-xl text-sm"
                    style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}
                  >
                    {rows.length === 0 ? "Sin ítems cobrables." : "No hay ítems pendientes de cobro."}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
                  {groupedPending.map(group => {
                    const expanded    = expandedClientes.has(group.cliente_id)
                    const sendingThis = enviandoCliente === group.cliente_id

                    return (
                      <div
                        key={group.cliente_id}
                        style={{
                          display:       "flex",
                          flexDirection: "column",
                          background:    "var(--surface)",
                          border:        "1px solid var(--border)",
                          borderRadius:  "12px",
                          minWidth:      0,
                          width:         "100%",
                        }}
                      >
                        {/* ── HEADER: cliente · totales ── */}
                        <div style={{
                          display:        "flex",
                          justifyContent: "space-between",
                          alignItems:     "flex-start",
                          gap:            "12px",
                          padding:        "16px 18px 14px",
                        }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{
                              margin: 0, fontWeight: 700, fontSize: "14px",
                              color: "var(--text)", lineHeight: 1.3,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {group.cliente_nombre}
                            </p>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-3)", lineHeight: 1.4 }}>
                              {[group.cliente_telefono, group.departamento_destino].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>
                          <div style={{
                            display: "flex", flexDirection: "column",
                            alignItems: "flex-end", gap: "3px", flexShrink: 0,
                          }}>
                            <span style={{
                              fontWeight: 700, fontSize: "16px", color: "var(--text)",
                              fontFamily: "'Geist Mono', 'Courier New', monospace", letterSpacing: "-0.01em",
                            }}>
                              {fmtBs(group.total_bs)}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                              {group.items.length} ítem{group.items.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* ── DETALLE EXPANDIDO ── */}
                        {expanded && (
                          <div style={{ borderTop: "1px solid var(--border)" }}>
                            {group.items.map((item, idx) => (
                              <div
                                key={item.recepcion_id}
                                style={{
                                  padding:    "12px 18px",
                                  display:    "flex",
                                  gap:        "12px",
                                  alignItems: "flex-start",
                                  borderTop:  idx === 0 ? "none" : "1px solid var(--border)",
                                }}
                              >
                                {/* Info del ítem */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{
                                    margin: 0, fontSize: "12px", fontWeight: 500,
                                    color: "var(--text-2)", lineHeight: 1.5,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}>
                                    {item.item_descripcion || "—"}
                                  </p>
                                  <div style={{
                                    display: "flex", flexWrap: "wrap",
                                    gap: "6px", marginTop: "5px", alignItems: "center",
                                  }}>
                                    {item.tracking_number && (
                                      <span style={{
                                        fontSize: "10px", fontFamily: "'Courier New', monospace",
                                        color: "var(--text-3)",
                                      }}>
                                        {item.tracking_number}
                                      </span>
                                    )}
                                    {item.codigo_recepcion && (
                                      <span style={{
                                        fontSize: "10px", fontFamily: "'Courier New', monospace",
                                        color: "var(--text-3)",
                                      }}>
                                        {item.codigo_recepcion}
                                      </span>
                                    )}
                                    {item.ubicacion_codigo && (
                                      <span style={{
                                        fontSize: "10px", fontFamily: "'Courier New', monospace",
                                        fontWeight: 600, color: "var(--text-2)",
                                      }}>
                                        {normalizarUbicacion(item.ubicacion_codigo)}
                                      </span>
                                    )}
                                    {item.zona && (
                                      <span style={{
                                        fontSize: "10px", padding: "1px 6px", borderRadius: "4px",
                                        fontWeight: 500,
                                        ...(ZONA_STYLE[item.zona] ?? ZONA_STYLE.desconocidos),
                                      }}>
                                        {ZONA_LABEL[item.zona] ?? item.zona}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Monto + acción individual */}
                                <div style={{
                                  display: "flex", flexDirection: "column",
                                  alignItems: "flex-end", gap: "6px", flexShrink: 0,
                                }}>
                                  <span style={{
                                    fontSize: "13px", fontWeight: 600, color: "var(--text)",
                                    fontFamily: "'Geist Mono', 'Courier New', monospace",
                                  }}>
                                    {formatBs(item.cobro_cliente_bs)}
                                  </span>
                                  <button
                                    className="ui-button-ghost ui-button-sm"
                                    style={{ fontSize: "11px" }}
                                    onClick={() => setCobrando(item)}
                                  >
                                    Cobrar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── FOOTER ── */}
                        <div style={{
                          borderTop:    "1px solid var(--border)",
                          background:   "var(--surface-2)",
                          padding:      "12px 18px",
                          display:      "flex",
                          gap:          "8px",
                          alignItems:   "center",
                          borderRadius: "0 0 12px 12px",
                        }}>
                          <button
                            className="ui-button ui-button-sm"
                            style={{ flexShrink: 0 }}
                            onClick={() => abrirWhatsAppCliente(group)}
                            disabled={sendingThis}
                          >
                            {sendingThis ? "..." : "Cobrar por WhatsApp"}
                          </button>
                          <button
                            className="ui-button-ghost ui-button-sm"
                            style={{ marginLeft: "auto", flexShrink: 0 }}
                            onClick={() => toggleExpanded(group.cliente_id)}
                          >
                            {expanded
                              ? "Ocultar ítems ▲"
                              : `Ver ${group.items.length} ítem${group.items.length !== 1 ? "s" : ""} ▼`}
                          </button>
                        </div>
                      </div>
                    )
                  })}
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
                  {sent.map(row => {
                    const detalleOpen = expandedDetalles.has(row.recepcion_id)

                    // Campos para el bloque de detalle
                    const detalleFields = [
                      { label: "Producto",       value: row.item_descripcion,              mono: false },
                      { label: "Monto",          value: formatBs(row.cobro_cliente_bs),    mono: true  },
                      { label: "Cliente",        value: row.cliente_nombre,                mono: false },
                      { label: "Teléfono",       value: row.cliente_telefono,              mono: true  },
                      { label: "Ciudad",         value: row.departamento_destino,          mono: false },
                      { label: "Recepción",      value: formatDateTime(row.recibido_at),   mono: true  },
                      { label: "Cobro enviado",  value: formatDateTime(row.cobro_enviado_at), mono: true },
                      { label: "Código REC",     value: row.codigo_recepcion,              mono: true  },
                      { label: "Tracking",       value: row.tracking_number,               mono: true  },
                      { label: "Ubicación",      value: normalizarUbicacion(row.ubicacion_codigo), mono: true  },
                    ]

                    return (
                      <div
                        key={row.recepcion_id}
                        style={{
                          display:       "flex",
                          flexDirection: "column",
                          background:    "var(--surface)",
                          border:        "1px solid var(--border)",
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

                        {/* ── RESUMEN COMPACTO ── */}
                        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)", lineHeight: 1.5, flex: "1 1 220px", minWidth: 0 }}>
                            {row.item_descripcion || "—"}
                          </p>
                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: "0 1 auto", maxWidth: "100%" }}>
                            <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", color: "var(--text-3)" }}>
                              {row.tracking_number || "Sin tracking"}
                            </span>
                            {row.ubicacion_codigo ? (
                              <span style={{ fontSize: "11px", fontFamily: "'Courier New', monospace", fontWeight: 600, color: "var(--text-2)" }}>
                                {normalizarUbicacion(row.ubicacion_codigo)}
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

                        {/* ── DETALLE EXPANDIDO ── */}
                        {detalleOpen && (
                          <div style={{
                            borderTop:           "1px solid var(--border)",
                            padding:             "14px 18px",
                            display:             "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                            gap:                 "10px 24px",
                            background:          "var(--surface-2)",
                          }}>
                            {detalleFields.map(({ label, value, mono }) =>
                              value ? (
                                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{
                                    fontSize: "10px", fontWeight: 600,
                                    textTransform: "uppercase", letterSpacing: "0.08em",
                                    color: "var(--text-3)",
                                  }}>
                                    {label}
                                  </span>
                                  <span style={{
                                    fontSize: "12px",
                                    color: "var(--text-2)",
                                    fontFamily: mono ? "'Courier New', monospace" : "inherit",
                                    wordBreak: "break-all",
                                  }}>
                                    {value}
                                  </span>
                                </div>
                              ) : null
                            )}
                          </div>
                        )}

                        {/* ── PANEL ANULAR (confirmación inline) ── */}
                        {anulandoId === row.recepcion_id && (
                          <div style={{
                            borderTop:    "1px solid var(--danger)",
                            background:   "var(--danger-soft)",
                            padding:      "14px 18px",
                            display:      "flex",
                            flexDirection:"column",
                            gap:          "10px",
                          }}>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--danger)" }}>
                              ¿Anular este cobro enviado?
                            </p>
                            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-2)", lineHeight: 1.5 }}>
                              El cobro quedará marcado como anulado y desaparecerá del listado activo.
                              El ítem podrá corregirse o revertirse desde Inventario Bolivia.
                            </p>
                            <input
                              className="ui-input"
                              style={{ fontSize: "12px", padding: "7px 10px" }}
                              placeholder="Motivo de anulación (opcional)"
                              value={anulaMotivo}
                              onChange={e => setAnulaMotivo(e.target.value)}
                              disabled={anulaLoading}
                            />
                            {anulaError && (
                              <p style={{ margin: 0, fontSize: "11px", color: "var(--danger)" }}>{anulaError}</p>
                            )}
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className="ui-button-sm"
                                style={{
                                  background: "var(--danger)", color: "#fff",
                                  border: "none", borderRadius: "8px", padding: "6px 14px",
                                  fontWeight: 600, fontSize: "12px", cursor: "pointer",
                                  opacity: anulaLoading ? 0.7 : 1,
                                }}
                                onClick={() => confirmarAnular(row)}
                                disabled={anulaLoading}
                              >
                                {anulaLoading ? "Anulando…" : "Confirmar anulación"}
                              </button>
                              <button
                                className="ui-button-ghost ui-button-sm"
                                onClick={cancelarAnular}
                                disabled={anulaLoading}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── FOOTER: botones ── */}
                        <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)", padding: "12px 18px", display: "flex", gap: "8px", alignItems: "center", borderRadius: "0 0 12px 12px" }}>
                          <button
                            className="ui-button-ghost ui-button-sm"
                            style={{ flexShrink: 0 }}
                            onClick={() => toggleDetalle(row.recepcion_id)}
                          >
                            {detalleOpen ? "Ocultar detalles ▲" : "Ver detalles ▼"}
                          </button>
                          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                            <button
                              className="ui-button-ghost ui-button-sm"
                              style={{ flexShrink: 0, color: "var(--danger)" }}
                              onClick={() => anulandoId === row.recepcion_id ? cancelarAnular() : abrirAnular(row.recepcion_id)}
                            >
                              {anulandoId === row.recepcion_id ? "Cancelar anulación" : "Anular cobro"}
                            </button>
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
                              Registrar pago
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ── TAB PAGO REGISTRADO ────────────────── */}
            {!loading && tab === "paid" && (
              <>
                {paidOnly.length === 0 && (
                  <div
                    className="flex items-center justify-center py-16 rounded-xl text-sm"
                    style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}
                  >
                    Sin pagos registrados.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
                  {paidOnly.map(row => (
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
                          <Badge type="success">Pago registrado</Badge>
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
                              {normalizarUbicacion(row.ubicacion_codigo)}
                            </span>
                          )}
                          {row.zona && (
                            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", fontWeight: 500, ...(ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos) }}>
                              {ZONA_LABEL[row.zona] ?? row.zona}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Panel anular pago */}
                      {anulandoId === row.recepcion_id && (
                        <div style={{
                          borderTop:    "1px solid var(--danger)",
                          background:   "var(--danger-soft)",
                          padding:      "14px 18px",
                          display:      "flex",
                          flexDirection:"column",
                          gap:          "10px",
                        }}>
                          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--danger)" }}>
                            ¿Anular este pago registrado?
                          </p>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-2)", lineHeight: 1.5 }}>
                            El pago registrado quedará anulado. El ítem podrá corregirse o revertirse desde Inventario Bolivia.
                          </p>
                          <input
                            className="ui-input"
                            style={{ fontSize: "12px", padding: "7px 10px" }}
                            placeholder="Motivo de anulación (opcional)"
                            value={anulaMotivo}
                            onChange={e => setAnulaMotivo(e.target.value)}
                            disabled={anulaLoading}
                          />
                          {anulaError && (
                            <p style={{ margin: 0, fontSize: "11px", color: "var(--danger)" }}>{anulaError}</p>
                          )}
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              style={{
                                background: "var(--danger)", color: "#fff",
                                border: "none", borderRadius: "8px", padding: "6px 14px",
                                fontWeight: 600, fontSize: "12px", cursor: "pointer",
                                opacity: anulaLoading ? 0.7 : 1,
                              }}
                              onClick={() => confirmarAnular(row)}
                              disabled={anulaLoading}
                            >
                              {anulaLoading ? "Anulando…" : "Confirmar anulación"}
                            </button>
                            <button className="ui-button-ghost ui-button-sm" onClick={cancelarAnular} disabled={anulaLoading}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Footer: método + fecha + anular */}
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
                        <button
                          className="ui-button-ghost ui-button-sm"
                          style={{ marginLeft: "auto", color: "var(--danger)", fontSize: "11px" }}
                          onClick={() => anulandoId === row.recepcion_id ? cancelarAnular() : abrirAnular(row.recepcion_id)}
                        >
                          {anulandoId === row.recepcion_id ? "Cancelar anulación" : "Anular pago"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── TAB PAGO CERRADO ─────────────────────── */}
            {!loading && tab === "confirmed" && (
              <>
                {confirmedOnly.length === 0 && (
                  <div
                    className="flex items-center justify-center py-16 rounded-xl text-sm"
                    style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}
                  >
                    Sin pagos cerrados.
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
                  {confirmedOnly.map(row => (
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
                          <Badge type="info">Pago cerrado</Badge>
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
                              {normalizarUbicacion(row.ubicacion_codigo)}
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
                        <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--text-3)" }}>
                          Cerrado · no anulable
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── TAB ANULADOS ──────────────────────────── */}
            {tab === "void" && (
              <>
                {loadingVoid && (
                  <div className="flex flex-col gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-[72px] rounded-xl animate-pulse"
                        style={{ background: "var(--surface-2)" }} />
                    ))}
                  </div>
                )}

                {!loadingVoid && rowsVoid.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 rounded-xl gap-3 text-sm"
                    style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}>
                    <span>Sin cobros anulados.</span>
                  </div>
                )}

                {!loadingVoid && rowsVoid.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {rowsVoid.map(row => {
                      const esReversion = row.origen_anulacion === "inventario_reversion"
                      const origenLabel = esReversion
                        ? "Anulado por reversión de inventario"
                        : "Anulado desde Cobros"
                      const origenStyle = esReversion
                        ? { background: "var(--warning-soft)", color: "var(--warning)" }
                        : { background: "var(--surface-3)", color: "var(--text-3)" }

                      return (
                        <div
                          key={row.record_id || row.recepcion_id}
                          style={{
                            display:       "flex",
                            flexDirection: "column",
                            background:    "var(--surface)",
                            border:        "1px solid var(--border)",
                            borderRadius:  "12px",
                            opacity:       0.9,
                          }}
                        >
                          {/* Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", padding: "14px 18px 12px" }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "var(--text-2)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.cliente_nombre}
                              </p>
                              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.item_descripcion || "—"}
                              </p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
                              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-3)", fontFamily: "'Geist Mono', 'Courier New', monospace" }}>
                                {formatBs(row.cobro_cliente_bs)}
                              </span>
                              <span style={{
                                fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px",
                                letterSpacing: "0.04em", whiteSpace: "nowrap",
                                ...origenStyle,
                              }}>
                                {origenLabel}
                              </span>
                            </div>
                          </div>

                          {/* Datos */}
                          <div style={{
                            borderTop: "1px solid var(--border)",
                            padding: "10px 18px",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                            gap: "8px 20px",
                            background: "var(--surface-2)",
                            borderRadius: "0 0 12px 12px",
                          }}>
                            {[
                              { label: "Tracking",      value: row.tracking_number,                  mono: true  },
                              { label: "Código REC",    value: row.codigo_recepcion,                 mono: true  },
                              { label: "Teléfono",      value: row.cliente_telefono,                 mono: true  },
                              { label: "Ciudad",        value: row.departamento_destino,             mono: false },
                              { label: "Cobro enviado", value: formatDateTime(row.cobro_enviado_at), mono: true  },
                              { label: "Motivo",        value: row.motivo,                           mono: false },
                            ].filter(({ value }) => value).map(({ label, value, mono }) => (
                              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>
                                  {label}
                                </span>
                                <span style={{ fontSize: "11px", color: "var(--text-2)", fontFamily: mono ? "'Courier New', monospace" : "inherit", wordBreak: "break-word", lineHeight: 1.4 }}>
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Footer: revertir — solo para ítems de recepciones_item (no cobros_anulados) */}
                          {row.recepcion_id && row.origen_anulacion !== "cobros_anulados" && (
                            <div style={{ borderTop: "1px solid var(--border)", padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px", borderRadius: "0 0 12px 12px", background: "var(--surface-2)" }}>
                              {revertError && revertiendoId === null && (
                                <span style={{ fontSize: "11px", color: "var(--danger)", flex: 1 }}>{revertError}</span>
                              )}
                              <button
                                className="ui-button-ghost ui-button-sm"
                                style={{ marginLeft: "auto", color: "var(--accent)", fontSize: "11px" }}
                                disabled={revertiendoId === row.recepcion_id}
                                onClick={() => revertirCobro(row)}
                              >
                                {revertiendoId === row.recepcion_id ? "Revirtiendo…" : "Revertir a pendientes"}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
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
