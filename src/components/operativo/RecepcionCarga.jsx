import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { API_URL } from "../../config/api";
import { normalizarUbicacion } from "../../utils/ubicacion";
import useRealtimeEvents from "../../hooks/useRealtimeEvents";

function printEtiquetaAlmacen(data, formato) {
  const {
    cliente_nombre, ubicacion, cobro_cliente_bs, item_descripcion,
    recibido_at, tracking_number, cliente_id
  } = data
  const precio = cobro_cliente_bs != null ? `Bs ${Number(cobro_cliente_bs).toFixed(2)}` : "—"
  const desc = item_descripcion
    ? (item_descripcion.length > 48 ? item_descripcion.slice(0, 48).trimEnd() + "…" : item_descripcion)
    : null

  // vars para etiqueta hoja
  const trackFinal = tracking_number ? tracking_number.slice(-4) : null
  const fechaRaw   = recibido_at || data.recibido_bolivia_at
  const fechaCarga = fechaRaw ? (() => {
    const d = new Date(fechaRaw)
    const p = n => String(n).padStart(2, "0")
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
  })() : null
  const ubicacionN = normalizarUbicacion(ubicacion)
  const ubicParts  = ubicacionN && /^([A-Z]\d+)-(F\d+)$/.test(ubicacionN)
    ? ubicacionN.split("-")
    : null

  let html

  if (formato === "adhesiva") {
    const descCorto = item_descripcion
      ? (item_descripcion.length > 32 ? item_descripcion.slice(0, 32).trimEnd() + "…" : item_descripcion)
      : null
    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiqueta adhesiva almacén</title>
<style>
  @page { size: 80mm 50mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    background: #fff;
    color: #000;
    width: 80mm;
    height: 50mm;
    display: flex;
    align-items: stretch;
  }
  .etiqueta {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 2.5mm 3mm;
    gap: 0;
  }
  .marca {
    font-size: 5.5pt;
    letter-spacing: 0.14em;
    color: #666;
    margin-bottom: 2mm;
    border-bottom: 0.5px solid #ccc;
    padding-bottom: 1.5mm;
    text-transform: uppercase;
  }
  .fila { display: flex; align-items: baseline; gap: 2mm; margin-bottom: 1.5mm; }
  .fila:last-child { margin-bottom: 0; }
  .lbl {
    font-size: 5pt;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    flex-shrink: 0;
    width: 12mm;
  }
  .val { font-size: 9pt; font-weight: 700; line-height: 1.2; word-break: break-word; }
  .val.ubic {
    font-size: 18pt;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.06em;
    line-height: 1;
  }
  .val.precio { font-size: 10pt; }
  .val.desc { font-size: 7pt; font-weight: 400; color: #333; }
  .sep { border: none; border-top: 0.5px solid #ddd; margin: 1.5mm 0; }
  @media print {
    body { width: 80mm; height: 50mm; }
  }
</style>
</head>
<body>
<div class="etiqueta">
  <div class="marca">Bolivia Imports — Almacén</div>
  <div class="fila">
    <div class="lbl">Cliente</div>
    <div class="val">${cliente_nombre || "—"}</div>
  </div>
  <hr class="sep">
  <div class="fila">
    <div class="lbl">Ubic.</div>
    <div class="val ubic">${ubicacionN}</div>
  </div>
  <hr class="sep">
  ${descCorto ? `<div class="fila"><div class="lbl">Ítem</div><div class="val desc">${descCorto}</div></div>` : ""}
  <div class="fila">
    <div class="lbl">Cobrar</div>
    <div class="val precio">${precio}</div>
  </div>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`
  } else {
    // formato === "hoja" — papel personalizado 110mm × 70mm
    const ubicHTML  = ubicParts
      ? `<div class="ubic-split"><div class="ubic-top">${ubicParts[0]}</div><div class="ubic-bot">${ubicParts[1]}</div></div>`
      : `<div class="ubic">${ubicacionN}</div>`
    const metaFecha = fechaCarga ? `<span><span class="ml">Fecha</span>&nbsp;${fechaCarga}</span>` : ""
    const metaTrack = trackFinal ? `<span><span class="ml">Track</span>&nbsp;…${trackFinal}</span>` : ""
    const metaID    = cliente_id ? `<span><span class="ml">ID</span>&nbsp;${cliente_id}</span>`    : ""
    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiqueta hoja almacén</title>
<style>
  @page { size: 110mm 70mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    background: #fff;
    color: #000;
    width: 110mm;
    height: 70mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media screen {
    body { width: auto; height: auto; min-height: 100vh; padding-bottom: 56px; }
  }
  .etiqueta {
    width: 104mm;
    height: 62mm;
    border: 1px solid #111;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .header {
    background: #111;
    color: #fff;
    font-size: 5.5pt;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    font-weight: 700;
    flex-shrink: 0;
    min-height: 7mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .body {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 1.5mm 2.5mm;
  }
  .col-left {
    flex: 0 0 62%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-right: 2mm;
  }
  .col-right {
    flex: 0 0 38%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-left: 0.5px solid #ccc;
    padding-left: 2mm;
  }
  .lbl {
    font-size: 4pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #888;
    margin-bottom: 0.5mm;
  }
  .cliente {
    font-size: 11pt;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5mm 3mm;
    font-size: 6.5pt;
    color: #222;
    line-height: 1.4;
  }
  .ml {
    font-size: 4pt;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    margin-right: 0.8mm;
  }
  .desc {
    font-size: 7pt;
    color: #333;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ubic-lbl {
    font-size: 4pt;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #888;
    margin-bottom: 1mm;
  }
  .ubic {
    font-size: 18pt;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.1;
    text-align: center;
    word-break: break-all;
  }
  .ubic-split {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5mm;
    line-height: 1;
  }
  .ubic-top {
    font-size: 20pt;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .ubic-bot {
    font-size: 13pt;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    color: #444;
    letter-spacing: 0.04em;
  }
  .screen-actions {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    padding: 8px 12px;
    background: #f0f0f0;
    border-top: 1px solid #ccc;
    display: flex;
    gap: 8px;
    z-index: 100;
  }
  .screen-actions button {
    padding: 8px 18px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-family: Arial, sans-serif;
    cursor: pointer;
  }
  .btn-v { background: #222; color: #fff; }
  .btn-c { background: #ddd; color: #333; }
  @media print {
    .screen-actions { display: none !important; }
    body { width: 110mm; height: 70mm; padding-bottom: 0; }
  }
</style>
</head>
<body>
<div class="etiqueta">
  <div class="header">Bolivia Imports · Almacén</div>
  <div class="body">
    <div class="col-left">
      <div>
        <div class="lbl">Cliente</div>
        <div class="cliente">${cliente_nombre || "—"}</div>
      </div>
      <div class="meta-row">
        <span><span class="ml">Cobro</span>${precio}</span>
        ${metaFecha}${metaTrack}${metaID}
      </div>
      <div>
        <div class="lbl">Ítem</div>
        <div class="desc">${desc || "—"}</div>
      </div>
    </div>
    <div class="col-right">
      <div class="ubic-lbl">Ubic.</div>
      ${ubicHTML}
    </div>
  </div>
</div>
<div class="screen-actions">
  <button class="btn-v" onclick="window.history.back()">← Volver</button>
  <button class="btn-c" onclick="window.close()">Cerrar</button>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`
  }

  const win = window.open("", "_blank", "width=480,height=400")
  if (!win) return
  win.document.write(html)
  win.document.close()
}

const ESPECIALES_ORDER = ["PISO", "PASILLO", "D1", "D2", "D3", "D4", "D5"];

// esPendiente: seleccionable aunque no tenga warehouse confirmado
const esPendiente = (item) =>
  item.estado !== "recibido_bolivia" &&
  item.estado !== "entregado";

// esEsperandoWarehouse: solo informativo — muestra badge "Sin warehouse" pero no bloquea
const esEsperandoWarehouse = (item) =>
  !item.warehouse_confirmado &&
  item.estado !== "recibido_bolivia" &&
  item.estado !== "entregado";

const fmtMoney = (v) => v == null ? "—" : Number(v).toFixed(2)
const redondearCobroBs = (valor) => {
  const entero = Math.floor(valor)
  const decimal = valor - entero
  return decimal >= 0.20 ? entero + 1 : entero
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-3)" }}>
      {children}
    </p>
  );
}

function StepLabel({ number, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
        style={{ background: "var(--text)", color: "var(--surface)" }}>
        {number}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
        {children}
      </span>
    </div>
  );
}

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
  const [monedaTarifaCliente, setMonedaTarifaCliente] = useState("usd");
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

  // ── Corrección rápida de cliente ──────────────────────────────────────────
  const [editandoCliente,       setEditandoCliente]       = useState(false);
  const [editandoClienteOrdenId, setEditandoClienteOrdenId] = useState(null);
  const [editClienteForm,       setEditClienteForm]       = useState({ nombre: "", telefono: "", ciudad: "" });
  const [savingCliente,         setSavingCliente]         = useState(false);
  const [editClienteError,      setEditClienteError]      = useState("");
  const [editClienteOk,         setEditClienteOk]         = useState(false);

  // ── Orden rápida ──────────────────────────────────────────────────────────
  const [showOrdenRapida, setShowOrdenRapida] = useState(false);
  const [orForm, setOrForm] = useState({
    tracking_number: "",
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_ciudad: "",
    numero_orden: "",
    item_descripcion: "",
    cantidad: "1",
  });
  const [orLoading, setOrLoading] = useState(false);
  const [orError, setOrError] = useState("");
  const [orSuccess, setOrSuccess] = useState("");

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
  const paso3Ref    = useRef(null);

  const ubicacionObj = ubicaciones.find((u) => u.codigo === selectedUbicacionCodigo);
  const ubicacionId = ubicacionObj ? String(ubicacionObj.id) : "";

  const zonaRecomendada = selectedOrden?.zona_recomendada || null;

  // Ubicaciones especiales tipo caja (sin fila): se muestran aparte de la grilla
  const ubicacionesCajas = useMemo(() => {
    const allCajas = ubicaciones.filter((u) => u.codigo.startsWith("CAJA-"));
    if (!zonaRecomendada) return allCajas;
    return allCajas.filter((u) => u.zona === zonaRecomendada);
  }, [ubicaciones, zonaRecomendada]);

  const ubicacionesParaGrilla = useMemo(() => {
    const base = zonaRecomendada
      ? ubicaciones.filter((u) => u.zona === zonaRecomendada)
      : ubicaciones.filter((u) => u.zona === "local" || u.zona === "terminal");
    // Excluir CAJA-* para que no contaminen los prefijos/filas de la grilla
    return base.filter((u) => !u.codigo.startsWith("CAJA-"));
  }, [ubicaciones, zonaRecomendada]);

  const esCelular = useMemo(() => {
    if (!categoriaId) return false;
    const cat = categorias.find((c) => String(c.id) === categoriaId);
    return cat?.nombre === "Celular usado" || cat?.nombre === "Celular nuevo";
  }, [categoriaId, categorias]);

  const ubicacionesEspeciales = useMemo(() => {
    const raw = ubicaciones.filter(
      (u) => u.zona === "especial" || u.zona === "desconocidos"
    );
    return [...raw].sort((a, b) => {
      const ia = ESPECIALES_ORDER.indexOf(a.codigo);
      const ib = ESPECIALES_ORDER.indexOf(b.codigo);
      if (ia === -1 && ib === -1) return a.codigo.localeCompare(b.codigo);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [ubicaciones]);

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

  // Función unificada: guarda edición de cliente desde banner post-recepción o desde card
  async function guardarEdicionCliente(clienteId) {
    if (!editClienteForm.nombre.trim()) {
      setEditClienteError("El nombre no puede quedar vacío");
      return;
    }
    setSavingCliente(true);
    setEditClienteError("");
    try {
      const res = await fetch(`${API_URL}/operativo/carga/clientes/${clienteId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nombre:   editClienteForm.nombre.trim(),
          telefono: editClienteForm.telefono.trim() || null,
          ciudad:   editClienteForm.ciudad.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar");
      const { nombre, telefono, ciudad } = json.data;
      // Actualizar todas las órdenes del mismo cliente en los resultados
      setOrdenes(prev => prev.map(o =>
        o.cliente_id === clienteId
          ? { ...o, cliente_nombre: nombre, cliente_telefono: telefono, cliente_ciudad: ciudad }
          : o
      ));
      // Actualizar banner post-recepción si corresponde
      setUltimaRecepcion(prev => prev && !prev.lote ? { ...prev, cliente_nombre: nombre } : prev);
      setEditClienteOk(true);
      setEditandoCliente(false);
      setEditandoClienteOrdenId(null);
      setTimeout(() => setEditClienteOk(false), 3000);
    } catch (err) {
      setEditClienteError(err.message || "Error al guardar");
    } finally {
      setSavingCliente(false);
    }
  }

  // Atajo para el banner post-recepción (compatibilidad con botón existente)
  async function guardarCorreccionCliente() {
    if (!ultimaRecepcion?.cliente_id) return;
    await guardarEdicionCliente(ultimaRecepcion.cliente_id);
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
        // Reset campos propios del ítem anterior — no arrastrar datos incorrectos
        setSelectedUbicacionCodigo("");
        setCategoriaId("");
        setTipoCalculo("kg");
        setPesoInterno("");
        setPesoCliente("");
        setUnidades("");
        setTarifaClienteUsd("");
        setCostoInternoUsd("");
        setNotas("");
        aplicarSugerida(orden);
        // Auto-scroll al Paso 3 después de que React renderice el formulario
        setTimeout(() => {
          paso3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
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

  // SSE: refrescar la búsqueda actual si llegan eventos de recepción/cambio
  const sseDebounce = useRef(null);
  useRealtimeEvents((ev) => {
    const RELEVANTES = ["item.received", "item.reverted", "inventory.updated"];
    if (RELEVANTES.includes(ev.type) && tracking.length >= 2) {
      clearTimeout(sseDebounce.current);
      sseDebounce.current = setTimeout(() => buscar(tracking), 500);
    }
  });

  // Regla de ubicación según categoría celular / no-celular
  useEffect(() => {
    if (!categoriaId) return;
    const cat = categorias.find((c) => String(c.id) === categoriaId);
    if (!cat) return;
    const esCat = cat.nombre === "Celular usado" || cat.nombre === "Celular nuevo";
    if (!esCat) {
      // Cambia a no-celular: limpiar si la selección era una caja
      setSelectedUbicacionCodigo((prev) =>
        prev === "CAJA-LOCAL" || prev === "CAJA-TERMINAL" ? "" : prev
      );
      return;
    }
    // Es celular: autoselect caja si no hay ubicación elegida
    setSelectedUbicacionCodigo((prev) => {
      if (prev) return prev; // ya hay selección → no sobrescribir
      if (zonaRecomendada === "local")
        return ubicaciones.some((u) => u.codigo === "CAJA-LOCAL") ? "CAJA-LOCAL" : prev;
      if (zonaRecomendada === "terminal")
        return ubicaciones.some((u) => u.codigo === "CAJA-TERMINAL") ? "CAJA-TERMINAL" : prev;
      return prev; // zona null → no autoseleccionar
    });
  }, [categoriaId, zonaRecomendada, categorias, ubicaciones]);

  function seleccionarItem(orden, itemId) {
    setSelectedOrden(orden);
    setSelectedItemId(itemId);
    setUltimaRecepcion(null);
    setError("");
    setFormTouched(false);
    // Reset campos propios del ítem anterior — no arrastrar datos incorrectos
    setSelectedUbicacionCodigo("");
    setCategoriaId("");
    setTipoCalculo("kg");
    setPesoInterno("");
    setPesoCliente("");
    setUnidades("");
    setTarifaClienteUsd("");
    setCostoInternoUsd("");
    setNotas("");
    // Aplicar sugerencia de ubicación para el nuevo ítem (si existe y coincide zona)
    aplicarSugerida(orden);
    // Auto-scroll al Paso 3 después de que React renderice el formulario
    setTimeout(() => {
      paso3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function seleccionarCategoria(id) {
    setCategoriaId(id);
    if (!id) return;
    const cat = categorias.find((c) => String(c.id) === id);
    if (!cat) return;
    if (cat.tipo_calculo) setTipoCalculo(cat.tipo_calculo);
    if (cat.tarifa_cliente_usd != null)
      setTarifaClienteUsd(String(Number(cat.tarifa_cliente_usd)));
    if (cat.precio_referencia_usd != null)
      setCostoInternoUsd(String(Number(cat.precio_referencia_usd)));
  }

  const costoInternoBs = useMemo(() => {
    const c = Number(costoInternoUsd);
    if (!c || c <= 0) return null;
    if (tipoCalculo === "declarado") {
      // Monto declarado: valor final en Bs, sin conversión
      return c.toFixed(2);
    }
    const tc = Number(tipoCambioInterno);
    if (!tc || tc <= 0) return null;
    if (tipoCalculo === "kg") {
      const p = Number(pesoInterno);
      return p > 0 ? (p * c * tc).toFixed(2) : null;
    }
    // unidad: si hay peso interno lo usa para costo; si no, fallback a unidades
    const pi = Number(pesoInterno);
    if (pi > 0) return (pi * c * tc).toFixed(2);
    const u = Number(unidades);
    return u > 0 ? (u * c * tc).toFixed(2) : null;
  }, [tipoCalculo, pesoInterno, unidades, costoInternoUsd, tipoCambioInterno]);

  const cobroClienteBs = useMemo(() => {
    const t = Number(tarifaClienteUsd);
    if (!t || t <= 0) return null;
    if (tipoCalculo === "declarado") {
      // Monto declarado: valor final en Bs, sin conversión ni redondeo
      return String(t);
    }
    const base = tipoCalculo === "kg" ? Number(pesoCliente) : Number(unidades);
    if (!base || base <= 0) return null;
    let raw;
    if (monedaTarifaCliente === "bs") {
      // Tarifa ingresada en Bs — T/C no altera el cobro, solo sirve de referencia
      raw = base * t;
    } else {
      const tc = Number(tipoCambioCliente);
      if (!tc || tc <= 0) return null;
      raw = base * t * tc;
    }
    return String(redondearCobroBs(raw));
  }, [tipoCalculo, pesoCliente, unidades, tarifaClienteUsd, tipoCambioCliente, monedaTarifaCliente]);

  const margenBs = useMemo(() => {
    if (!cobroClienteBs || !costoInternoBs) return null;
    return (Number(cobroClienteBs) - Number(costoInternoBs)).toFixed(2);
  }, [cobroClienteBs, costoInternoBs]);

  const validationErrors = useMemo(() => {
    if (!selectedItemId && selectedItemIds.size === 0) return [];
    const errs = [];
    if (tipoCalculo === "kg") {
      if (!pesoInterno || Number(pesoInterno) <= 0)
        errs.push("Peso interno (kg)");
      if (!pesoCliente || Number(pesoCliente) <= 0)
        errs.push("Peso cliente (kg)");
    } else if (tipoCalculo === "unidad") {
      if (!unidades || Number(unidades) <= 0) errs.push("Unidades");
    }
    // declarado: sin peso ni unidades requeridas
    if (!costoInternoUsd || Number(costoInternoUsd) <= 0)
      errs.push(tipoCalculo === "declarado" ? "Costo interno" : "Costo interno (USD)");
    if (!tarifaClienteUsd || Number(tarifaClienteUsd) <= 0)
      errs.push(
        tipoCalculo === "declarado"
          ? "Costo cliente"
          : monedaTarifaCliente === "bs" ? "Tarifa cliente (Bs)" : "Tarifa cliente (USD)"
      );
    // T/C nunca requerido para declarado (montos fijos en Bs)
    const tcRequerido = tipoCalculo !== "declarado";
    if (tcRequerido) {
      if (!tipoCambioInterno || Number(tipoCambioInterno) <= 0)
        errs.push("T/C interno");
      if (!tipoCambioCliente || Number(tipoCambioCliente) <= 0)
        errs.push("T/C cliente");
    }
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
    monedaTarifaCliente,
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
      // Para "declarado": montos fijos en Bs, TC = 1, sin conversión
      // Para kg/unidad en Bs: convertir tarifa de Bs → USD para que backend calcule bien
      let tarifaParaBackend, tcInternoFinal, tcClienteFinal;
      if (tipoCalculo === "declarado") {
        tarifaParaBackend = Number(tarifaClienteUsd);
        tcInternoFinal = 1;
        tcClienteFinal = 1;
      } else if (monedaTarifaCliente === "bs") {
        tarifaParaBackend = Number(tarifaClienteUsd) / Number(tipoCambioCliente);
        tcInternoFinal = Number(tipoCambioInterno);
        tcClienteFinal = Number(tipoCambioCliente);
      } else {
        tarifaParaBackend = Number(tarifaClienteUsd);
        tcInternoFinal = Number(tipoCambioInterno);
        tcClienteFinal = Number(tipoCambioCliente);
      }
      const payload = {
        item_id: selectedItemId,
        tipo_calculo: tipoCalculo,
        costo_interno_usd: Number(costoInternoUsd),
        tarifa_cliente_usd: tarifaParaBackend,
        tipo_cambio_interno: tcInternoFinal,
        tipo_cambio_cliente: tcClienteFinal,
        ubicacion_id: ubicacionId,
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
        ...(tipoCalculo === "kg"
          ? {
              peso_interno: Number(pesoInterno),
              peso_cliente: Number(pesoCliente),
            }
          : tipoCalculo === "unidad"
            ? {
                unidades: Number(unidades),
                ...(pesoInterno && Number(pesoInterno) > 0 ? { peso_interno: Number(pesoInterno) } : {}),
              }
            : {}),  // declarado: sin peso ni unidades
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
      let tarifaParaBackend, tcInternoFinal, tcClienteFinal;
      if (tipoCalculo === "declarado") {
        tarifaParaBackend = Number(tarifaClienteUsd);
        tcInternoFinal = 1;
        tcClienteFinal = 1;
      } else if (monedaTarifaCliente === "bs") {
        tarifaParaBackend = Number(tarifaClienteUsd) / Number(tipoCambioCliente);
        tcInternoFinal = Number(tipoCambioInterno);
        tcClienteFinal = Number(tipoCambioCliente);
      } else {
        tarifaParaBackend = Number(tarifaClienteUsd);
        tcInternoFinal = Number(tipoCambioInterno);
        tcClienteFinal = Number(tipoCambioCliente);
      }
      const payload = {
        item_ids: [...selectedItemIds],
        tipo_calculo: tipoCalculo,
        modo_lote: modoAplicacion,
        costo_interno_usd: Number(costoInternoUsd),
        tarifa_cliente_usd: tarifaParaBackend,
        tipo_cambio_interno: tcInternoFinal,
        tipo_cambio_cliente: tcClienteFinal,
        ubicacion_id: ubicacionId,
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
        ...(tipoCalculo === "kg"
          ? { peso_interno: Number(pesoInterno), peso_cliente: Number(pesoCliente) }
          : tipoCalculo === "unidad"
            ? {
                unidades: Number(unidades),
                ...(pesoInterno && Number(pesoInterno) > 0 ? { peso_interno: Number(pesoInterno) } : {}),
              }
            : {}),  // declarado: sin peso ni unidades
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

  async function registrarOrdenRapida() {
    setOrError("");
    setOrSuccess("");

    const trackingFinal = orForm.tracking_number.trim();
    if (!trackingFinal || trackingFinal.length < 5) {
      setOrError("Tracking obligatorio (mínimo 5 caracteres)");
      return;
    }
    if (!orForm.cliente_nombre.trim()) {
      setOrError("Nombre del cliente obligatorio");
      return;
    }
    if (!orForm.cliente_ciudad.trim()) {
      setOrError("Ciudad obligatoria");
      return;
    }
    if (!orForm.item_descripcion.trim()) {
      setOrError("Descripción del producto obligatoria");
      return;
    }

    setOrLoading(true);
    try {
      const res = await fetch(`${API_URL}/operativo/carga/orden-rapida`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_number:  trackingFinal,
          cliente_nombre:   orForm.cliente_nombre.trim(),
          cliente_telefono: orForm.cliente_telefono.trim() || "S/D",
          cliente_ciudad:   orForm.cliente_ciudad.trim(),
          ...(orForm.numero_orden.trim() ? { numero_orden: orForm.numero_orden.trim() } : {}),
          item_descripcion: orForm.item_descripcion.trim(),
          cantidad: Number(orForm.cantidad) >= 1 ? Number(orForm.cantidad) : 1,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setOrError(json.error || "Error al crear la orden");
        return;
      }

      // Limpiar campos del cliente/producto, conservar tracking para ver resultado
      setOrForm(f => ({
        ...f,
        cliente_nombre: "",
        cliente_telefono: "",
        cliente_ciudad: "",
        numero_orden: "",
        item_descripcion: "",
        cantidad: "1",
      }));
      setOrSuccess("Orden creada correctamente");

      // Actualizar buscador y refrescar resultados
      setTracking(trackingFinal);
      buscar(trackingFinal);

      setTimeout(() => setOrSuccess(""), 5000);

    } catch (err) {
      console.error(err);
      setOrError("Error de red al crear la orden");
    } finally {
      setOrLoading(false);
    }
  }

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
    <div className="flex flex-col gap-6">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Carga Bolivia
        </h3>
      </div>

      {/* Success banner */}
      {ultimaRecepcion && (
        <div className="rounded-xl p-4 flex flex-col gap-2"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: "var(--success)" }}>✓</span>
            <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              {ultimaRecepcion.lote
                ? `Lote registrado — ${ultimaRecepcion.count} ítems`
                : "Recepción registrada"}
            </p>
          </div>
          {!ultimaRecepcion.lote && (
            <>
              <p className="text-sm">
                <span style={{ color: "var(--text-3)" }}>Código: </span>
                <span className="font-mono font-medium" style={{ color: "var(--text)" }}>
                  {ultimaRecepcion.codigo_recepcion}
                </span>
              </p>
              <p className="text-sm">
                <span style={{ color: "var(--text-3)" }}>Ítem: </span>
                <span style={{ color: "var(--text-2)" }}>{ultimaRecepcion.item_descripcion}</span>
              </p>
            </>
          )}
          <p className="text-sm">
            <span style={{ color: "var(--text-3)" }}>Ubicación: </span>
            <span className="font-medium" style={{ color: "var(--text-2)" }}>{normalizarUbicacion(ultimaRecepcion.ubicacion)}</span>
          </p>
          {!ultimaRecepcion.lote && (
            <div className="flex gap-2 mt-1 flex-wrap">
              <button
                type="button"
                onClick={() => printEtiquetaAlmacen(ultimaRecepcion, "hoja")}
                className="ui-button self-start"
              >
                Etiqueta hoja
              </button>
              <button
                type="button"
                onClick={() => printEtiquetaAlmacen(ultimaRecepcion, "adhesiva")}
                className="ui-button self-start"
              >
                Etiqueta adhesiva
              </button>
              {!editandoCliente && (
                <button
                  type="button"
                  onClick={() => {
                    setEditClienteForm({ nombre: ultimaRecepcion.cliente_nombre || "", telefono: "", ciudad: "" });
                    setEditClienteError("");
                    setEditandoCliente(true);
                  }}
                  className="ui-button self-start"
                  style={{ color: "var(--text-2)", background: "var(--surface-3)" }}
                >
                  Corregir datos cliente
                </button>
              )}
            </div>
          )}

          {/* Formulario de corrección de cliente */}
          {!ultimaRecepcion.lote && editandoCliente && (
            <div className="mt-2 flex flex-col gap-2 rounded-xl p-3"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Corregir datos del cliente
              </p>
              <input
                placeholder="Nombre del cliente"
                value={editClienteForm.nombre}
                onChange={e => setEditClienteForm(f => ({ ...f, nombre: e.target.value }))}
                className="ui-input text-sm"
                disabled={savingCliente}
              />
              <input
                placeholder="Teléfono (opcional)"
                value={editClienteForm.telefono}
                onChange={e => setEditClienteForm(f => ({ ...f, telefono: e.target.value }))}
                className="ui-input text-sm"
                disabled={savingCliente}
              />
              <input
                placeholder="Ciudad (opcional)"
                value={editClienteForm.ciudad}
                onChange={e => setEditClienteForm(f => ({ ...f, ciudad: e.target.value }))}
                className="ui-input text-sm"
                disabled={savingCliente}
              />
              {editClienteError && (
                <p className="text-xs" style={{ color: "var(--danger)" }}>{editClienteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={guardarCorreccionCliente}
                  disabled={savingCliente}
                  className="ui-button text-sm disabled:opacity-50"
                >
                  {savingCliente ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditandoCliente(false); setEditClienteError(""); }}
                  disabled={savingCliente}
                  className="text-sm px-3 py-1.5 rounded-lg"
                  style={{ color: "var(--text-3)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {editClienteOk && (
            <p className="text-xs font-medium mt-1" style={{ color: "var(--success)" }}>
              ✓ Datos del cliente actualizados
            </p>
          )}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="text-sm rounded-xl p-3"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Paso 1 */}
      <StepLabel number="1">Buscar tracking</StepLabel>

      <input
        ref={trackingRef}
        placeholder="Tracking, cliente, teléfono, descripción..."
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

      {/* Orden rápida */}
      <button
        type="button"
        onClick={() => {
          const opening = !showOrdenRapida;
          setShowOrdenRapida(opening);
          if (opening) {
            setOrForm(f => ({ ...f, tracking_number: tracking }));
            setOrError("");
            setOrSuccess("");
          }
        }}
        className="self-start text-sm px-3 py-2 rounded-lg border transition-colors font-medium"
        style={showOrdenRapida
          ? { background: "var(--surface-2)", borderColor: "var(--border-strong)", color: "var(--text)" }
          : { borderColor: "var(--border)", color: "var(--text-3)" }
        }
      >
        {showOrdenRapida ? "Ocultar orden rápida" : "+ Registrar orden rápida"}
      </button>

      {showOrdenRapida && (
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>

          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Orden rápida
          </p>

          {orSuccess && (
            <div className="rounded-xl px-3 py-2 text-sm font-medium"
              style={{ background: "var(--success-soft)", border: "1px solid var(--success)", color: "var(--success)" }}>
              ✓ {orSuccess}
            </div>
          )}

          {orError && (
            <div className="rounded-xl px-3 py-2 text-sm"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
              {orError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="ui-label">Tracking <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                type="text"
                value={orForm.tracking_number}
                onChange={e => setOrForm(f => ({ ...f, tracking_number: e.target.value }))}
                className="ui-input ui-input-sm"
                placeholder="TBA331..."
                disabled={orLoading}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="ui-label">N° orden <span className="font-normal opacity-60">(opcional)</span></label>
              <input
                type="text"
                value={orForm.numero_orden}
                onChange={e => setOrForm(f => ({ ...f, numero_orden: e.target.value }))}
                className="ui-input ui-input-sm"
                placeholder="112-..."
                disabled={orLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="ui-label">Cliente <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                type="text"
                value={orForm.cliente_nombre}
                onChange={e => setOrForm(f => ({ ...f, cliente_nombre: e.target.value }))}
                className="ui-input ui-input-sm"
                placeholder="Nombre completo"
                disabled={orLoading}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="ui-label">Ciudad <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                type="text"
                value={orForm.cliente_ciudad}
                onChange={e => setOrForm(f => ({ ...f, cliente_ciudad: e.target.value }))}
                className="ui-input ui-input-sm"
                placeholder="Santa Cruz"
                disabled={orLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="ui-label">Teléfono <span className="font-normal opacity-60">(opcional)</span></label>
              <input
                type="text"
                value={orForm.cliente_telefono}
                onChange={e => setOrForm(f => ({ ...f, cliente_telefono: e.target.value }))}
                className="ui-input ui-input-sm"
                placeholder="70000000"
                disabled={orLoading}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="ui-label">Cantidad</label>
              <input
                type="number"
                value={orForm.cantidad}
                onChange={e => setOrForm(f => ({ ...f, cantidad: e.target.value }))}
                className="ui-input ui-input-sm"
                min="1"
                step="1"
                onWheel={e => e.currentTarget.blur()}
                disabled={orLoading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="ui-label">Descripción del producto <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              type="text"
              value={orForm.item_descripcion}
              onChange={e => setOrForm(f => ({ ...f, item_descripcion: e.target.value }))}
              className="ui-input"
              placeholder="Ej: CELULAR SAMSUNG GALAXY A54..."
              disabled={orLoading}
            />
          </div>

          <button
            type="button"
            onClick={registrarOrdenRapida}
            disabled={orLoading}
            className="ui-button-success disabled:opacity-50 disabled:cursor-not-allowed self-start"
          >
            {orLoading ? "Creando..." : "Crear y recibir"}
          </button>
        </div>
      )}

      {/* Paso 2 */}
      {ordenes.length > 0 && (
        <StepLabel number="2">Seleccionar ítem</StepLabel>
      )}

      {/* Orden cards */}
      {ordenes.map((orden) => {
        const habilitados = orden.items.filter(esPendiente);
        const sinWarehouse = orden.items.filter(esEsperandoWarehouse);
        const recibidos = orden.items.filter(
          (i) =>
            i.estado === "recibido_bolivia" || i.estado === "entregado"
        );

        return (
          <div
            key={orden.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            {/* Order header */}
            <div className="px-4 py-3 flex flex-col gap-0.5"
              style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{orden.cliente_nombre}</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditandoClienteOrdenId(orden.id);
                    setEditClienteForm({
                      nombre:   orden.cliente_nombre   || "",
                      telefono: orden.cliente_telefono || "",
                      ciudad:   orden.cliente_ciudad   || "",
                    });
                    setEditClienteError("");
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
                  style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  Editar
                </button>
              </div>
              <p className="text-xs font-mono" style={{ color: "var(--text-3)" }}>
                {orden.numero_orden} · {orden.tracking_number}
              </p>
              {orden.ubicacion_sugerida && orden.ubicacion_sugerida_coincide_zona && (
                <p className="text-xs" style={{ color: "var(--text-2)" }}>
                  Ubicación sugerida: {orden.ubicacion_sugerida.codigo} — este cliente ya tiene paquetes ahí
                </p>
              )}
              {orden.ubicacion_sugerida && !orden.ubicacion_sugerida_coincide_zona && (
                <p className="text-xs" style={{ color: "var(--warning)" }}>
                  Ubicación previa en zona {orden.ubicacion_sugerida.zona}: {orden.ubicacion_sugerida.codigo} — revisar antes de asignar
                </p>
              )}
              {orden.zona_recomendada && (
                <p className="text-xs font-medium"
                  style={{ color: orden.zona_recomendada === "local" ? "var(--text-2)" : "var(--warning)" }}>
                  {orden.zona_recomendada === "local"
                    ? "Local — Santa Cruz"
                    : `Terminal — ${orden.cliente_ciudad || "otro departamento"}`}
                </p>
              )}
              {orden.nota_solicitud && (
                <div
                  className="text-xs mt-1 px-2 py-1.5 rounded"
                  style={{ background: "rgba(111,164,183,0.10)", borderLeft: "2px solid #6FA4B7" }}
                >
                  <p
                    className="font-semibold uppercase"
                    style={{ fontFamily: "'Geist Mono', monospace", fontSize: "9px", letterSpacing: "0.10em", color: "var(--text-3)" }}
                  >
                    Observación interna
                  </p>
                  <p className="mt-0.5 leading-snug" style={{ color: "var(--text-2)" }}>
                    {orden.nota_solicitud}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {habilitados.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--surface-3)", color: "var(--text-2)" }}>
                    {habilitados.length} pendiente{habilitados.length !== 1 ? "s" : ""}
                  </span>
                )}
                {sinWarehouse.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
                    {sinWarehouse.length} sin warehouse
                  </span>
                )}
                {recibidos.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--success-soft)", color: "var(--success)" }}>
                    {recibidos.length} recibido{recibidos.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Formulario inline de edición de cliente */}
              {editandoClienteOrdenId === orden.id && (
                <div className="mt-2 flex flex-col gap-2 rounded-xl p-3"
                  style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                    Editar cliente
                  </p>
                  <input
                    placeholder="Nombre del cliente"
                    value={editClienteForm.nombre}
                    onChange={e => setEditClienteForm(f => ({ ...f, nombre: e.target.value }))}
                    className="ui-input text-sm"
                    disabled={savingCliente}
                  />
                  <input
                    placeholder="Teléfono (opcional)"
                    value={editClienteForm.telefono}
                    onChange={e => setEditClienteForm(f => ({ ...f, telefono: e.target.value }))}
                    className="ui-input text-sm"
                    disabled={savingCliente}
                  />
                  <input
                    placeholder="Ciudad"
                    value={editClienteForm.ciudad}
                    onChange={e => setEditClienteForm(f => ({ ...f, ciudad: e.target.value }))}
                    className="ui-input text-sm"
                    disabled={savingCliente}
                  />
                  {editClienteError && (
                    <p className="text-xs" style={{ color: "var(--danger)" }}>{editClienteError}</p>
                  )}
                  {editClienteOk && (
                    <p className="text-xs font-medium" style={{ color: "var(--success)" }}>✓ Cliente actualizado</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => guardarEdicionCliente(orden.cliente_id)}
                      disabled={savingCliente}
                      className="ui-button ui-button-sm disabled:opacity-50"
                    >
                      {savingCliente ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditandoClienteOrdenId(null); setEditClienteError(""); }}
                      disabled={savingCliente}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-3)" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="px-4 py-3 flex flex-col gap-2">

              {/* Toggle modo lote */}
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
                    className="text-xs px-2 py-1 rounded border transition-colors"
                    style={modoLote
                      ? { borderColor: "var(--border-strong)", background: "var(--surface-2)", color: "var(--text)" }
                      : { borderColor: "var(--border)", color: "var(--text-3)" }
                    }
                  >
                    {modoLote ? "Modo lote activo — cancelar" : "Recibir varios ítems juntos"}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1">
                {orden.items.map((item) => {
                  const habilitado = esPendiente(item);
                  const esperando = esEsperandoWarehouse(item);

                  if (modoLote && selectedOrden?.id === orden.id) {
                    const isChecked = selectedItemIds.has(item.id);
                    const rowStyle = !habilitado
                      ? { borderColor: "transparent", background: "var(--surface-3)", color: "var(--text-3)", opacity: 0.6, cursor: "default" }
                      : isChecked
                        ? { borderColor: "var(--border-strong)", background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }
                        : { borderColor: "var(--border)", color: "var(--text-2)", cursor: "pointer" };
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
                        className="text-left text-sm px-3 py-2 rounded-lg border transition-colors flex items-start gap-2"
                        style={rowStyle}
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
                            {item.cantidad > 1 && (
                              <span className="ml-1.5 text-xs font-normal opacity-70">×{item.cantidad}</span>
                            )}
                            {item.item_match && (
                              <span className="ml-2 text-xs font-medium" style={{ color: "var(--text-3)" }}>
                                · tracking coincide
                              </span>
                            )}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>
                            {esperando ? "Sin confirmación warehouse" : "Pendiente"}
                          </span>
                        </span>
                      </button>
                    );
                  }

                  const isSelected = item.id === selectedItemId;
                  const isRecibido = item.estado === "recibido_bolivia" || item.estado === "entregado";
                  const rowStyle = isSelected
                    ? { borderColor: "var(--border-strong)", background: "var(--surface-2)", color: "var(--text)" }
                    : habilitado
                      ? { borderColor: "var(--border)", color: "var(--text-2)", cursor: "pointer" }
                      : esperando
                        ? { borderColor: "var(--warning-soft)", background: "var(--warning-soft)", color: "var(--warning)", cursor: "default" }
                        : { borderColor: "transparent", background: "var(--surface-3)", color: "var(--text-3)", cursor: "default" };

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => habilitado && seleccionarItem(orden, item.id)}
                      disabled={!habilitado}
                      className="text-left text-sm w-full px-3 py-2 rounded-lg border transition-colors"
                      style={rowStyle}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="truncate font-medium">
                            {item.descripcion}
                            {item.cantidad > 1 && (
                              <span className="ml-1.5 text-xs font-normal opacity-70">×{item.cantidad}</span>
                            )}
                            {item.item_match && (
                              <span className="ml-2 text-xs font-medium" style={{ color: "var(--text-3)" }}>· tracking coincide</span>
                            )}
                          </span>
                          <span className="text-xs opacity-60">
                            {isRecibido
                              ? item.estado === "entregado" ? "Entregado" : "Recibido en Bolivia"
                              : esperando
                                ? "Sin confirmación warehouse"
                                : "Pendiente"}
                          </span>
                        </div>
                        {habilitado && !isSelected && (
                          <span className="flex-shrink-0 text-[10px] font-medium whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                            Seleccionar →
                          </span>
                        )}
                        {isSelected && (
                          <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: "var(--text)", color: "var(--surface)" }}>
                            ✓
                          </span>
                        )}
                        {isRecibido && (
                          <span className="flex-shrink-0 text-sm" style={{ color: "var(--success)" }}>✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Paso 3 + Reception form */}
      {((selectedItemId && selectedItem) || (modoLote && selectedItemIds.size > 0 && selectedOrden)) && (
        <div ref={paso3Ref} className="flex flex-col gap-6">
        <StepLabel number="3">Registrar recepción</StepLabel>
        <div className="rounded-2xl p-4 flex flex-col gap-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          {/* Form header */}
          {modoLote ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Recibiendo{" "}
                <span style={{ color: "var(--text-2)" }}>{selectedItemIds.size} ítem{selectedItemIds.size !== 1 ? "s" : ""}</span>
                {selectedOrden && <span className="font-normal" style={{ color: "var(--text-3)" }}> — {selectedOrden.cliente_nombre}</span>}
              </p>

              {/* Selector modo aplicación */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModoAplicacion("individual")}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border transition-colors text-left"
                  style={modoAplicacion === "individual"
                    ? { borderColor: "var(--border-strong)", background: "var(--surface-2)", color: "var(--text)" }
                    : { borderColor: "var(--border)", color: "var(--text-3)" }
                  }
                >
                  <span className="block font-medium">Valores individuales</span>
                  <span className="block text-xs opacity-70">Los valores ingresados se registran completos en cada ítem.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoAplicacion("consolidado")}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border transition-colors text-left"
                  style={modoAplicacion === "consolidado"
                    ? { borderColor: "var(--border-strong)", background: "var(--surface-2)", color: "var(--text)" }
                    : { borderColor: "var(--border)", color: "var(--text-3)" }
                  }
                >
                  <span className="block font-medium">Valores consolidados</span>
                  <span className="block text-xs opacity-70">Ingresa el total del lote. El sistema divide entre los ítems.</span>
                </button>
              </div>

              {modoAplicacion === "individual" ? (
                <p className="text-xs px-3 py-2 rounded-lg"
                  style={{ color: "var(--text-3)", background: "var(--surface-2)" }}>
                  Los valores ingresados se registrarán completos en cada ítem.
                </p>
              ) : (
                <p className="text-xs px-3 py-2 rounded-lg"
                  style={{ color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  Ingresa el total del lote. El sistema dividirá los valores entre los {selectedItemIds.size} ítems seleccionados.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Recibiendo:{" "}
              <span className="font-normal" style={{ color: "var(--text-3)" }}>{selectedItem.descripcion}</span>
            </p>
          )}

          {/* ── Layout 2 columnas en desktop ───────────────────────────── */}
          <div className="md:grid md:grid-cols-2 md:gap-x-6 flex flex-col gap-4 md:gap-y-4">

            {/* Columna izquierda: Categoría + Medida + Financiero + Preview */}
            <div className="flex flex-col gap-4">

              {/* Categoría */}
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Categoría</SectionLabel>
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
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    Referencia:{" "}
                    {categoriaSeleccionada?.precio_referencia_usd != null
                      ? `USD ${Number(categoriaSeleccionada.precio_referencia_usd).toFixed(2)} por ${categoriaSeleccionada.tipo_calculo === "kg" ? "kg" : "unidad"} — prellenado en costo interno`
                      : "sin precio configurado"}
                  </p>
                )}
              </div>

              {/* Tipo de cobro */}
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Tipo de cobro</SectionLabel>
                <div className="flex gap-4 text-sm flex-wrap">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={tipoCalculo === "kg"} onChange={() => setTipoCalculo("kg")} />
                    Por kg
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={tipoCalculo === "unidad"} onChange={() => setTipoCalculo("unidad")} />
                    Por unidad
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={tipoCalculo === "declarado"} onChange={() => setTipoCalculo("declarado")} />
                    Declarado
                  </label>
                </div>

                {tipoCalculo === "kg" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="ui-label">
                        {modoLote && modoAplicacion === "consolidado" ? "Peso interno TOTAL (kg)" : "Peso interno (kg)"}
                      </label>
                      <input type="number" placeholder="0.00" value={pesoInterno}
                        onChange={(e) => setPesoInterno(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="ui-input ui-input-sm" min="0" step="0.01" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="ui-label">
                        {modoLote && modoAplicacion === "consolidado" ? "Peso cliente TOTAL (kg)" : "Peso cliente (kg)"}
                      </label>
                      <input type="number" placeholder="0.00" value={pesoCliente}
                        onChange={(e) => setPesoCliente(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="ui-input ui-input-sm" min="0" step="0.01" />
                    </div>
                  </div>
                )}

                {tipoCalculo === "unidad" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="ui-label">
                        {modoLote && modoAplicacion === "consolidado" ? "Unidades TOTAL lote" : "Unidades"}
                      </label>
                      <input type="number" placeholder="1" value={unidades}
                        onChange={(e) => setUnidades(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="ui-input ui-input-sm" min="1" step="1" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="ui-label">
                        Peso interno (kg){" "}
                        <span style={{ fontWeight: 400, opacity: 0.6, fontSize: "0.75em" }}>opcional</span>
                      </label>
                      <input type="number" placeholder="0.00" value={pesoInterno}
                        onChange={(e) => setPesoInterno(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="ui-input ui-input-sm" min="0" step="0.01" />
                    </div>
                  </div>
                )}
              </div>

              {/* Financiero */}
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Financiero</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="ui-label">
                      {tipoCalculo === "declarado" ? "Costo interno" : "Costo interno (USD)"}
                    </label>
                    <input type="number" placeholder="0.00" value={costoInternoUsd}
                      onChange={(e) => setCostoInternoUsd(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="ui-input ui-input-sm" min="0" step="0.01" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="ui-label">
                        {tipoCalculo === "declarado"
                          ? "Costo cliente"
                          : tipoCalculo === "kg"
                            ? `Tarifa cliente/kg (${monedaTarifaCliente === "usd" ? "USD" : "Bs"})`
                            : `Tarifa cliente/unidad (${monedaTarifaCliente === "usd" ? "USD" : "Bs"})`}
                      </label>
                      {/* Toggle moneda: ocultar en declarado (siempre Bs) */}
                      {tipoCalculo !== "declarado" && (
                        <div className="flex rounded overflow-hidden border text-[10px] font-semibold flex-shrink-0"
                          style={{ borderColor: "var(--border)" }}>
                          <button type="button"
                            onClick={() => setMonedaTarifaCliente("usd")}
                            className="px-2 py-0.5 transition-colors"
                            style={monedaTarifaCliente === "usd"
                              ? { background: "var(--text)", color: "var(--surface)" }
                              : { color: "var(--text-3)" }}>
                            USD
                          </button>
                          <button type="button"
                            onClick={() => setMonedaTarifaCliente("bs")}
                            className="px-2 py-0.5 transition-colors"
                            style={monedaTarifaCliente === "bs"
                              ? { background: "var(--text)", color: "var(--surface)" }
                              : { color: "var(--text-3)" }}>
                            Bs
                          </button>
                        </div>
                      )}
                    </div>
                    <input type="number" placeholder="0.00" value={tarifaClienteUsd}
                      onChange={(e) => setTarifaClienteUsd(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="ui-input ui-input-sm" min="0" step="0.01" />
                  </div>
                </div>
                {/* T/C: solo para kg/unidad, nunca para declarado */}
                {tipoCalculo !== "declarado" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="ui-label">T/C interno</label>
                      <input type="number" placeholder="6.96" value={tipoCambioInterno}
                        onChange={(e) => setTipoCambioInterno(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="ui-input ui-input-sm" min="0" step="0.01" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="ui-label">T/C cliente</label>
                      <input type="number" placeholder="6.96" value={tipoCambioCliente}
                        onChange={(e) => setTipoCambioCliente(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="ui-input ui-input-sm" min="0" step="0.01" />
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen financiero */}
              {(() => {
                const nItems = modoLote ? selectedItemIds.size : 1;
                const esConsolidado = modoLote && modoAplicacion === "consolidado" && nItems > 1;

                if (!costoInternoBs && !cobroClienteBs) {
                  return (
                    <div className="rounded-xl p-3 text-xs"
                      style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>
                      Completa los datos para calcular la ganancia
                    </div>
                  );
                }

                const costoTotal = esConsolidado
                  ? Number(costoInternoBs || 0)
                  : Number(costoInternoBs || 0) * nItems;
                const cobroTotal = esConsolidado
                  ? Number(cobroClienteBs || 0)
                  : Number(cobroClienteBs || 0) * nItems;
                const margenTotal = cobroClienteBs && costoInternoBs
                  ? (esConsolidado ? Number(margenBs || 0) : Number(margenBs || 0) * nItems)
                  : null;

                return (
                  <div className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                      Resumen financiero{nItems > 1 ? ` — ${nItems} ítems` : ""}
                    </p>

                    {costoInternoBs && (
                      <div className="flex justify-between items-baseline text-sm gap-2">
                        <span style={{ color: "var(--text-2)" }}>Costo interno total</span>
                        <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                          Bs {fmtMoney(costoTotal)}
                        </span>
                      </div>
                    )}

                    {cobroClienteBs && (
                      <div className="flex justify-between items-baseline text-sm gap-2">
                        <span style={{ color: "var(--text-2)" }}>Cobro cliente total</span>
                        <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                          Bs {Math.round(cobroTotal)}
                        </span>
                      </div>
                    )}

                    {margenTotal !== null ? (
                      <div className="flex justify-between items-baseline text-sm gap-2 pt-1.5 mt-0.5"
                        style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="font-medium"
                          style={{ color: margenTotal >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {margenTotal >= 0 ? "Ganancia estimada" : "Pérdida estimada"}
                        </span>
                        <span className="font-bold tabular-nums"
                          style={{ color: margenTotal >= 0 ? "var(--success)" : "var(--danger)" }}>
                          Bs {fmtMoney(Math.abs(margenTotal))}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs pt-1.5 mt-0.5"
                        style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                        Completa los datos para calcular la ganancia
                      </p>
                    )}

                    {esConsolidado && nItems > 1 && (
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        Por ítem:{" "}
                        {costoInternoBs && <>costo Bs {fmtMoney(costoTotal / nItems)}</>}
                        {costoInternoBs && cobroClienteBs && " · "}
                        {cobroClienteBs && <>cobro Bs {fmtMoney(cobroTotal / nItems)}</>}
                      </p>
                    )}
                  </div>
                );
              })()}

            </div>{/* fin columna izquierda */}

            {/* Columna derecha: Ubicación + Notas */}
            <div className="flex flex-col gap-4">

              {/* Ubicación */}
              <div className="flex flex-col gap-1.5">
                <SectionLabel>
                  Ubicación
                  {zonaRecomendada && (
                    <span className="ml-1 normal-case font-medium"
                      style={{ color: zonaRecomendada === "local" ? "var(--text-2)" : "var(--warning)" }}>
                      — {zonaRecomendada === "local" ? "Local" : "Terminal"}
                    </span>
                  )}
                  {sugeridaCodigo && (
                    <span className="ml-1 normal-case font-normal" style={{ color: "var(--text-3)" }}>
                      (sugerida: {sugeridaCodigo})
                    </span>
                  )}
                </SectionLabel>

                {/* ── Cajas / Grilla condicional según categoría ── */}
                {esCelular ? (
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-3)" }}>Cajas</div>
                    <div className="flex gap-1 flex-wrap">
                      {ubicacionesCajas.length > 0 ? ubicacionesCajas.map((u) => {
                        const label      = u.codigo === "CAJA-LOCAL" ? "Caja Local"
                                         : u.codigo === "CAJA-TERMINAL" ? "Caja Terminal"
                                         : u.codigo;
                        const isSelected = selectedUbicacionCodigo === u.codigo;
                        const cellStyle  = isSelected
                          ? { background: "var(--text)", color: "var(--surface)", cursor: "pointer" }
                          : { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", color: "var(--text-2)", background: "var(--surface)", cursor: "pointer" };
                        return (
                          <button
                            key={u.codigo}
                            type="button"
                            onClick={() => setSelectedUbicacionCodigo(u.codigo)}
                            className="px-3 h-8 rounded-lg text-xs font-medium transition-colors"
                            style={cellStyle}
                          >
                            {label}
                          </button>
                        );
                      }) : (
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>No hay cajas disponibles.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex flex-col gap-1 min-w-max">
                      <div className="flex gap-1 ml-7">
                        {filas.map((f) => (
                          <div key={f} className="w-12 text-center text-xs font-medium" style={{ color: "var(--text-3)" }}>
                            {f}
                          </div>
                        ))}
                      </div>
                      {estantes.map((est) => (
                        <div key={est} className="flex items-center gap-1">
                          <div className="w-6 text-xs font-medium text-right" style={{ color: "var(--text-3)" }}>{normalizarUbicacion(est)}</div>
                          {filas.map((fil) => {
                            const codigo = `${est}-${fil}`;
                            const existe = ubicacionesParaGrilla.some((u) => u.codigo === codigo);
                            const isSelected = selectedUbicacionCodigo === codigo;
                            const isSugerida = sugeridaCodigo === codigo;
                            if (!existe) {
                              return <div key={fil} className="w-12 h-8 rounded-lg" style={{ background: "var(--surface-3)" }} />;
                            }
                            const cellStyle = isSelected
                              ? { background: "var(--text)", color: "var(--surface)", borderColor: "var(--text)", cursor: "pointer" }
                              : isSugerida
                                ? { borderWidth: 2, borderStyle: "solid", borderColor: "var(--border-strong)", color: "var(--text-2)", background: "var(--surface-2)", cursor: "pointer" }
                                : { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", color: "var(--text-2)", background: "var(--surface)", cursor: "pointer" };
                            return (
                              <button key={fil} type="button" onClick={() => setSelectedUbicacionCodigo(codigo)}
                                className="w-12 h-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                                style={cellStyle}>
                                {normalizarUbicacion(codigo)}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* ── Especiales: PISO, PASILLO, D1-D5 ── */}
                {ubicacionesEspeciales.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-3)" }}>Especiales</div>
                    <div className="flex gap-1 flex-wrap">
                      {ubicacionesEspeciales.map((u) => {
                        const isSelected = selectedUbicacionCodigo === u.codigo;
                        return (
                          <button
                            key={u.codigo}
                            type="button"
                            onClick={() => setSelectedUbicacionCodigo(u.codigo)}
                            className="px-3 h-8 rounded-lg text-xs font-medium transition-colors"
                            style={isSelected
                              ? { background: "var(--text)", color: "var(--surface)", cursor: "pointer" }
                              : { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", color: "var(--text-2)", background: "var(--surface)", cursor: "pointer" }
                            }
                          >
                            {u.codigo}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Seleccionada:{" "}
                  {selectedUbicacionCodigo ? (
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{normalizarUbicacion(selectedUbicacionCodigo)}</span>
                  ) : (
                    <span style={{ color: "var(--text-3)" }}>—</span>
                  )}
                </p>
              </div>

              {/* Notas */}
              <div className="flex flex-col gap-1">
                <label className="ui-label">Notas (opcional)</label>
                <input
                  type="text"
                  placeholder="Observaciones..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="ui-input"
                />
              </div>

            </div>{/* fin columna derecha */}

          </div>{/* fin grid 2 columnas */}

          {/* Validation errors — ancho completo */}
          {formTouched && validationErrors.length > 0 && (
            <div className="rounded-xl p-3 text-sm"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
              <p className="font-medium mb-1" style={{ color: "var(--danger)" }}>
                Completar antes de registrar:
              </p>
              <ul className="list-disc list-inside space-y-0.5" style={{ color: "var(--danger)" }}>
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
        </div>
      )}

      {/* Paquete desconocido */}
      <div className="pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
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
          className="self-start text-sm px-3 py-2 rounded-lg border transition-colors font-medium"
          style={showDesconocido
            ? { background: "var(--warning-soft)", borderColor: "var(--warning)", color: "var(--warning)" }
            : { borderColor: "var(--warning-soft)", color: "var(--warning)" }
          }
        >
          {showDesconocido ? "Ocultar formulario desconocido" : "+ Registrar paquete desconocido"}
        </button>
      </div>

      {showDesconocido && (
        <div className="rounded-2xl p-4 flex flex-col gap-4"
          style={{ background: "var(--warning-soft)", border: "1px solid var(--warning-soft)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
            Paquete desconocido
          </p>

          {ultimoDesconocido && (
            <div className="rounded-xl p-3 flex flex-col gap-1"
              style={{ background: "var(--success-soft)", border: "1px solid var(--success)" }}>
              <p className="font-semibold text-sm" style={{ color: "var(--success)" }}>Registrado</p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                {ultimoDesconocido.descripcion}
                {" · "}{normalizarUbicacion(ultimoDesconocido.ubicacion_codigo)}
              </p>
            </div>
          )}

          {descError && (
            <div className="text-sm rounded-xl p-3"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
              {descError}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="ui-label">Tracking (opcional)</label>
            <input
              type="text"
              placeholder="Si se conoce o es parcial"
              value={descTracking}
              onChange={(e) => setDescTracking(e.target.value)}
              className="ui-input ui-input-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="ui-label">
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
            <label className="ui-label">Peso kg (opcional)</label>
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
            <label className="ui-label">
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
                    className="w-12 h-9 rounded-lg text-xs font-medium transition-colors flex items-center justify-center border"
                    style={isSelected
                      ? { background: "var(--warning)", color: "#fff", borderColor: "var(--warning)" }
                      : { borderColor: "var(--border)", color: "var(--text-2)", background: "var(--surface)", cursor: "pointer" }
                    }
                  >
                    {cod}
                  </button>
                );
              })}
            </div>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Ubicación seleccionada:{" "}
              {descUbicacionCodigo ? (
                <span className="font-medium" style={{ color: "var(--warning)" }}>{descUbicacionCodigo}</span>
              ) : (
                <span style={{ color: "var(--text-3)" }}>—</span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="ui-label">Notas (opcional)</label>
            <input
              type="text"
              placeholder="Observaciones..."
              value={descNotas}
              onChange={(e) => setDescNotas(e.target.value)}
              className="ui-input ui-input-sm"
            />
          </div>

          {descTouched && descValidationErrors.length > 0 && (
            <div className="rounded-xl p-3 text-sm"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
              <p className="font-medium mb-1" style={{ color: "var(--danger)" }}>Completar antes de registrar:</p>
              <ul className="list-disc list-inside space-y-0.5" style={{ color: "var(--danger)" }}>
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
