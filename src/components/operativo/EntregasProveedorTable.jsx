import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseItems(order) {
  if (Array.isArray(order.items_detalle)) return order.items_detalle;
  if (typeof order.items_detalle === "string") {
    try { return JSON.parse(order.items_detalle); } catch { return []; }
  }
  return [];
}

// ─── Fila de ítem con control inline ────────────────────────────────────────

function ItemRow({ item, ordenId, onUpdated }) {
  const [fecha,   setFecha]   = useState(
    item.fecha_entrega_proveedor ? item.fecha_entrega_proveedor.split("T")[0] : ""
  );
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const confirmado = item.proveedor_confirmo_entrega;

  async function guardar(confirmo) {
    if (confirmo && !fecha) { setError("Selecciona una fecha"); return; }
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/compras/items/${item.id}/fecha-entrega-proveedor`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fecha: confirmo ? fecha : null, confirmo }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Error"); return; }
      onUpdated(item.id, json.data);
    } catch {
      setError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl px-4 py-2.5"
      style={{
        background: confirmado ? "var(--success-soft)" : "var(--surface-2)",
        border: `1px solid ${confirmado ? "var(--success)" : "var(--border)"}`,
      }}>

      {/* Descripción + tracking */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm leading-snug flex-1 min-w-0" style={{ color: "var(--text)" }}>
          {item.descripcion || "—"}
        </span>
        {item.tracking_number && (
          <span className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
            {item.tracking_number}
          </span>
        )}
      </div>

      {/* Estado + fecha */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold"
          style={{ color: confirmado ? "var(--success)" : "var(--text-3)" }}>
          {confirmado ? `Proveedor entregó · ${fmtDate(item.fecha_entrega_proveedor) ?? "—"}` : "Pendiente proveedor"}
        </span>
      </div>

      {/* Controles */}
      {!confirmado ? (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="ui-input"
            style={{ maxWidth: "160px" }}
          />
          <button
            onClick={() => guardar(true)}
            disabled={saving}
            className="ui-button ui-button-sm disabled:opacity-50"
            style={{ fontSize: "11px" }}>
            {saving ? "..." : "Marcar entregado"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => guardar(false)}
            disabled={saving}
            className="ui-button-ghost ui-button-sm disabled:opacity-50"
            style={{ color: "var(--text-3)", fontSize: "11px" }}>
            {saving ? "..." : "Quitar entrega proveedor"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-[11px]" style={{ color: "var(--danger)" }}>{error}</p>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function EntregasProveedorTable() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

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

  function handleUpdated(ordenId, itemId, updatedItem) {
    setData(prev => prev.map(orden => {
      if (orden.id !== ordenId) return orden;
      const items = parseItems(orden).map(it =>
        it.id === itemId ? { ...it, ...updatedItem } : it
      );
      return { ...orden, items_detalle: items };
    }));
  }

  const s = search.toLowerCase();
  const filtered = data.filter(c => {
    if (!s) return true;
    const items = parseItems(c);
    return (
      (c.cliente_nombre || "").toLowerCase().includes(s) ||
      (c.proveedor      || "").toLowerCase().includes(s) ||
      (c.numero_orden   || "").toLowerCase().includes(s) ||
      items.some(it =>
        (it.tracking_number || "").toLowerCase().includes(s) ||
        (it.descripcion     || "").toLowerCase().includes(s)
      )
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

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Entregas Proveedor
        </h3>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
          {filtered.length} {filtered.length === 1 ? "orden" : "órdenes"}
        </span>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar cliente, proveedor, tracking..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="ui-input max-w-xs"
      />

      {/* Estado vacío */}
      {filtered.length === 0 && (
        <div className="py-16 text-center text-sm rounded-2xl"
          style={{ color: "var(--text-3)", border: "1px dashed var(--border)" }}>
          {search ? "Sin resultados para la búsqueda." : "No hay órdenes."}
        </div>
      )}

      {/* Tarjetas */}
      <div className="flex flex-col gap-4">
        {filtered.map(c => {
          const items   = parseItems(c);
          const cliente = c.cliente_nombre || c.cliente || c.nombre_cliente;
          const fProv   = c.fecha_entrega_proveedor
            ? c.fecha_entrega_proveedor.split("T")[0].split("-").reverse().join("/")
            : null;

          const totalItems = items.length;
          const entregados = items.filter(i => i.proveedor_confirmo_entrega).length;

          return (
            <div key={c.id} className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>

              {/* Encabezado de tarjeta */}
              <div className="px-4 pt-3 pb-3 flex items-start justify-between gap-3"
                style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{cliente}</span>
                    {c.comprado_por && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--surface-3)", color: "var(--text-3)" }}>
                        {c.comprado_por === "empresa" ? "Empresa" : "Cliente"}
                      </span>
                    )}
                  </div>
                  {(c.proveedor || c.numero_orden) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.proveedor && (
                        <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>{c.proveedor}</span>
                      )}
                      {c.numero_orden && (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md"
                          style={{ color: "var(--text-3)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                          #{c.numero_orden}
                        </span>
                      )}
                      {c.codigo_solicitud && (
                        <span className="font-mono text-[11px]" style={{ color: "var(--text-3)" }}>
                          SOL: {c.codigo_solicitud}
                        </span>
                      )}
                    </div>
                  )}
                  {fProv && (
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      Est. proveedor (orden): {fProv}
                    </span>
                  )}
                </div>

                {/* Progreso */}
                {totalItems > 0 && (
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={entregados === totalItems
                        ? { background: "var(--success-soft)", color: "var(--success)" }
                        : entregados > 0
                          ? { background: "var(--warning-soft)", color: "var(--warning)" }
                          : { background: "var(--surface-3)", color: "var(--text-3)" }
                      }>
                      {entregados === totalItems ? "Todo entregado" : entregados > 0 ? "Parcial" : "Pendiente"}
                    </span>
                    <span className="text-[10px] tabular-nums" style={{ color: "var(--text-3)" }}>
                      {entregados}/{totalItems} ítems
                    </span>
                  </div>
                )}
              </div>

              {/* Ítems */}
              {items.length > 0 ? (
                <div className="px-4 py-3 flex flex-col gap-2">
                  {items.map((item, idx) => (
                    <ItemRow
                      key={item.id ?? idx}
                      item={item}
                      ordenId={c.id}
                      onUpdated={(itemId, updatedItem) => handleUpdated(c.id, itemId, updatedItem)}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3">
                  <span className="text-xs italic" style={{ color: "var(--text-3)" }}>Sin ítems registrados</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
