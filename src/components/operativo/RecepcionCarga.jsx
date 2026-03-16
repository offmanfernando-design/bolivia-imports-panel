import { useState, useRef, useEffect } from "react";

export default function RecepcionCarga() {

  const [tracking,setTracking] = useState("")
  const [items,setItems] = useState([])
  const [peso,setPeso] = useState("")
  const [tarifa,setTarifa] = useState("")
  const [tipoCambio,setTipoCambio] = useState("")
  const [ubicacion,setUbicacion] = useState("")
  const [loading,setLoading] = useState(false)

  const trackingRef = useRef(null)

  useEffect(()=>{
    trackingRef.current?.focus()
  },[])

  async function buscarTracking(){

    if(tracking.length < 4) return

    try{

      setLoading(true)

      const res = await fetch(`https://bolivia-imports-backend-pg.fly.dev/operativo/buscar-tracking/${tracking}`)
      const json = await res.json()

      setItems(json.data || [])

    }catch(err){

      console.error(err)

    }finally{

      setLoading(false)

    }

  }

  async function registrar(itemId){

    try{

      await fetch("https://bolivia-imports-backend-pg.fly.dev/operativo/recepcion",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          item_id:itemId,
          peso,
          tarifa_kg:tarifa,
          tipo_cambio:tipoCambio,
          ubicacion
        })
      })

      alert("Paquete registrado")

    }catch(err){

      console.error(err)

    }

  }

  return(

    <div className="ui-card flex flex-col gap-6">

      <h3 className="text-sm uppercase tracking-widest text-neutral-500">
        Recepción de carga
      </h3>

      <div className="flex gap-3">

        <input
          ref={trackingRef}
          placeholder="Últimos 4 dígitos del tracking"
          value={tracking}
          onChange={(e)=>setTracking(e.target.value)}
          onKeyDown={(e)=>{
            if(e.key === "Enter") buscarTracking()
          }}
          className="ui-input"
        />

        <button
          onClick={buscarTracking}
          className="ui-button"
        >
          Buscar
        </button>

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

                <strong>{item.cliente_nombre}</strong>

                <p className="text-neutral-400 text-xs">
                  Tracking: {item.tracking_number}
                </p>

              </div>

              <input
                placeholder="Peso"
                value={peso}
                onChange={(e)=>setPeso(e.target.value)}
                className="ui-input ui-input-sm"
              />

              <input
                placeholder="Tarifa por kg"
                value={tarifa}
                onChange={(e)=>setTarifa(e.target.value)}
                className="ui-input ui-input-sm"
              />

              <input
                placeholder="Tipo de cambio"
                value={tipoCambio}
                onChange={(e)=>setTipoCambio(e.target.value)}
                className="ui-input ui-input-sm"
              />

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
                Registrar paquete
              </button>

            </div>

          ))}

        </div>

      )}

    </div>

  )

}