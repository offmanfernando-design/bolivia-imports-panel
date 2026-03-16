import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Package,
  MapPin,
  Truck,
  DollarSign,
  LayoutGrid,
  PanelLeft,
  Bell
} from "lucide-react";

import logoLight from "../assets/logo-light.png";

export default function MainLayout() {

  const [collapsed, setCollapsed] = useState(false);

  const [theme, setTheme] = useState(() => {

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) return savedTheme;

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    return systemDark ? "dark" : "light";

  });

  useEffect(() => {

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);

  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const linkStyle = ({ isActive }) => `
    relative
    flex items-center gap-3
    px-3 py-2
    rounded-md
    transition-all duration-200
    text-neutral-400
    hover:text-neutral-200
    hover:bg-neutral-900
    hover:translate-x-[2px]
    ${isActive ? "bg-neutral-800 text-white" : ""}
  `;

  return (

    <div className="flex h-screen transition-colors duration-300 bg-neutral-100 dark:bg-black text-neutral-800 dark:text-neutral-200">

      {/* SIDEBAR */}

      <aside
        className={`${collapsed ? "w-20" : "w-64"} bg-neutral-950 border-r border-neutral-800 p-4 flex flex-col transition-all duration-300`}
      >

        {/* LOGO */}

        <div className="flex justify-center py-6 mb-6">

          {!collapsed && (
            <img
              src={logoLight}
              className="h-16 w-auto opacity-70 hover:opacity-100 transition"
            />
          )}

        </div>


        {/* MENU */}

        <nav className={`flex flex-col gap-6 ${collapsed ? "items-center" : ""}`}>

          {/* DASHBOARD */}

          <NavLink to="/" className={linkStyle} title="Dashboard">
            <LayoutGrid size={20} />
            {!collapsed && "Dashboard"}
          </NavLink>


          {/* OPERACIONES */}

          {!collapsed && (
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-4">
              Operaciones
            </p>
          )}

          <NavLink to="/compras" className={linkStyle} title="Compras">
            <Package size={20} />
            {!collapsed && "Compras"}
          </NavLink>

          <NavLink to="/operativo" className={linkStyle} title="Operativo">
            <Package size={20} />
            {!collapsed && "Operativo"}
          </NavLink>

          <NavLink to="/ubicaciones" className={linkStyle} title="Ubicaciones">
            <MapPin size={20} />
            {!collapsed && "Ubicaciones"}
          </NavLink>


          {/* FINANZAS */}

          {!collapsed && (
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-4">
              Finanzas
            </p>
          )}

          <NavLink to="/cobros" className={linkStyle} title="Cobros">
            <DollarSign size={20} />
            {!collapsed && "Cobros"}
          </NavLink>


          {/* SALIDAS */}

          {!collapsed && (
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-4">
              Salidas
            </p>
          )}

          <NavLink to="/entregas" className={linkStyle} title="Entregas">
            <Truck size={20} />
            {!collapsed && "Entregas"}
          </NavLink>

        </nav>

      </aside>


      {/* CONTENIDO */}

      <div className="flex-1 flex flex-col">


        {/* HEADER */}

        <header className="
          h-14
          border-b border-neutral-200 dark:border-neutral-800
          bg-white dark:bg-neutral-950
          flex items-center
          px-6
        ">


          {/* IZQUIERDA */}

          <div className="flex items-center gap-4 min-w-[220px]">

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="
              p-2
              rounded-md
              hover:bg-neutral-200
              dark:hover:bg-neutral-800
              transition
              "
            >
              <PanelLeft size={18} />
            </button>

            <span className="
              text-sm
              font-semibold
              tracking-wide
              text-neutral-700
              dark:text-neutral-200
            ">
              Bolivia Imports
            </span>

          </div>


          {/* CENTRO - BUSCADOR */}

          <div className="flex-1 flex justify-center">

            <div className="w-full max-w-xl">

              <input
                placeholder="Buscar cliente, tracking o teléfono..."
                className="
                w-full
                px-4 py-2
                rounded-lg
                border border-neutral-200 dark:border-neutral-800
                bg-neutral-100 dark:bg-neutral-900
                text-sm
                text-neutral-900 dark:text-neutral-100
                placeholder-neutral-400
                focus:outline-none
                focus:ring-2 focus:ring-neutral-400/30
                transition
                "
              />

            </div>

          </div>


          {/* DERECHA */}

          <div className="flex items-center gap-3 min-w-[220px] justify-end">


            {/* NOTIFICACIONES */}

            <button
              className="
              relative
              p-2
              rounded-md
              hover:bg-neutral-200
              dark:hover:bg-neutral-800
              transition
              "
            >

              <Bell size={18} />

              {/* FUTURO BADGE */}

              <span className="
              absolute
              -top-1
              -right-1
              w-2
              h-2
              bg-red-500
              rounded-full
              opacity-0
              "/>

            </button>


            {/* PERFIL */}

            <div className="
              w-8 h-8
              rounded-full
              bg-neutral-300 dark:bg-neutral-700
              flex items-center justify-center
              text-xs font-semibold
              text-neutral-700 dark:text-neutral-200
              hover:scale-105
              transition
            ">
              BI
            </div>


            {/* TOGGLE DARK MODE */}

            <button
              onClick={toggleTheme}
              className="
              relative
              w-12
              h-6
              bg-neutral-300
              dark:bg-neutral-700
              rounded-full
              transition
              "
            >

              <span
                className={`
                absolute
                top-1
                left-1
                w-4
                h-4
                bg-white
                rounded-full
                transition-transform
                ${theme === "dark" ? "translate-x-6" : "translate-x-0"}
                `}
              />

            </button>

          </div>

        </header>


        {/* CONTENIDO */}

        <main className="flex-1 overflow-y-auto p-6 bg-neutral-200 dark:bg-neutral-900">

          <div className="max-w-7xl mx-auto">

            <Outlet />

          </div>

        </main>

      </div>

    </div>

  );

}