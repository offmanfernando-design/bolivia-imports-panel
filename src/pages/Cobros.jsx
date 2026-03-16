import { useEffect, useState } from "react"

const API = "https://bolivia-imports-backend-pg.fly.dev/api"

export default function Cobros(){

  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)

  const [cache,setCache] = useState({})
  const [sending,setSending] = useState(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){

    try{

      const res = await fetch(`${API}/cobros`)
      const json = await res.json()

      setData(json.data || [])

    }catch(err){

      console.error(err)

    }finally{

      setLoading(false)

    }

  }


  async function avisar(clienteId){

    if(sending === clienteId) return

    setSending(clienteId)

    try{

      let productos = cache[clienteId]

      if(!productos){

        const res = await fetch(`${API}/cobros/detalle/${clienteId}`)
        productos = await res.json()

        setCache(prev => ({
          ...prev,
          [clienteId]: productos
        }))

      }

      if(!productos.length){
        setSending(null)
        return
      }

      const c0 = productos[0]

      const nombre = c0.cliente_nombre || ""
      const telefono = c0.telefono_cliente

      const esSantaCruz = (c0.departamento_destino || "")
        .toLowerCase()
        .includes("santa")

      const esMultiple = productos.length > 1

      let msg = `Hola ${nombre} 👋\n\n`

      if(esSantaCruz){

        msg += esMultiple
          ? "Tus pedidos llegaron a nuestra oficina en Santa Cruz.\n\n"
          : "Tu pedido llegó a nuestra oficina en Santa Cruz.\n\n"

      }else{

        msg += esMultiple
          ? "Tus pedidos ya se encuentran disponibles para envío.\n\n"
          : "Tu pedido ya se encuentra disponible para envío.\n\n"

      }

      let total = 0

      msg += esMultiple ? "📦 Detalle:\n\n" : "📦 Producto:\n\n"

      productos.forEach((p,i)=>{

        const monto = Number(p.monto_total_bs || 0)

        total += monto

        msg += `${i+1}) Producto: ${p.descripcion_producto}\n`

        if(p.peso_cobrado){

          msg += `Costo: ${p.peso_cobrado} × ${p.tipo_de_cobro} × ${p.dolar_cliente} = ${monto} Bs\n\n`

        }else{

          msg += `Precio: ${monto} Bs\n\n`

        }

      })

      if(esMultiple){
        msg += `💰 Total a pagar: ${total} Bs\n\n`
      }

      if(!esSantaCruz){

        try{

          const resLink = await fetch(`${API}/receptores/link/${clienteId}`)
          const dataLink = await resLink.json()

          if(dataLink.link){

            msg += "📦 Para coordinar el envío, completa este formulario:\n"
            msg += `${dataLink.link}\n\n`

          }

        }catch(err){

          console.error("Error obteniendo link formulario", err)

        }

      }else{

        msg +=
          "💳 Pago: QR o efectivo (solo Bs)\n\n" +
          "🕒 Horario:\n" +
          "Lunes - Viernes 09:30–12:00 / 14:30–18:00\n" +
          "Sabados 09:30-12:00\n\n" +
          "📍 Ubicación:\n" +
          "https://maps.app.goo.gl/fP472SmY3XjTmJBL8\n\n"

      }

      msg += "— Bolivia Imports"

      const url =
        `https://wa.me/591${telefono}?text=${encodeURIComponent(msg)}`

      window.open(url,"_blank")

    }catch(err){

      console.error(err)

    }

    setSending(null)

  }


  if(loading){

    return(
      <div className="ui-card">
        Cargando cobros...
      </div>
    )

  }


  return(

    <div className="space-y-12">

      <div>

        <p className="ui-section-title">
          Finanzas
        </p>

        <h2 className="ui-page-title">
          Cobros
        </h2>

      </div>

      <div className="ui-card">

        <table className="w-full text-sm">

          <thead>

            <tr className="text-left text-neutral-500">

              <th>Cliente</th>
              <th>Tracking</th>
              <th>Monto</th>
              <th>Acción</th>

            </tr>

          </thead>

          <tbody>

            {data.map(row=>(

              <tr
                key={row.id}
                className="border-t border-neutral-200 dark:border-neutral-800"
              >

                <td className="py-3">
                  {row.cliente}
                </td>

                <td>
                  {row.codigo}
                </td>

                <td className={`
                  ${row.monto_total > 500 ? "text-red-500 font-semibold" : ""}
                `}>
                  {row.monto_total} Bs
                </td>

                <td>

                  <button
                    onClick={()=>avisar(row.cliente_id)}
                    disabled={sending === row.cliente_id}
                    className="ui-button"
                  >
                    {sending === row.cliente_id ? "Enviando..." : "Avisar"}
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}