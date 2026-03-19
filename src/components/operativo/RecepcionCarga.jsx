import { useState, useRef, useEffect, useCallback } from "react";

const API_URL = "https://bolivia-imports-backend-pg.fly.dev/api";

export default function RecepcionCarga() {

  const [tracking,setTracking] = useState("")
  const [items,setItems] = useState([])
  const [peso,setPeso] = useState("")
  const [tarifa,setTarifa] = useState("")
  const [tipoCambio,setTipoCambio] = useState("")
  const [ubicacion,setUbicacion] = useState("")
  const [loading,setLoading] = useState(false)
  const [success,setSuccess] = useState(false)
  const [error,setError] = useState("")

  const trackingRef = useRef(null)

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

  const total = peso && tarifa && tipoCambio
    ? (Number(peso) * Number(tarifa) * Number(tipoCambio)).toFixed(2)
    : 0

  async function registrar(itemId){

    setError("")
    setSuccess(false)

    if(!peso || !tarifa || !tipoCambio || !ubicacion){
      setError("Completa todos los campos")
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
          peso:Number(peso),
          precio_por_kg:Number(tarifa),
          ubicacion_id:null
        })
      })

      if(!res.ok){
        throw new Error("Error al registrar")
      }

      // ✅ éxito
      setSuccess(true)

      // 🔥 limpiar TODO y volver a inicio
      setTracking("")
      setItems([])
      setPeso("")
      setTarifa("")
      setTipoCambio("")
      setUbicacion("")

      // volver foco
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

      {/* 🔔 feedback */}
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

      <div className="flex gap-3">

        <input
          ref={trackingRef}
          placeholder="Últimos 4 dígitos del tracking"
          value={tracking}
          onChange={(e)=>setTracking(e.target.value)}
          className="ui-input"
        />

      </div>

      {loading && (
        <p className="text-sm text-neutral-400">
          Buscando...
        </p>
      )}

      {items.length > 0 && (

        <div className="flex flex-col gap-4">

          {items.map(item => (

            <div
              key={item.id}
              className="ui-card ui-card-hover flex flex-col gap-3"
            >

              <div className="text-sm">

                <strong>{item.tracking_number}</strong>

                <p className="text-neutral-400 text-xs">
                  Fecha warehouse: {item.warehouse_fecha}
                </p>

              </div>

              <input
                placeholder="Peso (kg)"
                value={peso}
                onChange={(e)=>setPeso(e.target.value)}
                className="ui-input ui-input-sm"
              />

              <input
                placeholder="Precio por kg ($)"
                value={tarifa}
                onChange={(e)=>setTarifa(e.target.value)}
                className="ui-input ui-input-sm"
              />

              <input
                placeholder="Tipo de cambio (Bs)"
                value={tipoCambio}
                onChange={(e)=>setTipoCambio(e.target.value)}
                className="ui-input ui-input-sm"
              />

              <div className="text-sm font-semibold">
                Total: Bs {total}
              </div>

              <input
                placeholder="Ubicación (OBLIGATORIO)"
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

      )}

    </div>

  )

}