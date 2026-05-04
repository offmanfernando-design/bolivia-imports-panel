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
      <div className="ui-card flex items-center gap-2 text-sm text-emerald-500">
        <span>✓</span>
        <span>{mensaje}</span>
      </div>
    )
  }

  const puedeCrear =
    clienteNombre.trim() &&
    clienteCiudad.trim() &&
    trackingCrear.trim() &&
    itemDescripcion.trim()

  return (
    <div className="ui-card flex flex-col gap-3">

      {/* Datos del paquete desconocido */}
      <div className="flex flex-col gap-1">

        <p className="text-sm font-medium">{desconocido.descripcion}</p>

        {desconocido.tracking && (
          <p className="text-xs text-neutral-400">
            Tracking parcial: {desconocido.tracking}
          </p>
        )}

        {desconocido.peso != null && (
          <p className="text-xs text-neutral-400">{desconocido.peso} kg</p>
        )}

        {desconocido.notas && (
          <p className="text-xs text-neutral-400 italic">{desconocido.notas}</p>
        )}

      </div>

      {/* Estado inicial: dos acciones */}
      {modo === null && (

        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">

          <button
            onClick={() => setModo("vincular")}
            className="text-xs font-medium text-blue-500 hover:underline self-start"
          >
            Vincular a compra existente
          </button>

          <div className="flex flex-col gap-1">

            <button
              onClick={() => setModo("crear")}
              className="text-xs font-medium text-blue-500 hover:underline self-start"
            >
              Crear compra desde desconocido
            </button>

            <p className="text-xs text-neutral-400">
              Usar cuando el paquete llegó pero la compra no existe en el sistema.
            </p>

          </div>

        </div>

      )}

      {/* Modo vincular: buscar tracking y seleccionar ítem */}
      {modo === "vincular" && (

        <div className="flex flex-col gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">

          <p className="text-xs font-semibold text-neutral-500">
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
            <p className="text-xs text-neutral-400">
              No se encontró una orden/ítem con ese tracking. Prueba con el tracking completo o sus últimos dígitos.
            </p>
          )}

          {resultados && resultados.length > 0 && (

            <div className="flex flex-col gap-4">

              <p className="text-xs text-neutral-400 italic">
                Selecciona el ítem real al que pertenece este paquete. Identificar no registra recepción.
              </p>

              {resultados.map((orden) => (

                <div key={orden.id} className="flex flex-col gap-2">

                  <p className="text-xs font-semibold text-neutral-500">
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
                        className={`
                          flex items-center justify-between gap-2
                          px-3 py-2 rounded-lg border text-sm transition
                          ${elegible
                            ? selected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 cursor-pointer"
                              : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
                            : "border-neutral-100 dark:border-neutral-900 opacity-50 cursor-not-allowed"
                          }
                        `}
                      >

                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`
                              w-3 h-3 rounded-full border-2 flex-shrink-0 transition
                              ${elegible
                                ? selected
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-neutral-400"
                                : "border-neutral-200 dark:border-neutral-700"
                              }
                            `}
                          />
                          <span className="truncate">{item.descripcion}</span>
                        </div>

                        {razon && (
                          <span className="text-xs text-neutral-400 flex-shrink-0">{razon}</span>
                        )}

                      </div>
                    )
                  })}

                </div>

              ))}

            </div>

          )}

          {errorVincular && (
            <p className="text-xs text-red-500">{errorVincular}</p>
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
            className="text-xs text-neutral-400 hover:underline self-start"
          >
            Cancelar
          </button>

        </div>

      )}

      {/* Modo crear: formulario nueva compra */}
      {modo === "crear" && (

        <div className="flex flex-col gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">

          <p className="text-xs font-semibold text-neutral-500">
            Crear compra desde desconocido
          </p>

          <p className="text-xs text-neutral-400 italic">
            Se creará una orden con warehouse confirmado. No registra recepción.
          </p>

          <div className="flex flex-col gap-2">

            <label className="text-xs text-neutral-500">Cliente *</label>
            <input
              className="ui-input"
              placeholder="Nombre del cliente"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
            />

          </div>

          <div className="flex gap-2">

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs text-neutral-500">Ciudad *</label>
              <input
                className="ui-input"
                placeholder="Ej. Santa Cruz"
                value={clienteCiudad}
                onChange={(e) => setClienteCiudad(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs text-neutral-500">Teléfono</label>
              <input
                className="ui-input"
                placeholder="Opcional"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
              />
            </div>

          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-500">Tracking *</label>
            <input
              className="ui-input"
              placeholder="Tracking real"
              value={trackingCrear}
              onChange={(e) => setTrackingCrear(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-500">Descripción del ítem *</label>
            <input
              className="ui-input"
              placeholder="Descripción del producto"
              value={itemDescripcion}
              onChange={(e) => setItemDescripcion(e.target.value)}
            />
          </div>

          {errorCrear && (
            <p className="text-xs text-red-500">{errorCrear}</p>
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
            className="text-xs text-neutral-400 hover:underline self-start"
          >
            Cancelar
          </button>

        </div>

      )}

    </div>
  )
}
