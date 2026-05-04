import { useEffect, useState } from "react"
import { API_URL } from "../../config/api"
import IdentificarDesconocido from "./IdentificarDesconocido"

export default function UbicacionDrawer({ codigo }) {

  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const esDesconocida = Boolean(codigo?.startsWith("D"))

  useEffect(() => {

    if (!codigo) return

    setLoading(true)
    setData([])

    async function load() {

      try {

        let rows = []

        if (esDesconocida) {

          const res  = await fetch(`${API_URL}/operativo/paquetes-desconocidos?estado=pendiente`)
          const json = await res.json()
          rows = (json.data || []).filter((p) => p.ubicacion_codigo === codigo)

        } else {

          const res  = await fetch(`${API_URL}/operativo/ubicaciones/${codigo}`)
          const json = await res.json()
          rows = json.data || []

        }

        setData(rows)

      } catch (err) {

        console.error(err)

      } finally {

        setLoading(false)

      }

    }

    load()

  }, [codigo, esDesconocida])

  function handleIdentificado(id) {
    setData((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) {
    return <div className="text-sm text-neutral-400">Cargando paquetes...</div>
  }

  /* ---- Zona D: desconocidos ---- */

  if (esDesconocida) {

    return (

      <div className="flex flex-col gap-6">

        <div>
          <p className="ui-section-title">Ubicación</p>
          <h2 className="ui-page-title">{codigo}</h2>
        </div>

        {data.length === 0 ? (

          <p className="text-sm text-neutral-400">Sin paquetes pendientes.</p>

        ) : (

          <div className="flex flex-col gap-4">
            {data.map((pd) => (
              <IdentificarDesconocido
                key={pd.id}
                desconocido={pd}
                onIdentificado={handleIdentificado}
              />
            ))}
          </div>

        )}

      </div>

    )

  }

  /* ---- Zonas normales: recepciones ---- */

  const clientes = {}

  data.forEach((p) => {
    if (!clientes[p.cliente]) clientes[p.cliente] = []
    clientes[p.cliente].push(p)
  })

  return (

    <div className="flex flex-col gap-8">

      <div>
        <p className="ui-section-title">Ubicación</p>
        <h2 className="ui-page-title">{codigo}</h2>
      </div>

      {Object.entries(clientes).map(([cliente, items]) => (

        <div key={cliente} className="ui-card flex flex-col gap-3">

          <h3 className="text-sm font-semibold">{cliente}</h3>

          <div className="flex flex-col gap-2">

            {items.map((item, i) => (

              <div key={item.codigo_recepcion || i} className="flex flex-col gap-0.5">

                <p className="text-sm">{item.descripcion}</p>

                <p className="text-xs text-neutral-400">
                  {item.tracking_number}
                  {item.codigo_recepcion && ` · ${item.codigo_recepcion}`}
                </p>

              </div>

            ))}

          </div>

        </div>

      ))}

    </div>

  )

}
