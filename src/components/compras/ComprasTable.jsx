import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { API_URL } from "../../config/api";
import Badge from "../ui/Badge";

export default function ComprasTable({ reload }) {
  const [compras,          setCompras]          = useState([]);
  const [trackingEdit,     setTrackingEdit]      = useState({});
  const [loading,          setLoading]           = useState(true);
  const [filtro,           setFiltro]            = useState("");
  const [filtroTracking,   setFiltroTracking]    = useState("todos");
  const [expandedId,       setExpandedId]        = useState(null);
  const [itemsMap,         setItemsMap]          = useState({});
  const [itemTrackEdit,    setItemTrackEdit]      = useState({});
  const [savingItemId,     setSavingItemId]       = useState(null);
  const [editingId,        setEditingId]          = useState(null);
  const [editForm,         setEditForm]           = useState({});
  const [savingEdit,       setSavingEdit]         = useState(false);
  const [editError,        setEditError]          = useState("");
  const [editItems,        setEditItems]          = useState([]);
  const [editDeleteIds,    setEditDeleteIds]      = useState([]);
  const [loadingItems,     setLoadingItems]       = useState(false);
  const [savingItems,      setSavingItems]        = useState(false);
  const [itemsError,       setItemsError]         = useState("");

  async function load() {
    try {
      const res  = await fetch(`${API_URL}/compras`);
      const json = await res.json();
      setCompras(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [reload]);

  useEffect(() => {
    if (!editingId) {
      setEditItems([]);
      setEditDeleteIds([]);
      setItemsError("");
      return;
    }
    setLoadingItems(true);
    fetch(`${API_URL}/compras/${editingId}/items`)
      .then(r => r.json())
      .then(json => setEditItems(json.data || []))
      .catch(() => setItemsError("Error cargando ítems"))
      .finally(() => setLoadingItems(false));
  }, [editingId]);

  async function toggleItems(compraId) {
    if (expandedId === compraId) { setExpandedId(null); return; }
    setExpandedId(compraId);
    if (!itemsMap[compraId]) {
      try {
        const res  = await fetch(`${API_URL}/compras/${compraId}/items`);
        const json = await res.json();
        setItemsMap(prev => ({ ...prev, [compraId]: json.data || [] }));
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function guardarTracking(id) {
    try {
      const tracking = trackingEdit[id];
      if (!tracking || !tracking.trim()) { alert("Ingresa un tracking válido"); return; }
      const res  = await fetch(`${API_URL}/compras/${id}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: tracking }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar el tracking");
      setCompras(prev => prev.map(c => c.id === id ? { ...c, tracking_number: tracking, tracking_status: "received" } : c));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando tracking");
    }
  }

  async function guardarTrackingSingle(compraId, singleItemId) {
    const tracking = trackingEdit[compraId];
    if (!tracking || !tracking.trim()) { alert("Ingresa un tracking válido"); return; }
    try {
      const res  = await fetch(`${API_URL}/compras/items/${singleItemId}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: tracking }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar el tracking");
      setCompras(prev => prev.map(c =>
        c.id === compraId ? { ...c, single_item_tracking: tracking.trim(), tracking_status: "received" } : c
      ));
      setTrackingEdit(prev => { const n = { ...prev }; delete n[compraId]; return n; });
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando tracking");
    }
  }

  async function guardarTrackingItem(itemId, compraId) {
    const tracking = itemTrackEdit[itemId];
    if (!tracking || !tracking.trim()) { alert("Ingresa un tracking válido"); return; }
    setSavingItemId(itemId);
    try {
      const res  = await fetch(`${API_URL}/compras/items/${itemId}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: tracking }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar");
      setItemsMap(prev => ({
        ...prev,
        [compraId]: (prev[compraId] || []).map(it =>
          it.id === itemId ? { ...it, tracking_number: tracking } : it
        ),
      }));
      setCompras(prev => prev.map(c =>
        c.id === compraId ? { ...c, tracking_status: "received" } : c
      ));
      setItemTrackEdit(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    } catch (err) {
      console.error(err);
      alert(err.message || "Error guardando tracking del ítem");
    } finally {
      setSavingItemId(null);
    }
  }

  function updateEditItemDescripcion(idx, value) {
    setEditItems(prev => { const next = [...prev]; next[idx] = { ...next[idx], descripcion: value }; return next; });
  }

  function updateEditItemCantidad(idx, value) {
    const parsed = parseInt(value, 10);
    setEditItems(prev => { const next = [...prev]; next[idx] = { ...next[idx], cantidad: isNaN(parsed) ? "" : parsed }; return next; });
  }

  function marcarEliminarItem(item, idx) {
    if (item.id) {
      setEditDeleteIds(prev => [...prev, item.id]);
    } else {
      setEditItems(prev => prev.filter((_, i) => i !== idx));
    }
  }

  function agregarEditItem() {
    setEditItems(prev => [...prev, { descripcion: "", cantidad: 1 }]);
  }

  async function guardarItems() {
    setItemsError("");
    const itemsToSend = editItems.filter(i => {
      if (i.id && editDeleteIds.includes(i.id)) return false;
      if (i.id && (i.estado !== "pendiente" || i.warehouse_confirmado === true)) return false;
      return true;
    });
    for (const item of itemsToSend) {
      if (!String(item.descripcion || "").trim()) { setItemsError("Todos los ítems necesitan descripción"); return; }
      const cant = Number(item.cantidad);
      if (!Number.isInteger(cant) || cant < 1 || cant > 999) {
        setItemsError(`Cantidad inválida para "${item.descripcion}": entero entre 1 y 999`); return;
      }
    }
    setSavingItems(true);
    try {
      const res = await fetch(`${API_URL}/compras/${editingId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToSend, deleted_item_ids: editDeleteIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al guardar ítems");
      setCompras(prev => prev.map(c =>
        c.id === editingId ? { ...c, descripcion_producto: json.data.descripcion_producto } : c
      ));
      setEditItems(json.data.items);
      setEditDeleteIds([]);
    } catch (err) {
      setItemsError(err.message || "Error al guardar ítems");
    } finally {
      setSavingItems(false);
    }
  }

  function abrirEditar(compra) {
    setEditingId(compra.id);
    setEditForm({
      proveedor:               compra.proveedor || "",
      numero_orden:            compra.numero_orden || "",
      url_orden:               compra.url_orden || "",
      fecha_estimada:          compra.fecha_estimada ? compra.fecha_estimada.split("T")[0] : "",
      descripcion_producto:    compra.descripcion_producto || "",
      comprado_por:            compra.comprado_por || "cliente",
      fecha_entrega_proveedor: compra.fecha_entrega_proveedor ? compra.fecha_entrega_proveedor.split("T")[0] : "",
      tracking_responsible:    compra.tracking_responsible || compra.comprado_por || "cliente",
    });
    setEditError("");
  }

  async function guardarEdicion() {
    if (!editForm.proveedor.trim())    { setEditError("Proveedor requerido"); return; }
    if (!editForm.numero_orden.trim()) { setEditError("Número de orden requerido"); return; }
    setSavingEdit(true);
    setEditError("");
    try {
      const res = await fetch(`${API_URL}/compras/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor:               editForm.proveedor.trim(),
          numero_orden:            editForm.numero_orden.trim(),
          url_orden:               editForm.url_orden.trim() || null,
          fecha_estimada:          editForm.fecha_estimada || null,
          descripcion_producto:    editForm.descripcion_producto.trim() || null,
          comprado_por:            editForm.comprado_por,
          fecha_entrega_proveedor: editForm.fecha_entrega_proveedor || null,
          tracking_responsible:    editForm.tracking_responsible,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar");
      setCompras(prev => prev.map(c => {
        if (c.id !== editingId) return c;
        return {
          ...c,
          proveedor:               json.data.proveedor,
          numero_orden:            json.data.numero_orden,
          url_orden:               json.data.url_orden,
          fecha_estimada:          json.data.fecha_estimada,
          descripcion_producto:    json.data.descripcion_producto,
          comprado_por:            json.data.comprado_por,
          fecha_entrega_proveedor: json.data.fecha_entrega_proveedor,
          tracking_responsible:    json.data.tracking_responsible,
        };
      }));
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || "Error guardando");
    } finally {
      setSavingEdit(false);
    }
  }

  async function cambiarEstado(id, estado) {
    try {
      const res  = await fetch(`${API_URL}/compras/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo actualizar el estado");
      setCompras(prev => prev.map(c =>
        c.id === id
          ? { ...c, estado, tracking_status: estado === "recibido" ? "received" : c.tracking_status }
          : c
      ));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error actualizando estado");
    }
  }

  const TRACKING_STATUS_LABEL = { pending: "Pendiente", requested: "Solicitado", received: "Recibido" };

  function getTrackingStatusStyle(status) {
    switch (status) {
      case "received":  return { background: "var(--success-soft)", color: "var(--success)" };
      case "requested": return { background: "var(--accent-soft)", color: "var(--accent-2)" };
      default:          return { background: "var(--surface-2)", color: "var(--text-3)" };
    }
  }

  function getEstadoStyle(estado) {
    switch (estado) {
      case "reparto":   return { background: "var(--surface-3)", color: "var(--text-2)" };
      case "warehouse":
      case "entregado": return { background: "var(--accent-soft)", color: "var(--accent-2)" };
      case "recibido":  return { background: "var(--success-soft)", color: "var(--success)" };
      default:          return { background: "var(--surface-2)", color: "var(--text-2)" };
    }
  }

  function formatEstadoItem(estado) {
    switch (estado) {
      case "pendiente":        return "Pendiente";
      case "warehouse":        return "Warehouse";
      case "recibido_bolivia": return "En Bolivia";
      case "entregado":        return "Entregado";
      default:                 return estado || "—";
    }
  }

  function getItemEstadoStyle(estado) {
    switch (estado) {
      case "warehouse":        return { background: "var(--accent-soft)", color: "var(--accent-2)" };
      case "recibido_bolivia": return { background: "var(--success-soft)", color: "var(--success)" };
      case "entregado":        return { background: "var(--success-soft)", color: "var(--success)" };
      default:                 return { background: "var(--surface-3)", color: "var(--text-2)" };
    }
  }

  /* ── Filtros ─────────────────────────────────────────────────── */
  const comprasTexto = compras.filter(c => {
    if (!filtro) return true;
    const texto = filtro.toLowerCase();
    return (
      c.cliente_nombre?.toLowerCase().includes(texto) ||
      c.descripcion_producto?.toLowerCase().includes(texto) ||
      c.proveedor?.toLowerCase().includes(texto) ||
      c.numero_orden?.toLowerCase().includes(texto)
    );
  });

  const conteos = {
    todos:             comprasTexto.length,
    sin_tracking:      comprasTexto.filter(c => c.tracking_status === "pending" || c.tracking_status === "requested").length,
    pendiente_empresa: comprasTexto.filter(c => (c.tracking_status === "pending" || c.tracking_status === "requested") && c.tracking_responsible === "empresa").length,
    pendiente_cliente: comprasTexto.filter(c => (c.tracking_status === "pending" || c.tracking_status === "requested") && c.tracking_responsible === "cliente").length,
    recibidos:         comprasTexto.filter(c => c.tracking_status === "received").length,
  };

  const comprasFiltradas = comprasTexto.filter(c => {
    const sinTracking = c.tracking_status === "pending" || c.tracking_status === "requested";
    switch (filtroTracking) {
      case "sin_tracking":      return sinTracking;
      case "pendiente_empresa": return sinTracking && c.tracking_responsible === "empresa";
      case "pendiente_cliente": return sinTracking && c.tracking_responsible === "cliente";
      case "recibidos":         return c.tracking_status === "received";
      default:                  return true;
    }
  });

  /* ── Agrupación por solicitud ───────────────────────────────── */
  const grupos = (() => {
    const map = new Map();
    comprasFiltradas.forEach(compra => {
      const key = compra.codigo_solicitud || `__solo_${compra.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          codigo_solicitud: compra.codigo_solicitud || null,
          cliente_nombre:   compra.cliente_nombre,
          destino:          compra.destino,
          ordenes:          [],
        });
      }
      map.get(key).ordenes.push(compra);
    });
    return Array.from(map.values());
  })();

  /* ── Renderiza el panel expandido de ítems (reutilizado en ambos casos) ── */
  function renderItemsPanel(compra, borderRadius) {
    const items = itemsMap[compra.id];
    return (
      <div
        className={`px-3 pt-2.5 pb-3 flex flex-col gap-1.5 ${borderRadius}`}
        style={{ border: "1px solid var(--border)", borderTop: "none", background: "var(--surface-2)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider px-0.5 pb-0.5" style={{ color: "var(--text-3)" }}>
          Ítems · {items ? items.length : "…"}
        </p>
        {!items ? (
          <p className="text-xs py-1" style={{ color: "var(--text-3)" }}>Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-xs py-1" style={{ color: "var(--text-3)" }}>Sin ítems.</p>
        ) : (() => {
          const trackingCount = {};
          items.forEach(it => {
            if (!it.tracking_number) return;
            trackingCount[it.tracking_number] = (trackingCount[it.tracking_number] || 0) + 1;
          });
          return items.map((item, idx) => (
            <div key={item.id}
              className="rounded-xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold tabular-nums w-4 flex-shrink-0" style={{ color: "var(--text-3)" }}>
                    {idx + 1}.
                  </span>
                  <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
                    {item.descripcion}
                  </p>
                  {item.cantidad > 1 && (
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>×{item.cantidad}</span>
                  )}
                </div>
                <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
                  style={getItemEstadoStyle(item.estado)}>
                  {formatEstadoItem(item.estado)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {item.tracking_number ? (
                  itemTrackEdit[item.id] !== undefined ? (
                    <div className="flex items-center gap-1.5">
                      <input type="text" value={itemTrackEdit[item.id]}
                        onChange={e => setItemTrackEdit(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="ui-input ui-input-sm w-36"
                      />
                      <button disabled={savingItemId === item.id}
                        onClick={() => guardarTrackingItem(item.id, compra.id)}
                        className="ui-button ui-button-sm disabled:opacity-50">
                        {savingItemId === item.id ? "…" : "OK"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg text-xs font-mono"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                        {item.tracking_number}
                      </span>
                      {trackingCount[item.tracking_number] > 1 && (
                        <span className="text-[10px] font-semibold" style={{ color: "var(--warning)" }}>compartido</span>
                      )}
                      <button onClick={() => setItemTrackEdit(prev => ({ ...prev, [item.id]: item.tracking_number }))}
                        className="text-xs hover:underline transition-colors" style={{ color: "var(--text-3)" }}>
                        Editar
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input type="text" placeholder="Tracking"
                      value={itemTrackEdit[item.id] || ""}
                      onChange={e => setItemTrackEdit(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="ui-input ui-input-sm w-32"
                    />
                    <button disabled={savingItemId === item.id}
                      onClick={() => guardarTrackingItem(item.id, compra.id)}
                      className="ui-button ui-button-sm disabled:opacity-50">
                      {savingItemId === item.id ? "…" : "Guardar"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ));
        })()}
      </div>
    );
  }

  /* ── Renderiza el bloque de tracking (reutilizado en ambos casos) ── */
  function renderTrackingBand(compra, compact) {
    const effectiveTracking = compra.single_item_tracking || compra.tracking_number;
    const px = compact ? "px-3" : "px-4";
    const inputW = compact ? "min-w-[120px] max-w-[180px]" : "min-w-[150px] max-w-[220px]";
    const bandStyle = { background: "var(--surface-2)", borderTop: "1px solid var(--border)" };

    const label = (
      <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: "var(--text-3)" }}>
        Tracking
      </span>
    );

    const trackingPill = (value) => (
      <span className="px-2.5 py-1 rounded-lg font-mono text-xs"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
        {value}
      </span>
    );

    if (compra.item_count === 1) {
      if (effectiveTracking && trackingEdit[compra.id] === undefined) {
        return (
          <div className={`${px} py-2.5`} style={bandStyle}>
            <div className="flex items-center gap-2.5">
              {label}
              {trackingPill(effectiveTracking)}
              <button onClick={() => setTrackingEdit(prev => ({ ...prev, [compra.id]: effectiveTracking }))}
                className="text-xs hover:underline transition-colors" style={{ color: "var(--text-3)" }}>
                Editar
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className={`${px} py-2.5`} style={bandStyle}>
          <div className="flex items-center gap-2 flex-wrap">
            {label}
            <input type="text" placeholder="Número de tracking"
              value={trackingEdit[compra.id] || ""}
              onChange={e => setTrackingEdit({ ...trackingEdit, [compra.id]: e.target.value })}
              className={`flex-1 ${inputW} ui-input ui-input-sm`}
            />
            <button onClick={() => guardarTrackingSingle(compra.id, compra.single_item_id)}
              className="ui-button ui-button-sm flex-shrink-0">
              Guardar
            </button>
          </div>
        </div>
      );
    }

    if (compra.tracking_number) {
      return (
        <div className={`${px} py-2.5`} style={bandStyle}>
          <div className="flex items-center gap-2.5">
            {label}
            {trackingPill(compra.tracking_number)}
          </div>
        </div>
      );
    }

    return (
      <div className={`${px} py-2.5`} style={bandStyle}>
        <div className="flex items-center gap-2 flex-wrap">
          {label}
          <input type="text" placeholder="Número de tracking"
            className={`flex-1 ${inputW} ui-input ui-input-sm`}
            onChange={e => setTrackingEdit({ ...trackingEdit, [compra.id]: e.target.value })}
          />
          <button onClick={() => guardarTracking(compra.id)}
            className="ui-button ui-button-sm flex-shrink-0">
            Guardar
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Compras registradas
        </h3>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
          {compras.length} {compras.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {/* Búsqueda */}
      <input
        type="text"
        placeholder="Buscar cliente, producto, página..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        className="ui-input max-w-md"
      />

      {/* Filtros rápidos de tracking */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {[
          { key: "todos",             label: "Todos" },
          { key: "sin_tracking",      label: "Sin tracking" },
          { key: "pendiente_empresa", label: "Pend. empresa" },
          { key: "pendiente_cliente", label: "Pend. cliente" },
          { key: "recibidos",         label: "Recibidos" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltroTracking(key)}
            style={{
              padding: "5px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: filtroTracking === key ? 600 : 500,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.15s",
              border: `1px solid ${filtroTracking === key ? "var(--text)" : "var(--border)"}`,
              background: filtroTracking === key ? "var(--text)" : "var(--surface-2)",
              color: filtroTracking === key ? "var(--surface)" : "var(--text-3)",
              whiteSpace: "nowrap",
            }}
          >
            {label} ({conteos[key]})
          </button>
        ))}
      </div>

      {/* Empty */}
      {grupos.length === 0 && (
        <div className="py-16 text-center text-sm rounded-2xl"
          style={{ color: "var(--text-3)", border: "1px dashed var(--border)" }}>
          {filtro ? "Sin resultados para la búsqueda." : "No hay compras registradas."}
        </div>
      )}

      {/* ── Grupos / Cards ── */}
      {grupos.map(grupo => {
        const isSingle   = grupo.ordenes.length === 1;
        const c0         = grupo.ordenes[0];
        const c0expanded = expandedId === c0.id;
        const c0hasMulti = c0.item_count > 1;
        const c0est      = c0.fecha_estimada    ? c0.fecha_estimada.split("T")[0].split("-").reverse().join("/")    : null;
        const c0prov     = c0.fecha_entrega_proveedor ? c0.fecha_entrega_proveedor.split("T")[0].split("-").reverse().join("/") : null;
        const c0hasBody  = !!(c0.descripcion_producto || c0est || c0prov);

        return (
          <div key={grupo.key}>

            {/* ── CARD (única estructura para todos) ── */}
            <div
              className={`overflow-hidden transition-all ${isSingle && c0expanded ? "rounded-t-xl" : "rounded-xl"}`}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >

              {/* ZONA A — ENCABEZADO */}
              <div className="px-4 pt-3 pb-3 flex items-start gap-3"
                style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>

                <div className="flex-1 min-w-0 flex flex-col gap-1">

                  {/* Fila 1: cliente + destino + ref SOL + contador */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                      {grupo.cliente_nombre}
                    </span>
                    {grupo.destino && (
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        · {grupo.destino}
                      </span>
                    )}
                    {grupo.codigo_solicitud && (
                      <span className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>
                        · {grupo.codigo_solicitud}
                      </span>
                    )}
                    {!isSingle && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                        {grupo.ordenes.length} órdenes
                      </span>
                    )}
                  </div>

                  {/* Fila 2 (solo si 1 orden): proveedor + nº orden + link */}
                  {isSingle && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold leading-tight" style={{ color: "var(--text)" }}>
                        {c0.proveedor}
                      </span>
                      {c0.numero_orden && (
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
                          #{c0.numero_orden}
                        </span>
                      )}
                      {c0.url_orden && (
                        <a href={c0.url_orden} target="_blank" rel="noopener noreferrer"
                          className="text-xs hover:underline transition-colors"
                          style={{ color: "var(--accent)" }}>
                          Ver orden
                        </a>
                      )}
                    </div>
                  )}

                </div>

                {/* Acciones solo para orden única */}
                {isSingle && (
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <Badge type={c0.comprado_por === "empresa" ? "empresa" : "default"}>
                      {c0.comprado_por === "empresa" ? "Empresa" : "Cliente"}
                    </Badge>
                    <select value={c0.estado || "reparto"}
                      onChange={e => cambiarEstado(c0.id, e.target.value)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border-none outline-none cursor-pointer hover:opacity-80 transition-opacity"
                      style={getEstadoStyle(c0.estado || "reparto")}>
                      <option value="reparto">En Reparto</option>
                      <option value="warehouse">En Warehouse</option>
                      <option value="recibido">En Bolivia</option>
                    </select>
                    <button onClick={() => abrirEditar(c0)} title="Editar orden"
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-3)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
                      <Pencil size={13} />
                    </button>
                  </div>
                )}

              </div>

              {/* ── Contenido para orden única ── */}
              {isSingle && (
                <>
                  {/* Cuerpo: descripción + fechas */}
                  {c0hasBody && (
                    <div className="px-4 py-3 flex flex-col gap-1.5" style={{ background: "var(--surface)" }}>
                      {c0.descripcion_producto && (
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                          {c0.descripcion_producto}
                        </p>
                      )}
                      {(c0est || c0prov) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                          {c0est && (
                            <span style={{ color: "var(--text-3)" }}>
                              Fecha compra{" "}
                              <span className="font-medium tabular-nums" style={{ color: "var(--text-2)" }}>{c0est}</span>
                            </span>
                          )}
                          {c0prov && (
                            <span style={{ color: "var(--text-3)" }}>
                              Entrega estimada prov.{" "}
                              <span className="font-medium tabular-nums" style={{ color: "var(--text-2)" }}>{c0prov}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Responsable tracking + estado tracking */}
                  {(c0.tracking_responsible || c0.tracking_status) && (
                    <div className="px-4 py-2 flex items-center gap-3 flex-wrap"
                      style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
                      {c0.tracking_responsible && (
                        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                          Resp. tracking:{" "}
                          <span className="font-semibold" style={{ color: "var(--text-2)" }}>
                            {c0.tracking_responsible === "empresa" ? "Empresa" : "Cliente"}
                          </span>
                        </span>
                      )}
                      {c0.tracking_status && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={getTrackingStatusStyle(c0.tracking_status)}>
                          {TRACKING_STATUS_LABEL[c0.tracking_status] || c0.tracking_status}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Banda de tracking o footer de ítems */}
                  {!c0hasMulti
                    ? renderTrackingBand(c0, false)
                    : (
                      <div className="px-4 py-2.5 flex items-center justify-between gap-3"
                        style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>
                          Tracking individual por ítem
                        </span>
                        <button onClick={() => toggleItems(c0.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                          style={{ color: c0expanded ? "var(--text)" : "var(--text-3)" }}>
                          {c0expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {c0expanded ? "Ocultar ítems" : `Ver ${c0.item_count} ítems`}
                        </button>
                      </div>
                    )
                  }
                </>
              )}

              {/* ── Contenido para múltiples órdenes ── */}
              {!isSingle && (
                <div className="px-3 pb-3 pt-2 flex flex-col gap-2">
                  {grupo.ordenes.map(compra => {
                    const isExp   = expandedId === compra.id;
                    const hasMulti = compra.item_count > 1;
                    const fEst    = compra.fecha_estimada    ? compra.fecha_estimada.split("T")[0].split("-").reverse().join("/")    : null;
                    const fProv   = compra.fecha_entrega_proveedor ? compra.fecha_entrega_proveedor.split("T")[0].split("-").reverse().join("/") : null;
                    const hasBody = !!(compra.descripcion_producto || fEst || fProv);

                    return (
                      <div key={compra.id}>

                        {/* Mini-card de orden */}
                        <div className={`overflow-hidden ${isExp ? "rounded-t-xl" : "rounded-xl"}`}
                          style={{ border: "1px solid var(--border)" }}>

                          {/* Mini-header */}
                          <div className="px-3 py-2.5 flex items-start gap-2"
                            style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                                  {compra.proveedor}
                                </span>
                                {compra.numero_orden && (
                                  <span className="font-mono text-xs px-1.5 py-0.5 rounded-md"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
                                    #{compra.numero_orden}
                                  </span>
                                )}
                                {compra.url_orden && (
                                  <a href={compra.url_orden} target="_blank" rel="noopener noreferrer"
                                    className="text-xs hover:underline transition-colors"
                                    style={{ color: "var(--accent)" }}>
                                    Ver orden
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Badge type={compra.comprado_por === "empresa" ? "empresa" : "default"}>
                                {compra.comprado_por === "empresa" ? "Empresa" : "Cliente"}
                              </Badge>
                              <select value={compra.estado || "reparto"}
                                onChange={e => cambiarEstado(compra.id, e.target.value)}
                                className="px-2 py-0.5 rounded-full text-xs font-semibold border-none outline-none cursor-pointer hover:opacity-80 transition-opacity"
                                style={getEstadoStyle(compra.estado || "reparto")}>
                                <option value="reparto">En Reparto</option>
                                <option value="warehouse">En Warehouse</option>
                                <option value="recibido">En Bolivia</option>
                              </select>
                              <button onClick={() => abrirEditar(compra)} title="Editar"
                                className="p-1 rounded-lg transition-colors"
                                style={{ color: "var(--text-3)" }}
                                onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
                                <Pencil size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Mini-body */}
                          {hasBody && (
                            <div className="px-3 py-2 flex flex-col gap-1" style={{ background: "var(--surface)" }}>
                              {compra.descripcion_producto && (
                                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                                  {compra.descripcion_producto}
                                </p>
                              )}
                              {(fEst || fProv) && (
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                                  {fEst && (
                                    <span style={{ color: "var(--text-3)" }}>
                                      Fecha compra{" "}
                                      <span className="font-medium tabular-nums" style={{ color: "var(--text-2)" }}>{fEst}</span>
                                    </span>
                                  )}
                                  {fProv && (
                                    <span style={{ color: "var(--text-3)" }}>
                                      Entrega estimada prov.{" "}
                                      <span className="font-medium tabular-nums" style={{ color: "var(--text-2)" }}>{fProv}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Responsable tracking + estado tracking */}
                          {(compra.tracking_responsible || compra.tracking_status) && (
                            <div className="px-3 py-1.5 flex items-center gap-3 flex-wrap"
                              style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
                              {compra.tracking_responsible && (
                                <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                                  Resp.:{" "}
                                  <span className="font-semibold" style={{ color: "var(--text-2)" }}>
                                    {compra.tracking_responsible === "empresa" ? "Empresa" : "Cliente"}
                                  </span>
                                </span>
                              )}
                              {compra.tracking_status && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                  style={getTrackingStatusStyle(compra.tracking_status)}>
                                  {TRACKING_STATUS_LABEL[compra.tracking_status] || compra.tracking_status}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Tracking o expand footer */}
                          {!hasMulti
                            ? renderTrackingBand(compra, true)
                            : (
                              <div className="px-3 py-2 flex items-center justify-between gap-2"
                                style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
                                <span className="text-xs" style={{ color: "var(--text-3)" }}>Tracking por ítem</span>
                                <button onClick={() => toggleItems(compra.id)}
                                  className="flex items-center gap-1 text-xs font-semibold transition-colors"
                                  style={{ color: isExp ? "var(--text)" : "var(--text-3)" }}>
                                  {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  {isExp ? "Ocultar" : `Ver ${compra.item_count} ítems`}
                                </button>
                              </div>
                            )
                          }

                        </div>

                        {/* Panel expandido de esta orden */}
                        {isExp && renderItemsPanel(compra, "rounded-b-xl")}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Panel expandido para orden única (fuera del card) */}
            {isSingle && c0expanded && renderItemsPanel(c0, "rounded-b-2xl")}

          </div>
        );
      })}

      {/* ── Modal de edición ── */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md max-h-[88vh] overflow-hidden flex flex-col"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
              style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Editar orden</h3>
              <button onClick={() => setEditingId(null)}
                className="p-1.5 rounded-lg text-sm leading-none transition-colors"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface-3)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-3">

                {[
                  { label: "Página / Proveedor",   key: "proveedor",            type: "text",  ph: "" },
                  { label: "Número de orden",       key: "numero_orden",         type: "text",  ph: "" },
                  { label: "Link de la orden",      key: "url_orden",            type: "text",  ph: "https://..." },
                  { label: "Descripción producto",  key: "descripcion_producto", type: "text",  ph: "" },
                ].map(({ label, key, type, ph }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                      {label}
                    </label>
                    <input type={type} placeholder={ph} value={editForm[key] || ""}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="ui-input w-full"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Fecha compra",       key: "fecha_estimada" },
                    { label: "Entrega est. prov.", key: "fecha_entrega_proveedor" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                        {label}
                      </label>
                      <input type="date" value={editForm[key] || ""}
                        onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        className="ui-input w-full"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    Comprado por
                  </label>
                  <select value={editForm.comprado_por || "cliente"}
                    onChange={e => setEditForm(f => ({ ...f, comprado_por: e.target.value }))}
                    className="ui-select w-full">
                    <option value="cliente">Cliente</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    Responsable del tracking
                  </label>
                  <select value={editForm.tracking_responsible || "cliente"}
                    onChange={e => setEditForm(f => ({ ...f, tracking_responsible: e.target.value }))}
                    className="ui-select w-full">
                    <option value="cliente">Cliente</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>

              </div>

              {editError && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
                  {editError}
                </p>
              )}

              <div className="flex justify-end">
                <button onClick={guardarEdicion} disabled={savingEdit}
                  className="ui-button disabled:opacity-50">
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>

              <div className="pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  Ítems de la compra
                </p>
                {loadingItems ? (
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Cargando ítems...</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      {editItems.map((item, idx) => {
                        if (item.id && editDeleteIds.includes(item.id)) return null;
                        const bloqueado = Boolean(item.id) && (item.estado !== "pendiente" || item.warehouse_confirmado === true);
                        return (
                          <div key={item.id || idx}
                            className={`grid grid-cols-[minmax(0,1fr)_56px_24px] gap-1.5 items-center${bloqueado ? " opacity-60" : ""}`}>
                            <input disabled={bloqueado} value={item.descripcion}
                              onChange={e => updateEditItemDescripcion(idx, e.target.value)}
                              placeholder="Descripción"
                              className="ui-input ui-input-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <input type="text" inputMode="numeric" pattern="[0-9]*"
                              disabled={bloqueado} value={item.cantidad}
                              onChange={e => updateEditItemCantidad(idx, e.target.value)}
                              placeholder="Cant."
                              className="ui-input ui-input-sm text-center disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            {bloqueado ? (
                              <span className="text-xs text-center" style={{ color: "var(--border-strong)" }}>🔒</span>
                            ) : (
                              <button type="button" onClick={() => marcarEliminarItem(item, idx)}
                                className="text-xs text-center transition-colors"
                                style={{ color: "var(--text-3)" }}
                                onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>✕</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={agregarEditItem}
                      className="text-xs text-left hover:underline" style={{ color: "var(--text-3)" }}>
                      + Agregar ítem
                    </button>
                    {itemsError && (
                      <p className="text-xs px-3 py-2 rounded-xl" style={{ color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
                        {itemsError}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <button onClick={guardarItems} disabled={savingItems}
                        className="ui-button ui-button-sm disabled:opacity-50">
                        {savingItems ? "Guardando..." : "Guardar ítems"}
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
