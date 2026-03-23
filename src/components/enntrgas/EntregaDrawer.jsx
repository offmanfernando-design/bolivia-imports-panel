import { useEffect, useState } from "react"

export default function EntregaDrawer({ entregaId }){

  const [data,setData] = useState(null)
  const [loading,setLoading] = useState(false)

  useEffect(()=>{

    if(!entregaId) return

    async function load(){

      try{

        setLoading(true)

        const res = await fetch(
          `https://bolivia-imports-backend-pg.fly.dev/api/entregas/${entregaId}`
        )

        const json = await res.json()

        setData(json)

      }catch(err){
        console.error(err)
      }finally{
        setLoading(false)
      }

    }

    load()

  },[entregaId])


  if(!entregaId) return null

  if(loading){
    return <p className="text-sm text-neutral-400">Cargando...</p>
  }

  if(!data){
    return <p className="text-sm text-neutral-400">Sin datos</p>
  }

  const totalItems = data.items?.length || 0

  const resumenItems = totalItems === 0
    ? "Sin items"
    : totalItems === 1
      ? data.items[0]?.descripcion
      : `${totalItems} items - ${data.items[0]?.descripcion || ""}`

  return(

    <div className="space-y-6">

      <div className="flex justify-between items-start">

        <div>
          <p className="text-xs text-neutral-400">Tracking</p>
          <h3 className="text-lg font-semibold">{data.codigo}</h3>
        </div>

        <div className="flex gap-2">

          <span className={`
            text-xs px-2 py-1 rounded
            ${data.estado_pago === "pagado"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"}
          `}>
            {data.estado_pago || "pendiente"}
          </span>

          <span className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-700">
            {data.estado_operativo}
          </span>

        </div>

      </div>

      <div className="grid gap-4">

        <div>
          <p className="text-xs text-neutral-400">Cliente</p>
          <p className="font-medium">{data.cliente?.nombre}</p>
          <p className="text-xs text-neutral-500">{data.cliente?.telefono || ""}</p>
        </div>

        <div>
          <p className="text-xs text-neutral-400">Receptor</p>
          <p className="font-medium">{data.receptor?.nombre || "—"}</p>
          <p className="text-xs text-neutral-500">{data.receptor?.telefono || ""}</p>
        </div>

        <div>
          <p className="text-xs text-neutral-400">Destino</p>
          <p className="font-medium">{data.destino}</p>
        </div>

      </div>

      <div className="border-t pt-4 space-y-2">

        <p className="text-xs text-neutral-400">Items</p>
        <p className="text-sm font-medium">{resumenItems}</p>

      </div>

      <div className="border-t pt-4">

        <p className="text-xs text-neutral-400">Total</p>
        <p className="text-xl font-semibold">
          {data.monto_total ? `${data.monto_total} ${data.moneda || ""}` : "—"}
        </p>

      </div>

    </div>

  )

}