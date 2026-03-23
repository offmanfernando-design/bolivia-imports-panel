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

  useEffect(()=>{ load() },[])

  useEffect(()=>{

    function handler(){ load() }

    window.addEventListener("entregas-updated", handler)

    return ()=>window.removeEventListener("entregas-updated", handler)

  },[])


  async function confirmar(id){

    try{

      await fetch(`https://bolivia-imports-backend-pg.fly.dev/api/entregas/${id}/estado`,{
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ estado:"entregada" })
      })

      window.dispatchEvent(new Event("operativo-updated"))

      await load()

    }catch(err){
      console.error(err)
    }

  }


  function openDetalle(id){
    setSelected(id)
    setOpen(true)
  }


  const filtered = data.filter(e=>{
    if(!search) return true
    const s = search.toLowerCase()
    return (
      e.codigo?.toLowerCase().includes(s) ||
      e.cliente_nombre?.toLowerCase().includes(s)
    )
  })

  const locales = filtered.filter(e=>e.destino?.toLowerCase().includes("santa"))
  const terminal = filtered.filter(e=>!e.destino?.toLowerCase().includes("santa"))

  const list = tab === "local" ? locales : terminal


  if(loading){
    return <div className="p-6 text-sm text-neutral-400">Cargando...</div>
  }


  return(

    <div className="space-y-6">

      <div>
        <p className="ui-section-title">Logística</p>
        <h2 className="ui-page-title">Entregas</h2>
      </div>

      <input
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        placeholder="Buscar tracking o cliente..."
        className="ui-input max-w-md"
      />

      <div className="flex gap-2">

        <button
          onClick={()=>setTab("local")}
          className={`px-3 py-2 rounded text-sm ${
            tab==="local"
              ? "bg-black text-white"
              : "bg-neutral-200 dark:bg-neutral-800"
          }`}
        >
          Santa Cruz ({locales.length})
        </button>

        <button
          onClick={()=>setTab("terminal")}
          className={`px-3 py-2 rounded text-sm ${
            tab==="terminal"
              ? "bg-black text-white"
              : "bg-neutral-200 dark:bg-neutral-800"
          }`}
        >
          Departamental ({terminal.length})
        </button>

      </div>

      <div className="space-y-3">

        {list.map((e)=>(
          <div
            key={e.id}
            onClick={()=>openDetalle(e.id)}
            className="ui-card flex flex-col gap-3 cursor-pointer hover:opacity-80"
          >

            <div className="flex justify-between items-center">

              <div>
                <p className="text-xs text-neutral-400">Tracking</p>
                <p className="font-semibold">{e.codigo}</p>
              </div>

              <span className={`
                text-xs px-2 py-1 rounded
                ${e.estado_pago === "pendiente"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"}
              `}>
                {e.estado_pago || "pendiente"}
              </span>

            </div>

            <div className="text-sm">
              <p className="text-neutral-500">Cliente</p>
              <p className="font-medium">{e.cliente_nombre}</p>
            </div>

            <div className="flex justify-between items-center text-sm">

              <div>
                <p className="text-neutral-400">Destino</p>
                <p>{e.destino}</p>
              </div>

              <button
                onClick={(ev)=>{
                  ev.stopPropagation()
                  confirmar(e.id)
                }}
                className="ui-button-success"
              >
                Confirmar
              </button>

            </div>

          </div>
        ))}

      </div>

      {list.length===0 && (
        <div className="text-center text-sm text-neutral-400 py-10">
          No hay entregas pendientes
        </div>
      )}

      {/* 🔥 FIX IMPORTANTE */}
      {open && (
        <Drawer open={open} onClose={()=>setOpen(false)}>
          <EntregaDrawer entregaId={selected}/>
        </Drawer>
      )}

    </div>

  )

}