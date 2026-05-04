import { useEffect,useState } from "react"
import { API_URL } from "../../config/api"

export default function UbicacionDrawer({codigo}){

  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    if(!codigo) return

    async function load(){

      try{

        const res = await fetch(`${API_URL}/operativo/ubicaciones/${codigo}`)
        const json = await res.json()

        setData(json.data || [])

      }catch(err){

        console.error(err)

      }finally{

        setLoading(false)

      }

    }

    load()

  },[codigo])

  const clientes={}

  data.forEach(p=>{

    if(!clientes[p.cliente]) clientes[p.cliente]=[]

    clientes[p.cliente].push(p)

  })

  if(loading){

    return(
      <div className="text-sm text-neutral-400">
        Cargando paquetes...
      </div>
    )

  }

  return(

    <div className="flex flex-col gap-8">

      <div>

        <p className="ui-section-title">
          Ubicación
        </p>

        <h2 className="ui-page-title">
          {codigo}
        </h2>

      </div>

      {Object.entries(clientes).map(([cliente,items])=>{

        return(

          <div
            key={cliente}
            className="ui-card flex flex-col gap-3"
          >

            <h3 className="text-sm font-semibold">
              {cliente}
            </h3>

            <div className="flex flex-col gap-2">

              {items.map((item,i)=>(

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

        )

      })}

    </div>

  )

}