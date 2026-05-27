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

// ─── Etiqueta imprimible (Terminal) ──────────────────────────────────────────
function printEtiqueta(row, formato) {
  const nombre       = ((row.recoge_quien === "tercero" ? row.nombre_receptor   : row.cliente_nombre)   || "—").toUpperCase()
  const telefono     = (row.recoge_quien === "tercero" ? row.telefono_receptor : row.cliente_telefono) || "—"
  const destino      = (row.destino || "—").toUpperCase()
  const transportadora = (row.transportadora || "").trim().toUpperCase()

  let html

  if (formato === "adhesiva") {
    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiqueta adhesiva</title>
<style>
  @page { size: 100mm 150mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    background: #fff;
    color: #000;
    width: 100mm;
    height: 150mm;
    display: flex;
    align-items: stretch;
  }
  .etiqueta {
    width: 100%;
    height: 100%;
    border: 1.5px solid #000;
    display: flex;
    flex-direction: column;
    padding: 6mm 6mm;
    gap: 0;
  }
  .marca {
    font-size: 7pt;
    letter-spacing: 0.18em;
    color: #555;
    margin-bottom: 4mm;
    border-bottom: 0.5px solid #ccc;
    padding-bottom: 3mm;
  }
  .campo { margin-bottom: 5mm; }
  .campo:last-child { margin-bottom: 0; }
  .label {
    font-size: 6pt;
    letter-spacing: 0.14em;
    color: #777;
    margin-bottom: 1.5mm;
  }
  .valor { font-size: 22pt; font-weight: 700; line-height: 1.15; word-break: break-word; }
  .valor.md { font-size: 16pt; font-weight: 700; }
  .valor.sm { font-size: 13pt; font-weight: 600; }
  .sep { border: none; border-top: 0.5px solid #ddd; margin: 4mm 0; }
  @media print {
    body { width: 100mm; height: 150mm; }
  }
</style>
</head>
<body>
<div class="etiqueta">
  <div class="marca">BOLIVIA IMPORTS — ENVÍO TERMINAL</div>
  <div class="campo">
    <div class="label">PARA</div>
    <div class="valor">${nombre}</div>
  </div>
  <hr class="sep">
  <div class="campo">
    <div class="label">DESTINO</div>
    <div class="valor md">${destino}</div>
  </div>
  <div class="campo">
    <div class="label">TELÉFONO</div>
    <div class="valor sm">${telefono}</div>
  </div>
  ${transportadora ? `<hr class="sep"><div class="campo"><div class="label">TRANSPORTADORA</div><div class="valor sm">${transportadora}</div></div>` : ""}
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`
  } else {
    // formato === "hoja" (por defecto)
    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Etiqueta hoja</title>
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
    padding: 32px;
  }
  .etiqueta {
    border: 3px solid #000;
    width: 100%;
    max-width: 480px;
    text-align: center;
  }
  .marca {
    background: #000;
    color: #fff;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-weight: 700;
    padding: 8px 16px;
  }
  .cuerpo { padding: 32px 36px 40px; }
  .campo { margin-bottom: 28px; }
  .campo:last-child { margin-bottom: 0; }
  .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #777;
    margin-bottom: 6px;
  }
  .valor { font-size: 48px; font-weight: 700; line-height: 1.1; word-break: break-word; }
  .valor.md { font-size: 36px; font-weight: 700; }
  .valor.sm { font-size: 28px; font-weight: 600; }
  .sep { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
  @media print {
    body { min-height: unset; padding: 0; }
    .etiqueta { max-width: 100%; border: 3px solid #000; }
  }
</style>
</head>
<body>
<div class="etiqueta">
  <div class="marca">Bolivia Imports — Envío Terminal</div>
  <div class="cuerpo">
    <div class="campo">
      <div class="label">PARA</div>
      <div class="valor">${nombre}</div>
    </div>
    <hr class="sep">
    <div class="campo">
      <div class="label">DESTINO</div>
      <div class="valor md">${destino}</div>
    </div>
    <div class="campo">
      <div class="label">TELÉFONO</div>
      <div class="valor sm">${telefono}</div>
    </div>
    ${transportadora ? `<hr class="sep"><div class="campo"><div class="label">TRANSPORTADORA</div><div class="valor sm">${transportadora}</div></div>` : ""}
  </div>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`
  }

  const win = window.open("", "_blank", "width=600,height=700")
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
  const [expandedUbic, setExpandedUbic] = useState(new Set())
  const debounceRef = useRef(null)

  useEffect(() => {
    function cargarSolicitudes(silent = false) {
      if (!silent) setLoading(true)
      fetch(`${API_URL}/receptores/solicitudes-terminal`)
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then(json => { setRows(json.data); setLoading(false) })
        .catch(() => { if (!silent) { setError("Error cargando solicitudes"); setLoading(false) } })
    }
    cargarSolicitudes()
    const id = setInterval(() => cargarSolicitudes(true), 15000)
    return () => clearInterval(id)
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

  function toggleUbic(id) {
    setExpandedUbic(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

        {/* Panel header: tabs + filtro fecha + búsqueda */}
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
                }
              >
                {t.label}
                {!loading && (
                  <span className={`ml-1.5 text-xs ${tab === t.key ? "opacity-70" : "opacity-60"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* FILTRO FECHA — solo en Enviadas */}
          {tab === "enviado" && (
            <div className="flex items-center gap-2">
              {[
                { key: "mes",   label: "Este mes"        },
                { key: "30d",   label: "Últimos 30 días" },
                { key: "todas", label: "Todas"            },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltroFecha(f.key)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition"
                  style={filtroFecha === f.key
                    ? { background: "var(--surface-3)", color: "var(--text)" }
                    : { color: "var(--text-3)" }
                  }
                >
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

        <div className="scroll-area p-5 flex flex-col gap-2.5">

          {/* LOADING */}
          {loading && (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl animate-pulse"
                  style={{ background: "var(--surface-2)" }} />
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
            <div className="flex items-center justify-center py-16 text-sm rounded-xl"
              style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}>
              {q.trim()
                ? "Sin resultados para la búsqueda."
                : tab === "pendiente"
                  ? "No hay solicitudes pendientes."
                  : "No hay solicitudes enviadas en este período."}
            </div>
          )}

          {/* header de tabla eliminado — se usa card universal para todos los anchos */}

          {/* ─── LISTA PRINCIPAL: mobile / tablet / desktop ────────────────────── */}
          {!loading && !error && filtered.map(row => {
            const esTercero    = row.recoge_quien === "tercero"
            const tieneDetalle = !!(
              row.numero_guia  || row.guia_at      || row.nota_guia  ||
              row.nota_envio   || row.observaciones ||
              row.foto_envio_url || row.foto_guia_url
            )

            // Badge reutilizable
            const badgeEstado = tab === "enviado"
              ? <Badge type="success">Despachado</Badge>
              : <Badge type={row.tiene_comprobante ? "success" : "pendiente"}>
                  {row.tiene_comprobante ? "Con comprobante" : "Sin comprobante"}
                </Badge>

            // Texto de trans/receptor para columna compacta
            const transInfo = row.transportadora
              || (esTercero && row.nombre_receptor ? `Recoge: ${row.nombre_receptor}` : null)

            return (
              <div
                key={row.id}
                className="rounded-xl"
                style={{
                  background: "var(--surface)",
                  border:     "1px solid var(--border)",
                  boxShadow:  "var(--shadow-sm)",
                }}
              >

                {/* ── Cuerpo principal ── */}
                <div className="p-4 flex flex-col gap-3">

                  {/* Fila 1: nombre + destino + badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold leading-snug"
                        style={{ color: "var(--text)", wordBreak: "break-word" }}
                      >
                        {row.cliente_nombre || "Sin nombre"}
                      </p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-2)" }}>
                        → {row.destino || "—"}
                      </p>
                    </div>
                    <div className="flex-shrink-0 pt-0.5">
                      {badgeEstado}
                    </div>
                  </div>

                  {/* Info grid: 2 cols mobile/tablet, 4 cols desktop */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: "var(--text-3)" }}>Teléfono</p>
                      <p className="text-sm font-medium" style={{ fontFamily: "'Geist Mono', monospace", color: "var(--text-2)" }}>
                        {row.cliente_telefono || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: "var(--text-3)" }}>Fecha</p>
                      <p className="text-xs" style={{ color: "var(--text-2)" }}>{formatFecha(row.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: "var(--text-3)" }}>CI / Ref</p>
                      <p className="text-xs font-semibold" style={{ fontFamily: "'Geist Mono', monospace", color: "var(--text-2)" }}>
                        {row.referencia || "—"}
                      </p>
                    </div>
                    {transInfo && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: "var(--text-3)" }}>
                          {row.transportadora ? "Transportadora" : "Receptor"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-2)", wordBreak: "break-word" }}>
                          {transInfo}
                          {esTercero && row.telefono_receptor && (
                            <span className="ml-1.5" style={{ fontFamily: "'Geist Mono', monospace" }}>
                              {row.telefono_receptor}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Ítems de la solicitud / del cliente (cobro enviado) ── */}
                {(() => {
                  const items     = Array.isArray(row.items_ubicados) ? row.items_ubicados : []
                  const exactos   = row.items_vinculados_exactos === true
                  const ubOpen    = expandedUbic.has(row.id)

                  // Agrupar por ubicación para resumen
                  const porUbic = items.reduce((acc, it) => {
                    const loc = it.ubicacion || "Sin ubicación"
                    acc[loc] = (acc[loc] || 0) + 1
                    return acc
                  }, {})

                  // Sumar cobro total
                  const totalBs = items.reduce((s, it) => s + (Number(it.cobro_cliente_bs) || 0), 0)

                  return (
                    <div
                      style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
                    >
                      {/* Cabecera: label + chips de ubicación + toggle */}
                      <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--text-3)" }}>
                              {exactos ? "Ítems de esta solicitud" : "Ítems cobrados del cliente"}
                            </p>
                            {exactos ? (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: "var(--success-soft)", color: "var(--success)" }}
                                title="Los ítems mostrados están vinculados exactamente a esta solicitud."
                              >
                                ✓ Validado
                              </span>
                            ) : (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
                                title="No hay vínculo directo entre esta solicitud y los ítems mostrados. Se cruza por cliente."
                              >
                                ⚠ Verificar
                              </span>
                            )}
                          </div>
                          {items.length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--text-3)" }}>Sin ítems ubicados con cobro enviado</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {Object.entries(porUbic).map(([loc, count]) => (
                                <span
                                  key={loc}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                                  style={{
                                    background:  "var(--accent-soft)",
                                    color:       "var(--accent)",
                                    fontFamily:  "'Geist Mono', monospace",
                                  }}
                                >
                                  {loc}
                                  <span className="font-normal opacity-70">
                                    · {count} ítem{count > 1 ? "s" : ""}
                                  </span>
                                </span>
                              ))}
                              {totalBs > 0 && (
                                <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                                  Bs {totalBs.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {items.length > 0 && (
                          <button
                            onClick={() => toggleUbic(row.id)}
                            className="flex-shrink-0 text-xs transition px-2 py-1 rounded-md"
                            style={{ color: "var(--text-3)", background: "transparent" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface-3)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                          >
                            {ubOpen ? "▲ Ocultar" : `▼ Ver ${items.length} ítem${items.length > 1 ? "s" : ""}`}
                          </button>
                        )}
                      </div>

                      {/* Detalle de ítems — expandible */}
                      {ubOpen && items.length > 0 && (
                        <div className="flex flex-col gap-0 px-4 pb-3">
                          {items.map((it, idx) => (
                            <div
                              key={it.item_id || idx}
                              className="flex flex-col gap-0.5 py-2"
                              style={{ borderTop: "1px solid var(--border)" }}
                            >
                              {/* Fila principal: ubicación + producto */}
                              <div className="flex items-start gap-2">
                                <span
                                  className="flex-shrink-0 px-1.5 py-0.5 rounded text-[11px] font-bold leading-none"
                                  style={{
                                    background: "var(--accent-soft)",
                                    color:      "var(--accent)",
                                    fontFamily: "'Geist Mono', monospace",
                                    marginTop:  "1px",
                                  }}
                                >
                                  {it.ubicacion || "—"}
                                </span>
                                <p className="text-xs font-medium leading-snug min-w-0" style={{ color: "var(--text-2)" }}>
                                  {it.producto}
                                </p>
                              </div>
                              {/* Fila secundaria: tracking / REC / zona / peso / cobro */}
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 pl-[46px]">
                                {it.tracking_number && (
                                  <span className="text-[11px]" style={{ fontFamily: "'Geist Mono', monospace", color: "var(--text-3)" }}>
                                    {it.tracking_number}
                                  </span>
                                )}
                                {it.codigo_recepcion && (
                                  <span className="text-[11px]" style={{ fontFamily: "'Geist Mono', monospace", color: "var(--text-3)" }}>
                                    {it.codigo_recepcion}
                                  </span>
                                )}
                                {it.cobro_cliente_bs != null && (
                                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>
                                    Bs {Number(it.cobro_cliente_bs).toFixed(2)}
                                  </span>
                                )}
                                {it.zona && (
                                  <span className="text-[11px] capitalize" style={{ color: "var(--text-3)" }}>
                                    zona {it.zona}
                                  </span>
                                )}
                                {it.peso != null && (
                                  <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                                    {it.peso} kg
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* ── Detalle secundario: guía / notas / fotos ── */}
                {tieneDetalle && (
                  <div
                    className="flex flex-col gap-1.5 px-4 py-3"
                    style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
                  >
                    {row.numero_guia && (
                      <div className="text-xs">
                        <span style={{ color: "var(--text-3)" }}>Guía: </span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 600, color: "var(--text-2)" }}>
                          {row.numero_guia}
                        </span>
                        {row.guia_at && (
                          <span style={{ marginLeft: "8px", color: "var(--text-3)" }}>
                            · cargada {formatFecha(row.guia_at)}
                          </span>
                        )}
                      </div>
                    )}
                    {row.observaciones && (
                      <div className="text-xs" style={{ color: "var(--text-3)" }}>{row.observaciones}</div>
                    )}
                    {row.nota_envio && (
                      <div className="text-xs">
                        <span style={{ color: "var(--text-3)" }}>Nota envío: </span>
                        <span style={{ color: "var(--text-2)" }}>{row.nota_envio}</span>
                      </div>
                    )}
                    {row.nota_guia && (
                      <div className="text-xs" style={{ color: "var(--text-3)" }}>{row.nota_guia}</div>
                    )}
                    {row.foto_envio_url && (
                      <div className="text-xs">
                        <a href={row.foto_envio_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--accent)", textDecoration: "underline" }}>
                          Ver foto del envío
                        </a>
                      </div>
                    )}
                    {row.foto_guia_url && (
                      <div className="text-xs">
                        <a href={row.foto_guia_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--accent)", textDecoration: "underline" }}>
                          Ver foto de guía
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Acciones — siempre visibles, flex wrap, universal ── */}
                <div
                  className="flex flex-wrap gap-2 px-4 py-3"
                  style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
                >
                  {tab === "pendiente" && (
                    <>
                      <button className="ui-button ui-button-sm" onClick={() => setModalRow(row)}>
                        Confirmar envío
                      </button>
                      <button className="ui-button-ghost ui-button-sm" onClick={() => printEtiqueta(row, "hoja")}>
                        Etiqueta hoja
                      </button>
                      <button className="ui-button-ghost ui-button-sm" onClick={() => printEtiqueta(row, "adhesiva")}>
                        Etiqueta adhesiva
                      </button>
                    </>
                  )}
                  {tab === "enviado" && (
                    row.guia_at ? (
                      <>
                        <button className="ui-button ui-button-sm" onClick={() => abrirWhatsappGuia(row)}>
                          Enviar guía
                        </button>
                        <button className="ui-button-ghost ui-button-sm" onClick={() => setModalGuia(row)}>
                          Actualizar guía
                        </button>
                      </>
                    ) : (
                      <button className="ui-button ui-button-sm" onClick={() => setModalGuia(row)}>
                        Cargar guía
                      </button>
                    )
                  )}
                </div>

              </div>
            )
          })}

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
