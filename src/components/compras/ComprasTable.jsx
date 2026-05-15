import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { API_URL } from "../../config/api";
import Badge from "../ui/Badge";

export default function ComprasTable({ reload }) {
  const [compras,          setCompras]          = useState([]);
  const [trackingEdit,     setTrackingEdit]      = useState({});
  const [loading,          setLoading]           = useState(true);
  const [filtro,           setFiltro]            = useState("");
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
      setCompras(prev => prev.map(c => c.id === id ? { ...c, tracking_number: tracking } : c));
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
        c.id === compraId ? { ...c, single_item_tracking: tracking.trim() } : c
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
      setCompras(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error actualizando estado");
    }
  }

  function getEstadoColor(estado) {
    switch (estado) {
      case "reparto":   return "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200";
      case "entregado": return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200";
      case "recibido":  return "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200";
      default:          return "bg-slate-200 text-slate-600 dark:bg-neutral-700 dark:text-neutral-300";
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

  function getItemEstadoColor(estado) {
    switch (estado) {
      case "warehouse":        return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200";
      case "recibido_bolivia": return "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200";
      case "entregado":        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
      default:                 return "bg-slate-200 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300";
    }
  }

  /* ── Filtro ─────────────────────────────────────────────────── */
  const comprasFiltradas = compras.filter(c => {
    const texto = filtro.toLowerCase();
    return (
      c.cliente_nombre?.toLowerCase().includes(texto) ||
      c.descripcion_producto?.toLowerCase().includes(texto) ||
      c.proveedor?.toLowerCase().includes(texto) ||
      c.numero_orden?.toLowerCase().includes(texto)
    );
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
      <div className={`
        border border-t-0 border-slate-200 dark:border-neutral-700
        bg-slate-100 dark:bg-neutral-950/70
        px-3 pt-2.5 pb-3 flex flex-col gap-1.5
        ${borderRadius}
      `}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 px-0.5 pb-0.5">
          Ítems · {items ? items.length : "…"}
        </p>
        {!items ? (
          <p className="text-xs text-slate-400 dark:text-neutral-500 py-1">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-neutral-500 py-1">Sin ítems.</p>
        ) : (() => {
          const trackingCount = {};
          items.forEach(it => {
            if (!it.tracking_number) return;
            trackingCount[it.tracking_number] = (trackingCount[it.tracking_number] || 0) + 1;
          });
          return items.map((item, idx) => (
            <div key={item.id}
              className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800
                rounded-xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 tabular-nums w-4 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-tight">
                    {item.descripcion}
                  </p>
                  {item.cantidad > 1 && (
                    <span className="text-xs text-slate-400 dark:text-neutral-500">×{item.cantidad}</span>
                  )}
                </div>
                <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${getItemEstadoColor(item.estado)}`}>
                  {formatEstadoItem(item.estado)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {item.tracking_number ? (
                  itemTrackEdit[item.id] !== undefined ? (
                    <div className="flex items-center gap-1.5">
                      <input type="text" value={itemTrackEdit[item.id]}
                        onChange={e => setItemTrackEdit(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="px-2 py-1.5 rounded-lg text-xs w-36 border border-slate-200 dark:border-neutral-700
                          bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                          focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500"
                      />
                      <button disabled={savingItemId === item.id}
                        onClick={() => guardarTrackingItem(item.id, compra.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white disabled:opacity-50 transition-colors">
                        {savingItemId === item.id ? "…" : "OK"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-mono text-slate-800 dark:text-neutral-200">
                        {item.tracking_number}
                      </span>
                      {trackingCount[item.tracking_number] > 1 && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">compartido</span>
                      )}
                      <button onClick={() => setItemTrackEdit(prev => ({ ...prev, [item.id]: item.tracking_number }))}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors underline">
                        Editar
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input type="text" placeholder="Tracking"
                      value={itemTrackEdit[item.id] || ""}
                      onChange={e => setItemTrackEdit(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg text-xs w-32 border border-slate-200 dark:border-neutral-700
                        bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                        focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500"
                    />
                    <button disabled={savingItemId === item.id}
                      onClick={() => guardarTrackingItem(item.id, compra.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white disabled:opacity-50 transition-colors">
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

    const label = (
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 flex-shrink-0">
        Tracking
      </span>
    );

    const trackingPill = (value) => (
      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono text-xs text-slate-800 dark:text-neutral-200">
        {value}
      </span>
    );

    if (compra.item_count === 1) {
      if (effectiveTracking && trackingEdit[compra.id] === undefined) {
        return (
          <div className={`${px} py-2.5 bg-slate-100 dark:bg-neutral-800/30 border-t border-slate-200 dark:border-neutral-700`}>
            <div className="flex items-center gap-2.5">
              {label}
              {trackingPill(effectiveTracking)}
              <button onClick={() => setTrackingEdit(prev => ({ ...prev, [compra.id]: effectiveTracking }))}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors underline">
                Editar
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className={`${px} py-2.5 bg-slate-100 dark:bg-neutral-800/30 border-t border-slate-200 dark:border-neutral-700`}>
          <div className="flex items-center gap-2 flex-wrap">
            {label}
            <input type="text" placeholder="Número de tracking"
              value={trackingEdit[compra.id] || ""}
              onChange={e => setTrackingEdit({ ...trackingEdit, [compra.id]: e.target.value })}
              className={`flex-1 ${inputW} px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition`}
            />
            <button onClick={() => guardarTrackingSingle(compra.id, compra.single_item_id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white transition-colors">
              Guardar
            </button>
          </div>
        </div>
      );
    }

    if (compra.tracking_number) {
      return (
        <div className={`${px} py-2.5 bg-slate-100 dark:bg-neutral-800/30 border-t border-slate-200 dark:border-neutral-700`}>
          <div className="flex items-center gap-2.5">
            {label}
            {trackingPill(compra.tracking_number)}
          </div>
        </div>
      );
    }

    return (
      <div className={`${px} py-2.5 bg-slate-100 dark:bg-neutral-800/30 border-t border-slate-200 dark:border-neutral-700`}>
        <div className="flex items-center gap-2 flex-wrap">
          {label}
          <input type="text" placeholder="Número de tracking"
            className={`flex-1 ${inputW} px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition`}
            onChange={e => setTrackingEdit({ ...trackingEdit, [compra.id]: e.target.value })}
          />
          <button onClick={() => guardarTracking(compra.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white transition-colors">
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
          <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
          Compras registradas
        </h3>
        <span className="text-xs text-slate-400 dark:text-neutral-500 tabular-nums">
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

      {/* Empty */}
      {grupos.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400 dark:text-neutral-500
          border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
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
            <div className={`
              bg-white dark:bg-neutral-900
              border border-slate-200 dark:border-neutral-800
              shadow-md dark:shadow-black/30
              overflow-hidden transition-shadow hover:shadow-lg
              ${isSingle && c0expanded ? "rounded-t-2xl" : "rounded-2xl"}
            `}>

              {/* ZONA A — ENCABEZADO: cliente + destino + ref SOL + proveedor (si 1 orden) */}
              <div className="bg-slate-100 dark:bg-neutral-800/70 border-b border-slate-200 dark:border-neutral-800 px-4 pt-3 pb-3 flex items-start gap-3">

                <div className="flex-1 min-w-0 flex flex-col gap-1">

                  {/* Fila 1: cliente + destino + ref SOL + contador */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {grupo.cliente_nombre}
                    </span>
                    {grupo.destino && (
                      <span className="text-xs text-slate-500 dark:text-neutral-500">
                        · {grupo.destino}
                      </span>
                    )}
                    {grupo.codigo_solicitud && (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 px-1.5 py-0.5 rounded">
                        {grupo.codigo_solicitud}
                      </span>
                    )}
                    {!isSingle && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                        {grupo.ordenes.length} órdenes
                      </span>
                    )}
                  </div>

                  {/* Fila 2 (solo si 1 orden): proveedor + nº orden + link */}
                  {isSingle && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                        {c0.proveedor}
                      </span>
                      {c0.numero_orden && (
                        <span className="font-mono text-xs text-slate-500 dark:text-neutral-500 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 px-1.5 py-0.5 rounded-md">
                          #{c0.numero_orden}
                        </span>
                      )}
                      {c0.url_orden && (
                        <a href={c0.url_orden} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:underline transition-colors">
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
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border-none outline-none cursor-pointer hover:opacity-80 transition-opacity ${getEstadoColor(c0.estado || "reparto")}`}>
                      <option value="reparto">En Reparto</option>
                      <option value="entregado">En Warehouse</option>
                      <option value="recibido">En Bolivia</option>
                    </select>
                    <button onClick={() => abrirEditar(c0)} title="Editar orden"
                      className="p-1.5 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700/60 transition-colors">
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
                    <div className="px-4 py-3 bg-white dark:bg-neutral-900 flex flex-col gap-1.5">
                      {c0.descripcion_producto && (
                        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                          {c0.descripcion_producto}
                        </p>
                      )}
                      {(c0est || c0prov) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                          {c0est && (
                            <span className="text-slate-400 dark:text-neutral-500">
                              Fecha compra{" "}
                              <span className="font-medium tabular-nums text-slate-700 dark:text-neutral-300">{c0est}</span>
                            </span>
                          )}
                          {c0prov && (
                            <span className="text-slate-400 dark:text-neutral-500">
                              Entrega estimada prov.{" "}
                              <span className="font-medium tabular-nums text-slate-700 dark:text-neutral-300">{c0prov}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Banda de tracking o footer de ítems */}
                  {!c0hasMulti
                    ? renderTrackingBand(c0, false)
                    : (
                      <div className="px-4 py-2.5 bg-slate-100 dark:bg-neutral-800/50 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400 dark:text-neutral-500">
                          Tracking individual por ítem
                        </span>
                        <button onClick={() => toggleItems(c0.id)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${c0expanded ? "text-slate-700 dark:text-neutral-200" : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100"}`}>
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
                        <div className={`border border-slate-200 dark:border-neutral-700 overflow-hidden ${isExp ? "rounded-t-xl" : "rounded-xl"}`}>

                          {/* Mini-header */}
                          <div className="bg-slate-100 dark:bg-neutral-800/40 border-b border-slate-200 dark:border-neutral-700 px-3 py-2.5 flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                  {compra.proveedor}
                                </span>
                                {compra.numero_orden && (
                                  <span className="font-mono text-xs text-slate-500 dark:text-neutral-500 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 px-1.5 py-0.5 rounded-md">
                                    #{compra.numero_orden}
                                  </span>
                                )}
                                {compra.url_orden && (
                                  <a href={compra.url_orden} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:underline transition-colors">
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
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold border-none outline-none cursor-pointer hover:opacity-80 transition-opacity ${getEstadoColor(compra.estado || "reparto")}`}>
                                <option value="reparto">En Reparto</option>
                                <option value="entregado">En Warehouse</option>
                                <option value="recibido">En Bolivia</option>
                              </select>
                              <button onClick={() => abrirEditar(compra)} title="Editar"
                                className="p-1 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700/60 transition-colors">
                                <Pencil size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Mini-body */}
                          {hasBody && (
                            <div className="px-3 py-2 bg-white dark:bg-neutral-900 flex flex-col gap-1">
                              {compra.descripcion_producto && (
                                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                                  {compra.descripcion_producto}
                                </p>
                              )}
                              {(fEst || fProv) && (
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                                  {fEst && (
                                    <span className="text-slate-400 dark:text-neutral-500">
                                      Fecha compra{" "}
                                      <span className="font-medium tabular-nums text-slate-700 dark:text-neutral-300">{fEst}</span>
                                    </span>
                                  )}
                                  {fProv && (
                                    <span className="text-slate-400 dark:text-neutral-500">
                                      Entrega estimada prov.{" "}
                                      <span className="font-medium tabular-nums text-slate-700 dark:text-neutral-300">{fProv}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tracking o expand footer */}
                          {!hasMulti
                            ? renderTrackingBand(compra, true)
                            : (
                              <div className="px-3 py-2 bg-slate-100 dark:bg-neutral-800/30 border-t border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                                <span className="text-xs text-slate-400 dark:text-neutral-500">Tracking por ítem</span>
                                <button onClick={() => toggleItems(compra.id)}
                                  className={`flex items-center gap-1 text-xs font-semibold transition-colors ${isExp ? "text-slate-700 dark:text-neutral-200" : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100"}`}>
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
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-neutral-700 max-h-[88vh] overflow-hidden flex flex-col">

            <div className="px-5 py-4 bg-slate-100 dark:bg-neutral-800/70 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Editar orden</h3>
              <button onClick={() => setEditingId(null)}
                className="p-1.5 rounded-lg text-sm leading-none text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 transition-colors">
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
                    <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                      {label}
                    </label>
                    <input type={type} placeholder={ph} value={editForm[key] || ""}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Fecha compra",       key: "fecha_estimada" },
                    { label: "Entrega est. prov.", key: "fecha_entrega_proveedor" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                        {label}
                      </label>
                      <input type="date" value={editForm[key] || ""}
                        onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                    Comprado por
                  </label>
                  <select value={editForm.comprado_por || "cliente"}
                    onChange={e => setEditForm(f => ({ ...f, comprado_por: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition">
                    <option value="cliente">Cliente</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>

              </div>

              {editError && (
                <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-3 py-2 rounded-xl">
                  {editError}
                </p>
              )}

              <div className="flex justify-end">
                <button onClick={guardarEdicion} disabled={savingEdit}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors">
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>

              <div className="border-t border-slate-200 dark:border-neutral-800 pt-4 flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Ítems de la compra
                </p>
                {loadingItems ? (
                  <p className="text-xs text-slate-400">Cargando ítems...</p>
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
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 disabled:bg-slate-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:bg-white"
                            />
                            <input type="text" inputMode="numeric" pattern="[0-9]*"
                              disabled={bloqueado} value={item.cantidad}
                              onChange={e => updateEditItemCantidad(idx, e.target.value)}
                              placeholder="Cant."
                              className="px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-center text-neutral-900 dark:text-neutral-100 disabled:bg-slate-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed focus:outline-none"
                            />
                            {bloqueado ? (
                              <span className="text-slate-300 dark:text-neutral-600 text-xs text-center">🔒</span>
                            ) : (
                              <button type="button" onClick={() => marcarEliminarItem(item, idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors text-xs text-center">✕</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={agregarEditItem}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline text-left">
                      + Agregar ítem
                    </button>
                    {itemsError && (
                      <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-3 py-2 rounded-xl">
                        {itemsError}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <button onClick={guardarItems} disabled={savingItems}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 hover:opacity-80 disabled:opacity-50 transition">
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
