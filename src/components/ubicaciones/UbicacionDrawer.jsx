import { useEffect,useState } from "react"

export default function UbicacionDrawer({codigo}){

  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    if(!codigo) return

    async function load(){

      try{

        const res = await fetch(`https://bolivia-imports-backend-pg.fly.dev/operativo/ubicaciones/${codigo}`)
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

    clientes[p.cliente].push(p.tracking)

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

      {Object.entries(clientes).map(([cliente,trackings])=>{

        return(

          <div
            key={cliente}
            className="ui-card flex flex-col gap-3"
          >

            <h3 className="text-sm font-semibold">
              {cliente}
            </h3>

            <div className="flex flex-wrap gap-2">

              {trackings.map(t=>{

                return(

                  <span
                    key={t}
                    className="
                    px-2 py-1
                    text-xs
                    rounded
                    bg-neutral-200
                    dark:bg-neutral-800
                    "
                  >
                    {t}
                  </span>

                )

              })}

            </div>

          </div>

        )

      })}

    </div>

  )

}