import { useState } from "react"
import OperativoTable from "../components/operativo/OperativoTable"
import RecepcionCarga from "../components/operativo/RecepcionCarga"
import Drawer from "../components/ui/Drawer"
// import EntregaDrawer from "../components/entregas/EntregaDrawer"

export default function Operativo(){

  const [selectedEntregaId,setSelectedEntregaId] = useState(null)
  const [drawerOpen,setDrawerOpen] = useState(false)

  const openPackage = (entregaId)=>{
    setSelectedEntregaId(entregaId)
    setDrawerOpen(true)
  }

  return(

    <div className="space-y-12">

      <div>

        <p className="ui-section-title">
          Operaciones
        </p>

        <h2 className="ui-page-title">
          Operativo
        </h2>

      </div>

      <OperativoTable onOpenPackage={openPackage}/>

      <RecepcionCarga/>

      <Drawer open={drawerOpen} onClose={()=>setDrawerOpen(false)}>
        {/* <EntregaDrawer entregaId={selectedEntregaId}/> */}
      </Drawer>

    </div>

  )

}