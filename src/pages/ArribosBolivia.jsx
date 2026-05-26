import { useState, useEffect, useCallback, useMemo } from "react"
import { API_URL } from "../config/api"
import useRealtimeEvents from "../hooks/useRealtimeEvents"

/* ── Helpers ─────────────────────────────────────────────────── */

function fmtFecha(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getFullYear()}`
}

function fmtPeso(value) {
  if (value == null) return "—"
  return `${Number(value).toFixed(3)} kg`
}

function fmtDif(value) {
  if (value == null) return "—"
  const n = Number(value)
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(3)} kg`
}

function difColor(value) {
  if (value == null) return "var(--text-3)"
  const n = Number(value)
  if (n > 0.05)  return "var(--warning)"
  if (n < -0.05) return "var(--danger)"
  return "var(--success)"
}

const ESTADO_LABEL = { abierto: "Abierto", en_verificacion: "Verificando", cerrado: "Cerrado" }
const ESTADO_STYLE = {
  abierto:        { background: "var(--surface-3)", color: "var(--text-2)" },
  en_verificacion:{ background: "var(--warning-soft)", color: "var(--warning)" },
  cerrado:        { background: "var(--success-soft)", color: "var(--success)" },
}

function EstadoBadge({ estado }) {
  const label = ESTADO_LABEL[estado] ?? estado
  const style = ESTADO_STYLE[estado] ?? {}
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={style}>
      {label}
    </span>
  )
}

/* ── Formulario de arribo (crear / editar) ───────────────────── */
const FORM_VACÍO = {
  fecha_llegada_informada:   "",
  fecha_recojo:              "",
  fecha_ingreso_oficina:     "",
  origen_lugar:              "",
  responsable:               "",
  cantidad_bultos_declarada: "",
  peso_total_origen_kg:      "",
  peso_total_oficina_kg:     "",
  notas:                     "",
}

function FormArribo({ inicial = FORM_VACÍO, onGuardar, onCancelar, cargando, error }) {
  const [form, setForm] = useState({ ...FORM_VACÍO, ...inicial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl px-3 py-2 text-sm"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="ui-label">Origen / lugar</label>
          <input className="ui-input" placeholder="Miami FL, NYC, Lima…"
            value={form.origen_lugar} onChange={e => set("origen_lugar", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="ui-label">Responsable</label>
          <input className="ui-input" placeholder="Nombre o referencia"
            value={form.responsable} onChange={e => set("responsable", e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="ui-label">Fecha llegada informada</label>
          <input className="ui-input" type="date"
            value={form.fecha_llegada_informada} onChange={e => set("fecha_llegada_informada", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="ui-label">Fecha de recojo</label>
          <input className="ui-input" type="date"
            value={form.fecha_recojo} onChange={e => set("fecha_recojo", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="ui-label">Fecha ingreso oficina</label>
          <input className="ui-input" type="date"
            value={form.fecha_ingreso_oficina} onChange={e => set("fecha_ingreso_oficina", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="ui-label">Bultos declarados <span className="font-normal opacity-60">(aprox)</span></label>
          <input className="ui-input" type="number" min="0" step="1" placeholder="0"
            value={form.cantidad_bultos_declarada}
            onChange={e => set("cantidad_bultos_declarada", e.target.value)}
            onWheel={e => e.currentTarget.blur()} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="ui-label">Peso total origen (kg)</label>
          <input className="ui-input" type="number" min="0" step="0.001" placeholder="0.000"
            value={form.peso_total_origen_kg}
            onChange={e => set("peso_total_origen_kg", e.target.value)}
            onWheel={e => e.currentTarget.blur()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="ui-label">Peso total oficina (kg)</label>
          <input className="ui-input" type="number" min="0" step="0.001" placeholder="0.000"
            value={form.peso_total_oficina_kg}
            onChange={e => set("peso_total_oficina_kg", e.target.value)}
            onWheel={e => e.currentTarget.blur()} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="ui-label">Notas</label>
        <input className="ui-input" placeholder="Observaciones generales…"
          value={form.notas} onChange={e => set("notas", e.target.value)} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onGuardar(form)}
          disabled={cargando}
          className="ui-button-success disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={cargando}
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{ color: "var(--text-3)" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ── Panel de detalle / bultos ───────────────────────────────── */
function DetalleArribo({ arriboId, onClose, onArriboActualizado }) {
  const [arribo,   setArribo]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [editando, setEditando] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [metaError,  setMetaError]  = useState("")
  const [savingEstado, setSavingEstado] = useState(false)

  // Bulto
  const [nuevoOrigen,  setNuevoOrigen]  = useState("")
  const [nuevoOficina, setNuevoOficina] = useState("")
  const [nuevoObs,     setNuevoObs]     = useState("")
  const [addingBulto,  setAddingBulto]  = useState(false)
  const [bultoError,   setBultoError]   = useState("")
  const [showAddBulto, setShowAddBulto] = useState(false)

  // Edición inline de bulto
  const [editBultoId,     setEditBultoId]     = useState(null)
  const [editBultoOrigen,  setEditBultoOrigen]  = useState("")
  const [editBultoOficina, setEditBultoOficina] = useState("")
  const [editBultoObs,     setEditBultoObs]     = useState("")
  const [savingBulto,      setSavingBulto]      = useState(false)

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/operativo/arribos/${arriboId}`)
      const json = await res.json()
      if (json.ok) setArribo(json.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [arriboId])

  useEffect(() => { cargar() }, [cargar])

  async function guardarMeta(form) {
    setSavingMeta(true); setMetaError("")
    try {
      const payload = {}
      const campos = [
        "fecha_llegada_informada","fecha_recojo","fecha_ingreso_oficina",
        "origen_lugar","responsable","cantidad_bultos_declarada",
        "peso_total_origen_kg","peso_total_oficina_kg","notas",
      ]
      for (const k of campos) payload[k] = form[k] || null
      const res  = await fetch(`${API_URL}/operativo/arribos/${arriboId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Error al guardar")
      setArribo(prev => ({ ...prev, ...json.data }))
      setEditando(false)
      onArriboActualizado?.()
    } catch (e) { setMetaError(e.message) }
    finally { setSavingMeta(false) }
  }

  async function cambiarEstado(nuevoEstado) {
    setSavingEstado(true)
    try {
      const res  = await fetch(`${API_URL}/operativo/arribos/${arriboId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setArribo(prev => ({ ...prev, estado: json.data.estado }))
      onArriboActualizado?.()
    } catch (e) { alert(e.message) }
    finally { setSavingEstado(false) }
  }

  async function agregarBulto() {
    setBultoError(""); setAddingBulto(true)
    try {
      const res  = await fetch(`${API_URL}/operativo/arribos/${arriboId}/bultos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peso_origen_kg:  nuevoOrigen  !== "" ? Number(nuevoOrigen)  : null,
          peso_oficina_kg: nuevoOficina !== "" ? Number(nuevoOficina) : null,
          observaciones:   nuevoObs || null,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Error al agregar bulto")
      setArribo(prev => ({
        ...prev,
        bultos: [...(prev.bultos || []), json.data],
      }))
      setNuevoOrigen(""); setNuevoOficina(""); setNuevoObs("")
      setShowAddBulto(false)
      onArriboActualizado?.()
    } catch (e) { setBultoError(e.message) }
    finally { setAddingBulto(false) }
  }

  function iniciarEditBulto(b) {
    setEditBultoId(b.id)
    setEditBultoOrigen(b.peso_origen_kg  != null ? String(b.peso_origen_kg)  : "")
    setEditBultoOficina(b.peso_oficina_kg != null ? String(b.peso_oficina_kg) : "")
    setEditBultoObs(b.observaciones || "")
  }

  async function guardarBulto(bultoId) {
    setSavingBulto(true)
    try {
      const res  = await fetch(`${API_URL}/operativo/arribos/${arriboId}/bultos/${bultoId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peso_origen_kg:  editBultoOrigen  !== "" ? Number(editBultoOrigen)  : null,
          peso_oficina_kg: editBultoOficina !== "" ? Number(editBultoOficina) : null,
          observaciones:   editBultoObs || null,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setArribo(prev => ({
        ...prev,
        bultos: prev.bultos.map(b => b.id === bultoId ? json.data : b),
      }))
      setEditBultoId(null)
      onArriboActualizado?.()
    } catch (e) { alert(e.message) }
    finally { setSavingBulto(false) }
  }

  async function eliminarBulto(bultoId) {
    if (!confirm("¿Eliminar este bulto?")) return
    try {
      const res  = await fetch(`${API_URL}/operativo/arribos/${arriboId}/bultos/${bultoId}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setArribo(prev => ({
        ...prev,
        bultos: prev.bultos.filter(b => b.id !== bultoId),
      }))
      onArriboActualizado?.()
    } catch (e) { alert(e.message) }
  }

  // Totales calculados localmente
  const totales = useMemo(() => {
    if (!arribo?.bultos?.length) return null
    const bs = arribo.bultos
    const sumaO = bs.reduce((s, b) => s + (b.peso_origen_kg  != null ? Number(b.peso_origen_kg)  : 0), 0)
    const sumaF = bs.reduce((s, b) => s + (b.peso_oficina_kg != null ? Number(b.peso_oficina_kg) : 0), 0)
    const tieneO = bs.some(b => b.peso_origen_kg  != null)
    const tieneF = bs.some(b => b.peso_oficina_kg != null)
    return {
      sumaO: tieneO ? sumaO : null,
      sumaF: tieneF ? sumaF : null,
      dif:   tieneO && tieneF ? sumaF - sumaO : null,
    }
  }, [arribo?.bultos])

  if (loading) return <p className="text-sm p-4" style={{ color: "var(--text-3)" }}>Cargando…</p>
  if (!arribo) return <p className="text-sm p-4" style={{ color: "var(--danger)" }}>No encontrado</p>

  const cerrado = arribo.estado === "cerrado"
  const formInicial = {
    fecha_llegada_informada:   arribo.fecha_llegada_informada   ? arribo.fecha_llegada_informada.slice(0, 10)   : "",
    fecha_recojo:              arribo.fecha_recojo              ? arribo.fecha_recojo.slice(0, 10)              : "",
    fecha_ingreso_oficina:     arribo.fecha_ingreso_oficina     ? arribo.fecha_ingreso_oficina.slice(0, 10)     : "",
    origen_lugar:              arribo.origen_lugar  || "",
    responsable:               arribo.responsable   || "",
    cantidad_bultos_declarada: arribo.cantidad_bultos_declarada != null ? String(arribo.cantidad_bultos_declarada) : "",
    peso_total_origen_kg:      arribo.peso_total_origen_kg  != null ? String(arribo.peso_total_origen_kg)  : "",
    peso_total_oficina_kg:     arribo.peso_total_oficina_kg != null ? String(arribo.peso_total_oficina_kg) : "",
    notas:                     arribo.notas || "",
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-base font-bold" style={{ color: "var(--text)" }}>
            {arribo.codigo_arribo}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <EstadoBadge estado={arribo.estado} />
            {arribo.origen_lugar && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>{arribo.origen_lugar}</span>
            )}
          </div>
        </div>
        <button type="button" onClick={onClose}
          className="text-xs px-2.5 py-1 rounded-lg"
          style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}>
          Cerrar ✕
        </button>
      </div>

      {/* Cambio de estado */}
      <div className="flex gap-2 flex-wrap">
        {["abierto", "en_verificacion", "cerrado"].map(e => (
          <button key={e} type="button"
            disabled={savingEstado || arribo.estado === e}
            onClick={() => cambiarEstado(e)}
            className="text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40"
            style={arribo.estado === e
              ? { ...ESTADO_STYLE[e], borderColor: "currentColor", fontWeight: 600 }
              : { borderColor: "var(--border)", color: "var(--text-3)" }
            }>
            {ESTADO_LABEL[e]}
          </button>
        ))}
      </div>

      {/* Datos generales */}
      <div className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Datos del arribo
          </p>
          {!editando && (
            <button type="button" onClick={() => setEditando(true)}
              className="text-xs px-2.5 py-1 rounded-lg border"
              style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <FormArribo
            inicial={formInicial}
            onGuardar={guardarMeta}
            onCancelar={() => { setEditando(false); setMetaError("") }}
            cargando={savingMeta}
            error={metaError}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {[
              ["Llegada informada",  fmtFecha(arribo.fecha_llegada_informada)],
              ["Recojo",             fmtFecha(arribo.fecha_recojo)],
              ["Ingreso oficina",    fmtFecha(arribo.fecha_ingreso_oficina)],
              ["Responsable",        arribo.responsable       || "—"],
              ["Bultos declarados",  arribo.cantidad_bultos_declarada != null ? arribo.cantidad_bultos_declarada : "—"],
              ["Peso origen (total)",  fmtPeso(arribo.peso_total_origen_kg)],
              ["Peso oficina (total)", fmtPeso(arribo.peso_total_oficina_kg)],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</p>
                <p className="font-medium mt-0.5" style={{ color: "var(--text-2)" }}>{val}</p>
              </div>
            ))}
            {arribo.notas && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Notas</p>
                <p className="mt-0.5" style={{ color: "var(--text-2)" }}>{arribo.notas}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bultos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Bultos / cajas
            {arribo.bultos?.length > 0 && (
              <span className="ml-2 normal-case font-normal">({arribo.bultos.length})</span>
            )}
          </p>
          {!cerrado && (
            <button type="button"
              onClick={() => { setShowAddBulto(s => !s); setBultoError("") }}
              className="text-xs px-2.5 py-1 rounded-lg border"
              style={showAddBulto
                ? { borderColor: "var(--border-strong)", color: "var(--text)" }
                : { borderColor: "var(--border)", color: "var(--text-3)" }}>
              {showAddBulto ? "Cancelar" : "+ Agregar bulto"}
            </button>
          )}
        </div>

        {/* Formulario agregar bulto */}
        {showAddBulto && !cerrado && (
          <div className="rounded-xl p-3 flex flex-col gap-3"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {bultoError && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{bultoError}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="ui-label">Peso origen (kg)</label>
                <input className="ui-input ui-input-sm" type="number" min="0" step="0.001"
                  placeholder="0.000" value={nuevoOrigen}
                  onChange={e => setNuevoOrigen(e.target.value)}
                  onWheel={e => e.currentTarget.blur()} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="ui-label">Peso oficina (kg)</label>
                <input className="ui-input ui-input-sm" type="number" min="0" step="0.001"
                  placeholder="0.000" value={nuevoOficina}
                  onChange={e => setNuevoOficina(e.target.value)}
                  onWheel={e => e.currentTarget.blur()} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="ui-label">Observaciones</label>
              <input className="ui-input ui-input-sm" placeholder="Descripción, color, referencia…"
                value={nuevoObs} onChange={e => setNuevoObs(e.target.value)} />
            </div>
            <button type="button" onClick={agregarBulto} disabled={addingBulto}
              className="ui-button disabled:opacity-50 self-start text-sm">
              {addingBulto ? "Agregando…" : "Agregar"}
            </button>
          </div>
        )}

        {/* Tabla de bultos */}
        {arribo.bultos?.length > 0 ? (
          <div className="overflow-x-auto rounded-xl"
            style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Bulto", "Origen kg", "Oficina kg", "Dif.", "Observaciones", ""].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {arribo.bultos.map((b) => {
                  const editandoEste = editBultoId === b.id
                  const diferencia = b.peso_origen_kg != null && b.peso_oficina_kg != null
                    ? Number(b.peso_oficina_kg) - Number(b.peso_origen_kg) : null

                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-3 py-2 font-mono font-semibold" style={{ color: "var(--text-2)" }}>
                        {b.numero_bulto}
                      </td>

                      {editandoEste ? (
                        <>
                          <td className="px-2 py-1.5">
                            <input className="ui-input ui-input-sm w-24" type="number" min="0" step="0.001"
                              value={editBultoOrigen}
                              onChange={e => setEditBultoOrigen(e.target.value)}
                              onWheel={e => e.currentTarget.blur()} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input className="ui-input ui-input-sm w-24" type="number" min="0" step="0.001"
                              value={editBultoOficina}
                              onChange={e => setEditBultoOficina(e.target.value)}
                              onWheel={e => e.currentTarget.blur()} />
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: "var(--text-3)" }}>—</td>
                          <td className="px-2 py-1.5">
                            <input className="ui-input ui-input-sm w-40" placeholder="Observaciones"
                              value={editBultoObs}
                              onChange={e => setEditBultoObs(e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1">
                              <button type="button" onClick={() => guardarBulto(b.id)} disabled={savingBulto}
                                className="text-xs px-2 py-1 rounded font-medium disabled:opacity-50"
                                style={{ background: "var(--text)", color: "var(--surface)" }}>
                                ✓
                              </button>
                              <button type="button" onClick={() => setEditBultoId(null)}
                                className="text-xs px-2 py-1 rounded"
                                style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}>
                                ✕
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 font-mono text-xs tabular-nums" style={{ color: "var(--text-2)" }}>
                            {b.peso_origen_kg != null ? Number(b.peso_origen_kg).toFixed(3) : "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs tabular-nums" style={{ color: "var(--text-2)" }}>
                            {b.peso_oficina_kg != null ? Number(b.peso_oficina_kg).toFixed(3) : "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs tabular-nums font-semibold"
                            style={{ color: difColor(diferencia) }}>
                            {fmtDif(diferencia)}
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: "var(--text-3)", maxWidth: "160px" }}>
                            <span className="truncate block">{b.observaciones || "—"}</span>
                          </td>
                          <td className="px-2 py-1.5">
                            {!cerrado && (
                              <div className="flex gap-1">
                                <button type="button" onClick={() => iniciarEditBulto(b)}
                                  className="text-[10px] px-2 py-0.5 rounded"
                                  style={{ border: "1px solid var(--border)", color: "var(--text-3)" }}>
                                  Editar
                                </button>
                                <button type="button" onClick={() => eliminarBulto(b.id)}
                                  className="text-[10px] px-2 py-0.5 rounded"
                                  style={{ border: "1px solid var(--border)", color: "var(--danger)" }}>
                                  ✕
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}

                {/* Totales */}
                {totales && (
                  <tr style={{ background: "var(--surface-2)", borderTop: "2px solid var(--border-strong)" }}>
                    <td className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-3)" }}>Total</td>
                    <td className="px-3 py-2 font-mono text-xs font-bold tabular-nums" style={{ color: "var(--text)" }}>
                      {totales.sumaO != null ? totales.sumaO.toFixed(3) : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs font-bold tabular-nums" style={{ color: "var(--text)" }}>
                      {totales.sumaF != null ? totales.sumaF.toFixed(3) : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs font-bold tabular-nums"
                      style={{ color: difColor(totales.dif) }}>
                      {fmtDif(totales.dif)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm py-3" style={{ color: "var(--text-3)" }}>
            Sin bultos registrados.{!cerrado ? " Agregá uno con el botón de arriba." : ""}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────── */
export default function ArribosBolivia() {
  const [arribos,     setArribos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("")
  const [mostrarForm,  setMostrarForm]  = useState(false)
  const [creando,      setCreando]      = useState(false)
  const [createError,  setCreateError]  = useState("")
  const [detalleId,    setDetalleId]    = useState(null)

  const cargarLista = useCallback(async () => {
    try {
      const url = filtroEstado
        ? `${API_URL}/operativo/arribos?estado=${filtroEstado}`
        : `${API_URL}/operativo/arribos`
      const res  = await fetch(url)
      const json = await res.json()
      if (json.ok) setArribos(json.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filtroEstado])

  useEffect(() => {
    setLoading(true)
    cargarLista()
  }, [cargarLista])

  // SSE: no hay eventos específicos para arribos todavía; nada que suscribir
  useRealtimeEvents(() => {}) // hook montado para mantener la conexión compartida

  async function crearArribo(form) {
    setCreando(true); setCreateError("")
    try {
      const payload = {}
      for (const [k, v] of Object.entries(form)) payload[k] = v || null
      const res  = await fetch(`${API_URL}/operativo/arribos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Error al crear")
      setMostrarForm(false)
      setDetalleId(json.data.id)   // abre detalle directamente
      cargarLista()
    } catch (e) { setCreateError(e.message) }
    finally { setCreando(false) }
  }

  if (detalleId) {
    return (
      <div className="module-shell">
        <div className="module-body">
          <div className="panel flex-1">
            <div className="scroll-area p-5">
              <DetalleArribo
                arriboId={detalleId}
                onClose={() => { setDetalleId(null); cargarLista() }}
                onArriboActualizado={cargarLista}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="module-shell">
      <div className="module-body">
        <div className="panel flex-1">

          {/* Barra superior */}
          <div className="panel-header flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Filtro:
              </p>
              {["", "abierto", "en_verificacion", "cerrado"].map(e => (
                <button key={e} type="button"
                  onClick={() => setFiltroEstado(e)}
                  className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                  style={filtroEstado === e
                    ? { background: "var(--text)", color: "var(--surface)", borderColor: "var(--text)" }
                    : { borderColor: "var(--border)", color: "var(--text-3)" }
                  }>
                  {e === "" ? "Todos" : ESTADO_LABEL[e]}
                </button>
              ))}
            </div>
            <button type="button"
              onClick={() => { setMostrarForm(f => !f); setCreateError("") }}
              className="ui-button text-sm">
              {mostrarForm ? "Cancelar" : "+ Nuevo arribo"}
            </button>
          </div>

          <div className="scroll-area p-5 flex flex-col gap-5">

            {/* Formulario nuevo arribo */}
            {mostrarForm && (
              <div className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
                  Nuevo arribo
                </p>
                <FormArribo
                  onGuardar={crearArribo}
                  onCancelar={() => { setMostrarForm(false); setCreateError("") }}
                  cargando={creando}
                  error={createError}
                />
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
                ))}
              </div>
            )}

            {/* Lista vacía */}
            {!loading && arribos.length === 0 && (
              <div className="py-16 text-center text-sm rounded-xl"
                style={{ color: "var(--text-3)", border: "1px dashed var(--border)" }}>
                {filtroEstado
                  ? `Sin arribos con estado "${ESTADO_LABEL[filtroEstado]}"`
                  : "Sin arribos registrados. Creá uno con el botón de arriba."}
              </div>
            )}

            {/* Tarjetas de arribo */}
            {!loading && arribos.map(a => {
              const diferenciaTotal =
                a.suma_peso_origen_kg != null && a.suma_peso_oficina_kg != null
                  ? Number(a.suma_peso_oficina_kg) - Number(a.suma_peso_origen_kg)
                  : null

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setDetalleId(a.id)}
                  className="text-left rounded-2xl p-4 flex flex-col gap-3 w-full transition-all"
                  style={{
                    background:   "var(--surface)",
                    border:       "1px solid var(--border)",
                    boxShadow:    "var(--shadow-sm)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)" }}
                >
                  {/* Fila 1: código + estado + origen */}
                  <div className="flex items-center gap-3 flex-wrap justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm" style={{ color: "var(--text)" }}>
                        {a.codigo_arribo}
                      </span>
                      <EstadoBadge estado={a.estado} />
                      {a.origen_lugar && (
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>{a.origen_lugar}</span>
                      )}
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {fmtFecha(a.created_at)}
                    </span>
                  </div>

                  {/* Fila 2: fechas */}
                  <div className="flex flex-wrap gap-x-5 gap-y-0.5">
                    {[
                      ["Llegada info.", a.fecha_llegada_informada],
                      ["Recojo",        a.fecha_recojo],
                      ["Ingreso of.",   a.fecha_ingreso_oficina],
                    ].map(([label, val]) => val && (
                      <span key={label} className="text-[10px]" style={{ color: "var(--text-3)" }}>
                        {label}{" "}<span style={{ color: "var(--text-2)" }}>{fmtFecha(val)}</span>
                      </span>
                    ))}
                    {a.responsable && (
                      <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                        Resp.{" "}<span style={{ color: "var(--text-2)" }}>{a.responsable}</span>
                      </span>
                    )}
                  </div>

                  {/* Fila 3: bultos y pesos */}
                  <div className="flex flex-wrap gap-4 items-baseline">
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      Bultos{" "}
                      <span className="font-semibold" style={{ color: "var(--text-2)" }}>
                        {a.total_bultos ?? 0}
                        {a.cantidad_bultos_declarada != null ? ` / ${a.cantidad_bultos_declarada} declarados` : ""}
                      </span>
                    </span>
                    {(a.suma_peso_origen_kg != null || a.peso_total_origen_kg != null) && (
                      <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-3)" }}>
                        Origen{" "}
                        <span style={{ color: "var(--text-2)" }}>
                          {fmtPeso(a.suma_peso_origen_kg ?? a.peso_total_origen_kg)}
                        </span>
                      </span>
                    )}
                    {(a.suma_peso_oficina_kg != null || a.peso_total_oficina_kg != null) && (
                      <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-3)" }}>
                        Oficina{" "}
                        <span style={{ color: "var(--text-2)" }}>
                          {fmtPeso(a.suma_peso_oficina_kg ?? a.peso_total_oficina_kg)}
                        </span>
                      </span>
                    )}
                    {diferenciaTotal != null && (
                      <span className="text-xs font-mono tabular-nums font-semibold"
                        style={{ color: difColor(diferenciaTotal) }}>
                        Dif. {fmtDif(diferenciaTotal)}
                      </span>
                    )}
                  </div>

                  {a.notas && (
                    <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{a.notas}</p>
                  )}
                </button>
              )
            })}

          </div>
        </div>
      </div>
    </div>
  )
}
