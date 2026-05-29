import { useState, useEffect } from "react";
import Badge from "../ui/Badge";
import { API_URL } from "../../config/api";

function getEstadoLabel(estado) {
  switch (estado) {
    case "reparto":   return "En Reparto";
    case "warehouse":
    case "entregado": return "En Warehouse";
    case "recibido":  return "En Bolivia";
    default:          return "En Reparto";
  }
}

function getEstadoBadgeType(estado) {
  switch (estado) {
    case "reparto":   return "warning";
    case "warehouse":
    case "entregado": return "info";
    case "recibido":  return "success";
    default:          return "default";
  }
}

function fmtFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Construir grupos por cliente + tracking ──────────────────────────────────
function buildGroups(orders) {
  const map = new Map();

  for (const order of orders) {
    const items = Array.isArray(order.items_detalle) ? order.items_detalle : [];

    for (const item of items) {
      const efectivoTracking = item.tracking_number || order.tracking_number || null;
      const key = efectivoTracking
        ? `${order.cliente_id}||${efectivoTracking}`
        : `__solo__${order.id}_${item.id}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          cliente_id:     order.cliente_id,
          cliente_nombre: order.cliente_nombre,
          tracking:       efectivoTracking,
          ordenes:        [],
          all_items:      [],
          created_at:     order.created_at,
          proveedor:      order.proveedor,
          numero_orden:   order.numero_orden,
          comprado_por:   order.comprado_por,
          estado:         order.estado,
        });
      }

      const g = map.get(key);

      if (!g.ordenes.find((o) => o.id === order.id)) {
        g.ordenes.push(order);
      }

      if (!g.all_items.find((i) => i.id === item.id)) {
        g.all_items.push({ ...item, orden_id: order.id, orden: order });
      }
    }
  }

  return [...map.values()];
}

// ─── Componente ───────────────────────────────────────────────────────────────
// soloConfirmados: true → Confirmadas; false → Confirmaciones (pendientes)
export default function OperativoTable({ onOpenPackage, soloConfirmados = false }) {
  const [data,        setData]        = useState([]);
  const [search,      setSearch]      = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API_URL}/compras/operativo`);
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Construir grupos filtrados
  const grupos = buildGroups(data)
    .map((g) => ({
      ...g,
      // Solo los ítems relevantes para este tab
      items: g.all_items.filter((i) =>
        soloConfirmados ? i.warehouse_confirmado : !i.warehouse_confirmado
      ),
    }))
    .filter((g) => {
      // Descartar grupos sin ítems para este tab
      if (g.items.length === 0) return false;

      // Filtro de fecha exacta
      if (fechaFiltro) {
        if (soloConfirmados) {
          // Confirmadas: comparar contra warehouse_fecha de los ítems confirmados
          const match = g.items.some(
            (i) =>
              i.warehouse_fecha &&
              new Date(i.warehouse_fecha).toLocaleDateString("en-CA") === fechaFiltro
          );
          if (!match) return false;
        } else {
          // Confirmaciones: comparar contra created_at de la(s) orden(es)
          const match = g.ordenes.some(
            (o) =>
              o.created_at &&
              new Date(o.created_at).toLocaleDateString("en-CA") === fechaFiltro
          );
          if (!match) return false;
        }
      }

      // Filtro texto
      if (search) {
        const t = search.toLowerCase();
        return (
          (g.cliente_nombre || "").toLowerCase().includes(t) ||
          (g.tracking       || "").toLowerCase().includes(t) ||
          g.items.some((i) => (i.descripcion || "").toLowerCase().includes(t)) ||
          g.ordenes.some(
            (o) =>
              (o.numero_orden || "").toLowerCase().includes(t) ||
              (o.descripcion_producto || "").toLowerCase().includes(t)
          )
        );
      }

      return true;
    });

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          {soloConfirmados ? "Confirmadas" : "Confirmaciones"}
        </h3>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
          {grupos.length} {grupos.length === 1 ? "grupo" : "grupos"}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Buscar cliente, tracking, ítem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ui-input max-w-xs flex-1"
        />
        <input
          type="date"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          className="ui-input"
          style={{ maxWidth: "180px" }}
          title={soloConfirmados ? "Filtrar por fecha de confirmación warehouse" : "Filtrar por fecha de registro"}
        />
        {fechaFiltro && (
          <button
            onClick={() => setFechaFiltro("")}
            className="ui-button-ghost ui-button-sm"
            style={{ color: "var(--text-3)" }}
          >
            ✕ fecha
          </button>
        )}
      </div>

      {/* Estado vacío */}
      {grupos.length === 0 && (
        <div className="py-16 text-center text-sm rounded-2xl"
          style={{ color: "var(--text-3)", border: "1px dashed var(--border)" }}>
          {search || fechaFiltro
            ? "Sin resultados para los filtros aplicados."
            : soloConfirmados
              ? "No hay ítems confirmados en warehouse."
              : "No hay ítems pendientes de confirmación."}
        </div>
      )}

      {/* Grupos */}
      <div className="flex flex-col gap-3">
        {grupos.map((g) => {
          // Orden representativa para "Ver detalle"
          const ordenRef = g.ordenes[0];
          // Fecha del primer ítem relevante para mostrar
          const fechaRef = soloConfirmados
            ? g.items[0]?.warehouse_fecha
            : ordenRef?.created_at;

          return (
            <div key={g.key} className="rounded-2xl overflow-hidden transition-shadow"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>

              {/* ZONA A — Encabezado: cliente + badges */}
              <div className="px-4 pt-3 pb-3 flex items-start gap-3"
                style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {g.cliente_nombre}
                  </span>
                  {g.ordenes.length > 1 && (
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {g.ordenes.length} órdenes
                    </span>
                  )}
                  {g.ordenes.length === 1 && g.proveedor && (
                    <span className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                      {g.proveedor}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {g.comprado_por && (
                      <Badge type={g.comprado_por === "empresa" ? "empresa" : "default"}>
                        {g.comprado_por === "empresa" ? "Empresa" : "Cliente"}
                      </Badge>
                    )}
                    <Badge type={getEstadoBadgeType(g.estado)}>
                      {getEstadoLabel(g.estado)}
                    </Badge>
                  </div>
                  {fechaRef && (
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                      {soloConfirmados ? "Confirmado " : "Registrado "}
                      {fmtFecha(fechaRef)}
                    </span>
                  )}
                </div>
              </div>

              {/* ZONA B — Lista de ítems */}
              <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "var(--surface)" }}>
                {g.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <p className="text-xs leading-snug flex-1 min-w-0" style={{ color: "var(--text-2)" }}>
                      {item.descripcion || "—"}
                      {item.cantidad > 1 && (
                        <span className="ml-1.5" style={{ color: "var(--text-3)" }}>
                          ×{item.cantidad}
                        </span>
                      )}
                    </p>
                    {soloConfirmados && item.warehouse_fecha && (
                      <span className="text-[10px] whitespace-nowrap flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: "var(--success-soft)", color: "var(--success)" }}>
                        {fmtFecha(item.warehouse_fecha)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* ZONA C — Footer: tracking + acción */}
              <div className="px-4 py-2.5 flex items-center justify-between gap-3"
                style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: "var(--text-3)" }}>
                    Tracking
                  </span>
                  {g.tracking ? (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg truncate max-w-[180px] sm:max-w-[260px]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                      {g.tracking}
                    </span>
                  ) : (
                    <span className="text-xs italic" style={{ color: "var(--text-3)" }}>
                      Sin tracking
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onOpenPackage(ordenRef)}
                  className="ui-button ui-button-sm flex-shrink-0"
                >
                  Ver detalle
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
