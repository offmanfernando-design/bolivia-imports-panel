import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { API_URL } from "../../config/api";

const esPendiente = (item) =>
  item.warehouse_confirmado === true &&
  item.estado !== "recibido_bolivia" &&
  item.estado !== "entregado";

const esEsperandoWarehouse = (item) =>
  !item.warehouse_confirmado &&
  item.estado !== "recibido_bolivia" &&
  item.estado !== "entregado";

export default function RecepcionCarga({ onRecepcionRegistrada }) {
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [tracking, setTracking] = useState("");
  const [ordenes, setOrdenes] = useState([]);
  const [loadingBuscar, setLoadingBuscar] = useState(false);

  const [selectedOrden, setSelectedOrden] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [categoriaId, setCategoriaId] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState("kg");
  const [pesoInterno, setPesoInterno] = useState("");
  const [pesoCliente, setPesoCliente] = useState("");
  const [unidades, setUnidades] = useState("");
  const [costoInternoUsd, setCostoInternoUsd] = useState("");
  const [tarifaClienteUsd, setTarifaClienteUsd] = useState("");
  const [tipoCambioInterno, setTipoCambioInterno] = useState("");
  const [tipoCambioCliente, setTipoCambioCliente] = useState("");
  const [selectedUbicacionCodigo, setSelectedUbicacionCodigo] = useState("");
  const [notas, setNotas] = useState("");

  const [loadingRegistrar, setLoadingRegistrar] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [error, setError] = useState("");
  const [ultimaRecepcion, setUltimaRecepcion] = useState(null);

  const [modoLote, setModoLote] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [modoAplicacion, setModoAplicacion] = useState("individual");

  const [showDesconocido, setShowDesconocido] = useState(false);
  const [descTracking, setDescTracking] = useState("");
  const [descDescripcion, setDescDescripcion] = useState("");
  const [descPeso, setDescPeso] = useState("");
  const [descUbicacionCodigo, setDescUbicacionCodigo] = useState("");
  const [descNotas, setDescNotas] = useState("");
  const [loadingDesconocido, setLoadingDesconocido] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const [descError, setDescError] = useState("");
  const [ultimoDesconocido, setUltimoDesconocido] = useState(null);

  const trackingRef = useRef(null);

  const ubicacionObj = ubicaciones.find((u) => u.codigo === selectedUbicacionCodigo);
  const ubicacionId = ubicacionObj ? String(ubicacionObj.id) : "";

  const zonaRecomendada = selectedOrden?.zona_recomendada || null;

  const ubicacionesParaGrilla = useMemo(() => {
    if (zonaRecomendada)
      return ubicaciones.filter((u) => u.zona === zonaRecomendada);
    return ubicaciones.filter((u) => u.zona === "local" || u.zona === "terminal");
  }, [ubicaciones, zonaRecomendada]);

  const estantes = useMemo(() => {
    const s = new Set(
      ubicacionesParaGrilla.map((u) => u.codigo.split("-")[0]).filter(Boolean)
    );
    return [...s].sort();
  }, [ubicacionesParaGrilla]);

  const filas = useMemo(() => {
    const s = new Set(
      ubicacionesParaGrilla.map((u) => u.codigo.split("-")[1]).filter(Boolean)
    );
    return [...s].sort();
  }, [ubicacionesParaGrilla]);

  const sugeridaCodigo = selectedOrden?.ubicacion_sugerida?.codigo;

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [catRes, ubicRes] = await Promise.all([
          fetch(`${API_URL}/operativo/categorias`),
          fetch(`${API_URL}/operativo/ubicaciones`),
        ]);
        const [catJson, ubicJson] = await Promise.all([
          catRes.json(),
          ubicRes.json(),
        ]);
        if (catJson.ok) setCategorias(catJson.data);
        if (ubicJson.ok) setUbicaciones(ubicJson.data);
      } catch (err) {
        console.error("Error cargando datos maestros:", err);
      }
    }
    loadMasterData();
    trackingRef.current?.focus();
  }, []);

  function aplicarSugerida(orden) {
    if (!orden?.ubicacion_sugerida) return;
    if (orden.ubicacion_sugerida_coincide_zona) {
      setSelectedUbicacionCodigo(orden.ubicacion_sugerida.codigo);
    }
  }

  const buscar = useCallback(async (t) => {
    if (t.length < 2) {
      setOrdenes([]);
      setSelectedOrden(null);
      setSelectedItemId(null);
      return;
    }
    setLoadingBuscar(true);
    try {
      const res = await fetch(
        `${API_URL}/operativo/carga/buscar?tracking=${encodeURIComponent(t)}`
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrdenes(list);

      const allPending = list.flatMap((o) => o.items.filter(esPendiente));
      const matchedPending = allPending.filter((i) => i.item_match);
      const autoItem =
        matchedPending.length === 1
          ? matchedPending[0]
          : allPending.length === 1
            ? allPending[0]
            : null;

      if (autoItem) {
        const orden = list.find((o) =>
          o.items.some((i) => i.id === autoItem.id)
        );
        setSelectedOrden(orden);
        setSelectedItemId(autoItem.id);
        setUltimaRecepcion(null);
        setError("");
        setFormTouched(false);
        aplicarSugerida(orden);
      }
    } catch (err) {
      console.error(err);
      setError("Error al buscar tracking");
    } finally {
      setLoadingBuscar(false);
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => buscar(tracking), 400);
    return () => clearTimeout(delay);
  }, [tracking, buscar]);

  function seleccionarItem(orden, itemId) {
    setSelectedOrden(orden);
    setSelectedItemId(itemId);
    setUltimaRecepcion(null);
    setError("");
    setFormTouched(false);
    aplicarSugerida(orden);
  }

  function seleccionarCategoria(id) {
    setCategoriaId(id);
    if (!id) return;
    const cat = categorias.find((c) => String(c.id) === id);
    if (!cat) return;
    if (cat.tipo_calculo) setTipoCalculo(cat.tipo_calculo);
    if (cat.tarifa_cliente_usd != null)
      setTarifaClienteUsd(String(cat.tarifa_cliente_usd));
  }

  const costoInternoBs = useMemo(() => {
    const c = Number(costoInternoUsd);
    const tc = Number(tipoCambioInterno);
    if (!c || !tc || c <= 0 || tc <= 0) return null;
    if (tipoCalculo === "kg") {
      const p = Number(pesoInterno);
      return p > 0 ? (p * c * tc).toFixed(2) : null;
    }
    const u = Number(unidades);
    return u > 0 ? (u * c * tc).toFixed(2) : null;
  }, [tipoCalculo, pesoInterno, unidades, costoInternoUsd, tipoCambioInterno]);

  const cobroClienteBs = useMemo(() => {
    const t = Number(tarifaClienteUsd);
    const tc = Number(tipoCambioCliente);
    if (!t || !tc || t <= 0 || tc <= 0) return null;
    if (tipoCalculo === "kg") {
      const p = Number(pesoCliente);
      return p > 0 ? (p * t * tc).toFixed(2) : null;
    }
    const u = Number(unidades);
    return u > 0 ? (u * t * tc).toFixed(2) : null;
  }, [tipoCalculo, pesoCliente, unidades, tarifaClienteUsd, tipoCambioCliente]);

  const validationErrors = useMemo(() => {
    if (!selectedItemId && selectedItemIds.size === 0) return [];
    const errs = [];
    if (tipoCalculo === "kg") {
      if (!pesoInterno || Number(pesoInterno) <= 0)
        errs.push("Peso interno (kg)");
      if (!pesoCliente || Number(pesoCliente) <= 0)
        errs.push("Peso cliente (kg)");
    } else {
      if (!unidades || Number(unidades) <= 0) errs.push("Unidades");
    }
    if (!costoInternoUsd || Number(costoInternoUsd) <= 0)
      errs.push("Costo interno USD");
    if (!tarifaClienteUsd || Number(tarifaClienteUsd) <= 0)
      errs.push("Tarifa cliente USD");
    if (!tipoCambioInterno || Number(tipoCambioInterno) <= 0)
      errs.push("T/C interno");
    if (!tipoCambioCliente || Number(tipoCambioCliente) <= 0)
      errs.push("T/C cliente");
    if (!ubicacionId) errs.push("Ubicación");
    return errs;
  }, [
    selectedItemId,
    selectedItemIds,
    tipoCalculo,
    pesoInterno,
    pesoCliente,
    unidades,
    costoInternoUsd,
    tarifaClienteUsd,
    tipoCambioInterno,
    tipoCambioCliente,
    ubicacionId,
  ]);

  async function registrar() {
    setFormTouched(true);
    if (validationErrors.length > 0) return;
    setError("");
    setLoadingRegistrar(true);
    try {
      const payload = {
        item_id: selectedItemId,
        tipo_calculo: tipoCalculo,
        costo_interno_usd: Number(costoInternoUsd),
        tarifa_cliente_usd: Number(tarifaClienteUsd),
        tipo_cambio_interno: Number(tipoCambioInterno),
        tipo_cambio_cliente: Number(tipoCambioCliente),
        ubicacion_id: ubicacionId,
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
        ...(tipoCalculo === "kg"
          ? {
              peso_interno: Number(pesoInterno),
              peso_cliente: Number(pesoCliente),
            }
          : { unidades: Number(unidades) }),
        ...(notas.trim() ? { notas: notas.trim() } : {}),
      };

      const res = await fetch(`${API_URL}/operativo/carga/recibir-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Error al registrar");

      const result = json.data;

      setOrdenes((prev) =>
        prev.map((o) => {
          if (o.id !== selectedOrden.id) return o;
          return {
            ...o,
            items: o.items.map((i) =>
              i.id === selectedItemId
                ? { ...i, estado: "recibido_bolivia" }
                : i
            ),
          };
        })
      );

      setUltimaRecepcion(result);
      setSelectedItemId(null);
      setFormTouched(false);
      setCategoriaId("");
      setPesoInterno("");
      setPesoCliente("");
      setUnidades("");
      setNotas("");
      onRecepcionRegistrada?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrar recepción");
    } finally {
      setLoadingRegistrar(false);
    }
  }

  async function registrarLote() {
    setFormTouched(true);
    if (validationErrors.length > 0) return;
    if (selectedItemIds.size === 0) return;
    setError("");
    setLoadingRegistrar(true);
    try {
      const payload = {
        item_ids: [...selectedItemIds],
        tipo_calculo: tipoCalculo,
        modo_lote: modoAplicacion,
        costo_interno_usd: Number(costoInternoUsd),
        tarifa_cliente_usd: Number(tarifaClienteUsd),
        tipo_cambio_interno: Number(tipoCambioInterno),
        tipo_cambio_cliente: Number(tipoCambioCliente),
        ubicacion_id: ubicacionId,
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
        ...(tipoCalculo === "kg"
          ? { peso_interno: Number(pesoInterno), peso_cliente: Number(pesoCliente) }
          : { unidades: Number(unidades) }),
        ...(notas.trim() ? { notas: notas.trim() } : {}),
      };

      const res = await fetch(`${API_URL}/operativo/carga/recibir-lote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Error al registrar lote");

      const idsRegistrados = new Set(json.data.map((r) => r.item_id));

      setOrdenes((prev) =>
        prev.map((o) => {
          if (o.id !== selectedOrden.id) return o;
          return {
            ...o,
            items: o.items.map((i) =>
              idsRegistrados.has(i.id) ? { ...i, estado: "recibido_bolivia" } : i
            ),
          };
        })
      );

      setSelectedItemIds(new Set());
      setModoLote(false);
      setModoAplicacion("individual");
      setSelectedItemId(null);
      setFormTouched(false);
      setCategoriaId("");
      setPesoInterno("");
      setPesoCliente("");
      setUnidades("");
      setNotas("");
      setUltimaRecepcion({ lote: true, count: json.data.length, ubicacion: json.data[0]?.ubicacion });
      onRecepcionRegistrada?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrar lote");
    } finally {
      setLoadingRegistrar(false);
    }
  }

  const selectedItem = selectedOrden?.items?.find((i) => i.id === selectedItemId);
  const categoriaSeleccionada = categorias.find((c) => String(c.id) === categoriaId);

  const descUbicacionObj = ubicaciones.find((u) => u.codigo === descUbicacionCodigo);
  const descUbicacionId = descUbicacionObj ? String(descUbicacionObj.id) : "";

  const descValidationErrors = useMemo(() => {
    if (!showDesconocido) return [];
    const errs = [];
    if (!descDescripcion.trim()) errs.push("Descripción");
    if (!descUbicacionId) errs.push("Ubicación");
    if (descPeso !== "" && (isNaN(Number(descPeso)) || Number(descPeso) < 0))
      errs.push("Peso inválido");
    return errs;
  }, [showDesconocido, descDescripcion, descUbicacionId, descPeso]);

  async function registrarDesconocido() {
    setDescTouched(true);
    if (descValidationErrors.length > 0) return;
    setDescError("");
    setLoadingDesconocido(true);
    try {
      const payload = {
        ...(descTracking.trim() ? { tracking: descTracking.trim() } : {}),
        descripcion: descDescripcion.trim(),
        ...(descPeso !== "" ? { peso: Number(descPeso) } : {}),
        ubicacion_id: descUbicacionId,
        ...(descNotas.trim() ? { notas: descNotas.trim() } : {}),
      };
      const res = await fetch(`${API_URL}/operativo/paquetes-desconocidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al registrar");
      setUltimoDesconocido(json.data);
      setDescTracking("");
      setDescDescripcion("");
      setDescPeso("");
      setDescUbicacionCodigo("");
      setDescNotas("");
      setDescTouched(false);
    } catch (err) {
      console.error(err);
      setDescError(err.message || "Error al registrar desconocido");
    } finally {
      setLoadingDesconocido(false);
    }
  }

  return (
    <div className="ui-card flex flex-col gap-6">
      <h3 className="text-sm uppercase tracking-widest text-neutral-500">
        Carga (Bolivia)
      </h3>

      {ultimaRecepcion && (
        <div className="bg-green-50 border border-green-200 rounded p-4 flex flex-col gap-2">
          <p className="text-green-700 font-semibold text-sm">
            {ultimaRecepcion.lote
              ? `Lote registrado — ${ultimaRecepcion.count} ítems`
              : "Recepción registrada"}
          </p>
          {!ultimaRecepcion.lote && (
            <>
              <p className="text-sm">
                <span className="text-neutral-500">Código: </span>
                <span className="font-mono font-medium">
                  {ultimaRecepcion.codigo_recepcion}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-neutral-500">Ítem: </span>
                {ultimaRecepcion.item_descripcion}
              </p>
            </>
          )}
          <p className="text-sm">
            <span className="text-neutral-500">Ubicación: </span>
            {ultimaRecepcion.ubicacion}
          </p>
          {!ultimaRecepcion.lote && (
            <button
              type="button"
              onClick={() =>
                window.open(
                  `${API_URL}/operativo/etiqueta/recepcion/${ultimaRecepcion.recepcion_id}`,
                  "_blank"
                )
              }
              className="ui-button mt-1 self-start"
            >
              Imprimir etiqueta
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-2 rounded">
          {error}
        </div>
      )}

      <input
        ref={trackingRef}
        placeholder="Últimos dígitos del tracking"
        value={tracking}
        onChange={(e) => {
          setTracking(e.target.value);
          setError("");
          setUltimaRecepcion(null);
        }}
        className="ui-input"
      />

      {loadingBuscar && (
        <p className="text-sm text-neutral-400">Buscando...</p>
      )}

      {ordenes.length === 0 && tracking.length >= 2 && !loadingBuscar && (
        <p className="text-sm text-neutral-400">
          Sin resultados para &ldquo;{tracking}&rdquo;
        </p>
      )}

      {ordenes.map((orden) => {
        const habilitados = orden.items.filter(esPendiente);
        const sinWarehouse = orden.items.filter(esEsperandoWarehouse);
        const recibidos = orden.items.filter(
          (i) =>
            i.estado === "recibido_bolivia" || i.estado === "entregado"
        );

        return (
          <div key={orden.id} className="ui-card flex flex-col gap-3">
            {/* Order header */}
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-sm">{orden.cliente_nombre}</p>
              <p className="text-xs text-neutral-500">
                {orden.numero_orden} · {orden.tracking_number}
              </p>
              {orden.ubicacion_sugerida && orden.ubicacion_sugerida_coincide_zona && (
                <p className="text-xs text-blue-500">
                  Ubicación sugerida: {orden.ubicacion_sugerida.codigo}
                </p>
              )}
              {orden.ubicacion_sugerida && !orden.ubicacion_sugerida_coincide_zona && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Ubicación previa en zona {orden.ubicacion_sugerida.zona}: {orden.ubicacion_sugerida.codigo} — revisar antes de asignar
                </p>
              )}
              {orden.zona_recomendada && (
                <p className={`text-xs font-medium ${orden.zona_recomendada === "local" ? "text-blue-500" : "text-amber-500"}`}>
                  {orden.zona_recomendada === "local"
                    ? "Local — Santa Cruz"
                    : `Terminal — ${orden.cliente_ciudad || "otro departamento"}`}
                </p>
              )}
              <p className="text-xs text-neutral-400">
                {habilitados.length > 0 && (
                  <span>{habilitados.length} pendiente{habilitados.length !== 1 ? "s" : ""}</span>
                )}
                {sinWarehouse.length > 0 && (
                  <span className="ml-2 text-amber-500">
                    · {sinWarehouse.length} esperando warehouse
                  </span>
                )}
                {recibidos.length > 0 && (
                  <span className="ml-2">
                    · {recibidos.length} recibido{recibidos.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            {/* Toggle modo lote — solo si hay 2+ ítems pendientes */}
            {habilitados.length >= 2 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !modoLote;
                    setModoLote(next);
                    setSelectedItemIds(new Set());
                    setModoAplicacion("individual");
                    if (!next) {
                      setSelectedItemId(null);
                      setFormTouched(false);
                    }
                    setSelectedOrden(next ? orden : null);
                  }}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    modoLote
                      ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "border-neutral-200 text-neutral-500 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {modoLote ? "Modo lote activo — cancelar" : "Recibir varios ítems juntos"}
                </button>
              </div>
            )}

            {/* Items */}
            <div className="flex flex-col gap-1">
              {orden.items.map((item) => {
                const habilitado = esPendiente(item);
                const esperando = esEsperandoWarehouse(item);

                if (modoLote && selectedOrden?.id === orden.id) {
                  const isChecked = selectedItemIds.has(item.id);
                  let rowClass =
                    "text-left text-sm px-3 py-2 rounded border transition-colors flex items-start gap-2 ";
                  if (!habilitado) {
                    rowClass += "border-transparent bg-neutral-100 text-neutral-400 cursor-default opacity-60";
                  } else if (isChecked) {
                    rowClass += "border-blue-400 bg-blue-50 text-blue-800 cursor-pointer";
                  } else {
                    rowClass += "border-neutral-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
                  }
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!habilitado}
                      onClick={() => {
                        if (!habilitado) return;
                        setSelectedItemIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                        setFormTouched(false);
                      }}
                      className={rowClass}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={isChecked}
                        className="mt-0.5 flex-shrink-0 pointer-events-none"
                      />
                      <span className="flex flex-col min-w-0">
                        <span className="truncate">
                          {item.descripcion}
                          {item.item_match && (
                            <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                              · tracking coincide
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {esperando ? "Esperando warehouse" : "Pendiente"}
                        </span>
                      </span>
                    </button>
                  );
                }

                const isSelected = item.id === selectedItemId;
                let rowClass =
                  "text-left text-sm px-3 py-2 rounded border transition-colors ";
                if (isSelected) {
                  rowClass += "border-blue-400 bg-blue-50 text-blue-800";
                } else if (habilitado) {
                  rowClass += "border-neutral-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
                } else if (esperando) {
                  rowClass += "border-amber-200 bg-amber-50 text-amber-700 cursor-default";
                } else {
                  rowClass += "border-transparent bg-neutral-100 text-neutral-400 cursor-default";
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => habilitado && seleccionarItem(orden, item.id)}
                    disabled={!habilitado}
                    className={rowClass}
                  >
                    <span className="block truncate">
                      {item.descripcion}
                      {item.item_match && (
                        <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                          · tracking coincide
                        </span>
                      )}
                    </span>
                    <span className="text-xs">
                      {item.estado === "recibido_bolivia"
                        ? "Recibido en Bolivia"
                        : item.estado === "entregado"
                          ? "Entregado"
                          : esperando
                            ? "Esperando confirmación warehouse"
                            : "Pendiente — clic para seleccionar"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Reception form — unitario o lote */}
      {((selectedItemId && selectedItem) || (modoLote && selectedItemIds.size > 0 && selectedOrden)) && (
        <div className="ui-card flex flex-col gap-4">
          {modoLote ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                Recibiendo{" "}
                <span className="text-blue-700">{selectedItemIds.size} ítem{selectedItemIds.size !== 1 ? "s" : ""}</span>
                {selectedOrden && <span className="text-neutral-500"> — {selectedOrden.cliente_nombre}</span>}
              </p>

              {/* Selector modo aplicación */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModoAplicacion("individual")}
                  className={`flex-1 text-xs px-3 py-2 rounded border transition-colors text-left ${
                    modoAplicacion === "individual"
                      ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700"
                  }`}
                >
                  <span className="block font-medium">Valores individuales</span>
                  <span className="block text-xs opacity-70">Los valores ingresados se registran completos en cada ítem.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoAplicacion("consolidado")}
                  className={`flex-1 text-xs px-3 py-2 rounded border transition-colors text-left ${
                    modoAplicacion === "consolidado"
                      ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700"
                  }`}
                >
                  <span className="block font-medium">Valores consolidados</span>
                  <span className="block text-xs opacity-70">Ingresa el total del lote. El sistema divide entre los ítems.</span>
                </button>
              </div>

              {modoAplicacion === "individual" ? (
                <p className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-900 px-2 py-1.5 rounded">
                  Los valores ingresados se registrarán completos en cada ítem.
                </p>
              ) : (
                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1.5 rounded border border-blue-200 dark:border-blue-800">
                  Ingresa el total del lote. El sistema dividirá los valores entre los {selectedItemIds.size} ítems seleccionados.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium">
              Recibiendo:{" "}
              <span className="text-blue-700">{selectedItem.descripcion}</span>
            </p>
          )}

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">
              Categoría (opcional)
            </label>
            <select
              value={categoriaId}
              onChange={(e) => seleccionarCategoria(e.target.value)}
              className="ui-input"
            >
              <option value="">Sin categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {categoriaId && (
              <p className="text-xs text-neutral-400">
                Referencia categoría:{" "}
                {categoriaSeleccionada?.precio_referencia_usd != null
                  ? `USD ${Number(categoriaSeleccionada.precio_referencia_usd).toFixed(2)} por ${categoriaSeleccionada.tipo_calculo === "kg" ? "kg" : "unidad"}`
                  : "sin precio configurado"}
              </p>
            )}
          </div>

          {/* Tipo calculo */}
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={tipoCalculo === "kg"}
                onChange={() => setTipoCalculo("kg")}
              />{" "}
              Por kg
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={tipoCalculo === "unidad"}
                onChange={() => setTipoCalculo("unidad")}
              />{" "}
              Por unidad
            </label>
          </div>

          {tipoCalculo === "kg" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500">
                  {modoLote && modoAplicacion === "consolidado"
                    ? `Peso interno TOTAL lote (kg)`
                    : "Peso interno (kg)"}
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={pesoInterno}
                  onChange={(e) => setPesoInterno(e.target.value)}
                  className="ui-input ui-input-sm"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500">
                  {modoLote && modoAplicacion === "consolidado"
                    ? `Peso cliente TOTAL lote (kg)`
                    : "Peso cliente (kg)"}
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={pesoCliente}
                  onChange={(e) => setPesoCliente(e.target.value)}
                  className="ui-input ui-input-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {tipoCalculo === "unidad" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">
                {modoLote && modoAplicacion === "consolidado"
                  ? `Unidades TOTAL lote`
                  : "Unidades"}
              </label>
              <input
                type="number"
                placeholder="1"
                value={unidades}
                onChange={(e) => setUnidades(e.target.value)}
                className="ui-input ui-input-sm"
                min="1"
                step="1"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">
                Costo interno (USD)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={costoInternoUsd}
                onChange={(e) => setCostoInternoUsd(e.target.value)}
                className="ui-input ui-input-sm"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">
                {tipoCalculo === "kg" ? "Tarifa cliente por kg (USD)" : "Tarifa cliente por unidad (USD)"}
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={tarifaClienteUsd}
                onChange={(e) => setTarifaClienteUsd(e.target.value)}
                className="ui-input ui-input-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">T/C interno</label>
              <input
                type="number"
                placeholder="6.96"
                value={tipoCambioInterno}
                onChange={(e) => setTipoCambioInterno(e.target.value)}
                className="ui-input ui-input-sm"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">T/C cliente</label>
              <input
                type="number"
                placeholder="6.96"
                value={tipoCambioCliente}
                onChange={(e) => setTipoCambioCliente(e.target.value)}
                className="ui-input ui-input-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Live preview */}
          {(costoInternoBs || cobroClienteBs) && (() => {
            const nItems = modoLote ? selectedItemIds.size : 1;
            const esConsolidado = modoLote && modoAplicacion === "consolidado" && nItems > 1;
            // In consolidado: costoInternoBs/cobroClienteBs are totals; per-item = total / N
            // In individual: costoInternoBs/cobroClienteBs are per-item; total = per-item * N
            const cobroTotal = esConsolidado
              ? Number(cobroClienteBs)
              : Number(cobroClienteBs) * nItems;
            const cobro1Item = esConsolidado
              ? (Number(cobroClienteBs) / nItems)
              : Number(cobroClienteBs);
            const costoTotal = esConsolidado
              ? Number(costoInternoBs)
              : Number(costoInternoBs) * nItems;
            const costo1Item = esConsolidado
              ? (Number(costoInternoBs) / nItems)
              : Number(costoInternoBs);

            // peso/unidades por ítem in consolidado
            const pI = modoLote && modoAplicacion === "consolidado" && tipoCalculo === "kg" && pesoInterno
              ? (Number(pesoInterno) / nItems).toFixed(3)
              : null;
            const pC = modoLote && modoAplicacion === "consolidado" && tipoCalculo === "kg" && pesoCliente
              ? (Number(pesoCliente) / nItems).toFixed(3)
              : null;
            const uItem = modoLote && modoAplicacion === "consolidado" && tipoCalculo === "unidad" && unidades
              ? Math.round(Number(unidades) / nItems)
              : null;

            return (
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded p-3 text-sm flex flex-col gap-1">
                {esConsolidado && (tipoCalculo === "kg" ? pI : uItem !== null) && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                    {tipoCalculo === "kg"
                      ? <>Peso por ítem: <span className="font-medium">{pI} kg interno / {pC} kg cliente</span></>
                      : <>Unidades por ítem: <span className="font-medium">{uItem}</span></>
                    }
                  </p>
                )}
                {cobroClienteBs && (
                  <>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {esConsolidado ? "Cobro total lote" : "Cobro cliente por ítem"}:{" "}
                      <span className="font-medium">Bs {cobroTotal.toFixed(2)}</span>
                    </p>
                    {esConsolidado && (
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                        Por ítem:{" "}
                        <span className="font-medium">Bs {cobro1Item.toFixed(2)}</span>
                      </p>
                    )}
                  </>
                )}
                {costoInternoBs && (
                  <>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {esConsolidado ? "Costo interno total lote" : "Costo interno por ítem"}:{" "}
                      <span className="font-medium">Bs {costoTotal.toFixed(2)}</span>
                    </p>
                    {esConsolidado && (
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                        Por ítem:{" "}
                        <span className="font-medium">Bs {costo1Item.toFixed(2)}</span>
                      </p>
                    )}
                  </>
                )}
                {!esConsolidado && modoLote && nItems > 1 && cobroClienteBs && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs border-t border-neutral-200 dark:border-neutral-700 pt-1 mt-0.5">
                    Total lote ({nItems} ítems):{" "}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                      Bs {cobroTotal.toFixed(2)} cobro
                    </span>
                    {costoInternoBs && (
                      <span className="text-neutral-400">
                        {" / "}Bs {costoTotal.toFixed(2)} costo
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Ubicacion: grilla visual */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-500">
              Ubicación
              {zonaRecomendada && (
                <span className={`ml-1 font-medium ${zonaRecomendada === "local" ? "text-blue-400" : "text-amber-400"}`}>
                  — Zona {zonaRecomendada === "local" ? "local" : "terminal"}
                </span>
              )}
              {sugeridaCodigo && (
                <span className="ml-1 text-blue-400">
                  (sugerida: {sugeridaCodigo})
                </span>
              )}
            </label>
            <div className="overflow-x-auto">
              <div className="flex flex-col gap-1 min-w-max">
                <div className="flex gap-1 ml-7">
                  {filas.map((f) => (
                    <div key={f} className="w-14 text-center text-xs text-neutral-400 font-medium">
                      {f}
                    </div>
                  ))}
                </div>
                {estantes.map((est) => (
                  <div key={est} className="flex items-center gap-1">
                    <div className="w-6 text-xs text-neutral-400 font-medium text-right">{est}</div>
                    {filas.map((fil) => {
                      const codigo = `${est}-${fil}`;
                      const existe = ubicacionesParaGrilla.some((u) => u.codigo === codigo);
                      const isSelected = selectedUbicacionCodigo === codigo;
                      const isSugerida = sugeridaCodigo === codigo;
                      if (!existe) {
                        return <div key={fil} className="w-14 h-8 rounded bg-neutral-100 dark:bg-neutral-800" />;
                      }
                      let cellClass = "w-14 h-8 rounded text-xs font-medium transition-colors flex items-center justify-center ";
                      if (isSelected) {
                        cellClass += "bg-blue-600 text-white border border-blue-600";
                      } else if (isSugerida) {
                        cellClass += "border-2 border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 cursor-pointer";
                      } else {
                        cellClass += "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
                      }
                      return (
                        <button
                          key={fil}
                          type="button"
                          onClick={() => setSelectedUbicacionCodigo(codigo)}
                          className={cellClass}
                        >
                          {codigo}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm">
              Ubicación seleccionada:{" "}
              {selectedUbicacionCodigo ? (
                <span className="font-medium text-blue-700">{selectedUbicacionCodigo}</span>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </p>
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">
              Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Observaciones..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="ui-input"
            />
          </div>

          {/* Validation errors (shown after first submit attempt) */}
          {formTouched && validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
              <p className="text-red-600 font-medium mb-1">
                Completar antes de registrar:
              </p>
              <ul className="list-disc list-inside text-red-500 space-y-0.5">
                {validationErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {modoLote ? (
            <button
              type="button"
              onClick={registrarLote}
              disabled={loadingRegistrar || selectedItemIds.size === 0 || (formTouched && validationErrors.length > 0)}
              className="ui-button-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingRegistrar
                ? "Registrando..."
                : `Registrar lote (${selectedItemIds.size} ítem${selectedItemIds.size !== 1 ? "s" : ""})`}
            </button>
          ) : (
            <button
              type="button"
              onClick={registrar}
              disabled={loadingRegistrar || (formTouched && validationErrors.length > 0)}
              className="ui-button-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingRegistrar ? "Registrando..." : "Registrar recepción"}
            </button>
          )}
        </div>
      )}

      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <button
          type="button"
          onClick={() => {
            const opening = !showDesconocido;
            setShowDesconocido(opening);
            if (opening) {
              setDescTracking(tracking);
              setUltimoDesconocido(null);
              setDescError("");
              setDescTouched(false);
            }
          }}
          className="text-sm px-3 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          {showDesconocido ? "Ocultar formulario desconocido" : "+ Registrar paquete desconocido"}
        </button>
      </div>

      {showDesconocido && (
        <div className="ui-card flex flex-col gap-4 border-amber-200 bg-amber-50/30 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Paquete desconocido
          </p>

          {ultimoDesconocido && (
            <div className="bg-green-50 border border-green-200 rounded p-3 flex flex-col gap-1">
              <p className="text-green-700 font-semibold text-sm">Registrado</p>
              <p className="text-xs text-neutral-600">
                {ultimoDesconocido.descripcion}
                {" · "}{ultimoDesconocido.ubicacion_codigo}
              </p>
            </div>
          )}

          {descError && (
            <div className="bg-red-100 text-red-700 text-sm p-2 rounded">{descError}</div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Tracking (opcional)</label>
            <input
              type="text"
              placeholder="Si se conoce o es parcial"
              value={descTracking}
              onChange={(e) => setDescTracking(e.target.value)}
              className="ui-input ui-input-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">
              Descripción física <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: caja negra mediana, bolsa con ropa..."
              value={descDescripcion}
              onChange={(e) => setDescDescripcion(e.target.value)}
              className={`ui-input ui-input-sm ${descTouched && !descDescripcion.trim() ? "border-red-400" : ""}`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Peso kg (opcional)</label>
            <input
              type="number"
              placeholder="0.00"
              value={descPeso}
              onChange={(e) => setDescPeso(e.target.value)}
              className="ui-input ui-input-sm"
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-500">
              Zona de depósito <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-1 flex-wrap">
              {["D1", "D2", "D3", "D4", "D5"].map((cod) => {
                const existe = ubicaciones.some((u) => u.codigo === cod);
                const isSelected = descUbicacionCodigo === cod;
                if (!existe) return null;
                return (
                  <button
                    key={cod}
                    type="button"
                    onClick={() => setDescUbicacionCodigo(cod)}
                    className={`w-12 h-9 rounded text-xs font-medium transition-colors flex items-center justify-center border ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-500"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:border-amber-300 hover:bg-amber-50 cursor-pointer"
                    }`}
                  >
                    {cod}
                  </button>
                );
              })}
            </div>
            <p className="text-sm">
              Ubicación seleccionada:{" "}
              {descUbicacionCodigo ? (
                <span className="font-medium text-amber-700">{descUbicacionCodigo}</span>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Notas (opcional)</label>
            <input
              type="text"
              placeholder="Observaciones..."
              value={descNotas}
              onChange={(e) => setDescNotas(e.target.value)}
              className="ui-input ui-input-sm"
            />
          </div>

          {descTouched && descValidationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
              <p className="text-red-600 font-medium mb-1">Completar antes de registrar:</p>
              <ul className="list-disc list-inside text-red-500 space-y-0.5">
                {descValidationErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={registrarDesconocido}
            disabled={loadingDesconocido || (descTouched && descValidationErrors.length > 0)}
            className="ui-button disabled:opacity-50 disabled:cursor-not-allowed self-start"
          >
            {loadingDesconocido ? "Guardando..." : "Guardar desconocido"}
          </button>
        </div>
      )}
    </div>
  );
}
