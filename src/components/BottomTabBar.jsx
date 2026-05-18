import { NavLink } from "react-router-dom";
import { LayoutGrid, Package, Boxes, DollarSign, Menu } from "lucide-react";

const TABS = [
  { to: "/",          label: "Inicio",    icon: <LayoutGrid size={18} />, end: true },
  { to: "/compras",   label: "Compras",   icon: <Package    size={18} /> },
  { to: "/operativo", label: "Operativo", icon: <Boxes      size={18} /> },
  { to: "/cobros",    label: "Cobros",    icon: <DollarSign size={18} /> },
];

export default function BottomTabBar({ onMenuOpen }) {
  return (
    <nav
      className="md:hidden flex-shrink-0 flex items-stretch"
      style={{
        background:    "var(--surface)",
        borderTop:     "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height:        "calc(56px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 select-none"
          style={({ isActive }) => ({
            color:     isActive ? "var(--accent)" : "var(--text-3)",
            fontSize:  "9.5px",
            fontFamily: "'Geist Mono', monospace",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          })}
        >
          {({ isActive }) => (
            <>
              <span
                className="transition-transform duration-150"
                style={{
                  transform: isActive ? "scale(1)" : "scale(0.92)",
                  opacity:   isActive ? 1 : 0.7,
                }}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Más — abre el menú lateral */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 select-none"
        style={{
          color:         "var(--text-3)",
          fontSize:      "9.5px",
          fontFamily:    "'Geist Mono', monospace",
          fontWeight:    600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          background:    "transparent",
          border:        "none",
          cursor:        "pointer",
          padding:       0,
        }}
      >
        <span style={{ opacity: 0.7 }}><Menu size={18} /></span>
        <span>Más</span>
      </button>
    </nav>
  );
}
