import { useEffect, useState } from "react"
import Drawer from "../components/ui/Drawer"
import UbicacionDrawer from "../components/ubicaciones/UbicacionDrawer"

export default function Ubicaciones(){

  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)

  const [selected,setSelected] = useState(null)
  const [drawerOpen,setDrawerOpen] = useState(false)

  useEffect(()=>{

    async function load(){

      try{

        const res = await fetch("https://bolivia-imports-backend-pg.fly.dev/api/operativo/ubicaciones")
        const json = await res.json()

        setData(json.data || [])

      }catch(err){

        console.error(err)

      }finally{

        setLoading(false)

      }

    }

    load()

  },[])

  const estantes = {}

  data.forEach((u)=>{

    const match = u.codigo.match(/E(\d+)F(\d+)/)

    if(!match) return

    const estante = `E${match[1]}`
    const fila = `F${match[2]}`

    if(!estantes[estante]) estantes[estante] = []

    estantes[estante].push({
      fila,
      paquetes:u.paquetes
    })

  })

  if(loading){

    return(

      <div className="space-y-12">

        <div className="h-8 w-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"/>

        <div className="grid grid-cols-7 gap-6">
          {[...Array(7)].map((_,i)=>(
            <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse"/>
          ))}
        </div>

      </div>

    )

  }

  return(

    <div className="space-y-12">

      <div>

        <p className="ui-section-title">
          Almacén
        </p>

        <h2 className="ui-page-title">
          Ubicaciones
        </h2>

      </div>

      <div className="grid grid-cols-7 gap-6">

        {Object.entries(estantes).map(([estante,filas])=>{

          const filasOrdenadas = filas.sort((a,b)=>{
            return Number(a.fila.slice(1)) - Number(b.fila.slice(1))
          })

          return(

            <div
              key={estante}
              className="ui-card flex flex-col gap-3"
            >

              <h3 className="
                text-sm
                font-semibold
                text-center
                border-b
                border-neutral-200
                dark:border-neutral-800
                pb-2
              ">
                {estante}
              </h3>

              {filasOrdenadas.map((f)=>{

                const codigo = `${estante}${f.fila}`

                return(

                  <div
                    key={f.fila}

                    onClick={()=>{
                      setSelected(codigo)
                      setDrawerOpen(true)
                    }}

                    className="
                    flex
                    items-center
                    justify-between
                    px-3
                    py-2
                    rounded-lg
                    bg-neutral-50
                    dark:bg-neutral-900
                    border border-neutral-200 dark:border-neutral-800
                    text-sm
                    cursor-pointer
                    hover:bg-neutral-100
                    dark:hover:bg-neutral-800
                    transition
                    "
                  >

                    <span>{f.fila}</span>

                    <span className="text-neutral-400">
                      {f.paquetes}
                    </span>

                  </div>

                )

              })}

            </div>

          )

        })}

      </div>

      <Drawer
        open={drawerOpen}
        onClose={()=>setDrawerOpen(false)}
      >

        <UbicacionDrawer codigo={selected}/>

      </Drawer>

    </div>

  )

}