import { useState } from "react"
import { FileText, Download } from "lucide-react"
import { API_URL } from "../config/api"

function exportarCSV(nombreArchivo, columnas, filas) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`
  const cab = columnas.map(c => esc(c.label)).join(",")
  const cuerpo = filas.map(f =>
    columnas.map(c => esc(c.fn ? c.fn(f) : f[c.key])).join(",")
  )
  const blob = new Blob(["﻿" + [cab, ...cuerpo].join("\n")], {
    type: "text/csv;charset=utf-8;",
  })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(a.href)
}

const COLS_COMPRAS = [
  { key: "cliente_nombre",          label: "Cliente" },
  { key: "destino",                 label: "Ciudad" },
  { key: "codigo_solicitud",        label: "Solicitud" },
  { key: "proveedor",               label: "Proveedor" },
  { key: "numero_orden",            label: "Número Orden" },
  { key: "tracking_number",         label: "Tracking" },
  { key: "estado",                  label: "Estado" },
  { key: "comprado_por",            label: "Comprado por" },
  { key: "fecha_entrega_proveedor", label: "Fecha Entrega Proveedor" },
  { key: "created_at",              label: "Fecha Registro" },
  { key: "warehouse_confirmado",    label: "Warehouse Confirmado" },
  { key: "warehouse_fecha",         label: "Fecha Warehouse" },
  { key: "item_count",              label: "Cant. Ítems" },
]

const COLS_OPERATIVO = [
  { key: "cliente_nombre",          label: "Cliente" },
  { key: "codigo_solicitud",        label: "Solicitud" },
  { key: "numero_orden",            label: "Número Orden" },
  { key: "tracking_number",         label: "Tracking Efectivo" },
  { key: "tracking_items",          label: "Tracking Ítems" },
  { key: "estado",                  label: "Estado" },
  { key: "fecha_entrega_proveedor", label: "Fecha Entrega Proveedor" },
  { key: "warehouse_confirmado",    label: "Warehouse" },
  { key: "warehouse_fecha",         label: "Fecha Warehouse" },
  { key: "created_at",              label: "Fecha Registro" },
]

const COLS_INVENTARIO = [
  { key: "cliente_nombre",      label: "Cliente" },
  { key: "cliente_telefono",    label: "Teléfono" },
  { key: "item_descripcion",    label: "Ítem" },
  { key: "cantidad_solicitada", label: "Cantidad" },
  { key: "tracking_number",     label: "Tracking" },
  { key: "codigo_recepcion",    label: "Código Recepción" },
  { key: "ubicacion_codigo",    label: "Ubicación" },
  { key: "zona",                label: "Zona" },
  { key: "peso_cliente",        label: "Peso (kg)" },
  { key: "cobro_cliente_bs",    label: "Cobro (Bs)" },
  { key: "recibido_at",         label: "Fecha Recepción" },
]

const COLS_COBROS = [
  { key: "cliente_nombre",        label: "Cliente" },
  { key: "cliente_telefono",      label: "Teléfono" },
  { key: "departamento_destino",  label: "Ciudad" },
  { key: "item_descripcion",      label: "Ítem" },
  { key: "peso_cobrado",          label: "Peso (kg)" },
  { key: "unidades",              label: "Unidades" },
  { key: "tarifa_cliente",        label: "Tarifa USD" },
  { key: "tipo_cambio_cliente",   label: "TC" },
  { key: "cobro_cliente_bs",      label: "Cobro (Bs)" },
  { key: "payment_status",        label: "Estado Pago" },
  { key: "ubicacion_codigo",      label: "Ubicación" },
]

const COLS_ENTREGAS = [
  { key: "cliente_nombre",    label: "Cliente" },
  { key: "cliente_telefono",  label: "Teléfono" },
  { key: "item_descripcion",  label: "Ítem" },
  { key: "entregado_a",       label: "Entregado a" },
  { key: "entregado_at",      label: "Fecha Entrega" },
  { key: "firma_url", label: "Firma", fn: r => r.firma_url ? "Sí" : "No" },
  { key: "ubicacion_codigo",  label: "Ubicación" },
  { key: "codigo_recepcion",  label: "Código Recepción" },
]

const COLS_SOLICITUDES = [
  { key: "cliente_nombre",     label: "Cliente" },
  { key: "cliente_telefono",   label: "Teléfono" },
  { key: "recoge_quien",       label: "Recoge" },
  { key: "nombre_receptor",    label: "Receptor" },
  { key: "telefono_receptor",  label: "Tel. Receptor" },
  { key: "destino",            label: "Destino" },
  { key: "transportadora",     label: "Transportadora" },
  { key: "estado",             label: "Estado" },
  { key: "numero_guia",        label: "Número Guía" },
  { key: "guia_at",            label: "Fecha Guía" },
  { key: "nota_guia",          label: "Nota Guía" },
]

const REPORTES = [
  {
    id: "compras",
    titulo: "Compras",
    descripcion:
      "Listado general de compras registradas, clientes, órdenes, estado y tracking.",
    disponible: true,
    endpoint: `${API_URL}/compras`,
    nombreBase: "compras",
    cols: COLS_COMPRAS,
  },
  {
    id: "operativo",
    titulo: "Operativo en tránsito",
    descripcion:
      "Órdenes en tránsito, tracking efectivo, warehouse y estado operativo.",
    disponible: true,
    endpoint: `${API_URL}/compras/operativo`,
    nombreBase: "operativo",
    cols: COLS_OPERATIVO,
  },
  {
    id: "inventario",
    titulo: "Inventario Bolivia",
    descripcion:
      "Productos recibidos en Bolivia, ubicación, código recepción, peso y cobro.",
    disponible: true,
    endpoint: `${API_URL}/operativo/inventario`,
    nombreBase: "inventario_bolivia",
    cols: COLS_INVENTARIO,
  },
  {
    id: "cobros",
    titulo: "Cobros pendientes",
    descripcion:
      "Ítems pendientes de cobro por cliente, ciudad y monto.",
    disponible: true,
    endpoint: `${API_URL}/cobros/items`,
    nombreBase: "cobros_pendientes",
    cols: COLS_COBROS,
  },
  {
    id: "entregas",
    titulo: "Entregas",
    descripcion:
      "Historial de entregas, receptor, fecha y constancia de firma.",
    disponible: true,
    endpoint: `${API_URL}/operativo/entregas/historial`,
    nombreBase: "entregas",
    cols: COLS_ENTREGAS,
  },
  {
    id: "solicitudes",
    titulo: "Solicitudes Terminal",
    descripcion:
      "Solicitudes de envío a terminal, receptor, destino, guía y estado.",
    disponible: true,
    endpoint: `${API_URL}/receptores/solicitudes-terminal`,
    nombreBase: "solicitudes_terminal",
    cols: COLS_SOLICITUDES,
  },
  {
    id: "financiero",
    titulo: "Resumen financiero",
    descripcion:
      "Totales pendientes, cobrados, inventario valorizado y resumen por ciudad.",
    disponible: false,
  },
  {
    id: "ubicaciones",
    titulo: "Reporte por ubicación",
    descripcion:
      "Valor y detalle de mercadería agrupada por ubicación o estante.",
    disponible: false,
  },
]

export default function Reportes() {
  const [loading, setLoading] = useState(null)

  async function handleExportar(reporte) {
    if (loading) return
    setLoading(reporte.id)
    try {
      const res = await fetch(reporte.endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const filas =
        json.data ?? json.items ?? (Array.isArray(json) ? json : [])
      if (!filas.length) {
        alert("No hay datos para exportar")
        return
      }
      const fecha = new Date().toISOString().split("T")[0]
      exportarCSV(`${reporte.nombreBase}_${fecha}.csv`, reporte.cols, filas)
    } catch (err) {
      console.error(err)
      alert("No se pudo exportar el reporte")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">

      <div className="flex flex-col gap-1">
        <p className="ui-section-title">Sistema</p>
        <h2 className="ui-page-title">Reportes</h2>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>
          Exportaciones operativas del sistema en formato CSV
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTES.map((r) => (
          <div
            key={r.id}
            className="relative flex flex-col gap-4 p-5 rounded-xl border transition-all duration-200"
            style={{
              background:   "var(--surface)",
              border:       `1px solid var(--border)`,
              boxShadow:    r.disponible ? "var(--shadow-sm)" : "none",
              opacity:      r.disponible ? 1 : 0.55,
            }}
          >
            {/* Icon + title */}
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
              >
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
                  {r.titulo}
                </h3>
              </div>
              {!r.disponible && (
                <span
                  className="text-[9px] uppercase tracking-widest font-semibold flex-shrink-0 pt-1"
                  style={{ color: "var(--text-3)" }}
                >
                  Próximo
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed flex-1" style={{ color: "var(--text-3)" }}>
              {r.descripcion}
            </p>

            {r.disponible ? (
              <button
                onClick={() => handleExportar(r)}
                disabled={!!loading}
                className="ui-button-ghost flex items-center gap-2 justify-center w-full text-xs"
                style={{ height: "32px" }}
              >
                {loading === r.id ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "var(--border-strong)", borderTopColor: "transparent" }} />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    Exportar CSV
                  </>
                )}
              </button>
            ) : null}

          </div>
        ))}
      </div>

    </div>
  )
}
