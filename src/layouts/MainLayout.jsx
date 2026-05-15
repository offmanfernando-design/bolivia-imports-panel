import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Boxes,
  Package,
  MapPin,
  Truck,
  DollarSign,
  LayoutGrid,
  PanelLeft,
  Menu,
  Settings,
  ClipboardList,
  BarChart2,
  Sun,
  Moon,
} from "lucide-react";

import logoLight from "../assets/logo-light.png";

const NAV_ITEMS = [
  {
    section: null,
    items: [{ to: "/", label: "Dashboard", icon: <LayoutGrid size={17} /> }],
  },
  {
    section: "Operaciones",
    items: [
      { to: "/compras",     label: "Compras",     icon: <Package    size={17} /> },
      { to: "/operativo",   label: "Operativo",   icon: <Boxes      size={17} /> },
      { to: "/ubicaciones", label: "Ubicaciones", icon: <MapPin     size={17} /> },
    ],
  },
  {
    section: "Finanzas",
    items: [
      { to: "/cobros",                label: "Cobros",               icon: <DollarSign    size={17} /> },
      { to: "/solicitudes-terminal", label: "Solicitudes Terminal", icon: <ClipboardList size={17} /> },
      { to: "/entregas",             label: "Entregas",             icon: <Truck         size={17} /> },
    ],
  },
  {
    section: "Sistema",
    items: [
      { to: "/reportes",      label: "Reportes",      icon: <BarChart2 size={17} /> },
      { to: "/configuracion", label: "Configuración", icon: <Settings  size={17} /> },
    ],
  },
];

/* Función linkStyle — NO modificar lógica de isActive */
function linkStyle({ isActive }) {
  return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150
    ${isActive
      ? "bg-cyan-500/10 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium border-l-2 border-cyan-500"
      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
    }`;
}

function SidebarContent({ collapsed, onNavClick }) {
  return (
    <div className="flex flex-col h-full">

      {/* LOGO */}
      <div className="flex items-center justify-center h-14 px-4 border-b border-neutral-800/80 flex-shrink-0">
        {collapsed ? (
          <span className="text-white font-bold text-sm tracking-widest select-none opacity-70">BI</span>
        ) : (
          <img src={logoLight} className="h-9 w-auto opacity-75" alt="Bolivia Imports" />
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>

            {group.section && !collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 px-3 mb-1.5 font-medium">
                {group.section}
              </p>
            )}

            {group.section && collapsed && gi > 0 && (
              <div className="h-px bg-neutral-800/60 my-2 mx-2" />
            )}

            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={linkStyle}
                onClick={onNavClick}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}

          </div>
        ))}
      </nav>

    </div>
  );
}

export default function MainLayout() {

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 transition-colors duration-300">

      {/* SIDEBAR DESKTOP — lg+ */}
      <aside className={`
        hidden lg:flex flex-col flex-shrink-0
        ${collapsed ? "w-[56px]" : "w-[220px]"}
        border-r border-neutral-800/80
        transition-all duration-300
      `}
        style={{ backgroundColor: "#0d1117" }}
      >
        <SidebarContent collapsed={collapsed} onNavClick={null} />
      </aside>

      {/* SIDEBAR MOBILE — overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-[220px] border-r border-neutral-800/80 flex flex-col lg:hidden ui-slide-right"
            style={{ backgroundColor: "#0d1117" }}
          >
            <SidebarContent collapsed={false} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="
          h-14 flex-shrink-0 flex items-center px-4 gap-3
          border-b border-neutral-200 dark:border-neutral-800
          bg-white/90 dark:bg-neutral-950/90
          backdrop-blur-sm
          sticky top-0 z-30
        ">

          {/* Hamburger — solo móvil */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={17} />
          </button>

          {/* Colapsar sidebar — solo desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Colapsar sidebar"
          >
            <PanelLeft size={17} />
          </button>

          {/* Nombre sistema */}
          <span className="text-sm font-semibold tracking-wide text-neutral-700 dark:text-neutral-300 flex-shrink-0 hidden sm:block">
            Bolivia Imports
          </span>

          {/* Buscador — visible desde md */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative w-full max-w-sm">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                placeholder="Buscar cliente, tracking o teléfono..."
                className="
                  w-full pl-9 pr-4 py-2
                  rounded-lg
                  border border-neutral-200 dark:border-neutral-700
                  bg-neutral-50 dark:bg-neutral-800
                  text-sm text-neutral-900 dark:text-neutral-100
                  placeholder-neutral-400
                  focus:outline-none
                  focus:ring-2 focus:ring-cyan-500/20
                  focus:border-cyan-500 dark:focus:border-cyan-500
                  transition-colors duration-150
                "
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Toggle dark/light mode — Sun / Moon */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="
              p-2 rounded-lg flex-shrink-0
              text-neutral-500 dark:text-neutral-400
              hover:bg-neutral-100 dark:hover:bg-neutral-800
              hover:text-neutral-700 dark:hover:text-neutral-200
              transition-colors duration-150
            "
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

        </header>

        {/* CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
}
