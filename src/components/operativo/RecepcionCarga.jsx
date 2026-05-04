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

export default function RecepcionCarga() {
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
  const [selectedEstante, setSelectedEstante] = useState("");
  const [selectedFila, setSelectedFila] = useState("");
  const [notas, setNotas] = useState("");

  const [loadingRegistrar, setLoadingRegistrar] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [error, setError] = useState("");
  const [ultimaRecepcion, setUltimaRecepcion] = useState(null);

  const trackingRef = useRef(null);

  // Derived location state
  const ubicacionResultante =
    selectedEstante && selectedFila ? `${selectedEstante}-${selectedFila}` : "";
  const ubicacionObj = ubicaciones.find((u) => u.codigo === ubicacionResultante);
  const ubicacionId = ubicacionObj ? String(ubicacionObj.id) : "";

  const estantes = useMemo(() => {
    const s = new Set(
      ubicaciones.map((u) => u.codigo.split("-")[0]).filter(Boolean)
    );
    return [...s].sort();
  }, [ubicaciones]);

  const filas = useMemo(() => {
    const s = new Set(
      ubicaciones.map((u) => u.codigo.split("-")[1]).filter(Boolean)
    );
    return [...s].sort();
  }, [ubicaciones]);

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
    const codigo = orden?.ubicacion_sugerida?.codigo;
    if (codigo) {
      const [est, fil] = codigo.split("-");
      setSelectedEstante(est || "");
      setSelectedFila(fil || "");
    } else {
      setSelectedEstante("");
      setSelectedFila("");
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
      if (allPending.length === 1) {
        const orden = list.find((o) =>
          o.items.some((i) => i.id === allPending[0].id)
        );
        setSelectedOrden(orden);
        setSelectedItemId(allPending[0].id);
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
    if (cat.costo_interno_usd != null)
      setCostoInternoUsd(String(cat.costo_interno_usd));
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
    if (!selectedItemId) return [];
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
    if (!ubicacionId) errs.push("Ubicación (estante y fila)");
    return errs;
  }, [
    selectedItemId,
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
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrar recepción");
    } finally {
      setLoadingRegistrar(false);
    }
  }

  const selectedItem = selectedOrden?.items?.find((i) => i.id === selectedItemId);

  return (
    <div className="ui-card flex flex-col gap-6">
      <h3 className="text-sm uppercase tracking-widest text-neutral-500">
        Carga (Bolivia)
      </h3>

      {ultimaRecepcion && (
        <div className="bg-green-50 border border-green-200 rounded p-4 flex flex-col gap-2">
          <p className="text-green-700 font-semibold text-sm">
            Recepción registrada
          </p>
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
          <p className="text-sm">
            <span className="text-neutral-500">Ubicación: </span>
            {ultimaRecepcion.ubicacion}
          </p>
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
              {orden.ubicacion_sugerida && (
                <p className="text-xs text-blue-500">
                  Ubicación sugerida: {orden.ubicacion_sugerida.codigo}
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

            {/* Items */}
            <div className="flex flex-col gap-1">
              {orden.items.map((item) => {
                const habilitado = esPendiente(item);
                const esperando = esEsperandoWarehouse(item);
                const isSelected = item.id === selectedItemId;

                let rowClass =
                  "text-left text-sm px-3 py-2 rounded border transition-colors ";
                if (isSelected) {
                  rowClass +=
                    "border-blue-400 bg-blue-50 text-blue-800";
                } else if (habilitado) {
                  rowClass +=
                    "border-neutral-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
                } else if (esperando) {
                  rowClass +=
                    "border-amber-200 bg-amber-50 text-amber-700 cursor-default";
                } else {
                  rowClass +=
                    "border-transparent bg-neutral-100 text-neutral-400 cursor-default";
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      habilitado && seleccionarItem(orden, item.id)
                    }
                    disabled={!habilitado}
                    className={rowClass}
                  >
                    <span className="block truncate">{item.descripcion}</span>
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

      {/* Reception form */}
      {selectedItemId && selectedItem && (
        <div className="ui-card flex flex-col gap-4">
          <p className="text-sm font-medium">
            Recibiendo:{" "}
            <span className="text-blue-700">{selectedItem.descripcion}</span>
          </p>

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
                  Peso interno (kg)
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
                  Peso cliente (kg)
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
              <label className="text-xs text-neutral-500">Unidades</label>
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
                Tarifa cliente (USD)
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
          {(costoInternoBs || cobroClienteBs) && (
            <div className="bg-neutral-50 rounded p-3 text-sm flex flex-col gap-1">
              {costoInternoBs && (
                <p className="text-neutral-600">
                  Costo interno:{" "}
                  <span className="font-medium">Bs {costoInternoBs}</span>
                </p>
              )}
              {cobroClienteBs && (
                <p className="text-neutral-600">
                  Cobro cliente:{" "}
                  <span className="font-medium">Bs {cobroClienteBs}</span>
                </p>
              )}
            </div>
          )}

          {/* Ubicacion: 2-selector estante + fila */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-500">
              Ubicación
              {sugeridaCodigo && (
                <span className="ml-1 text-blue-400">
                  (sugerida: {sugeridaCodigo})
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-400">Estante</label>
                <select
                  value={selectedEstante}
                  onChange={(e) => setSelectedEstante(e.target.value)}
                  className="ui-input ui-input-sm"
                >
                  <option value="">—</option>
                  {estantes.map((e) => (
                    <option key={e} value={e}>
                      {e}
                      {sugeridaCodigo?.startsWith(e + "-") ? " ★" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-400">Fila</label>
                <select
                  value={selectedFila}
                  onChange={(e) => setSelectedFila(e.target.value)}
                  className="ui-input ui-input-sm"
                >
                  <option value="">—</option>
                  {filas.map((f) => (
                    <option key={f} value={f}>
                      {f}
                      {sugeridaCodigo?.endsWith("-" + f) ? " ★" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {ubicacionResultante && (
              <p className="text-sm">
                Ubicación:{" "}
                {ubicacionObj ? (
                  <span className="font-medium text-blue-700">
                    {ubicacionResultante}
                  </span>
                ) : (
                  <span className="text-red-500">
                    {ubicacionResultante} — no encontrada
                  </span>
                )}
              </p>
            )}
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

          <button
            type="button"
            onClick={registrar}
            disabled={loadingRegistrar || (formTouched && validationErrors.length > 0)}
            className="ui-button-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingRegistrar ? "Registrando..." : "Registrar recepción"}
          </button>
        </div>
      )}

      <button
        type="button"
        disabled
        className="ui-button opacity-50 cursor-not-allowed self-start text-sm"
      >
        Registrar desconocido (próximamente)
      </button>
    </div>
  );
}
