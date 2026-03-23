import { useEffect, useState } from "react"

export default function Entregas(){

  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)

  const [tab,setTab] = useState("local")

  const [search,setSearch] = useState("")

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

  useEffect(()=>{

    function handler(){
      load()
    }

    window.addEventListener("entregas-updated", handler)

    return ()=>{
      window.removeEventListener("entregas-updated", handler)
    }

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

      window.dispatchEvent(new Event("operativo-updated"))

      await load()

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

    return(
      <div className="space-y-6">

        <div className="h-10 w-60 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"/>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {[...Array(6)].map((_,i)=>(
            <div
              key={i}
              className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse"
            />
          ))}

        </div>

      </div>
    )

  }


  return(

    <div className="space-y-8">

      <div>

        <p className="ui-section-title">
          Logística
        </p>

        <h2 className="ui-page-title">
          Entregas
        </h2>

      </div>


      <div className="max-w-md">

        <input
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="Buscar tracking o cliente..."
          className="ui-input"
        />

      </div>


      <div className="flex gap-4">

        <button
          onClick={()=>setTab("local")}
          className={`
          px-4 py-2 rounded-lg text-sm
          ${tab==="local"
            ? "bg-neutral-900 text-white"
            : "bg-neutral-200 dark:bg-neutral-800"
          }
          `}
        >
          Santa Cruz ({locales.length})
        </button>

        <button
          onClick={()=>setTab("terminal")}
          className={`
          px-4 py-2 rounded-lg text-sm
          ${tab==="terminal"
            ? "bg-neutral-900 text-white"
            : "bg-neutral-200 dark:bg-neutral-800"
          }
          `}
        >
          Departamental ({terminal.length})
        </button>

      </div>


      <div className="
      grid
      sm:grid-cols-2
      xl:grid-cols-3
      gap-6
      ">

        {list.map((e)=>{

          return(

            <div
              key={e.id}
              className="
              ui-card
              ui-scale
              flex flex-col gap-4
              "
            >

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-xs text-neutral-400">
                    Tracking
                  </p>

                  <p className="font-semibold">
                    {e.codigo}
                  </p>

                </div>

                <span className="
                text-xs
                px-2 py-1
                rounded
                bg-neutral-200
                dark:bg-neutral-800
                ">
                  {e.estado_pago}
                </span>

              </div>


              <div className="text-sm">

                <p className="text-neutral-500">
                  Cliente
                </p>

                <p className="font-medium">
                  {e.cliente_nombre}
                </p>

              </div>


              {tab==="terminal" && (

                <div className="text-sm space-y-2">

                  <div>
                    <span className="text-neutral-500">
                      Destino
                    </span>
                    <p>{e.destino_terminal || e.destino}</p>
                  </div>

                  <div>
                    <span className="text-neutral-500">
                      Receptor
                    </span>
                    <p>{e.nombre_receptor || e.receptor_nombre}</p>
                  </div>

                  {e.telefono_receptor && (
                    <div>
                      <span className="text-neutral-500">
                        Teléfono
                      </span>
                      <p>{e.telefono_receptor}</p>
                    </div>
                  )}

                  {e.transportadora && (
                    <div>
                      <span className="text-neutral-500">
                        Transportadora
                      </span>
                      <p>{e.transportadora}</p>
                    </div>
                  )}

                </div>

              )}


              <button
                onClick={()=>confirmar(e.id)}
                className={`
                mt-2
                ${tab==="local"
                  ? "ui-button-success"
                  : "ui-button"
                }
                `}
              >

                {tab==="local"
                  ? "Confirmar entrega"
                  : "Confirmar envío"
                }

              </button>

            </div>

          )

        })}

      </div>


      {list.length===0 && (

        <div className="
        text-center
        text-sm
        text-neutral-400
        py-20
        ">

          No hay entregas pendientes

        </div>

      )}

    </div>

  )

}