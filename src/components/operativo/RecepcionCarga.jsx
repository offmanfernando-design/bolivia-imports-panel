import { useState, useRef, useEffect, useCallback } from "react";

const API_URL = "https://bolivia-imports-backend-pg.fly.dev/api";

export default function RecepcionCarga() {

  const [tracking,setTracking] = useState("")
  const [items,setItems] = useState([])
  const [peso,setPeso] = useState("")
  const [tarifa,setTarifa] = useState("")
  const [tipoCambio,setTipoCambio] = useState("")
  const [precioBs,setPrecioBs] = useState("")
  const [ubicacion,setUbicacion] = useState("")
  const [tipoCalculo,setTipoCalculo] = useState("peso")
  const [loading,setLoading] = useState(false)
  const [success,setSuccess] = useState(false)
  const [error,setError] = useState("")

  const trackingRef = useRef(null)
  const lastEdited = useRef(null)

  useEffect(()=>{
    trackingRef.current?.focus()
  },[])

  const buscarTracking = useCallback(async () => {

    if(tracking.length < 2) return

    try{
      setLoading(true)

      const res = await fetch(
        `${API_URL}/operativo/carga/buscar?tracking=${tracking}`
      )

      const json = await res.json()

      setItems(json || [])

    }catch(err){
      console.error(err)
      setError("Error al buscar")
    }finally{
      setLoading(false)
    }

  }, [tracking])

  useEffect(() => {

    if (tracking.length < 2) {
      setItems([])
      return
    }

    const delay = setTimeout(() => {
      buscarTracking()
    }, 400)

    return () => clearTimeout(delay)

  }, [tracking, buscarTracking])

  useEffect(() => {

    if(tipoCalculo !== "unidad") return
    if(!tipoCambio) return

    const tc = Number(tipoCambio)

    if(lastEdited.current === "usd" && tarifa){
      setPrecioBs((Number(tarifa) * tc).toFixed(2))
    }

    if(lastEdited.current === "bs" && precioBs){
      setTarifa((Number(precioBs) / tc).toFixed(2))
    }

  }, [tarifa, precioBs, tipoCambio, tipoCalculo])

  const total = tipoCalculo === "peso"
    ? peso && tarifa && tipoCambio
      ? (Number(peso) * Number(tarifa) * Number(tipoCambio)).toFixed(2)
      : 0
    : precioBs || 0

  async function registrar(itemId){

    setError("")
    setSuccess(false)

    if(!ubicacion){
      setError("Ubicación obligatoria")
      return
    }

    try{

      const res = await fetch(`${API_URL}/operativo/carga/recepcion`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          orden_id:itemId,
          peso: tipoCalculo === "peso" ? Number(peso) : null,
          precio_por_kg: tipoCalculo === "peso" ? Number(tarifa) : null,
          ubicacion_id:1
        })
      })

      if(!res.ok){
        throw new Error("Error al registrar")
      }

      // 🔥 EVENTO CLAVE (lo que faltaba)
      window.dispatchEvent(new Event("entregas-updated"))

      setSuccess(true)

      setTracking("")
      setItems([])
      setPeso("")
      setTarifa("")
      setTipoCambio("")
      setPrecioBs("")
      setUbicacion("")
      setTipoCalculo("peso")

      trackingRef.current?.focus()

    }catch(err){
      console.error(err)
      setError("Error al registrar carga")
    }

  }

  return(

    <div className="ui-card flex flex-col gap-6">

      <h3 className="text-sm uppercase tracking-widest text-neutral-500">
        Carga (Bolivia)
      </h3>

      {success && (
        <div className="bg-green-100 text-green-700 text-sm p-2 rounded">
          ✅ Carga registrada
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-2 rounded">
          ❌ {error}
        </div>
      )}

      <input
        ref={trackingRef}
        placeholder="Últimos 4 dígitos del tracking"
        value={tracking}
        onChange={(e)=>setTracking(e.target.value)}
        className="ui-input"
      />

      {loading && (
        <p className="text-sm text-neutral-400">
          Buscando...
        </p>
      )}

      {items.length > 0 && items.map(item => (

        <div key={item.id} className="ui-card flex flex-col gap-3">

          <strong>{item.tracking_number}</strong>

          <div className="flex gap-4 text-sm">
            <label>
              <input
                type="radio"
                checked={tipoCalculo==="peso"}
                onChange={()=>setTipoCalculo("peso")}
              /> Peso
            </label>

            <label>
              <input
                type="radio"
                checked={tipoCalculo==="unidad"}
                onChange={()=>setTipoCalculo("unidad")}
              /> Unidad
            </label>
          </div>

          {tipoCalculo === "peso" && (
            <>
              <input placeholder="Peso" value={peso} onChange={(e)=>setPeso(e.target.value)} className="ui-input ui-input-sm"/>
              <input placeholder="Precio por kg" value={tarifa} onChange={(e)=>setTarifa(e.target.value)} className="ui-input ui-input-sm"/>
              <input placeholder="Tipo cambio" value={tipoCambio} onChange={(e)=>setTipoCambio(e.target.value)} className="ui-input ui-input-sm"/>
            </>
          )}

          {tipoCalculo === "unidad" && (
            <>
              <input
                placeholder="Precio USD"
                value={tarifa}
                onChange={(e)=>{
                  lastEdited.current = "usd"
                  setTarifa(e.target.value)
                }}
                className="ui-input ui-input-sm"
              />

              <input
                placeholder="Precio Bs"
                value={precioBs}
                onChange={(e)=>{
                  lastEdited.current = "bs"
                  setPrecioBs(e.target.value)
                }}
                className="ui-input ui-input-sm"
              />

              <input
                placeholder="Tipo cambio"
                value={tipoCambio}
                onChange={(e)=>setTipoCambio(e.target.value)}
                className="ui-input ui-input-sm"
              />
            </>
          )}

          <div className="font-semibold">
            Total: Bs {total}
          </div>

          <input
            placeholder="Ubicación"
            value={ubicacion}
            onChange={(e)=>setUbicacion(e.target.value)}
            className="ui-input ui-input-sm"
          />

          <button
            onClick={()=>registrar(item.id)}
            className="ui-button-success"
          >
            Registrar carga
          </button>

        </div>

      ))}

    </div>
  )
}