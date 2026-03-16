import { useState } from "react"
import OperativoTable from "../components/operativo/OperativoTable"
import RecepcionCarga from "../components/operativo/RecepcionCarga"
import Drawer from "../components/ui/Drawer"
import PackageDrawer from "../components/packages/PackageDrawer"

export default function Operativo(){

  const [selectedPackage,setSelectedPackage] = useState(null)
  const [drawerOpen,setDrawerOpen] = useState(false)

  const openPackage = (pkg)=>{
    setSelectedPackage(pkg)
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
        <PackageDrawer pkg={selectedPackage}/>
      </Drawer>

    </div>

  )

}