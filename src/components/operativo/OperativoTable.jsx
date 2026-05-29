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

const TIPOS_INC = [
  { value: "sin_evidencia_warehouse", label: "Sin evidencia warehouse" },
  { value: "comercio_no_entrego",     label: "Comercio no entregó" },
  { value: "entrega_incompleta",      label: "Entrega incompleta" },
  { value: "tracking_sin_movimiento", label: "Tracking sin movimiento" },
  { value: "otro",                    label: "Otro" },
];

function tipoLabel(tipo) {
  return TIPOS_INC.find(t => t.value === tipo)?.label ?? tipo ?? "—";
}

function fmtIncFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// soloConfirmados: legacy — muestra solo warehouse_confirmado
// soloIncidencias: muestra solo warehouse_incidencia = true
export default function OperativoTable({ onOpenPackage, soloConfirmados = false, soloIncidencias = false }) {
  const [data,        setData]        = useState([]);
  const [search,      setSearch]      = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [loading,     setLoading]     = useState(true);

  const [incModal,   setIncModal]   = useState(null); // null | { ordenId }
  const [incTipo,    setIncTipo]    = useState("");
  const [incNota,    setIncNota]    = useState("");
  const [incSaving,  setIncSaving]  = useState(false);
  const [incError,   setIncError]   = useState(null);

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

  function abrirIncModal(ordenId) {
    setIncModal({ ordenId });
    setIncTipo("");
    setIncNota("");
    setIncError(null);
  }

  async function handleMarcarIncidencia() {
    if (!incTipo) { setIncError("Selecciona un tipo de incidencia"); return; }
    setIncSaving(true);
    setIncError(null);
    try {
      const res  = await fetch(`${API_URL}/compras/${incModal.ordenId}/warehouse-incidencia`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tipo: incTipo, nota: incNota.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setIncError(json.error || "Error al marcar incidencia"); return; }
      setData(prev => prev.filter(c => c.id !== incModal.ordenId));
      setIncModal(null);
    } catch {
      setIncError("Error de red");
    } finally {
      setIncSaving(false);
    }
  }

  async function handleResolverIncidencia(ordenId) {
    if (!window.confirm("¿Resolver esta incidencia? La orden volverá a Confirmaciones.")) return;
    try {
      const res  = await fetch(`${API_URL}/compras/${ordenId}/warehouse-incidencia/resolver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) { alert(json.error || "Error al resolver incidencia"); return; }
      setData(prev => prev.filter(c => c.id !== ordenId));
    } catch {
      alert("Error de red");
    }
  }

  const dataset = data.filter((c) => {
    // Filtro incidencias
    if (soloIncidencias) return !!c.warehouse_incidencia;

    // Filtro warehouse: pendientes vs confirmados (legacy soloConfirmados)
    if (soloConfirmados && !c.warehouse_confirmado) return false;
    if (!soloConfirmados && c.warehouse_confirmado)  return false;
    // Confirmaciones: excluir órdenes con incidencia activa
    if (!soloConfirmados && c.warehouse_incidencia)  return false;

    // Filtro por fecha exacta (contra created_at)
    if (fechaFiltro) {
      const fechaRegistro = c.created_at
        ? new Date(c.created_at).toLocaleDateString("en-CA")
        : "";
      if (fechaRegistro !== fechaFiltro) return false;
    }

    // Filtro texto
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
    <>
    <div className="flex flex-col gap-6">

      {/* Encabezado de sección */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          {soloIncidencias ? "Incidencias Warehouse" : "Confirmaciones"}
        </h3>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
          {dataset.length} {dataset.length === 1 ? "paquete" : "paquetes"}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Buscar cliente, tracking..."
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
          title="Filtrar por fecha de registro"
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

              {/* ZONA B2 — Info de incidencia (solo en tab Incidencias) */}
              {soloIncidencias && c.warehouse_incidencia && (
                <div className="px-4 py-3 flex flex-col gap-1.5"
                  style={{ background: "var(--warning-soft)", borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--warning)" }}>
                      Incidencia
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--warning)", color: "#fff" }}>
                      {tipoLabel(c.warehouse_incidencia_tipo)}
                    </span>
                    {c.warehouse_incidencia_at && (
                      <span className="text-[10px] tabular-nums" style={{ color: "var(--warning)" }}>
                        {fmtIncFecha(c.warehouse_incidencia_at)}
                      </span>
                    )}
                  </div>
                  {c.warehouse_incidencia_nota && (
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {c.warehouse_incidencia_nota}
                    </p>
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

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!soloIncidencias && (
                    <button
                      onClick={() => abrirIncModal(c.id)}
                      className="ui-button-ghost ui-button-sm"
                      style={{ color: "var(--warning)" }}
                    >
                      Marcar incidencia
                    </button>
                  )}
                  {soloIncidencias && (
                    <button
                      onClick={() => handleResolverIncidencia(c.id)}
                      className="ui-button-ghost ui-button-sm"
                      style={{ color: "var(--success)" }}
                    >
                      Resolver
                    </button>
                  )}
                  <button
                    onClick={() => onOpenPackage(c)}
                    className="ui-button ui-button-sm"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>

    {/* Modal: marcar incidencia */}
    {incModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIncModal(null)} />
        <div className="relative z-10 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Marcar incidencia warehouse
            </h4>
            <button onClick={() => setIncModal(null)}
              className="text-lg leading-none transition"
              style={{ color: "var(--text-3)" }}>✕</button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Tipo de incidencia *
            </label>
            <select
              value={incTipo}
              onChange={e => setIncTipo(e.target.value)}
              className="ui-input"
            >
              <option value="">Seleccionar...</option>
              {TIPOS_INC.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Nota (opcional)
            </label>
            <textarea
              value={incNota}
              onChange={e => setIncNota(e.target.value)}
              rows={3}
              placeholder="Descripción del problema..."
              className="ui-input resize-none"
            />
          </div>

          {incError && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>{incError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setIncModal(null)}
              className="ui-button-ghost ui-button-sm"
              style={{ color: "var(--text-3)" }}>
              Cancelar
            </button>
            <button
              onClick={handleMarcarIncidencia}
              disabled={incSaving}
              className="ui-button ui-button-sm disabled:opacity-50"
              style={{ background: "var(--warning)", borderColor: "var(--warning)", color: "#fff" }}>
              {incSaving ? "..." : "Confirmar incidencia"}
            </button>
          </div>

        </div>
      </div>
    )}
    </>
  );
}
