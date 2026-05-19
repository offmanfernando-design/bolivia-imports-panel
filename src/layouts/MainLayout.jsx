import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Boxes,
  Package,
  MapPin,
  Truck,
  DollarSign,
  LayoutGrid,
  PanelLeft,
  Settings,
  ClipboardList,
  BarChart2,
  Sun,
  Moon,
  X,
} from "lucide-react";

import BottomTabBar from "../components/BottomTabBar";

/* ── Grupos de navegación ──────────────────────────────────── */

const NAV_GROUPS = [
  {
    section: "OPERACIÓN",
    items: [
      { to: "/",                     label: "Dashboard",     icon: <LayoutGrid    size={15} />, end: true },
      { to: "/compras",              label: "Compras",       icon: <Package       size={15} /> },
      { to: "/operativo",            label: "Operativo",     icon: <Boxes         size={15} /> },
      { to: "/ubicaciones",          label: "Ubicaciones",   icon: <MapPin        size={15} /> },
      { to: "/solicitudes-terminal", label: "Sol. Terminal", icon: <ClipboardList size={15} /> },
      { to: "/entregas",             label: "Entregas",      icon: <Truck         size={15} /> },
    ],
  },
  {
    section: "FINANZAS",
    items: [
      { to: "/cobros", label: "Cobros", icon: <DollarSign size={15} /> },
    ],
  },
  {
    section: "SISTEMA",
    items: [
      { to: "/reportes",      label: "Reportes",      icon: <BarChart2 size={15} /> },
      { to: "/configuracion", label: "Configuración", icon: <Settings  size={15} /> },
    ],
  },
];

/* ── Clases para ítems nav ─────────────────────────────────── */

function expandedNavClass({ isActive }) {
  const base =
    "flex items-center gap-2.5 text-[13px] font-medium transition-colors duration-150 select-none rounded-r-lg w-full";
  if (isActive) {
    return `${base} border-l-[2.5px] border-[#6FA4B7] pl-[9.5px] pr-3 py-[7px] bg-[rgba(111,164,183,0.14)] text-[#6FA4B7]`;
  }
  return `${base} border-l-[2.5px] border-transparent pl-[9.5px] pr-3 py-[7px] text-[#8E9BA8] hover:text-[#D8DEE5] hover:bg-white/[0.05]`;
}

function collapsedNavClass({ isActive }) {
  const base =
    "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors duration-150";
  if (isActive) {
    return `${base} bg-[rgba(111,164,183,0.14)] text-[#6FA4B7]`;
  }
  return `${base} text-[#5F6B77] hover:text-[#D8DEE5] hover:bg-white/[0.06]`;
}

/* ── Label de página actual ────────────────────────────────── */

const PAGE_LABELS = {
  "/":                     "Dashboard",
  "/compras":              "Compras",
  "/operativo":            "Operativo",
  "/ubicaciones":          "Ubicaciones",
  "/cobros":               "Cobros",
  "/solicitudes-terminal": "Sol. Terminal",
  "/entregas":             "Entregas",
  "/reportes":             "Reportes",
  "/configuracion":        "Configuración",
};

/* ── Contenido del sidebar ─────────────────────────────────── */

function SidebarContent({ collapsed, theme, onThemeToggle, onNavClick }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* LOGO BLOCK */}
      <div className={`flex items-center gap-3 flex-shrink-0 ${collapsed ? "justify-center px-3 py-4" : "px-[18px] py-[16px]"}`}>
        <div
          className="w-8 h-8 rounded-[7px] flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6FA4B7 0%, #3F6E7E 100%)" }}
        >
          <span className="font-bold text-[11px] tracking-wide select-none" style={{ color: "#0B1014" }}>
            BI
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold leading-none truncate" style={{ color: "#E3E8EE" }}>
              Bolivia Imports
            </p>
            <p
              className="text-[10px] mt-[3px] truncate"
              style={{ color: "#5F6B77" }}
            >
              Sistema logístico
            </p>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav
        className="flex-1 overflow-y-auto pb-2 flex flex-col"
        style={{ paddingLeft: "8px", paddingRight: "8px", scrollbarWidth: "none" }}
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : "mt-1"}>
            {!collapsed && (
              <p
                className="font-semibold uppercase px-3 mb-1.5 select-none"
                style={{
                  fontFamily:    "'Geist Mono', monospace",
                  fontSize:      "9px",
                  letterSpacing: "0.14em",
                  color:         "#3F4E5A",
                }}
              >
                {group.section}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="h-px my-2.5 mx-2" style={{ background: "rgba(255,255,255,0.06)" }} />
            )}
            <div className="flex flex-col gap-[2px]">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  end={item.end}
                  className={collapsed ? collapsedNavClass : expandedNavClass}
                  onClick={onNavClick}
                  aria-current={undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div
        className="flex-shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold select-none"
                style={{ background: "rgba(255,255,255,0.07)", color: "#8E9BA8" }}
              >
                AD
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium leading-none truncate" style={{ color: "#C8D0D9" }}>
                  Administrador
                </p>
                <p
                  className="text-[10px] truncate mt-[3px]"
                  style={{ color: "#5F6B77" }}
                >
                  Acceso total
                </p>
              </div>
            </div>
            <button
              onClick={onThemeToggle}
              className="flex-shrink-0 p-1.5 rounded-md transition-colors"
              style={{ color: "#5F6B77" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#D8DEE5"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#5F6B77"; e.currentTarget.style.background = "transparent"; }}
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        ) : (
          <button
            onClick={onThemeToggle}
            className="mx-auto flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ color: "#5F6B77" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#D8DEE5"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#5F6B77"; e.currentTarget.style.background = "transparent"; }}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        )}
      </div>

    </div>
  );
}

/* ── Layout principal ──────────────────────────────────────── */

export default function MainLayout() {
  const location = useLocation();

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "";
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const pageLabel = PAGE_LABELS[location.pathname] ?? "Bolivia Imports";

  const sidebarWidth = collapsed ? "64px" : "240px";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >

      {/* ── SIDEBAR DESKTOP (md+) ────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 transition-[width] duration-200"
        style={{
          width:           sidebarWidth,
          backgroundColor: "var(--nav)",
          borderRight:     "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          theme={theme}
          onThemeToggle={toggleTheme}
          onNavClick={null}
        />
      </aside>

      {/* ── SIDEBAR MOBILE — overlay drawer ──────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(11,16,20,0.6)", backdropFilter: "blur(2px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col md:hidden ui-slide-right"
            style={{
              backgroundColor: "var(--nav)",
              borderRight:     "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="flex items-center justify-end px-3 pt-3 pb-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: "#5F6B77" }}
                aria-label="Cerrar menú"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent
                collapsed={false}
                theme={theme}
                onThemeToggle={toggleTheme}
                onNavClick={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </>
      )}

      {/* ── ÁREA PRINCIPAL ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOPBAR */}
        <header
          className="flex-shrink-0 flex items-center gap-3 sticky top-0 z-30"
          style={{
            height:       "60px",
            padding:      "0 20px",
            background:   "var(--surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Colapsar sidebar — solo desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-md transition-colors flex-shrink-0"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
            aria-label="Colapsar sidebar"
          >
            <PanelLeft size={15} />
          </button>

          {/* Separador vertical */}
          <div
            className="hidden md:block h-4 w-px flex-shrink-0"
            style={{ background: "var(--border)" }}
          />

          {/* Título de página */}
          <h1
            className="font-semibold truncate"
            style={{
              fontSize:      "15px",
              letterSpacing: "-0.01em",
              color:         "var(--text)",
            }}
          >
            {pageLabel}
          </h1>
        </header>

        {/* CONTENIDO */}
        <main
          className="flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden px-[18px] py-5 md:px-5 md:py-5 lg:px-[26px] lg:py-6"
          style={{ background: "var(--bg)" }}
        >
          <Outlet />
        </main>

        {/* BOTTOM TAB BAR — solo mobile */}
        <BottomTabBar onMenuOpen={() => setMobileOpen(true)} />

      </div>

    </div>
  );
}
