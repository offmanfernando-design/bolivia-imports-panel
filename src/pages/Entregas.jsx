import { useEffect, useState } from "react"
import Drawer from "../components/ui/Drawer"
import EntregaDrawer from "../components/entregas/EntregaDrawer"

export default function Entregas(){

  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)

  const [tab,setTab] = useState("local")
  const [search,setSearch] = useState("")

  const [selected,setSelected] = useState(null)
  const [open,setOpen] = useState(false)

  async function load(){

    try{

      const res = await fetch(
        "https://bolivia-imports-backend-pg.fly.dev/api/entregas?estado_operativo=lista_para_entrega"
      )

      const json = await res.json()

      setData(json.data || [])

    }catch(err){
      console.error(err)
    }finally{
      setLoading(false)
    }

  }

  useEffect(()=>{
    load()
  },[])


  async function confirmar(id){

    try{

      await fetch(`https://bolivia-imports-backend-pg.fly.dev/api/entregas/${id}/estado`,{
        method:"PATCH",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          estado:"entregada"
        })
      })

      setData(prev => prev.filter(p=>p.id !== id))

    }catch(err){
      console.error(err)
    }

  }


  const filtered = data.filter(e=>{

    if(!search) return true

    const s = search.toLowerCase()

    return (
      e.codigo?.toLowerCase().includes(s) ||
      e.cliente_nombre?.toLowerCase().includes(s)
    )

  })


  const locales = filtered.filter(
    e=>e.destino?.toLowerCase().includes("santa")
  )

  const terminal = filtered.filter(
    e=>!e.destino?.toLowerCase().includes("santa")
  )


  const list = tab === "local" ? locales : terminal


  if(loading){
    return <p>Cargando...</p>
  }


  return(

    <div className="space-y-8">

      <h2 className="ui-page-title">Entregas</h2>

      <input
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        placeholder="Buscar..."
        className="ui-input"
      />

      <div className="flex gap-4">

        <button onClick={()=>setTab("local")}>
          Santa Cruz ({locales.length})
        </button>

        <button onClick={()=>setTab("terminal")}>
          Departamental ({terminal.length})
        </button>

      </div>

      <div className="grid gap-4">

        {list.map((e)=>(
          <div
            key={e.id}
            onClick={()=>{
              setSelected(e.id)
              setOpen(true)
            }}
            className="
            ui-card
            cursor-pointer
            p-4
            flex flex-col gap-3
            transition
            hover:scale-[1.01]
            active:scale-[0.99]
            "
          >

            <div className="flex justify-between items-center">

              <div>
                <p className="text-xs text-neutral-400">
                  Tracking
                </p>
                <p className="font-semibold text-sm">
                  {e.codigo}
                </p>
              </div>

              <span className={`
                text-xs
                px-2 py-1
                rounded
                ${e.estado_pago === "pagado"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"}
              `}>
                {e.estado_pago || "pendiente"}
              </span>

            </div>

            <div>
              <p className="text-xs text-neutral-400">
                Cliente
              </p>
              <p className="text-sm font-medium">
                {e.cliente_nombre}
              </p>
            </div>

            {e.estado_operativo === "retenida" && (
              <div className="text-xs text-red-500 font-medium">
                ⚠️ Urgente
              </div>
            )}

            <div className="flex justify-end">

              <button
                onClick={(ev)=>{
                  ev.stopPropagation()
                  confirmar(e.id)
                }}
                className="
                ui-button-success
                text-sm
                px-3 py-1
                flex items-center gap-2
                "
              >
                ✔ Confirmar
              </button>

            </div>

          </div>
        ))}

      </div>

      <Drawer open={open} onClose={()=>setOpen(false)}>
        <EntregaDrawer entregaId={selected}/>
      </Drawer>

    </div>

  )

}