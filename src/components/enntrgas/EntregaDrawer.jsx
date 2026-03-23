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

  return(

    <div className="space-y-6">

      <div>
        <p className="text-xs text-neutral-400">Tracking</p>
        <h3 className="text-lg font-semibold">{data.codigo}</h3>
      </div>

      <div>
        <p className="text-xs text-neutral-400">Cliente</p>
        <p>{data.cliente?.nombre}</p>
      </div>

      <div>
        <p className="text-xs text-neutral-400">Receptor</p>
        <p>{data.receptor?.nombre || "—"}</p>
      </div>

      <div>
        <p className="text-xs text-neutral-400">Destino</p>
        <p>{data.destino}</p>
      </div>

      <div>
        <p className="text-xs text-neutral-400">Estado</p>
        <p>{data.estado_operativo}</p>
      </div>

      <div>
        <p className="text-xs text-neutral-400">Pago</p>
        <p>{data.estado_pago || "pendiente"}</p>
      </div>

      {data.eventos?.length > 0 && (
        <div>
          <p className="text-xs text-neutral-400 mb-2">Eventos</p>

          <div className="space-y-2 text-sm">
            {data.eventos.map(ev=>(
              <div key={ev.id} className="border-b pb-1">
                <p className="font-medium">{ev.tipo}</p>
                <p className="text-neutral-500">{ev.detalle}</p>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>

  )

}