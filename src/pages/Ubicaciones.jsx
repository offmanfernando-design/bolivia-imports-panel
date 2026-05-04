import { useEffect, useState } from "react"
import { API_URL } from "../config/api"
import Drawer from "../components/ui/Drawer"
import UbicacionDrawer from "../components/ubicaciones/UbicacionDrawer"

function agruparPorEstante(items) {

  const estantes = {}

  items.forEach((u) => {

    const match = u.codigo.match(/^([A-Z]\d+)-(F\d+)$/)

    if(!match) return

    const estante = match[1]
    const fila    = match[2]

    if(!estantes[estante]) estantes[estante] = []

    estantes[estante].push({
      fila,
      paquetes: u.paquetes,
      codigo:   u.codigo,
    })

  })

  return estantes

}

function ColumnaEstante({ estante, filas, onSelect }) {

  const filasOrdenadas = [...filas].sort((a, b) =>
    Number(a.fila.slice(1)) - Number(b.fila.slice(1))
  )

  return (

    <div className="ui-card flex flex-col gap-3">

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

      {filasOrdenadas.map((f) => (

        <div
          key={f.fila}
          onClick={() => onSelect(f.codigo)}
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

      ))}

    </div>

  )

}

export default function Ubicaciones(){

  const [data,setData]       = useState([])
  const [loading,setLoading] = useState(true)
  const [selected,setSelected]   = useState(null)
  const [drawerOpen,setDrawerOpen] = useState(false)

  useEffect(()=>{

    async function load(){

      try{

        const res  = await fetch(`${API_URL}/operativo/ubicaciones`)
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

  const local        = data.filter((u) => u.zona === 'local')
  const terminal     = data.filter((u) => u.zona === 'terminal')
  const desconocidos = data.filter((u) => u.zona === 'desconocidos')

  const estantesLocal    = agruparPorEstante(local)
  const estantesTerminal = agruparPorEstante(terminal)

  function abrirDrawer(codigo){
    setSelected(codigo)
    setDrawerOpen(true)
  }

  if(loading){

    return(

      <div className="space-y-12">

        <div className="h-8 w-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"/>

        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_,i)=>(
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

      {/* Local — Santa Cruz */}
      <div className="space-y-4">

        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Local — Santa Cruz
        </p>

        <div className="grid grid-cols-4 gap-6">

          {Object.entries(estantesLocal)
            .sort(([a],[b]) => Number(a.slice(1)) - Number(b.slice(1)))
            .map(([estante,filas]) => (

              <ColumnaEstante
                key={estante}
                estante={estante}
                filas={filas}
                onSelect={abrirDrawer}
              />

            ))
          }

        </div>

      </div>

      {/* Terminal — Envíos a departamentos */}
      <div className="space-y-4">

        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Terminal — Envíos a departamentos
        </p>

        <div className="grid grid-cols-2 gap-6">

          {Object.entries(estantesTerminal)
            .sort(([a],[b]) => Number(a.slice(1)) - Number(b.slice(1)))
            .map(([estante,filas]) => (

              <ColumnaEstante
                key={estante}
                estante={estante}
                filas={filas}
                onSelect={abrirDrawer}
              />

            ))
          }

        </div>

      </div>

      {/* Desconocidos */}
      <div className="space-y-4">

        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Desconocidos
        </p>

        <div className="flex gap-4 flex-wrap">

          {desconocidos
            .sort((a,b) => a.codigo.localeCompare(b.codigo))
            .map((u) => (

              <div
                key={u.codigo}
                onClick={() => abrirDrawer(u.codigo)}
                className="
                  ui-card
                  flex flex-col items-center gap-2
                  min-w-[72px]
                  cursor-pointer
                  hover:bg-neutral-100
                  dark:hover:bg-neutral-800
                  transition
                "
              >

                <span className="text-sm font-semibold">{u.codigo}</span>

                <span className="text-xs text-neutral-400">{u.paquetes}</span>

              </div>

            ))
          }

        </div>

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
