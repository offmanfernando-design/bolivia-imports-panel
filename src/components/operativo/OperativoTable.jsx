import { useState, useEffect } from "react";
import Badge from "../ui/Badge";
import { API_URL } from "../../config/api";

function getEstadoLabel(estado) {
  switch (estado) {
    case "reparto":   return "En Reparto";
    case "entregado": return "En Warehouse";
    case "recibido":  return "En Bolivia";
    default:          return "En Reparto";
  }
}

function getEstadoBadgeType(estado) {
  switch (estado) {
    case "reparto":   return "warning";
    case "entregado": return "info";
    case "recibido":  return "success";
    default:          return "default";
  }
}

export default function OperativoTable({ onOpenPackage }) {
  const [data,    setData]    = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

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

  const dataset = data.filter((c) => {
    const texto = search.toLowerCase();
    return (
      (c.cliente_nombre || c.cliente || c.nombre_cliente || "").toLowerCase().includes(texto) ||
      (c.tracking_number || c.tracking || "").toLowerCase().includes(texto) ||
      (c.tracking_items || "").toLowerCase().includes(texto) ||
      (c.numero_orden || "").toLowerCase().includes(texto) ||
      (c.descripcion_producto || "").toLowerCase().includes(texto)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Encabezado de sección */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Confirmaciones
        </h3>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
          {dataset.length} {dataset.length === 1 ? "paquete" : "paquetes"}
        </span>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar cliente, tracking..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="ui-input max-w-md"
      />

      {/* Estado vacío */}
      {dataset.length === 0 && (
        <div className="py-16 text-center text-sm rounded-2xl"
          style={{ color: "var(--text-3)", border: "1px dashed var(--border)" }}>
          {search ? "Sin resultados para la búsqueda." : "No hay paquetes pendientes de confirmación."}
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {dataset.map((c) => {
          const tracking = c.tracking_number || c.tracking;
          const cliente  = c.cliente_nombre  || c.cliente || c.nombre_cliente;
          const producto = c.descripcion_producto || c.producto;
          const fProv    = c.fecha_entrega_proveedor
            ? c.fecha_entrega_proveedor.split("T")[0].split("-").reverse().join("/")
            : null;
          const hasBody  = !!(producto || fProv);

          // Indicador warehouse — campos opcionales según respuesta del API
          const wCount = c.warehouse_count ?? null;
          const iCount = c.item_count      ?? null;
          const wOk    = c.warehouse_confirmado ?? null;

          const wAllConfirmed = iCount != null && wCount != null && wCount >= iCount && iCount > 0;
          const wPartial      = iCount != null && wCount != null && wCount > 0 && wCount < iCount;

          return (
            <div key={c.id} className="rounded-2xl overflow-hidden transition-shadow"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>

              {/* ZONA A — Encabezado */}
              <div className="px-4 pt-3 pb-3 flex items-start gap-3"
                style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0 flex flex-col gap-1">

                  {/* Fila 1: cliente + destino */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                      {cliente}
                    </span>
                    {c.destino && (
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        · {c.destino}
                      </span>
                    )}
                  </div>

                  {/* Fila 2: proveedor + nº orden */}
                  {(c.proveedor || c.numero_orden) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.proveedor && (
                        <span className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                          {c.proveedor}
                        </span>
                      )}
                      {c.numero_orden && (
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded-md"
                          style={{ color: "var(--text-3)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                          #{c.numero_orden}
                        </span>
                      )}
                    </div>
                  )}

                </div>

                {/* Derecha: badges + warehouse */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {c.comprado_por && (
                      <Badge type={c.comprado_por === "empresa" ? "empresa" : "default"}>
                        {c.comprado_por === "empresa" ? "Empresa" : "Cliente"}
                      </Badge>
                    )}
                    <Badge type={getEstadoBadgeType(c.estado)}>
                      {getEstadoLabel(c.estado)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Warehouse: N/M ítems */}
                    {iCount != null && iCount > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={wAllConfirmed
                          ? { background: "var(--success-soft)", color: "var(--success)" }
                          : wPartial
                            ? { background: "var(--warning-soft)", color: "var(--warning)" }
                            : { background: "var(--surface-3)", color: "var(--text-3)" }
                        }>
                        {wAllConfirmed
                          ? "Warehouse completo"
                          : wPartial
                            ? `${wCount ?? 0}/${iCount} en warehouse`
                            : `Sin confirmar · ${iCount} ítem${iCount !== 1 ? "s" : ""}`
                        }
                      </span>
                    )}
                    {/* Warehouse booleano simple */}
                    {iCount == null && wOk != null && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={wOk
                          ? { background: "var(--success-soft)", color: "var(--success)" }
                          : { background: "var(--surface-3)", color: "var(--text-3)" }
                        }>
                        {wOk ? "Warehouse confirmado" : "Pendiente warehouse"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ZONA B — Cuerpo (condicional) */}
              {hasBody && (
                <div className="px-4 py-3 flex flex-col gap-1.5" style={{ background: "var(--surface)" }}>
                  {producto && (
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-2)" }}>
                      {producto}
                    </p>
                  )}
                  {fProv && (
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      Entrega estimada prov.{" "}
                      <span className="font-medium tabular-nums" style={{ color: "var(--text-2)" }}>
                        {fProv}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* ZONA C — Footer: tracking + acción */}
              <div className="px-4 py-2.5 flex items-center justify-between gap-3"
                style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: "var(--text-3)" }}>
                    Tracking
                  </span>
                  {tracking ? (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg truncate max-w-[180px] sm:max-w-[260px]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                      {tracking}
                    </span>
                  ) : (
                    <span className="text-xs italic" style={{ color: "var(--text-3)" }}>
                      Sin tracking
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onOpenPackage(c)}
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
