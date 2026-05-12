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
} from "lucide-react";

import logoLight from "../assets/logo-light.png";

const NAV_ITEMS = [
  {
    section: null,
    items: [{ to: "/", label: "Dashboard", icon: <LayoutGrid size={18} /> }],
  },
  {
    section: "Operaciones",
    items: [
      { to: "/compras",     label: "Compras",      icon: <Package size={18} /> },
      { to: "/operativo",   label: "Operativo",    icon: <Boxes size={18} /> },
      { to: "/ubicaciones", label: "Ubicaciones",  icon: <MapPin size={18} /> },
    ],
  },
  {
    section: "Finanzas",
    items: [
      { to: "/cobros",                label: "Cobros",               icon: <DollarSign    size={18} /> },
      { to: "/solicitudes-terminal", label: "Solicitudes Terminal", icon: <ClipboardList size={18} /> },
      { to: "/entregas",             label: "Entregas",             icon: <Truck         size={18} /> },
    ],
  },
  {
    section: "Sistema",
    items: [
      { to: "/reportes",      label: "Reportes",      icon: <BarChart2 size={18} /> },
      { to: "/configuracion", label: "Configuración", icon: <Settings size={18} /> },
    ],
  },
];

function linkStyle({ isActive }) {
  return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150
    ${isActive
      ? "bg-neutral-800 text-white font-medium"
      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
    }`;
}

function SidebarContent({ collapsed, onNavClick }) {
  return (
    <div className="flex flex-col h-full">

      {/* LOGO */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-800 flex-shrink-0">
        {collapsed ? (
          <span className="text-white font-bold text-sm tracking-widest select-none">BI</span>
        ) : (
          <img src={logoLight} className="h-10 w-auto opacity-80" alt="Bolivia Imports" />
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>

            {group.section && !collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 px-3 mb-1">
                {group.section}
              </p>
            )}

            {group.section && collapsed && gi > 0 && (
              <div className="h-px bg-neutral-800 my-2 mx-2" />
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
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 transition-colors duration-300">

      {/* SIDEBAR DESKTOP — lg+ */}
      <aside className={`
        hidden lg:flex flex-col flex-shrink-0
        ${collapsed ? "w-16" : "w-56"}
        bg-neutral-950 border-r border-neutral-800
        transition-all duration-300
      `}>
        <SidebarContent collapsed={collapsed} onNavClick={null} />
      </aside>

      {/* SIDEBAR MOBILE — overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-56 bg-neutral-950 border-r border-neutral-800 flex flex-col lg:hidden">
            <SidebarContent collapsed={false} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-14 flex-shrink-0 flex items-center px-4 gap-3
          border-b border-neutral-200 dark:border-neutral-800
          bg-white dark:bg-neutral-950
        ">

          {/* Hamburger — solo móvil */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>

          {/* Colapsar sidebar — solo desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Colapsar sidebar"
          >
            <PanelLeft size={18} />
          </button>

          {/* Nombre sistema */}
          <span className="text-sm font-semibold tracking-wide text-neutral-700 dark:text-neutral-200 flex-shrink-0">
            Bolivia Imports
          </span>

          {/* Buscador — oculto en móvil */}
          <div className="hidden md:flex flex-1 justify-center">
            <input
              placeholder="Buscar cliente, tracking o teléfono..."
              className="w-full max-w-md px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800
                bg-neutral-100 dark:bg-neutral-900 text-sm placeholder-neutral-400
                focus:outline-none focus:ring-2 focus:ring-neutral-300/40 transition"
            />
          </div>

          <div className="flex-1 md:hidden" />

          {/* Toggle dark mode */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-300
              bg-neutral-300 dark:bg-neutral-700"
            aria-label="Cambiar tema"
          >
            <span className={`
              absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300
              ${theme === "dark" ? "translate-x-5" : "translate-x-0"}
            `} />
          </button>

        </header>

        {/* CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-100 dark:bg-neutral-900">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
}
