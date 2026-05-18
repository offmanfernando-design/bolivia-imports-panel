import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";
import Badge from "../ui/Badge";

/* ── Campo de solo lectura ─────────────────────────────────── */
function InfoField({ label, value, mono = false, full = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
        {label}
      </p>
      <p className={`text-sm font-medium leading-snug ${mono ? "font-mono text-xs" : ""}`} style={{ color: "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}

/* ── Sección interna del drawer ────────────────────────────── */
function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      {title && (
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-3)" }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

const DRAWER_TABS = [
  { id: "resumen",   label: "Resumen" },
  { id: "warehouse", label: "Warehouse" },
  { id: "historial", label: "Historial" },
];

export default function PackageDrawer({ pkg }) {
  const [drawerTab,           setDrawerTab]           = useState("resumen");
  const [warehouseImage,      setWarehouseImage]       = useState(null);
  const [loadingUpload,       setLoadingUpload]        = useState(false);
  const [events,              setEvents]               = useState([]);
  const [items,               setItems]                = useState([]);
  const [fotos,               setFotos]                = useState([]);
  const [selectedItemId,      setSelectedItemId]       = useState(null);

  const [localPkg,            setLocalPkg]             = useState(pkg);
  const [warehouseFechaInput, setWarehouseFechaInput]  = useState(
    pkg?.warehouse_fecha ? new Date(pkg.warehouse_fecha).toISOString().split("T")[0] : ""
  );
  const [savingWfecha,        setSavingWfecha]         = useState(false);
  const [wfechaError,         setWfechaError]          = useState("");

  const [fechaEntregaProvInput, setFechaEntregaProvInput] = useState(
    pkg?.fecha_entrega_proveedor
      ? new Date(pkg.fecha_entrega_proveedor).toISOString().split("T")[0]
      : ""
  );
  const [savingFep,  setSavingFep]  = useState(false);
  const [fepError,   setFepError]   = useState("");

  /* Resetear estado al cambiar de paquete */
  useEffect(() => {
    setLocalPkg(pkg);
    setSelectedItemId(null);
    setDrawerTab("resumen");
    setWarehouseFechaInput(
      pkg?.warehouse_fecha ? new Date(pkg.warehouse_fecha).toISOString().split("T")[0] : ""
    );
    setFechaEntregaProvInput(
      pkg?.fecha_entrega_proveedor
        ? new Date(pkg.fecha_entrega_proveedor).toISOString().split("T")[0]
        : ""
    );
    setFepError("");
    setWfechaError("");
  }, [pkg]);

  /* Paste image */
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

  /* Cargar eventos */
  useEffect(() => {
    if (!pkg?.id) return;
    fetch(`${API_URL}/compras/${pkg.id}/eventos`)
      .then(res => res.json())
      .then(data => { if (data.ok) setEvents(data.data); })
      .catch(console.error);
  }, [pkg?.id]);

  /* Cargar ítems y fotos */
  useEffect(() => {
    if (!pkg?.id) return;
    loadItems(pkg.id);
    loadFotos(pkg.id);
  }, [pkg?.id]);

  if (!localPkg) return null;

  const tracking = localPkg.tracking || localPkg.tracking_number;
  const cliente  = localPkg.cliente  || localPkg.cliente_nombre;

  async function loadItems(id) {
    try {
      const res  = await fetch(`${API_URL}/compras/${id}/items`);
      const json = await res.json();
      if (json.ok) setItems(json.data);
    } catch (err) { console.error("Error cargando ítems:", err); }
  }

  async function loadFotos(id) {
    try {
      const res  = await fetch(`${API_URL}/compras/${id}/fotos`);
      const json = await res.json();
      if (json.ok) setFotos(json.data);
    } catch (err) { console.error("Error cargando fotos:", err); }
  }

  async function handleUpload() {
    if (!warehouseImage) return;
    try {
      setLoadingUpload(true);
      const formData = new FormData();
      formData.append("file", warehouseImage);
      if (selectedItemId)      formData.append("item_id",         selectedItemId);
      if (warehouseFechaInput) formData.append("warehouse_fecha", warehouseFechaInput);

      const res    = await fetch(`${API_URL}/compras/${localPkg.id}/warehouse`, { method: "PATCH", body: formData });
      const result = await res.json();
      if (result.ok) {
        setLocalPkg(prev => ({
          ...prev,
          warehouse_confirmado: true,
          warehouse_imagen:     result.data.warehouse_imagen,
          warehouse_fecha:      result.data.warehouse_fecha,
          estado:               result.data.estado,
          peso:                 result.data.peso,
          total:                result.data.total,
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
          .then(data => { if (data.ok) setEvents(data.data); })
          .catch(console.error);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingUpload(false); }
  }

  async function guardarFechaWarehouse() {
    if (!warehouseFechaInput) { setWfechaError("Ingresa una fecha"); return; }
    setSavingWfecha(true);
    setWfechaError("");
    try {
      const res  = await fetch(`${API_URL}/compras/${localPkg.id}/warehouse-fecha`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ warehouse_fecha: warehouseFechaInput }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al guardar fecha");
      setLocalPkg(prev => ({ ...prev, warehouse_fecha: json.data.warehouse_fecha }));
    } catch (err) { setWfechaError(err.message || "Error guardando fecha"); }
    finally { setSavingWfecha(false); }
  }

  async function guardarFechaEntregaProveedor() {
    setSavingFep(true);
    setFepError("");
    try {
      const res  = await fetch(`${API_URL}/compras/${localPkg.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          proveedor:               localPkg.proveedor,
          numero_orden:            localPkg.numero_orden,
          fecha_entrega_proveedor: fechaEntregaProvInput || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al guardar fecha");
      setLocalPkg(prev => ({ ...prev, fecha_entrega_proveedor: json.data.fecha_entrega_proveedor }));
    } catch (err) { setFepError(err.message || "Error guardando fecha"); }
    finally { setSavingFep(false); }
  }

  const wConfirmados = items.filter(i => i.warehouse_confirmado).length;
  const wTotal       = items.length;
  const wAllDone     = wTotal > 0 && wConfirmados === wTotal;
  const wPartial     = wTotal > 0 && wConfirmados > 0 && !wAllDone;

  function fmtDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  /* Botón de guardar compartido */
  const SaveBtn = ({ onClick, saving, label = "Guardar", disabled = false }) => (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="ui-button ui-button-sm flex-shrink-0 disabled:opacity-50"
    >
      {saving ? "..." : label}
    </button>
  );

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-full ui-fade-up">

      {/* ══ HEADER ════════════════════════════════════════ */}
      <div className="px-7 pt-6 pb-5"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>

        {/* Eyebrow + estado */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--text-3)" }}>
              Paquete
            </p>
            <h2 className="text-xl font-bold tracking-tight leading-tight break-all font-mono" style={{ color: "var(--text)" }}>
              {tracking || "Sin tracking"}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 pt-1 pr-8">
            <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
              style={{ background: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              {localPkg.estado || "en proceso"}
            </span>
            {wTotal > 0 && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                style={wAllDone
                  ? { background: "var(--success-soft)", color: "var(--success)" }
                  : wPartial
                    ? { background: "var(--warning-soft)", color: "var(--warning)" }
                    : { background: "var(--surface-3)", color: "var(--text-3)" }
                }>
                {wAllDone
                  ? "Warehouse completo"
                  : wPartial
                    ? `${wConfirmados}/${wTotal} en warehouse`
                    : `Sin confirmar · ${wTotal} ítem${wTotal !== 1 ? "s" : ""}`
                }
              </span>
            )}
          </div>
        </div>

        {/* Cliente + datos */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {cliente}
            </span>
            {localPkg.destino && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>· {localPkg.destino}</span>
            )}
          </div>
          {(localPkg.proveedor || localPkg.numero_orden) && (
            <div className="flex items-center gap-2 flex-wrap">
              {localPkg.proveedor && (
                <span className="text-xs" style={{ color: "var(--text-2)" }}>{localPkg.proveedor}</span>
              )}
              {localPkg.numero_orden && (
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md"
                  style={{ color: "var(--text-3)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                  #{localPkg.numero_orden}
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ══ TABS ══════════════════════════════════════════ */}
      <div className="flex px-7" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        {DRAWER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setDrawerTab(tab.id)}
            className="whitespace-nowrap px-0 mr-6 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px"
            style={drawerTab === tab.id
              ? { color: "var(--text)", fontWeight: 600, borderBottomColor: "var(--accent)" }
              : { color: "var(--text-3)", borderBottomColor: "transparent" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ CONTENIDO ══════════════════════════════════════ */}
      <div className="flex-1 px-7 py-6 overflow-y-auto" style={{ background: "var(--surface)" }}>

        {/* ── TAB: RESUMEN ────────────────────────────────── */}
        {drawerTab === "resumen" && (
          <div className="flex flex-col gap-6">

            {/* Grid de datos clave */}
            <Section title="Datos del paquete">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-xl"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <InfoField label="Cliente"    value={cliente} />
                <InfoField label="Tracking"   value={tracking} mono />
                {localPkg.codigo_solicitud && (
                  <InfoField label="Solicitud" value={localPkg.codigo_solicitud} mono />
                )}
                {(localPkg.proveedor || localPkg.numero_orden) && (
                  <InfoField label="Orden"
                    value={[localPkg.proveedor, localPkg.numero_orden].filter(Boolean).join(" — ")} />
                )}
                {localPkg.peso     && <InfoField label="Peso"      value={`${localPkg.peso} kg`} />}
                {localPkg.volumen  && <InfoField label="Volumen"   value={localPkg.volumen} />}
                {localPkg.ubicacion && <InfoField label="Ubicación" value={localPkg.ubicacion} mono />}
                {localPkg.total    && <InfoField label="Total"     value={`${localPkg.total} Bs`} />}
              </div>
            </Section>

            {/* Fechas */}
            {(localPkg.warehouse_fecha || localPkg.fecha_entrega_proveedor) && (
              <Section title="Fechas">
                <div className="flex flex-wrap gap-4">
                  {localPkg.warehouse_fecha && (
                    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl min-w-[140px]"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
                        Llegada warehouse
                      </p>
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{fmtDate(localPkg.warehouse_fecha)}</p>
                    </div>
                  )}
                  {localPkg.fecha_entrega_proveedor && (
                    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl min-w-[140px]"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
                        Entrega proveedor
                      </p>
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{fmtDate(localPkg.fecha_entrega_proveedor)}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Lista de ítems */}
            {items.length > 0 && (
              <Section title={`Ítems · ${items.length}`}>
                <div className="flex flex-col gap-1.5">
                  {items.map((item, idx) => (
                    <div key={item.id}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-[10px] font-bold tabular-nums flex-shrink-0" style={{ color: "var(--border-strong)" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm truncate" style={{ color: "var(--text)" }}>
                          {item.descripcion}
                        </span>
                        {item.cantidad > 1 && (
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>
                            ×{item.cantidad}
                          </span>
                        )}
                      </div>
                      <Badge type={item.warehouse_confirmado ? "success" : "default"}>
                        {item.warehouse_confirmado ? "Warehouse" : "Pendiente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>
        )}

        {/* ── TAB: WAREHOUSE ──────────────────────────────── */}
        {drawerTab === "warehouse" && (
          <div className="flex flex-col gap-6">

            {/* Estado por ítem */}
            {items.length > 0 && (
              <Section title="Estado por ítem">
                <div className="flex flex-col gap-1.5">
                  {items.map(it => (
                    <div key={it.id}
                      className="flex items-center justify-between text-sm rounded-xl px-4 py-2.5"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <span className="truncate pr-3" style={{ color: "var(--text-2)" }}>{it.descripcion}</span>
                      <Badge type={it.warehouse_confirmado ? "success" : "default"}>
                        {it.warehouse_confirmado ? "Confirmado" : "Pendiente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Fechas */}
            <Section title="Fecha llegada warehouse">
              <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                {!localPkg.warehouse_confirmado ? (
                  <input type="date" value={warehouseFechaInput}
                    onChange={e => setWarehouseFechaInput(e.target.value)}
                    className="ui-input max-w-[200px]" />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={warehouseFechaInput}
                      onChange={e => setWarehouseFechaInput(e.target.value)}
                      className="ui-input flex-1 max-w-[200px]" />
                    <SaveBtn onClick={guardarFechaWarehouse} saving={savingWfecha} />
                  </div>
                )}
                {wfechaError && <p className="text-xs text-red-500">{wfechaError}</p>}
              </div>
            </Section>

            <Section title="Entrega proveedor (Amazon / UPS / FedEx)">
              <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="date" value={fechaEntregaProvInput}
                    onChange={e => setFechaEntregaProvInput(e.target.value)}
                    className="ui-input flex-1 max-w-[200px]" />
                  <SaveBtn onClick={guardarFechaEntregaProveedor} saving={savingFep} />
                </div>
                {fepError && <p className="text-xs text-red-500">{fepError}</p>}
              </div>
            </Section>

            {/* Asociar foto a ítem */}
            {items.length > 0 && (
              <Section title="Asociar foto a ítem">
                <p className="text-xs -mt-1" style={{ color: "var(--text-3)" }}>
                  Usa "General" si la imagen muestra toda la orden.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedItemId(null)}
                    className="px-3 py-1.5 text-xs rounded-lg border transition-all font-medium"
                    style={selectedItemId === null
                      ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                      : { background: "transparent", color: "var(--text-2)", borderColor: "var(--border)" }
                    }>
                    General / varios ítems
                  </button>
                  {items.map(it => (
                    <button
                      key={it.id}
                      onClick={() => setSelectedItemId(it.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border transition-all font-medium"
                      style={selectedItemId === it.id
                        ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                        : { background: "transparent", color: "var(--text-2)", borderColor: "var(--border)" }
                      }>
                      {it.descripcion}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Zona drag/drop */}
            <Section title="Imagen de warehouse">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setWarehouseImage(f); }}
                className="rounded-xl p-6 text-center cursor-pointer transition-all duration-150"
                style={{ border: "2px dashed var(--border-strong)" }}>
                {warehouseImage ? (
                  <img
                    src={URL.createObjectURL(warehouseImage)}
                    className="max-h-40 rounded-xl object-cover mx-auto"
                    alt="preview"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm" style={{ color: "var(--text-3)" }}>Arrastra imagen aquí</p>
                    <p className="text-xs" style={{ color: "var(--border-strong)" }}>o pega con Cmd+V</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={loadingUpload || !warehouseImage}
                className="ui-button w-full"
              >
                {loadingUpload ? "Subiendo..." : "Confirmar llegada warehouse"}
              </button>
            </Section>

            {/* Galería de fotos */}
            {fotos.length > 0 && (
              <Section title="Fotos registradas">
                <div className="flex flex-wrap gap-3">
                  {fotos.map(foto => (
                    <img
                      key={foto.id}
                      src={foto.url}
                      alt="warehouse"
                      onClick={() => window.open(foto.url, "_blank")}
                      title={foto.item_id ? "Foto de ítem" : "Foto general"}
                      className="h-24 w-24 object-cover rounded-xl cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-150"
                      style={{ border: "1px solid var(--border)" }}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Fallback legacy */}
            {fotos.length === 0 && localPkg.warehouse_imagen && (
              <Section>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--success)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--success)" }}>Confirmado en warehouse</span>
                </div>
                {localPkg.warehouse_fecha && (
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>{fmtDate(localPkg.warehouse_fecha)}</span>
                )}
                <img
                  src={localPkg.warehouse_imagen}
                  alt="warehouse"
                  onClick={() => window.open(localPkg.warehouse_imagen, "_blank")}
                  className="rounded-xl max-h-40 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ border: "1px solid var(--border)" }}
                />
              </Section>
            )}

          </div>
        )}

        {/* ── TAB: HISTORIAL ──────────────────────────────── */}
        {drawerTab === "historial" && (
          <div>
            {events.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  Sin eventos registrados.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {events.map((event, index) => (
                  <div key={index} className="flex gap-4 relative">
                    {index < events.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px" style={{ background: "var(--border)" }} />
                    )}
                    <div className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 z-10 border-2"
                      style={{ background: "var(--surface)", borderColor: "var(--border-strong)" }} />
                    <div className="flex flex-col gap-0.5 pb-6 min-w-0">
                      <p className="text-sm leading-snug" style={{ color: "var(--text-2)" }}>
                        {event.descripcion}
                      </p>
                      <span className="text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>
                        {event.fecha ? new Date(event.fecha).toLocaleString() : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
