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
  const [q, setQ]               = useState("")
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [cobrando, setCobrando] = useState(null)
  const [enviando, setEnviando] = useState(null)
  const debounceRef             = useRef(null)

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
    } catch {
      // silencioso — el mensaje no se pudo generar
    } finally {
      setEnviando(null)
    }
  }

  const pending = rows.filter(r => r.payment_status === "pending")
  const paid    = rows.filter(r => r.payment_status === "paid")

  return (
    <div className="module-shell">

      {/* Header */}
      <div className="module-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="ui-section-title">Finanzas</p>
            <h2 className="ui-page-title">Cobros</h2>
          </div>
          {!loading && (
            <div className="flex gap-3 text-xs" style={{ color: "var(--text-3)" }}>
              <span>{pending.length} pendiente{pending.length !== 1 ? "s" : ""}</span>
              <span>{paid.length} cobrado{paid.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      <div className="module-body">
        <div className="panel flex-1">

          {/* Búsqueda fija arriba */}
          <div className="panel-header">
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
          </div>{/* panel-header */}

          <div className="scroll-area p-5 flex flex-col gap-4">

          {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && rows.length === 0 && !error && (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>Sin ítems cobrables.</p>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {rows.map(row => (
            <div
              key={row.recepcion_id}
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              {/* Header: cliente + estado + monto */}
              <div
                className="flex items-start justify-between gap-3 px-4 py-3"
                style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
                    {row.cliente_nombre}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    {[row.cliente_telefono, row.departamento_destino].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {row.payment_status === "paid"
                    ? <Badge type="success">Cobrado</Badge>
                    : <Badge type="pendiente">Pendiente</Badge>
                  }
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                    {formatBs(row.cobro_cliente_bs)}
                  </span>
                </div>
              </div>

              {/* Body: ítem + tracking + ubicación + pago */}
              <div className="px-4 py-3 flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                    Ítem
                  </p>
                  <p className="text-xs leading-snug" style={{ color: "var(--text-2)" }}>
                    {row.item_descripcion || "—"}
                  </p>
                </div>

                <div className="w-32 flex-shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                    Tracking
                  </p>
                  <p className="text-xs font-mono" style={{ color: "var(--text-3)" }}>
                    {row.tracking_number || "—"}
                  </p>
                </div>

                <div className="w-28 flex-shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                    Ubicación
                  </p>
                  {row.ubicacion_codigo ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-2)" }}>
                        {row.ubicacion_codigo}
                      </span>
                      {row.zona && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={ZONA_STYLE[row.zona] ?? ZONA_STYLE.desconocidos}>
                          {ZONA_LABEL[row.zona] ?? row.zona}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>—</p>
                  )}
                </div>

                {row.payment_status === "paid" && (
                  <div className="w-44 flex-shrink-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                      Pago registrado
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-2)" }}>
                      {formatBs(row.payment_amount)} · {row.payment_method} · {formatFecha(row.paid_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer: acciones (solo pendientes) */}
              {row.payment_status === "pending" && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
                >
                  <button
                    className="ui-button ui-button-sm"
                    onClick={() => abrirWhatsApp(row)}
                    disabled={enviando === row.recepcion_id}
                  >
                    {enviando === row.recepcion_id ? "..." : "Cobrar por WhatsApp"}
                  </button>
                  <button
                    className="ui-button-ghost ui-button-sm"
                    onClick={() => setCobrando(row)}
                  >
                    Registrar cobro
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
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
