import { useState } from "react"
import { API_URL } from "../../config/api"

function esElegible(item) {
  return (
    item.warehouse_confirmado &&
    item.estado !== "recibido_bolivia" &&
    item.estado !== "entregado"
  )
}

function razonInelegible(item) {
  if (!item.warehouse_confirmado) return "No confirmado en warehouse"
  if (item.estado === "recibido_bolivia") return "Ya recibido en Bolivia"
  if (item.estado === "entregado")        return "Ya entregado"
  return null
}

export default function IdentificarDesconocido({ desconocido, onIdentificado }) {
  // modo: null | 'vincular' | 'crear'
  const [modo, setModo] = useState(null)

  // Estado modo vincular
  const [busqueda, setBusqueda]                 = useState("")
  const [buscando, setBuscando]                 = useState(false)
  const [resultados, setResultados]             = useState(null)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [guardando, setGuardando]               = useState(false)
  const [errorVincular, setErrorVincular]       = useState(null)

  // Estado modo crear
  const [clienteNombre, setClienteNombre]     = useState("")
  const [clienteCiudad, setClienteCiudad]     = useState("")
  const [clienteTelefono, setClienteTelefono] = useState("")
  const [trackingCrear, setTrackingCrear]     = useState(() => desconocido.tracking || "")
  const [itemDescripcion, setItemDescripcion] = useState(() => desconocido.descripcion || "")
  const [guardandoCrear, setGuardandoCrear]   = useState(false)
  const [errorCrear, setErrorCrear]           = useState(null)

  // exito: null | 'vincular' | 'crear'
  const [exito, setExito] = useState(null)

  // ---- Modo vincular ----

  async function buscar() {
    if (!busqueda.trim()) return
    setBuscando(true)
    setResultados(null)
    setItemSeleccionado(null)
    setErrorVincular(null)
    try {
      const res  = await fetch(`${API_URL}/operativo/carga/buscar?tracking=${encodeURIComponent(busqueda.trim())}`)
      const json = await res.json()
      setResultados(Array.isArray(json) ? json : (json.data || []))
    } catch {
      setErrorVincular("Error al buscar")
    } finally {
      setBuscando(false)
    }
  }

  async function confirmar() {
    if (!itemSeleccionado) return
    setGuardando(true)
    setErrorVincular(null)
    try {
      const res = await fetch(
        `${API_URL}/operativo/paquetes-desconocidos/${desconocido.id}/identificar`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id:  itemSeleccionado,
            tracking: busqueda.trim() || null,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        setErrorVincular(json.error || "Error al identificar")
        return
      }
      setExito("vincular")
      setTimeout(() => onIdentificado(desconocido.id), 1200)
    } catch {
      setErrorVincular("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  function cancelarVincular() {
    setModo(null)
    setBusqueda("")
    setResultados(null)
    setItemSeleccionado(null)
    setErrorVincular(null)
  }

  // ---- Modo crear ----

  async function crearCompra() {
    if (!clienteNombre.trim() || !clienteCiudad.trim() || !trackingCrear.trim() || !itemDescripcion.trim()) return
    setGuardandoCrear(true)
    setErrorCrear(null)
    try {
      const res = await fetch(
        `${API_URL}/operativo/paquetes-desconocidos/${desconocido.id}/crear-compra`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliente_nombre:   clienteNombre.trim(),
            cliente_ciudad:   clienteCiudad.trim(),
            cliente_telefono: clienteTelefono.trim() || undefined,
            tracking_number:  trackingCrear.trim(),
            item_descripcion: itemDescripcion.trim(),
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setErrorCrear("Ya existe una orden con ese tracking. Usa Vincular a compra existente.")
        } else {
          setErrorCrear(json.error || "Error al crear compra")
        }
        return
      }
      setExito("crear")
      setTimeout(() => onIdentificado(desconocido.id), 1200)
    } catch {
      setErrorCrear("Error de conexión")
    } finally {
      setGuardandoCrear(false)
    }
  }

  function cancelarCrear() {
    setModo(null)
    setClienteNombre("")
    setClienteCiudad("")
    setClienteTelefono("")
    setTrackingCrear(desconocido.tracking || "")
    setItemDescripcion(desconocido.descripcion || "")
    setErrorCrear(null)
  }

  // ---- Éxito ----

  if (exito) {
    const mensaje = exito === "crear" ? "Compra creada e identificada" : "Identificado correctamente"
    return (
      <div className="rounded-xl px-4 py-3 flex items-center gap-2.5"
        style={{ background: "var(--success-soft)", border: "1px solid var(--success)" }}>
        <span className="text-base font-bold" style={{ color: "var(--success)" }}>✓</span>
        <span className="text-sm font-medium" style={{ color: "var(--success)" }}>{mensaje}</span>
      </div>
    )
  }

  const puedeCrear =
    clienteNombre.trim() &&
    clienteCiudad.trim() &&
    trackingCrear.trim() &&
    itemDescripcion.trim()

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>

      {/* ── Header: descripción + badge ── */}
      <div className="px-4 py-3 flex items-start justify-between gap-3"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-bold leading-snug" style={{ color: "var(--text)" }}>
            {desconocido.descripcion}
          </p>
          {desconocido.peso != null && (
            <p className="text-xs" style={{ color: "var(--text-3)" }}>{desconocido.peso} kg</p>
          )}
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
          Sin identificar
        </span>
      </div>

      {/* ── Body: tracking + notas ── */}
      {(desconocido.tracking || desconocido.notas) && (
        <div className="px-4 py-3 flex flex-col gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}>
          {desconocido.tracking && (
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Tracking parcial
              </p>
              <p className="font-mono text-xs" style={{ color: "var(--text-2)" }}>
                {desconocido.tracking}
              </p>
            </div>
          )}
          {desconocido.notas && (
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Notas
              </p>
              <p className="text-xs italic" style={{ color: "var(--text-2)" }}>
                {desconocido.notas}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Acciones iniciales ── */}
      {modo === null && (
        <div className="px-4 py-3 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setModo("vincular")}
              className="ui-button flex-1 text-sm text-center"
            >
              Vincular a compra existente
            </button>
            <button
              onClick={() => setModo("crear")}
              className="ui-button-ghost flex-1 text-sm text-center"
            >
              Crear compra nueva
            </button>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>
            Usar &ldquo;Crear&rdquo; cuando el paquete llegó pero la compra no existe en el sistema.
          </p>
        </div>
      )}

      {/* ── Modo vincular ── */}
      {modo === "vincular" && (
        <div className="px-4 py-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>

          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            Vincular a compra existente
          </p>

          <div className="flex gap-2">
            <input
              className="ui-input flex-1"
              placeholder="Buscar tracking o últimos dígitos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button
              onClick={buscar}
              disabled={buscando || !busqueda.trim()}
              className="ui-button disabled:opacity-40 whitespace-nowrap"
            >
              {buscando ? "..." : "Buscar"}
            </button>
          </div>

          {resultados !== null && resultados.length === 0 && (
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              No se encontró una orden/ítem con ese tracking. Prueba con el tracking completo o sus últimos dígitos.
            </p>
          )}

          {resultados && resultados.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs italic" style={{ color: "var(--text-3)" }}>
                Selecciona el ítem real al que pertenece este paquete. Identificar no registra recepción.
              </p>

              {resultados.map((orden) => (
                <div key={orden.id} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>
                    {orden.cliente_nombre} · {orden.numero_orden}
                  </p>

                  {orden.items.map((item) => {
                    const elegible = esElegible(item)
                    const razon    = razonInelegible(item)
                    const selected = itemSeleccionado === item.id

                    return (
                      <div
                        key={item.id}
                        onClick={() => elegible && setItemSeleccionado(item.id)}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition"
                        style={elegible
                          ? selected
                            ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--text)", cursor: "pointer" }
                            : { borderColor: "var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }
                          : { borderColor: "var(--border)", opacity: 0.5, cursor: "not-allowed", color: "var(--text-3)" }
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full border-2 flex-shrink-0 transition"
                            style={elegible && selected
                              ? { background: "var(--accent)", borderColor: "var(--accent)" }
                              : { borderColor: "var(--border-strong)" }
                            } />
                          <span className="truncate">{item.descripcion}</span>
                        </div>
                        {razon && (
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>
                            {razon}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {errorVincular && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>{errorVincular}</p>
          )}

          {itemSeleccionado && (
            <button
              onClick={confirmar}
              disabled={guardando}
              className="ui-button-success disabled:opacity-40"
            >
              {guardando ? "Guardando..." : "Confirmar identificación"}
            </button>
          )}

          <button
            onClick={cancelarVincular}
            className="text-xs hover:underline self-start transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
          >
            Cancelar
          </button>

        </div>
      )}

      {/* ── Modo crear ── */}
      {modo === "crear" && (
        <div className="px-4 py-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>

          <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            Crear compra desde desconocido
          </p>

          <p className="text-xs italic" style={{ color: "var(--text-3)" }}>
            Se creará una orden con warehouse confirmado. No registra recepción.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="ui-label">Cliente *</label>
            <input
              className="ui-input"
              placeholder="Nombre del cliente"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="ui-label">Ciudad *</label>
              <input
                className="ui-input"
                placeholder="Ej. Santa Cruz"
                value={clienteCiudad}
                onChange={(e) => setClienteCiudad(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="ui-label">Teléfono</label>
              <input
                className="ui-input"
                placeholder="Opcional"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="ui-label">Tracking *</label>
            <input
              className="ui-input"
              placeholder="Tracking real"
              value={trackingCrear}
              onChange={(e) => setTrackingCrear(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="ui-label">Descripción del ítem *</label>
            <input
              className="ui-input"
              placeholder="Descripción del producto"
              value={itemDescripcion}
              onChange={(e) => setItemDescripcion(e.target.value)}
            />
          </div>

          {errorCrear && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>{errorCrear}</p>
          )}

          <button
            onClick={crearCompra}
            disabled={guardandoCrear || !puedeCrear}
            className="ui-button-success disabled:opacity-40"
          >
            {guardandoCrear ? "Creando..." : "Crear compra e identificar"}
          </button>

          <button
            onClick={cancelarCrear}
            className="text-xs hover:underline self-start transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
          >
            Cancelar
          </button>

        </div>
      )}

    </div>
  )
}
