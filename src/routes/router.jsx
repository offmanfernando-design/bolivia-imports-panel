import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import Compras from "../pages/Compras";
import Operativo from "../pages/Operativo";
import Ubicaciones from "../pages/Ubicaciones";
import Cobros from "../pages/Cobros";
import Entregas from "../pages/Entregas";

function Etiquetas() {
  return <div>Etiquetas</div>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/operativo" element={<Operativo />} />
          <Route path="/ubicaciones" element={<Ubicaciones />} />
          <Route path="/etiquetas" element={<Etiquetas />} />
          <Route path="/entregas" element={<Entregas />} />
          <Route path="/cobros" element={<Cobros />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
