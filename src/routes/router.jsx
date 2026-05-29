import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/Login";
import { isLoggedIn } from "../utils/auth";

import Dashboard from "../pages/Dashboard";
import Compras from "../pages/Compras";
import Operativo from "../pages/Operativo";
import ArribosBolivia from "../pages/ArribosBolivia";
import Ubicaciones from "../pages/Ubicaciones";
import Cobros from "../pages/Cobros";
import Entregas from "../pages/Entregas";
import Configuracion from "../pages/Configuracion";
import SolicitudesTerminal from "../pages/SolicitudesTerminal";
import Reportes from "../pages/Reportes";

function Etiquetas() {
  return <div>Etiquetas</div>;
}

function RequireAuth() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/arribos-bolivia" element={<ArribosBolivia />} />
            <Route path="/operativo" element={<Operativo />} />
            <Route path="/ubicaciones" element={<Ubicaciones />} />
            <Route path="/etiquetas" element={<Etiquetas />} />
            <Route path="/entregas" element={<Entregas />} />
            <Route path="/cobros" element={<Cobros />} />
            <Route path="/solicitudes-terminal" element={<SolicitudesTerminal />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
