import { useState } from "react";
import ComprasTable from "../components/compras/ComprasTable";
import { API_URL } from "../config/api";

function emptyOrden() {
  return {
    pagina: "",
    numero_orden: "",
    url_orden: "",
    comprado_por: "cliente",
    tracking_responsible: "cliente",
    fecha: "",
    fecha_entrega_proveedor: "",
    cantidadItems: "",
    items: [],
  };
}

function OrdenBlock({ orden, idx, total, onChange, onRemove }) {
  function handleCantidadItems(e) {
    const value = e.target.value;
    const n = Math.min(99, parseInt(value, 10) || 0);
    const newItems =
      value === "" || n <= 0
        ? []
        : n > orden.items.length
        ? [
            ...orden.items,
            ...Array.from({ length: n - orden.items.length }, () => ({
              descripcion: "",
              cantidad: 1,
            })),
          ]
        : orden.items.slice(0, n);
    onChange(idx, "cantidadItems", value);
    onChange(idx, "items", newItems);
  }

  function updateItem(itemIdx, field, value) {
    const next = orden.items.map((it, j) =>
      j === itemIdx ? { ...it, [field]: value } : it
    );
    onChange(idx, "items", next);
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Orden / página {idx + 1}
        </p>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="text-xs transition"
            style={{ color: "var(--danger)" }}
          >
            Eliminar
          </button>
        )}
      </div>

      <input
        placeholder="Página (Amazon, eBay, Shein...)"
        value={orden.pagina}
        onChange={(e) => onChange(idx, "pagina", e.target.value)}
        className="ui-input"
      />

      <input
        placeholder="Número de orden"
        value={orden.numero_orden}
        onChange={(e) => onChange(idx, "numero_orden", e.target.value)}
        className="ui-input"
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: "var(--text-3)" }}>
          Referencia / link opcional
        </label>
        <input
          placeholder="Link, correo, nota o referencia para ubicar el tracking"
          value={orden.url_orden}
          onChange={(e) => onChange(idx, "url_orden", e.target.value)}
          className="ui-input"
        />
      </div>

      <select
        value={orden.comprado_por}
        onChange={(e) => onChange(idx, "comprado_por", e.target.value)}
        className="ui-input"
      >
        <option value="cliente">Comprado por: Cliente</option>
        <option value="empresa">Comprado por: Empresa</option>
      </select>

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: "var(--text-3)" }}>
          Responsable del tracking
        </label>
        <select
          value={orden.tracking_responsible}
          onChange={(e) => onChange(idx, "tracking_responsible", e.target.value)}
          className="ui-input"
        >
          <option value="cliente">Cliente</option>
          <option value="empresa">Empresa</option>
        </select>
      </div>

      <input
        type="text"
        inputMode="numeric"
        placeholder="Cantidad de ítems"
        value={orden.cantidadItems}
        onChange={handleCantidadItems}
        className="ui-input"
      />

      {orden.items.map((item, itemIdx) => (
        <div
          key={itemIdx}
          className="grid grid-cols-[minmax(0,1fr)_88px] gap-2 items-center"
        >
          <input
            placeholder={`Producto ${itemIdx + 1}`}
            value={item.descripcion}
            onChange={(e) => updateItem(itemIdx, "descripcion", e.target.value)}
            className="ui-input !w-full min-w-0"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Cant."
            value={item.cantidad}
            onChange={(e) => {
              const p = parseInt(e.target.value, 10);
              updateItem(itemIdx, "cantidad", isNaN(p) ? "" : p);
            }}
            className="ui-input !w-[88px] text-center"
          />
        </div>
      ))}

      <input
        type="date"
        placeholder="Fecha estimada"
        value={orden.fecha}
        onChange={(e) => onChange(idx, "fecha", e.target.value)}
        className="ui-input"
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: "var(--text-3)" }}>
          Fecha entrega proveedor (opcional)
        </label>
        <input
          type="date"
          value={orden.fecha_entrega_proveedor}
          onChange={(e) => onChange(idx, "fecha_entrega_proveedor", e.target.value)}
          className="ui-input"
        />
      </div>
    </div>
  );
}

export default function Compras() {
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", ciudad: "" });
  const [nota, setNota] = useState("");
  const [ordenes, setOrdenes] = useState([emptyOrden()]);
  const [reload, setReload] = useState(0);

  function updateCliente(e) {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
  }

  function updateOrden(idx, field, value) {
    setOrdenes((prev) =>
      prev.map((o, i) => {
        if (i !== idx) return o;
        const updated = { ...o, [field]: value };
        if (field === "comprado_por") updated.tracking_responsible = value;
        return updated;
      })
    );
  }

  function agregarOrden() {
    setOrdenes((prev) => [...prev, emptyOrden()]);
  }

  function eliminarOrden(idx) {
    setOrdenes((prev) => prev.filter((_, i) => i !== idx));
  }

  async function guardar() {
    if (!cliente.nombre.trim() || !cliente.telefono.trim() || !cliente.ciudad.trim()) {
      alert("Completa nombre, teléfono y ciudad");
      return;
    }

    for (let i = 0; i < ordenes.length; i++) {
      const o = ordenes[i];
      const n = i + 1;
      if (!o.pagina.trim()) { alert(`Orden ${n}: falta página/proveedor`); return; }
      if (!o.numero_orden.trim()) { alert(`Orden ${n}: falta número de orden`); return; }
      if (o.items.length === 0) { alert(`Orden ${n}: indica la cantidad de ítems`); return; }

      const validos = o.items.filter((it) => it.descripcion.trim());
      if (validos.length === 0) { alert(`Orden ${n}: debes registrar al menos un ítem`); return; }

      for (const item of validos) {
        const cant = Number(item.cantidad);
        if (!Number.isInteger(cant) || cant < 1 || cant > 999) {
          alert(`Orden ${n}: cantidad inválida para "${item.descripcion}"`);
          return;
        }
      }

      if (o.fecha_entrega_proveedor) {
        if (isNaN(new Date(o.fecha_entrega_proveedor).getTime())) {
          alert(`Orden ${n}: fecha entrega proveedor inválida`);
          return;
        }
      }
    }

    const payload = {
      cliente: {
        nombre:   cliente.nombre.trim(),
        telefono: cliente.telefono.trim(),
        ciudad:   cliente.ciudad.trim(),
      },
      nota: nota.trim() || null,
      ordenes: ordenes.map((o) => ({
        pagina:                   o.pagina.trim(),
        numero_orden:             o.numero_orden.trim(),
        url_orden:                o.url_orden.trim() || null,
        comprado_por:             o.comprado_por,
        tracking_responsible:     o.tracking_responsible,
        fecha_entrega_proveedor:  o.fecha_entrega_proveedor || null,
        fecha:                    o.fecha || null,
        items: o.items
          .filter((it) => it.descripcion.trim())
          .map((it) => ({
            descripcion: it.descripcion.trim(),
            cantidad:    Number(it.cantidad),
          })),
      })),
    };

    try {
      const res = await fetch(`${API_URL}/compras/solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo guardar la solicitud");
      }

      setCliente({ nombre: "", telefono: "", ciudad: "" });
      setNota("");
      setOrdenes([emptyOrden()]);
      setReload((prev) => prev + 1);
    } catch (err) {
      console.error("Error guardando solicitud:", err);
      alert(err.message || "Error guardando solicitud");
    }
  }

  return (
    <div className="module-shell">

      {/* Cabecera del módulo */}
      <div className="module-header">
        <p className="ui-section-title">Compras</p>
        <h2 className="ui-page-title">Solicitudes de compra</h2>
      </div>

      {/* Split de dos columnas */}
      <div className="module-body">
        <div className="split-pane">

          {/* Panel izquierdo — formulario */}
          <div className="panel lg:w-[360px] lg:flex-shrink-0">

            <div className="panel-header">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Nueva solicitud
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                Completa cliente y órdenes
              </p>
            </div>

            <div className="panel-body flex flex-col gap-5">

              {/* Datos del cliente */}
              <div className="flex flex-col gap-2.5">
                <p
                  className="font-semibold uppercase"
                  style={{ fontFamily: "'Geist Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "var(--text-3)" }}
                >
                  Cliente
                </p>
                <input
                  name="nombre"
                  placeholder="Nombre cliente"
                  value={cliente.nombre}
                  onChange={updateCliente}
                  className="ui-input"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="telefono"
                    placeholder="Teléfono"
                    value={cliente.telefono}
                    onChange={updateCliente}
                    className="ui-input"
                  />
                  <input
                    name="ciudad"
                    placeholder="Ciudad"
                    value={cliente.ciudad}
                    onChange={updateCliente}
                    className="ui-input"
                  />
                </div>
                <input
                  placeholder="Nota solicitud (opcional)"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="ui-input"
                />
              </div>

              {/* Separador */}
              <div style={{ height: "1px", background: "var(--border)" }} />

              {/* Bloques de orden */}
              <div className="flex flex-col gap-3">
                <p
                  className="font-semibold uppercase"
                  style={{ fontFamily: "'Geist Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "var(--text-3)" }}
                >
                  Órdenes / páginas
                </p>
                {ordenes.map((orden, idx) => (
                  <OrdenBlock
                    key={idx}
                    orden={orden}
                    idx={idx}
                    total={ordenes.length}
                    onChange={updateOrden}
                    onRemove={eliminarOrden}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={agregarOrden}
                className="ui-button-ghost text-sm"
              >
                + Agregar otra página / proveedor
              </button>

            </div>

            <div className="panel-footer">
              <button onClick={guardar} className="ui-button w-full justify-center">
                Guardar solicitud
              </button>
            </div>

          </div>

          {/* Panel derecho — tabla de compras */}
          <div className="panel flex-1 min-w-0">
            <div className="scroll-area p-5">
              <ComprasTable reload={reload} />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
