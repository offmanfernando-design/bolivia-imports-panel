import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";

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

  async function toggleItems(compraId) {
    if (expandedId === compraId) {
      setExpandedId(null);
      return;
    }
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

  function abrirEditar(compra) {
    setEditingId(compra.id);
    setEditForm({
      proveedor: compra.proveedor || "",
      numero_orden: compra.numero_orden || "",
      url_orden: compra.url_orden || "",
      fecha_estimada: compra.fecha_estimada
        ? compra.fecha_estimada.split("T")[0]
        : "",
      descripcion_producto: compra.descripcion_producto || "",
    });
    setEditError("");
  }

  async function guardarEdicion() {
    if (!editForm.proveedor.trim()) { setEditError("Proveedor requerido"); return; }
    if (!editForm.numero_orden.trim()) { setEditError("Número de orden requerido"); return; }
    setSavingEdit(true);
    setEditError("");
    try {
      const res = await fetch(`${API_URL}/compras/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor: editForm.proveedor.trim(),
          numero_orden: editForm.numero_orden.trim(),
          url_orden: editForm.url_orden.trim() || null,
          fecha_estimada: editForm.fecha_estimada || null,
          descripcion_producto: editForm.descripcion_producto.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar");
      setCompras(prev => prev.map(c => {
        if (c.id !== editingId) return c;
        return {
          ...c,
          proveedor: json.data.proveedor,
          numero_orden: json.data.numero_orden,
          url_orden: json.data.url_orden,
          fecha_estimada: json.data.fecha_estimada,
          descripcion_producto: json.data.descripcion_producto,
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

  function formatEstado(estado) {
    switch (estado) {
      case "reparto":   return "En Reparto";
      case "entregado": return "En Warehouse";
      case "recibido":  return "En Bolivia";
      default:          return "Reparto";
    }
  }

  function getEstadoColor(estado) {
    switch (estado) {
      case "reparto":   return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "entregado": return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "recibido":  return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      default:          return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  function formatEstadoItem(estado) {
    switch (estado) {
      case "pendiente":         return "Pendiente";
      case "warehouse":         return "Warehouse";
      case "recibido_bolivia":  return "En Bolivia";
      case "entregado":         return "Entregado";
      default:                  return estado || "—";
    }
  }

  const comprasFiltradas = compras.filter(c => {
    const texto = filtro.toLowerCase();
    return (
      c.cliente_nombre?.toLowerCase().includes(texto) ||
      c.descripcion_producto?.toLowerCase().includes(texto) ||
      c.proveedor?.toLowerCase().includes(texto) ||
      c.numero_orden?.toLowerCase().includes(texto)
    );
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        Cargando compras...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Compras registradas
        </h3>
        <span className="text-xs text-gray-400">{compras.length} registros</span>
      </div>

      <input
        type="text"
        placeholder="Buscar cliente, producto, página..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded dark:bg-[#111]"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="text-left px-3">Cliente</th>
              <th className="text-left px-3">Producto</th>
              <th className="text-left px-3">Página</th>
              <th className="text-left px-3">Orden</th>
              <th className="text-left px-3">Link</th>
              <th className="text-left px-3">Destino</th>
              <th className="text-left px-3">Fecha</th>
              <th className="text-left px-3">Estado</th>
              <th className="text-left px-3">Tracking</th>
              <th className="text-left px-3">Ítems</th>
            </tr>
          </thead>

          <tbody>
            {comprasFiltradas.map(compra => {
              const tracking     = compra.tracking_number;
              const estadoActual = compra.estado || "reparto";
              const isExpanded   = expandedId === compra.id;
              const fechaFormateada = compra.fecha_estimada
                ? compra.fecha_estimada.split("T")[0].split("-").reverse().join("/")
                : "—";
              const items = itemsMap[compra.id];

              return (
                <>
                  <tr
                    key={compra.id}
                    className="bg-gray-50 dark:bg-[#181818] rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] transition"
                  >
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {compra.cliente_nombre}
                    </td>

                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 max-w-[180px]">
                      <span className="block truncate" title={compra.descripcion_producto}>
                        {compra.descripcion_producto || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-3">{compra.proveedor}</td>

                    <td className="px-3 py-3">{compra.numero_orden || "—"}</td>

                    <td className="px-3 py-3">
                      {compra.url_orden ? (
                        <a href={compra.url_orden} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 underline text-xs hover:text-blue-400">
                          Abrir
                        </a>
                      ) : "—"}
                    </td>

                    <td className="px-3 py-3">{compra.destino || "—"}</td>

                    <td className="px-3 py-3 text-gray-400">{fechaFormateada}</td>

                    <td className="px-3 py-3">
                      <select
                        value={estadoActual}
                        onChange={e => cambiarEstado(compra.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer
                          ${getEstadoColor(estadoActual)} hover:opacity-80 transition`}
                      >
                        <option value="reparto">{formatEstado("reparto")}</option>
                        <option value="entregado">{formatEstado("entregado")}</option>
                        <option value="recibido">{formatEstado("recibido")}</option>
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      {compra.item_count === 1 ? (
                        (() => {
                          const effectiveTracking = compra.single_item_tracking || compra.tracking_number;
                          const isEditing = trackingEdit[compra.id] !== undefined;
                          return effectiveTracking && !isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-mono">
                                {effectiveTracking}
                              </span>
                              <button
                                onClick={() => setTrackingEdit(prev => ({ ...prev, [compra.id]: effectiveTracking }))}
                                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition underline">
                                Editar
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Tracking"
                                value={trackingEdit[compra.id] || ""}
                                onChange={e => setTrackingEdit({ ...trackingEdit, [compra.id]: e.target.value })}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-[#111]"
                              />
                              <button
                                onClick={() => guardarTrackingSingle(compra.id, compra.single_item_id)}
                                className="px-3 py-1 bg-black text-white rounded text-xs hover:opacity-80">
                                Guardar
                              </button>
                            </div>
                          );
                        })()
                      ) : compra.item_count > 1 ? (
                        <span className="text-xs text-neutral-400 italic">Tracking por ítem</span>
                      ) : (
                        tracking ? (
                          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs">
                            {tracking}
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Tracking"
                              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-[#111]"
                              onChange={e => setTrackingEdit({ ...trackingEdit, [compra.id]: e.target.value })}
                            />
                            <button
                              onClick={() => guardarTracking(compra.id)}
                              className="px-3 py-1 bg-black text-white rounded text-xs hover:opacity-80">
                              Guardar
                            </button>
                          </div>
                        )
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-1.5 items-center">
                        <button
                          onClick={() => abrirEditar(compra)}
                          className="px-2 py-1 rounded text-xs font-medium transition
                            bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400
                            hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        >
                          Editar
                        </button>
                        {compra.item_count > 1 && (
                          <button
                            onClick={() => toggleItems(compra.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition
                              ${isExpanded
                                ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                              }`}
                          >
                            {isExpanded ? "Cerrar" : "Ver ítems"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Panel de ítems expandible */}
                  {isExpanded && (
                    <tr key={`${compra.id}-items`}>
                      <td colSpan={10} className="px-3 pb-3">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700
                          bg-white dark:bg-neutral-900 p-4">

                          {!items ? (
                            <p className="text-xs text-neutral-400">Cargando ítems...</p>
                          ) : items.length === 0 ? (
                            <p className="text-xs text-neutral-400">Sin ítems registrados.</p>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                                Ítems de la compra
                              </p>
                              {(() => {
                                const trackingCount = {};
                                items.forEach(it => {
                                  if (!it.tracking_number) return;
                                  trackingCount[it.tracking_number] = (trackingCount[it.tracking_number] || 0) + 1;
                                });
                                return items.map((item, idx) => (
                                <div key={item.id}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2
                                    border-b border-neutral-100 dark:border-neutral-800 pb-3 last:border-0 last:pb-0">

                                  {/* Número + descripción */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-neutral-400 mb-0.5">Ítem {idx + 1}</p>
                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                                      {item.descripcion}
                                      {item.cantidad > 1 && (
                                        <span className="ml-1.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
                                          ×{item.cantidad}
                                        </span>
                                      )}
                                    </p>
                                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium
                                      ${item.estado === "entregado"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                        : item.estado === "recibido_bolivia"
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                                      }`}>
                                      {formatEstadoItem(item.estado)}
                                    </span>
                                  </div>

                                  {/* Tracking del ítem */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {item.tracking_number ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800
                                          text-xs font-mono text-neutral-700 dark:text-neutral-300">
                                          {item.tracking_number}
                                        </span>
                                        {trackingCount[item.tracking_number] > 1 && (
                                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                            compartido ({trackingCount[item.tracking_number]})
                                          </span>
                                        )}
                                        <button
                                          onClick={() => setItemTrackEdit(prev => ({
                                            ...prev, [item.id]: item.tracking_number,
                                          }))}
                                          className="text-xs text-neutral-400 hover:text-neutral-600
                                            dark:hover:text-neutral-200 transition underline">
                                          Editar
                                        </button>
                                        {itemTrackEdit[item.id] !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="text"
                                              value={itemTrackEdit[item.id]}
                                              onChange={e => setItemTrackEdit(prev =>
                                                ({ ...prev, [item.id]: e.target.value }))}
                                              className="px-2 py-1 border border-gray-300 dark:border-gray-600
                                                rounded text-xs bg-white dark:bg-neutral-800 w-36"
                                            />
                                            <button
                                              disabled={savingItemId === item.id}
                                              onClick={() => guardarTrackingItem(item.id, compra.id)}
                                              className="px-2 py-1 bg-black dark:bg-white
                                                text-white dark:text-black rounded text-xs
                                                hover:opacity-80 disabled:opacity-50 transition">
                                              {savingItemId === item.id ? "..." : "OK"}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-400 italic">
                                          Usa tracking general
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            placeholder="Tracking propio"
                                            value={itemTrackEdit[item.id] || ""}
                                            onChange={e => setItemTrackEdit(prev =>
                                              ({ ...prev, [item.id]: e.target.value }))}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600
                                              rounded text-xs bg-white dark:bg-neutral-800 w-36"
                                          />
                                          <button
                                            disabled={savingItemId === item.id}
                                            onClick={() => guardarTrackingItem(item.id, compra.id)}
                                            className="px-2 py-1 bg-black dark:bg-white
                                              text-white dark:text-black rounded text-xs
                                              hover:opacity-80 disabled:opacity-50 transition">
                                            {savingItemId === item.id ? "..." : "Guardar"}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-[#111] rounded-xl p-6 w-full max-w-md shadow-xl space-y-4
          border border-neutral-200 dark:border-neutral-800">

          <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Editar compra
          </h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Página / Proveedor</label>
              <input
                value={editForm.proveedor}
                onChange={e => setEditForm(f => ({ ...f, proveedor: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded
                  bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 mb-1">Número de orden</label>
              <input
                value={editForm.numero_orden}
                onChange={e => setEditForm(f => ({ ...f, numero_orden: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded
                  bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 mb-1">Link de la orden</label>
              <input
                value={editForm.url_orden}
                onChange={e => setEditForm(f => ({ ...f, url_orden: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded
                  bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 mb-1">Fecha estimada</label>
              <input
                type="date"
                value={editForm.fecha_estimada}
                onChange={e => setEditForm(f => ({ ...f, fecha_estimada: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded
                  bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 mb-1">Descripción producto</label>
              <input
                value={editForm.descripcion_producto}
                onChange={e => setEditForm(f => ({ ...f, descripcion_producto: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded
                  bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
              />
            </div>
          </div>

          {editError && (
            <p className="text-xs text-red-500 dark:text-red-400">{editError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setEditingId(null)}
              disabled={savingEdit}
              className="px-4 py-2 rounded text-sm text-neutral-600 dark:text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardarEdicion}
              disabled={savingEdit}
              className="px-4 py-2 rounded text-sm font-medium bg-black dark:bg-white
                text-white dark:text-black hover:opacity-80 transition disabled:opacity-50"
            >
              {savingEdit ? "Guardando..." : "Guardar"}
            </button>
          </div>

        </div>
      </div>
    )}
    </div>
  );
}
