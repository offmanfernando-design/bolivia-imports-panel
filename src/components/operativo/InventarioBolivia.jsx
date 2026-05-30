import { useState, useEffect, useRef, useMemo } from "react"
import { API_URL } from "../../config/api"
import { normalizarUbicacion, desnormalizarUbicacion } from "../../utils/ubicacion"
import useRealtimeEvents from "../../hooks/useRealtimeEvents"

/* ── Etiqueta hoja 110×70mm ─────────────────────────────────
   Función copiada de RecepcionCarga.jsx — no importar para
   evitar dependencia circular; sólo formato "hoja" se usa aquí.
─────────────────────────────────────────────────────────── */
function printEtiquetaAlmacen(data, formato) {
  const {
    cliente_nombre, ubicacion, cobro_cliente_bs, item_descripcion,
    recibido_at, tracking_number, cliente_id
  } = data
  const precio = cobro_cliente_bs != null ? `Bs ${Number(cobro_cliente_bs).toFixed(2)}` : "—"
  const desc = item_descripcion
    ? (item_descripcion.length > 48 ? item_descripcion.slice(0, 48).trimEnd() + "…" : item_descripcion)
    : null

  // vars para etiqueta hoja
  const trackFinal = tracking_number ? tracking_number.slice(-4) : null
  const fechaRaw   = recibido_at || data.recibido_bolivia_at
  const fechaCarga = fechaRaw ? (() => {
    const d = new Date(fechaRaw)
    const p = n => String(n).padStart(2, "0")
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
  })() : null
  const ubicacionN = normalizarUbicacion(ubicacion)
  const ubicParts  = ubicacionN && /^([A-Z]\d+)-(F\d+)$/.test(ubicacionN)
    ? ubicacionN.split("-")
    : null

  let html

  if (formato === "adhesiva") {
    const descCorto = item_descripcion
      ? (item_descripcion.length > 32 ? item_descripcion.slice(0, 32).trimEnd() + "…" : item_descripcion)
      : null
    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiqueta adhesiva almacén</title>
<style>
  @page { size: 80mm 50mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    background: #fff;
    color: #000;
    width: 80mm;
    height: 50mm;
    display: flex;
    align-items: stretch;
  }
  .etiqueta {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 2.5mm 3mm;
    gap: 0;
  }
  .marca {
    font-size: 5.5pt;
    letter-spacing: 0.14em;
    color: #666;
    margin-bottom: 2mm;
    border-bottom: 0.5px solid #ccc;
    padding-bottom: 1.5mm;
    text-transform: uppercase;
  }
  .fila { display: flex; align-items: baseline; gap: 2mm; margin-bottom: 1.5mm; }
  .fila:last-child { margin-bottom: 0; }
  .lbl {
    font-size: 5pt;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    flex-shrink: 0;
    width: 12mm;
  }
  .val { font-size: 9pt; font-weight: 700; line-height: 1.2; word-break: break-word; }
  .val.ubic {
    font-size: 18pt;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.06em;
    line-height: 1;
  }
  .val.precio { font-size: 10pt; }
  .val.desc { font-size: 7pt; font-weight: 400; color: #333; }
  .sep { border: none; border-top: 0.5px solid #ddd; margin: 1.5mm 0; }
  @media print {
    body { width: 80mm; height: 50mm; }
  }
</style>
</head>
<body>
<div class="etiqueta">
  <div class="marca">Bolivia Imports — Almacén</div>
  <div class="fila">
    <div class="lbl">Cliente</div>
    <div class="val">${cliente_nombre || "—"}</div>
  </div>
  <hr class="sep">
  <div class="fila">
    <div class="lbl">Ubic.</div>
    <div class="val ubic">${ubicacionN}</div>
  </div>
  <hr class="sep">
  ${descCorto ? `<div class="fila"><div class="lbl">Ítem</div><div class="val desc">${descCorto}</div></div>` : ""}
  <div class="fila">
    <div class="lbl">Cobrar</div>
    <div class="val precio">${precio}</div>
  </div>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`
  } else {
    // formato === "hoja" — papel personalizado 110mm × 70mm
    const ubicHTML  = ubicParts
      ? `<div class="ubic-split"><div class="ubic-top">${ubicParts[0]}</div><div class="ubic-bot">${ubicParts[1]}</div></div>`
      : `<div class="ubic">${ubicacionN}</div>`
    const metaFecha = fechaCarga ? `<span><span class="ml">Fecha</span>&nbsp;${fechaCarga}</span>` : ""
    const metaTrack = trackFinal ? `<span><span class="ml">Track</span>&nbsp;…${trackFinal}</span>` : ""
    const metaID    = cliente_id ? `<span><span class="ml">ID</span>&nbsp;${cliente_id}</span>`    : ""
    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiqueta hoja almacén</title>
<style>
  @page { size: 110mm 70mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    background: #fff;
    color: #000;
    width: 110mm;
    height: 70mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media screen {
    body { width: auto; height: auto; min-height: 100vh; padding-bottom: 56px; }
  }
  .etiqueta {
    width: 104mm;
    height: 62mm;
    border: 1px solid #111;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .header {
    background: #111;
    color: #fff;
    font-size: 5.5pt;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    font-weight: 700;
    flex-shrink: 0;
    min-height: 7mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .body {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 1.5mm 2.5mm;
  }
  .col-left {
    flex: 0 0 62%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-right: 2mm;
  }
  .col-right {
    flex: 0 0 38%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-left: 0.5px solid #ccc;
    padding-left: 2mm;
  }
  .lbl {
    font-size: 4pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #888;
    margin-bottom: 0.5mm;
  }
  .cliente {
    font-size: 11pt;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5mm 3mm;
    font-size: 6.5pt;
    color: #222;
    line-height: 1.4;
  }
  .ml {
    font-size: 4pt;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    margin-right: 0.8mm;
  }
  .desc {
    font-size: 7pt;
    color: #333;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ubic-lbl {
    font-size: 4pt;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #888;
    margin-bottom: 1mm;
  }
  .ubic {
    font-size: 18pt;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.1;
    text-align: center;
    word-break: break-all;
  }
  .ubic-split {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5mm;
    line-height: 1;
  }
  .ubic-top {
    font-size: 20pt;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .ubic-bot {
    font-size: 13pt;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    color: #444;
    letter-spacing: 0.04em;
  }
  .screen-actions {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    padding: 8px 12px;
    background: #f0f0f0;
    border-top: 1px solid #ccc;
    display: flex;
    gap: 8px;
    z-index: 100;
  }
  .screen-actions button {
    padding: 8px 18px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-family: Arial, sans-serif;
    cursor: pointer;
  }
  .btn-v { background: #222; color: #fff; }
  .btn-c { background: #ddd; color: #333; }
  @media print {
    .screen-actions { display: none !important; }
    body { width: 110mm; height: 70mm; padding-bottom: 0; }
  }
</style>
</head>
<body>
<div class="etiqueta">
  <div class="header">Bolivia Imports · Almacén</div>
  <div class="body">
    <div class="col-left">
      <div>
        <div class="lbl">Cliente</div>
        <div class="cliente">${cliente_nombre || "—"}</div>
      </div>
      <div class="meta-row">
        <span><span class="ml">Cobro</span>${precio}</span>
        ${metaFecha}${metaTrack}${metaID}
      </div>
      <div>
        <div class="lbl">Ítem</div>
        <div class="desc">${desc || "—"}</div>
      </div>
    </div>
    <div class="col-right">
      <div class="ubic-lbl">Ubic.</div>
      ${ubicHTML}
    </div>
  </div>
</div>
<div class="screen-actions">
  <button class="btn-v" onclick="window.history.back()">← Volver</button>
  <button class="btn-c" onclick="window.close()">Cerrar</button>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`
  }

  const win = window.open("", "_blank", "width=480,height=400")
  if (!win) return
  win.document.write(html)
  win.document.close()
}

function formatFecha(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatFechaHora(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const p = n => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
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
function DetalleItem({ row, onClose, onReload, onUpdate }) {
  const [tab, setTab]               = useState("detalle")
  const [events, setEvents]         = useState(null) // null = no cargado aún

  // ── Corrección de datos ───────────────────────────────────
  const [editando,    setEditando]    = useState(false)
  const [editForm,    setEditForm]    = useState({})
  const [savingEdit,  setSavingEdit]  = useState(false)
  const [editError,   setEditError]   = useState("")
  const [editSuccess, setEditSuccess] = useState(false)

  function abrirEdicion() {
    setEditForm({
      cliente_nombre:    row.cliente_nombre    || "",
      cliente_telefono:  row.cliente_telefono  || "",
      item_descripcion:  row.item_descripcion  || "",
      tracking_number:   row.tracking_number   || "",
      ubicacion_codigo:  normalizarUbicacion(row.ubicacion_codigo) === "—"
                           ? ""
                           : normalizarUbicacion(row.ubicacion_codigo),
      cobro_cliente_bs:  row.cobro_cliente_bs  != null ? String(row.cobro_cliente_bs) : "",
      unidades:          row.unidades          != null ? String(row.unidades)          : "",
      notas:             row.notas             || "",
    })
    setEditError("")
    setEditando(true)
  }

  async function guardarEdicion() {
    if (!editForm.cliente_nombre?.trim()) {
      setEditError("El nombre del cliente no puede quedar vacío"); return
    }
    if (!editForm.item_descripcion?.trim()) {
      setEditError("La descripción del ítem no puede quedar vacía"); return
    }
    setSavingEdit(true)
    setEditError("")
    try {
      const body = {
        cliente_nombre:   editForm.cliente_nombre.trim(),
        cliente_telefono: editForm.cliente_telefono.trim() || undefined,
        item_descripcion: editForm.item_descripcion.trim(),
        tracking_number:  editForm.tracking_number.trim()  || undefined,
      }
      // Ubicación: de-normalizar para enviar código de DB
      const ubCodigo = editForm.ubicacion_codigo.trim()
      if (ubCodigo) body.ubicacion_codigo = desnormalizarUbicacion(ubCodigo)

      if (editForm.cobro_cliente_bs !== "") body.cobro_cliente_bs = Number(editForm.cobro_cliente_bs)
      if (row.tipo_calculo === "unidad" && editForm.unidades !== "") body.unidades = Number(editForm.unidades)
      if (editForm.notas !== row.notas) body.notas = editForm.notas.trim() || null

      const res  = await fetch(`${API_URL}/operativo/items/${row.item_id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar")

      setEditando(false)
      setEditSuccess(true)
      setTimeout(() => setEditSuccess(false), 3000)

      // Actualizar el modal y la lista
      if (json.data) onUpdate?.(json.data)
      onReload?.()
    } catch (err) {
      setEditError(err.message || "Error al guardar")
    } finally {
      setSavingEdit(false)
    }
  }

  // ── Revertir recepción ────────────────────────────────────
  const [revertiendo, setRevertiendo]       = useState(false)
  const [motivo, setMotivo]                 = useState("")
  const [loadingRevertir, setLoadingRevertir] = useState(false)
  const [errorRevertir, setErrorRevertir]   = useState(null)

  async function handleRevertir() {
    const esSent = row.payment_status === "sent"
    if (esSent && !motivo.trim()) {
      setErrorRevertir("El motivo es obligatorio para anular un cobro enviado")
      return
    }
    setLoadingRevertir(true)
    setErrorRevertir(null)
    try {
      const body = { motivo: motivo.trim() || null }
      if (esSent) body.anular_si_enviado = true
      const res  = await fetch(`${API_URL}/operativo/inventario/${row.item_id}/revertir-recepcion`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.ok) {
        setErrorRevertir(json.error || "Error al revertir la recepción")
        return
      }
      onClose()
      if (onReload) onReload()
    } catch {
      setErrorRevertir("Error de conexión")
    } finally {
      setLoadingRevertir(false)
    }
  }

  function cancelarRevertir() {
    setRevertiendo(false)
    setMotivo("")
    setErrorRevertir(null)
  }

  useEffect(() => {
    if (tab !== "historial" || !row?.orden_compra_id || events !== null) return
    fetch(`${API_URL}/compras/${row.orden_compra_id}/eventos`)
      .then(r => r.json())
      .then(d => setEvents(d.ok ? d.data : []))
      .catch(() => setEvents([]))
  }, [tab, row?.orden_compra_id, events])

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

        {/* ── Tabs ── */}
        <div className="flex px-6" style={{ borderBottom: "1px solid var(--border)" }}>
          {[{ id: "detalle", label: "Detalle" }, { id: "historial", label: "Historial" }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="text-xs font-semibold px-3 py-2.5 transition"
              style={{
                color:        tab === t.id ? "var(--accent)"           : "var(--text-3)",
                borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                background:   "transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "detalle" && (
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Ubicación */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Ubicación</p>
              <p className="text-xl font-bold font-mono leading-none" style={{ color: "var(--text)" }}>
                {normalizarUbicacion(row.ubicacion_codigo)}
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

          {/* Fechas del ítem */}
          <Sección titulo="Fechas del ítem">
            <CampoGrid items={[
              ["Recibido Bolivia",  formatFecha(row.recibido_at),    false],
              ["Fecha estimada",    formatFecha(row.fecha_estimada), false],
              ["Warehouse",         formatFecha(row.warehouse_fecha),         false],
              ["Cobro enviado",     formatFechaHora(row.cobro_enviado_at),    false],
              ["Pago registrado",   formatFechaHora(row.paid_at),             false],
              ["Orden creada",      formatFecha(row.orden_created_at),        false],
            ]} />
          </Sección>

          {/* Pesos */}
          {row.tipo_calculo === "kg" && (row.peso_cliente != null || row.peso_interno != null) && (
            <Sección titulo="Pesos">
              <CampoGrid items={[
                ["Peso cliente", row.peso_cliente != null ? `${row.peso_cliente} kg` : null, false],
                ["Peso interno", row.peso_interno != null ? `${row.peso_interno} kg` : null, false],
              ]} />
            </Sección>
          )}

          {/* Operativo */}
          <Sección titulo="Operativo">
            <CampoGrid items={[
              ["Categoría",    row.categoria_nombre,                                                       false],
              ["Tipo cálculo", row.tipo_calculo,                                                           false],
              ["Unidades",     row.tipo_calculo === "unidad" && row.unidades != null ? String(row.unidades) : null, false],
            ]} />
            {row.notas && (
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Notas</p>
                <p className="text-sm leading-snug" style={{ color: "var(--text-2)" }}>{row.notas}</p>
              </div>
            )}
          </Sección>

          {/* Cobro y cálculo */}
          {(row.costo_interno_bs != null || row.cobro_cliente_bs != null) && (
            <Sección titulo="Cobro y cálculo">
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

          {/* ── Mensaje de éxito de edición ─────────────────────── */}
          {editSuccess && (
            <div className="text-sm px-3 py-2 rounded-xl font-medium"
              style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid var(--success)" }}>
              ✓ Datos actualizados correctamente
            </div>
          )}

          {/* ── Formulario de corrección ─────────────────────────── */}
          {editando ? (
            <div className="flex flex-col gap-3 rounded-xl p-4"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Corregir datos
              </p>
              {[
                { label: "Nombre del cliente",   key: "cliente_nombre",   ph: "" },
                { label: "Teléfono del cliente", key: "cliente_telefono", ph: "" },
                { label: "Descripción del ítem", key: "item_descripcion", ph: "" },
                { label: "Tracking",             key: "tracking_number",  ph: "" },
                { label: "Ubicación (ej. T1-F2)", key: "ubicacion_codigo", ph: "" },
              ].map(({ label, key, ph }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-3)" }}>{label}</label>
                  <input
                    placeholder={ph}
                    value={editForm[key] || ""}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    disabled={savingEdit}
                    className="ui-input w-full text-sm disabled:opacity-50"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-3)" }}>Cobro cliente (Bs)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editForm.cobro_cliente_bs || ""}
                    onChange={e => setEditForm(f => ({ ...f, cobro_cliente_bs: e.target.value }))}
                    disabled={savingEdit}
                    className="ui-input w-full text-sm disabled:opacity-50"
                  />
                </div>
                {row.tipo_calculo === "unidad" && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1"
                      style={{ color: "var(--text-3)" }}>Unidades</label>
                    <input
                      type="number" min="0"
                      value={editForm.unidades || ""}
                      onChange={e => setEditForm(f => ({ ...f, unidades: e.target.value }))}
                      disabled={savingEdit}
                      className="ui-input w-full text-sm disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-3)" }}>Notas</label>
                <input
                  placeholder="Notas (opcional)"
                  value={editForm.notas || ""}
                  onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))}
                  disabled={savingEdit}
                  className="ui-input w-full text-sm disabled:opacity-50"
                />
              </div>
              {editError && (
                <p className="text-xs px-3 py-2 rounded-xl"
                  style={{ color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
                  {editError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={guardarEdicion}
                  disabled={savingEdit}
                  className="ui-button flex-1 disabled:opacity-50"
                >
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditando(false); setEditError("") }}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition"
                  style={{ color: "var(--text-2)", background: "var(--surface-3)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={abrirEdicion}
              className="w-full text-sm font-semibold py-2.5 px-4 rounded-xl transition"
              style={{
                color:      "var(--text-2)",
                background: "var(--surface-2)",
                border:     "1px solid var(--border)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
            >
              ✏️ Corregir datos
            </button>
          )}

          {/* ── Imprimir etiqueta hoja ───────────────────────────── */}
          <button
            type="button"
            onClick={() => printEtiquetaAlmacen({ ...row, ubicacion: row.ubicacion_codigo }, "hoja")}
            className="w-full text-sm font-semibold py-2.5 px-4 rounded-xl transition"
            style={{
              color:      "var(--text-2)",
              background: "var(--surface-2)",
              border:     "1px solid var(--border)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
          >
            🖨 Imprimir etiqueta hoja
          </button>

          {/* ── Revertir recepción ──────────────────────────────── */}
          {(row.payment_status === "paid" || row.payment_status === "confirmed") ? (
            /* Bloqueado: pago ya registrado o confirmado */
            <div className="rounded-xl px-4 py-3 flex items-start gap-2"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="text-base leading-none flex-shrink-0 mt-0.5">🔒</span>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                No se puede revertir: el cobro ya fue{" "}
                {row.payment_status === "confirmed" ? "confirmado" : "registrado como pagado"}.
              </p>
            </div>
          ) : !revertiendo ? (
            /* Botón inicial — texto distinto si el cobro fue enviado */
            <button
              type="button"
              onClick={() => setRevertiendo(true)}
              className="w-full text-sm font-semibold py-2.5 px-4 rounded-xl transition"
              style={{
                color:      "var(--danger)",
                background: "var(--danger-soft)",
                border:     "1px solid var(--danger)",
              }}
            >
              {row.payment_status === "sent"
                ? "Anular cobro y revertir recepción"
                : "Revertir recepción"}
            </button>
          ) : (
            /* Panel de confirmación */
            <div className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
              {row.payment_status === "sent" ? (
                <>
                  <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                    ¿Anular cobro y revertir recepción?
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                    Este cobro ya fue enviado al cliente. Si fue enviado por error o el ítem no
                    pertenece a este cliente, puedes anular el cobro y revertir la recepción.
                    El cobro pasará a estado anulado y el ítem volverá a Carga Bolivia.
                  </p>
                  <input
                    type="text"
                    placeholder="Motivo (obligatorio)"
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    className="ui-input text-sm"
                    disabled={loadingRevertir}
                  />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                    ¿Revertir esta recepción?
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                    El ítem volverá a Carga Bolivia para registrar la recepción nuevamente.
                    Los datos financieros registrados serán eliminados.
                  </p>
                  <input
                    type="text"
                    placeholder="Motivo (opcional)"
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    className="ui-input text-sm"
                    disabled={loadingRevertir}
                  />
                </>
              )}
              {errorRevertir && (
                <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>
                  {errorRevertir}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRevertir}
                  disabled={loadingRevertir || (row.payment_status === "sent" && !motivo.trim())}
                  className="flex-1 text-sm font-semibold py-2 px-4 rounded-lg transition"
                  style={{
                    background: "var(--danger)", color: "#fff",
                    opacity: (loadingRevertir || (row.payment_status === "sent" && !motivo.trim())) ? 0.5 : 1,
                  }}
                >
                  {loadingRevertir
                    ? "Procesando…"
                    : row.payment_status === "sent"
                      ? "Confirmar anulación y reversión"
                      : "Confirmar reversión"}
                </button>
                <button
                  type="button"
                  onClick={cancelarRevertir}
                  disabled={loadingRevertir}
                  className="text-sm py-2 px-4 rounded-lg transition"
                  style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

        </div>
        )}

        {tab === "historial" && (
          <div className="px-6 py-5">
            {events === null ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: "var(--text-3)" }}>Cargando…</p>
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: "var(--text-3)" }}>Sin eventos registrados.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {events.map((event, index) => (
                  <div key={index} className="flex gap-4 relative">
                    {index < events.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px"
                        style={{ background: "var(--border)" }} />
                    )}
                    <div className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 z-10 border-2"
                      style={{ background: "var(--surface)", borderColor: "var(--border-strong)" }} />
                    <div className="flex flex-col gap-0.5 pb-6 min-w-0">
                      <p className="text-sm leading-snug" style={{ color: "var(--text-2)" }}>
                        {event.descripcion}
                      </p>
                      <span className="text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>
                        {event.fecha ? new Date(event.fecha).toLocaleString() : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
  const [cajaFocus, setCajaFocus] = useState(null) // null | "CAJA-LOCAL" | "CAJA-TERMINAL"
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

  // SSE: refrescar inventario automáticamente cuando cambian ítems
  const sseDebounce = useRef(null)
  useRealtimeEvents((ev) => {
    const RELEVANTES = ["item.updated", "item.received", "item.reverted", "inventory.updated"]
    if (RELEVANTES.includes(ev.type)) {
      clearTimeout(sseDebounce.current)
      sseDebounce.current = setTimeout(() => fetchInventario(q), 400)
    }
  })

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
    const cajaLocal    = rows.filter(r => r.ubicacion_codigo === "CAJA-LOCAL").length
    const cajaTerminal = rows.filter(r => r.ubicacion_codigo === "CAJA-TERMINAL").length
    // local/terminal excluyen las cajas para no contar dos veces
    const local    = rows.filter(r => r.zona === "local"    && r.ubicacion_codigo !== "CAJA-LOCAL").length
    const terminal = rows.filter(r => r.zona === "terminal" && r.ubicacion_codigo !== "CAJA-TERMINAL").length
    return { total: rows.length, local, terminal, cajaLocal, cajaTerminal }
  }, [rows])

  const displayRows = useMemo(() => {
    if (!cajaFocus) return rows;
    return rows.filter((r) => r.ubicacion_codigo === cajaFocus);
  }, [rows, cajaFocus]);

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
          {stats.cajaLocal > 0 && (
            <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
              <span className="font-semibold">{stats.cajaLocal}</span> caja local
            </span>
          )}
          {stats.cajaTerminal > 0 && (
            <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
              <span className="font-semibold">{stats.cajaTerminal}</span> caja terminal
            </span>
          )}
        </div>
      )}

      {/* ── Cajas ── */}
      {!loading && rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Cajas
          </p>
          <div className="flex gap-2 flex-wrap">
            {[
              { codigo: "CAJA-LOCAL",    label: "Caja Local",    count: stats?.cajaLocal    ?? 0 },
              { codigo: "CAJA-TERMINAL", label: "Caja Terminal", count: stats?.cajaTerminal ?? 0 },
            ].map(({ codigo, label, count }) => {
              const isActive = cajaFocus === codigo;
              return (
                <button
                  key={codigo}
                  type="button"
                  onClick={() => setCajaFocus(isActive ? null : codigo)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={isActive
                    ? { background: "var(--text)", color: "var(--surface)", border: "1px solid var(--text)" }
                    : { background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }
                  }
                >
                  <span>{label}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={isActive
                      ? { background: "rgba(255,255,255,0.15)", color: "inherit" }
                      : { background: "var(--surface-2)", color: "var(--text-3)" }
                    }
                  >
                    {count === 0 ? "Libre" : `${count} ítem${count !== 1 ? "s" : ""}`}
                  </span>
                </button>
              );
            })}
            {cajaFocus && (
              <button
                type="button"
                onClick={() => setCajaFocus(null)}
                className="text-xs px-3 py-2 rounded-xl"
                style={{ color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                Ver todos
              </button>
            )}
          </div>
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
          {/* ─── Estado vacío cuando cajaFocus activo pero sin ítems ── */}
          {cajaFocus && displayRows.length === 0 && (
            <div className="py-12 text-center text-sm rounded-2xl"
              style={{ color: "var(--text-3)", border: "1px dashed var(--border)" }}>
              {cajaFocus === "CAJA-LOCAL" ? "Caja Local está vacía." : "Caja Terminal está vacía."}
            </div>
          )}

          {/* ─── Tabla desktop ─────────────────────────────── */}
          {displayRows.length > 0 && (
          <>
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
                  {displayRows.map((row, ri) => (
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
                          {normalizarUbicacion(row.ubicacion_codigo)}
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
                        {!formatFecha(row.recibido_at) && (
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
            {displayRows.map((row) => (
              <div
                key={row.item_id}
                onClick={() => setSelected(row)}
                className="w-full text-left rounded-2xl overflow-hidden transition-shadow cursor-pointer"
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
                    {normalizarUbicacion(row.ubicacion_codigo)}
                  </span>
                  <div className="flex items-center gap-2">
                    <ZonaPill zona={row.zona} />
                    <span className="text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>
                      {formatFecha(row.recibido_at) ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </>
      )}

      {selected && (
        <DetalleItem
          row={selected}
          onClose={() => setSelected(null)}
          onReload={() => fetchInventario(q)}
          onUpdate={(updatedRow) => setSelected(updatedRow)}
        />
      )}

    </div>
  )
}
