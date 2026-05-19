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
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--text-3)" }}>
              Confirmar envío
            </p>
            <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--text)" }}>
              {row.cliente_nombre || "Sin nombre"}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
              {row.destino}
            </p>
          </div>
          <button
            onClick={onClose}
            className="transition text-lg leading-none flex-shrink-0 mt-0.5"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Foto del paquete (opcional)
            </label>
            {foto ? (
              <div className="flex items-center gap-2">
                <span className="text-sm truncate flex-1" style={{ color: "var(--text-2)" }}>
                  {foto.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFoto(null)}
                  className="text-xs transition flex-shrink-0"
                  style={{ color: "var(--text-3)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
                  Quitar
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition"
                style={{ border: "1px dashed var(--border-strong)", color: "var(--text-3)" }}>
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
            <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Nota (opcional)
            </label>
            <input
              className="ui-input"
              placeholder="Observación del envío"
              value={nota}
              onChange={e => setNota(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-ghost flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ui-button flex-1">
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
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--text-3)" }}>
              {yaTieneGuia ? "Actualizar guía" : "Cargar guía"}
            </p>
            <h3 className="text-base font-semibold mt-0.5" style={{ color: "var(--text)" }}>
              {row.cliente_nombre || "Sin nombre"}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
              {row.destino}
            </p>
          </div>
          <button
            onClick={onClose}
            className="transition text-lg leading-none flex-shrink-0 mt-0.5"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Número de guía (opcional)
            </label>
            <input
              className="ui-input"
              placeholder="Ej: TER-9901"
              value={guia}
              onChange={e => setGuia(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Foto de la guía (opcional)
            </label>
            {foto ? (
              <div className="flex items-center gap-2">
                <span className="text-sm truncate flex-1" style={{ color: "var(--text-2)" }}>
                  {foto.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFoto(null)}
                  className="text-xs transition flex-shrink-0"
                  style={{ color: "var(--text-3)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
                  Quitar
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition"
                style={{ border: "1px dashed var(--border-strong)", color: "var(--text-3)" }}>
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
            <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Nota (opcional)
            </label>
            <input
              className="ui-input"
              placeholder="Observación de la guía"
              value={nota}
              onChange={e => setNota(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-ghost flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ui-button flex-1">
              {saving ? "Guardando..." : yaTieneGuia ? "Actualizar" : "Guardar guía"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

// ─── Etiqueta imprimible ──────────────────────────────────────────────────────
function printEtiqueta(row) {
  const nombre   = (row.recoge_quien === "tercero" ? row.nombre_receptor   : row.cliente_nombre)   || "—"
  const telefono = (row.recoge_quien === "tercero" ? row.telefono_receptor : row.cliente_telefono) || "—"
  const destino  = row.destino || "—"

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Etiqueta</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    background: #fff;
    color: #000;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
  }
  .etiqueta {
    border: 2.5px solid #000;
    border-radius: 4px;
    padding: 36px 40px;
    width: 100%;
    max-width: 340px;
    text-align: center;
  }
  .campo { margin-bottom: 28px; }
  .campo:last-child { margin-bottom: 0; }
  .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #777;
    margin-bottom: 6px;
  }
  .valor {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-word;
  }
  .valor.sm { font-size: 22px; }
  hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 24px 0;
  }
  @media print {
    body { min-height: unset; padding: 0; }
    .etiqueta { max-width: 100%; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="etiqueta">
  <div class="campo">
    <div class="label">Para</div>
    <div class="valor">${nombre}</div>
  </div>
  <hr>
  <div class="campo">
    <div class="label">Destino</div>
    <div class="valor sm">${destino}</div>
  </div>
  <div class="campo">
    <div class="label">Teléfono</div>
    <div class="valor sm">${telefono}</div>
  </div>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open("", "_blank", "width=460,height=400")
  if (!win) return
  win.document.write(html)
  win.document.close()
}

// ─── Helpers WhatsApp guía ────────────────────────────────────────────────────
function normalizarTelefonoWhatsapp(value) {
  const tel = String(value || "").replace(/[\s\-().+]/g, "")
  if (!tel) return ""
  if (tel.startsWith("591")) return tel
  if (tel.length === 8) return `591${tel}`
  return tel
}

function esUrlPublica(url) {
  if (!url) return false
  if (url.includes("localhost")) return false
  if (url.includes("127.0.0.1")) return false
  if (url.startsWith("/")) return false
  return true
}

function crearMensajeGuia(row) {
  const nombre = (row.recoge_quien === "tercero" ? row.nombre_receptor : row.cliente_nombre) || "cliente"
  const destino = row.destino || "tu destino"
  let msg = `Hola ${nombre},\n\n`
  msg += `Tu paquete ya fue despachado hacia ${destino}.\n\n`
  if (row.numero_guia) {
    msg += `Guía de transporte:\n${row.numero_guia}\n\n`
  }
  if (row.foto_guia_url) {
    if (esUrlPublica(row.foto_guia_url)) {
      msg += `Puedes consultar/mostrar esta guía:\n${row.foto_guia_url}\n\n`
    } else {
      msg += `La foto de la guía será adjuntada en este chat.\n\n`
    }
  }
  if (row.nota_guia) {
    msg += `Observación: ${row.nota_guia}\n\n`
  }
  msg += "— Bolivia Imports"
  return msg
}

function abrirWhatsappGuia(row) {
  const telRaw = row.recoge_quien === "tercero" ? row.telefono_receptor : row.cliente_telefono
  const tel = normalizarTelefonoWhatsapp(telRaw)
  if (!tel) {
    alert("Esta solicitud no tiene teléfono para WhatsApp")
    return
  }
  const msg = crearMensajeGuia(row)
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank")
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
    <div className="module-shell">

      {/* HEADER */}
      <div className="module-header">
        <p className="ui-section-title">Operación</p>
        <h1 className="ui-page-title">Solicitudes Terminal</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
          Datos enviados desde el formulario de coordinación de envío
        </p>
      </div>

      <div className="module-body">
      <div className="panel flex-1">

      {/* Panel header: tabs + filtros + búsqueda */}
      <div className="panel-header flex flex-col gap-3">

      {/* TABS */}
      <div className="flex items-center gap-2">
        {[
          { key: "pendiente", label: "Pendientes", count: countPendiente },
          { key: "enviado",   label: "Enviadas",   count: countEnviado   },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition"
            style={tab === t.key
              ? { background: "var(--text)", color: "var(--surface)" }
              : { background: "var(--surface-3)", color: "var(--text-3)" }
            }>
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
              className="px-3 py-1 rounded-full text-xs font-medium transition"
              style={filtroFecha === f.key
                ? { background: "var(--surface-3)", color: "var(--text)" }
                : { color: "var(--text-3)" }
              }>
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
        className="ui-input md:max-w-md"
      />

      </div>{/* panel-header */}

      <div className="scroll-area p-5 flex flex-col gap-4">

      {/* LOADING */}
      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg px-6 py-12 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
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
          <div className="hidden md:block ui-table overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {["Fecha", "Cliente", "Recoge", "Receptor / CI", "Destino", "Comprobante", ...(tab === "enviado" ? ["Guía"] : []), "Acción"].map(h => (
                    <th key={h} className="ui-th text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="ui-row">
                    <td className="ui-td whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                      {formatFecha(row.created_at)}
                    </td>
                    <td className="ui-td font-medium" style={{ color: "var(--text)" }}>
                      {row.cliente_nombre || "—"}
                    </td>
                    <td className="ui-td">
                      <Badge type={row.recoge_quien === "cliente" ? "info" : "default"}>
                        {row.recoge_quien === "cliente" ? "Cliente" : "Tercero"}
                      </Badge>
                    </td>
                    <td className="ui-td" style={{ color: "var(--text-2)" }}>
                      {row.recoge_quien === "tercero"
                        ? (row.nombre_receptor || "—")
                        : (row.referencia      || "—")}
                    </td>
                    <td className="ui-td" style={{ color: "var(--text-2)" }}>
                      {row.destino || "—"}
                    </td>
                    <td className="ui-td">
                      {tab === "enviado" ? (
                        <Badge type="success">Despachado</Badge>
                      ) : (
                        <Badge type={row.tiene_comprobante ? "success" : "pendiente"}>
                          {row.tiene_comprobante ? "Comprobante" : "Sin comprobante"}
                        </Badge>
                      )}
                    </td>
                    {tab === "enviado" && (
                      <td className="ui-td" style={{ color: "var(--text-3)" }}>
                        {row.numero_guia || "—"}
                      </td>
                    )}
                    <td className="ui-td">
                      <div className="flex items-center gap-2">
                        {tab === "pendiente" && (
                          <button
                            onClick={() => setModalRow(row)}
                            className="ui-button-sm">
                            Confirmar envío
                          </button>
                        )}
                        {tab === "enviado" && (
                          <button
                            onClick={() => setModalGuia(row)}
                            className="ui-button-ghost-sm">
                            {row.guia_at ? "Actualizar guía" : "Cargar guía"}
                          </button>
                        )}
                        {tab === "enviado" && row.guia_at && (
                          <button
                            onClick={() => abrirWhatsappGuia(row)}
                            className="ui-button-ghost-sm">
                            Enviar guía
                          </button>
                        )}
                        {tab === "pendiente" && (
                          <button
                            onClick={() => printEtiqueta(row)}
                            className="ui-button-ghost-sm">
                            Etiqueta
                          </button>
                        )}
                      </div>
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
                  className="rounded-xl px-4 pt-4 pb-3 space-y-3"
                  style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>

                  {/* Bloque 1 — cliente + destino + badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[15px] leading-snug truncate" style={{ color: "var(--text)" }}>
                        {row.cliente_nombre || "Sin nombre"}
                      </p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-2)" }}>
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
                      <span style={{ color: "var(--text-3)" }}>Entrega: </span>
                      <span style={{ color: "var(--text-2)" }}>
                        {esTercero ? "Tercero" : "Cliente"}
                      </span>
                    </p>
                    {esTercero && row.nombre_receptor && (
                      <p>
                        <span style={{ color: "var(--text-3)" }}>Receptor: </span>
                        <span style={{ color: "var(--text-2)" }}>{row.nombre_receptor}</span>
                      </p>
                    )}
                    {row.telefono_receptor && (
                      <p>
                        <span style={{ color: "var(--text-3)" }}>Tel: </span>
                        <span style={{ color: "var(--text-2)" }}>{row.telefono_receptor}</span>
                      </p>
                    )}
                    {row.referencia && (
                      <p>
                        <span style={{ color: "var(--text-3)" }}>CI: </span>
                        <span style={{ color: "var(--text-2)" }}>{row.referencia}</span>
                      </p>
                    )}
                  </div>

                  {/* Bloque 3 — adicional */}
                  {tieneExtra && (
                    <div className="space-y-1 text-sm pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      {row.transportadora && (
                        <p>
                          <span style={{ color: "var(--text-3)" }}>Transportadora: </span>
                          <span style={{ color: "var(--text-2)" }}>{row.transportadora}</span>
                        </p>
                      )}
                      {row.observaciones && (
                        <p>
                          <span style={{ color: "var(--text-3)" }}>Nota: </span>
                          <span style={{ color: "var(--text-2)" }}>{row.observaciones}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Guía si enviada */}
                  {row.estado === "enviado" && (row.numero_guia || row.guia_at) && (
                    <div className="space-y-1 text-sm pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      {row.numero_guia && (
                        <p>
                          <span style={{ color: "var(--text-3)" }}>Guía: </span>
                          <span className="font-medium" style={{ color: "var(--text-2)" }}>{row.numero_guia}</span>
                        </p>
                      )}
                      {row.guia_at && (
                        <p>
                          <span style={{ color: "var(--text-3)" }}>Cargada: </span>
                          <span style={{ color: "var(--text-3)" }}>{formatFecha(row.guia_at)}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer: fecha + botones de acción */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      {formatFecha(row.created_at)}
                    </p>
                    <div className="flex items-center gap-2">
                      {row.estado === "pendiente" && (
                        <button
                          onClick={() => setModalRow(row)}
                          className="ui-button-sm">
                          Confirmar envío
                        </button>
                      )}
                      {row.estado === "enviado" && (
                        <button
                          onClick={() => setModalGuia(row)}
                          className="ui-button-ghost-sm">
                          {row.guia_at ? "Actualizar guía" : "Cargar guía"}
                        </button>
                      )}
                      {row.estado === "enviado" && row.guia_at && (
                        <button
                          onClick={() => abrirWhatsappGuia(row)}
                          className="ui-button-ghost-sm">
                          Enviar guía
                        </button>
                      )}
                      {row.estado === "pendiente" && (
                        <button
                          onClick={() => printEtiqueta(row)}
                          className="ui-button-ghost-sm">
                          Etiqueta
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </>
      )}

      </div>{/* scroll-area */}
      </div>{/* panel */}
      </div>{/* module-body */}

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
