import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

export default function PackageDrawer({ pkg }) {
  const [editingField, setEditingField] = useState(null);
  const [warehouseImage, setWarehouseImage] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [events, setEvents] = useState([]);
  const [items, setItems] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [localPkg, setLocalPkg] = useState(pkg);
  const [warehouseFechaInput, setWarehouseFechaInput] = useState(
    pkg?.warehouse_fecha ? new Date(pkg.warehouse_fecha).toISOString().split("T")[0] : ""
  );
  const [savingWfecha, setSavingWfecha] = useState(false);
  const [wfechaError, setWfechaError] = useState("");

  const [fechaEntregaProvInput, setFechaEntregaProvInput] = useState(
    pkg?.fecha_entrega_proveedor
      ? new Date(pkg.fecha_entrega_proveedor).toISOString().split("T")[0]
      : ""
  );
  const [savingFep, setSavingFep] = useState(false);
  const [fepError, setFepError] = useState("");

  useEffect(() => {
    setLocalPkg(pkg);
    setSelectedItemId(null);
    setWarehouseFechaInput(
      pkg?.warehouse_fecha ? new Date(pkg.warehouse_fecha).toISOString().split("T")[0] : ""
    );
    setFechaEntregaProvInput(
      pkg?.fecha_entrega_proveedor
        ? new Date(pkg.fecha_entrega_proveedor).toISOString().split("T")[0]
        : ""
    );
    setFepError("");
  }, [pkg]);

  const [data, setData] = useState({
    cliente: pkg?.cliente || pkg?.cliente_nombre || "",
    peso: pkg?.peso || "",
    volumen: pkg?.volumen || "",
    ubicacion: pkg?.ubicacion || "",
  });

  useEffect(() => {
    function handlePaste(e) {
      const item = Array.from(e.clipboardData?.items || [])
        .find(i => i.type.startsWith("image/"));
      if (item) {
        const file = item.getAsFile();
        if (file) setWarehouseImage(file);
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    if (!pkg?.id) return;

    fetch(`${API_URL}/compras/${pkg.id}/eventos`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setEvents(data.data);
      })
      .catch(console.error);
  }, [pkg?.id]);

  useEffect(() => {
    if (!pkg?.id) return;
    loadItems(pkg.id);
    loadFotos(pkg.id);
  }, [pkg?.id]);

  if (!localPkg) return null;

  const tracking = localPkg.tracking || localPkg.tracking_number;

  async function loadItems(id) {
    try {
      const res = await fetch(`${API_URL}/compras/${id}/items`);
      const json = await res.json();
      if (json.ok) setItems(json.data);
    } catch (err) {
      console.error("Error cargando ítems:", err);
    }
  }

  async function loadFotos(id) {
    try {
      const res = await fetch(`${API_URL}/compras/${id}/fotos`);
      const json = await res.json();
      if (json.ok) setFotos(json.data);
    } catch (err) {
      console.error("Error cargando fotos:", err);
    }
  }

  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const renderEditable = (field, value) => {
    if (editingField === field) {
      return (
        <input
          autoFocus
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => setEditingField(null)}
          className="bg-transparent border-b border-neutral-300 dark:border-neutral-600 outline-none text-sm text-neutral-900 dark:text-neutral-200"
        />
      );
    }

    return (
      <p
        onClick={() => setEditingField(field)}
        className="font-medium text-neutral-900 dark:text-neutral-200 cursor-pointer hover:text-black dark:hover:text-white transition-colors"
      >
        {value || "—"}
      </p>
    );
  };

  async function handleUpload() {
    if (!warehouseImage) return;

    try {
      setLoadingUpload(true);

      const formData = new FormData();
      formData.append("file", warehouseImage);
      if (selectedItemId) {
        formData.append("item_id", selectedItemId);
      }
      if (warehouseFechaInput) {
        formData.append("warehouse_fecha", warehouseFechaInput);
      }

      const res = await fetch(
        `${API_URL}/compras/${localPkg.id}/warehouse`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const result = await res.json();

      if (result.ok) {
        setLocalPkg(prev => ({
          ...prev,
          warehouse_confirmado: true,
          warehouse_imagen: result.data.warehouse_imagen,
          warehouse_fecha: result.data.warehouse_fecha,
          estado: result.data.estado,
          peso: result.data.peso,
          total: result.data.total,
        }));

        await loadItems(localPkg.id);
        await loadFotos(localPkg.id);

        setWarehouseImage(null);
        setSelectedItemId(null);
        if (result.data.warehouse_fecha) {
          setWarehouseFechaInput(new Date(result.data.warehouse_fecha).toISOString().split("T")[0]);
        }

        fetch(`${API_URL}/compras/${localPkg.id}/eventos`)
          .then(res => res.json())
          .then(data => {
            if (data.ok) setEvents(data.data);
          })
          .catch(console.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUpload(false);
    }
  }

  async function guardarFechaWarehouse() {
    if (!warehouseFechaInput) { setWfechaError("Ingresa una fecha"); return; }
    setSavingWfecha(true);
    setWfechaError("");
    try {
      const res = await fetch(`${API_URL}/compras/${localPkg.id}/warehouse-fecha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouse_fecha: warehouseFechaInput }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al guardar fecha");
      setLocalPkg(prev => ({ ...prev, warehouse_fecha: json.data.warehouse_fecha }));
    } catch (err) {
      setWfechaError(err.message || "Error guardando fecha");
    } finally {
      setSavingWfecha(false);
    }
  }

  async function guardarFechaEntregaProveedor() {
    setSavingFep(true);
    setFepError("");
    try {
      const res = await fetch(`${API_URL}/compras/${localPkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor: localPkg.proveedor,
          numero_orden: localPkg.numero_orden,
          fecha_entrega_proveedor: fechaEntregaProvInput || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al guardar fecha");
      setLocalPkg(prev => ({ ...prev, fecha_entrega_proveedor: json.data.fecha_entrega_proveedor }));
    } catch (err) {
      setFepError(err.message || "Error guardando fecha");
    } finally {
      setSavingFep(false);
    }
  }

  const fotosBadge = (confirmado) => confirmado
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400";

  return (
    <div className="w-full flex justify-center animate-[fadeIn_.25s_ease]">
      <div className="w-full max-w-3xl flex flex-col gap-14">

        <div className="flex flex-col gap-2">
          <p className="text-xs text-neutral-400 uppercase tracking-widest">
            Paquete
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-200">
            {tracking || "Sin tracking"}
          </h2>

          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
              {localPkg.estado || "en proceso"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md">
            Imprimir etiqueta
          </button>

          <button className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md">
            Cambiar estado
          </button>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Información del paquete
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-neutral-500">Cliente</p>
              {renderEditable("cliente", data.cliente)}
            </div>

            <div>
              <p className="text-neutral-500">Tracking</p>
              <p className="font-medium">{tracking || "—"}</p>
            </div>

            <div>
              <p className="text-neutral-500">Peso</p>
              <p className="font-medium">{localPkg.peso || "—"}</p>
            </div>

            <div>
              <p className="text-neutral-500">Volumen</p>
              <p className="font-medium">{localPkg.volumen || "—"}</p>
            </div>

            <div>
              <p className="text-neutral-500">Ubicación</p>
              <p className="font-medium">{localPkg.ubicacion || "—"}</p>
            </div>

            <div>
              <p className="text-neutral-500">Total</p>
              <p className="font-medium">
                {localPkg.total ? `${localPkg.total} Bs` : "—"}
              </p>
            </div>

            <div>
              <p className="text-neutral-500">Warehouse</p>
              {items.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium">
                    {items.filter(i => i.warehouse_confirmado).length}/{items.length} ítems confirmados
                  </p>
                  {localPkg.warehouse_fecha && (
                    <p className="text-xs text-neutral-400">
                      Última confirmación: {new Date(localPkg.warehouse_fecha).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-medium">
                  {localPkg.warehouse_fecha
                    ? new Date(localPkg.warehouse_fecha).toLocaleDateString()
                    : "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Confirmación Warehouse (USA)
          </h3>

          {/* Lista de ítems con estado warehouse */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2">
              {items.map(compraItem => (
                <div
                  key={compraItem.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {compraItem.descripcion}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${fotosBadge(compraItem.warehouse_confirmado)}`}>
                    {compraItem.warehouse_confirmado ? "warehouse ✔" : "pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4">

            {/* Fecha warehouse */}
            {!localPkg.warehouse_confirmado ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500">Fecha llegada warehouse</label>
                <input
                  type="date"
                  value={warehouseFechaInput}
                  onChange={e => setWarehouseFechaInput(e.target.value)}
                  className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm
                    bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                    focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-500">Fecha warehouse</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={warehouseFechaInput}
                    onChange={e => setWarehouseFechaInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm
                      bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                      focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
                  />
                  <button
                    onClick={guardarFechaWarehouse}
                    disabled={savingWfecha}
                    className="px-3 py-2 bg-black text-white rounded-md text-sm disabled:opacity-40 whitespace-nowrap"
                  >
                    {savingWfecha ? "..." : "Guardar fecha"}
                  </button>
                </div>
                {wfechaError && <p className="text-xs text-red-500">{wfechaError}</p>}
              </div>
            )}

            {/* Fecha entrega proveedor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-500">Fecha entrega proveedor</label>
              <p className="text-[10px] text-neutral-400">Fecha "Delivered" del proveedor/courier (Amazon, UPS, FedEx...)</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fechaEntregaProvInput}
                  onChange={e => setFechaEntregaProvInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm
                    bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                    focus:outline-none focus:ring-2 focus:ring-neutral-300/40"
                />
                <button
                  onClick={guardarFechaEntregaProveedor}
                  disabled={savingFep}
                  className="px-3 py-2 bg-black text-white rounded-md text-sm disabled:opacity-40 whitespace-nowrap"
                >
                  {savingFep ? "..." : "Guardar"}
                </button>
              </div>
              {fepError && <p className="text-xs text-red-500">{fepError}</p>}
            </div>

            {/* Selector de asociación */}
            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-neutral-500">Asociar foto a:</p>
                <p className="text-xs text-neutral-400">Usa "Foto general" si la imagen muestra toda la orden o varios productos juntos.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedItemId(null)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selectedItemId === null
                        ? "bg-black text-white border-black dark:bg-white dark:text-black"
                        : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    Foto general / varios ítems
                  </button>
                  {items.map(compraItem => (
                    <button
                      key={compraItem.id}
                      onClick={() => setSelectedItemId(compraItem.id)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        selectedItemId === compraItem.id
                          ? "bg-black text-white border-black dark:bg-white dark:text-black"
                          : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {compraItem.descripcion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zona de carga: drag/drop + Cmd+V */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) setWarehouseImage(file);
              }}
              className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer"
            >
              {warehouseImage ? (
                <img
                  src={URL.createObjectURL(warehouseImage)}
                  className="max-h-40 rounded-lg object-cover mx-auto"
                  alt="preview"
                />
              ) : (
                <p className="text-sm text-neutral-400">
                  Arrastra imagen aquí o pega con Cmd+V
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loadingUpload || !warehouseImage}
              className="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-40"
            >
              {loadingUpload ? "Subiendo..." : "Confirmar llegada"}
            </button>

            {/* Galería de fotos */}
            {fotos.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-neutral-500">Fotos registradas</p>
                <div className="flex flex-wrap gap-3">
                  {fotos.map(foto => (
                    <img
                      key={foto.id}
                      src={foto.url}
                      alt="warehouse"
                      onClick={() => window.open(foto.url, "_blank")}
                      title={foto.item_id ? "Foto de ítem" : "Foto general"}
                      className={`h-24 w-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 ${
                        foto.item_id
                          ? "border-blue-300 dark:border-blue-700"
                          : "border-neutral-200 dark:border-neutral-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fallback legacy: solo si no hay fotos en warehouse_fotos */}
            {fotos.length === 0 && localPkg.warehouse_imagen && (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-green-600">
                  ✔ Confirmado en warehouse
                </span>
                {localPkg.warehouse_fecha && (
                  <span className="text-xs text-neutral-400">
                    {new Date(localPkg.warehouse_fecha).toLocaleString()}
                  </span>
                )}
                <img
                  src={localPkg.warehouse_imagen}
                  alt="warehouse"
                  onClick={() => window.open(localPkg.warehouse_imagen, "_blank")}
                  className="rounded-lg max-h-40 object-cover border cursor-pointer hover:opacity-80"
                />
              </div>
            )}

          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 border rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Historial
          </h3>

          <div className="flex flex-col gap-6">
            {events.map((event, index) => (
              <div key={index} className="flex flex-col">
                <p className="text-sm">{event.descripcion}</p>
                <span className="text-xs text-neutral-400">
                  {event.fecha
                    ? new Date(event.fecha).toLocaleString()
                    : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
