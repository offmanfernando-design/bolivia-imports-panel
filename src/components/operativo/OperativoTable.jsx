import { useState, useEffect } from "react"
import Badge from "../ui/Badge"
import Table from "../ui/Table"
import useSearch from "../../hooks/useSearch"

export default function OperativoTable({onOpenPackage}){

  const [data,setData] = useState([])
  const [search,setSearch] = useState("")
  const [loading,setLoading] = useState(true)

  const {results,loading:searchLoading} = useSearch(search)

  useEffect(()=>{

    async function load(){

      try{

        const res = await fetch("https://bolivia-imports-backend-pg.fly.dev/api/entregas")
        const json = await res.json()

        setData(json.data)

      }catch(err){

        console.error(err)

      }finally{

        setLoading(false)

      }

    }

    load()

  },[])

  const dataset = search.length >= 2 ? results : data

  const columns = [
    "Código",
    "Cliente",
    "Estado",
    "Pago"
  ]

  const rows = dataset.map(pkg=>[
    pkg.codigo,
    pkg.cliente || pkg.cliente_nombre,

    <Badge type={pkg.estado_operativo}>
      {pkg.estado_operativo}
    </Badge>,

    <Badge type={pkg.estado_pago}>
      {pkg.estado_pago}
    </Badge>
  ])

  const openRow = (index)=>{
    const pkg = dataset[index]
    onOpenPackage(pkg)
  }

  if(loading){

    return(
      <div className="p-6 bg-white rounded-xl border">
        Cargando paquetes...
      </div>
    )

  }

  return (

  <div
    className="
    bg-white dark:bg-neutral-950
    border border-neutral-200 dark:border-neutral-800
    rounded-xl
    p-6
    flex flex-col gap-6
    shadow-sm dark:shadow-black/20
    "
  >

    <div className="flex items-center justify-between">

      <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
        Operación de paquetes
      </h3>

    </div>

    <input
      type="text"
      placeholder="Buscar cliente, tracking, teléfono..."
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      className="
        w-full
        px-4 py-2.5
        rounded-lg
        border border-neutral-200 dark:border-neutral-800
        bg-white dark:bg-neutral-900
        text-sm
        text-neutral-900 dark:text-neutral-100
        placeholder-neutral-400
        focus:outline-none
        focus:ring-2 focus:ring-neutral-300/40
        transition
      "
    />

    {searchLoading && (
      <p className="text-xs text-neutral-400">
        Buscando...
      </p>
    )}

    <Table
      columns={columns}
      data={rows}
      onRowClick={openRow}
    />

  </div>

)

}