import { useState } from "react";
import ComprasTable from "../components/compras/ComprasTable";
import { API_URL } from "../config/api";

export default function Compras() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    ciudad: "",
    pagina: "",
    numero_orden: "",
    fecha: "",
    url_orden: "",
  });

  const [cantidadItems, setCantidadItems] = useState("");
  const [items, setItems] = useState([]);
  const [reload, setReload] = useState(0);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCantidadItems(e) {
    const value = e.target.value;
    setCantidadItems(value);
    if (value === "") {
      setItems([]);
      return;
    }
    const n = Math.min(99, parseInt(value, 10) || 0);
    if (n <= 0) {
      setItems([]);
      return;
    }
    setItems((prev) => {
      if (n > prev.length) {
        const extras = Array.from({ length: n - prev.length }, () => ({ descripcion: "", cantidad: 1 }));
        return [...prev, ...extras];
      }
      return prev.slice(0, n);
    });
  }

  function updateDescripcion(index, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], descripcion: value };
      return next;
    });
  }

  function updateCantidad(index, value) {
    const parsed = parseInt(value, 10);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], cantidad: isNaN(parsed) ? "" : parsed };
      return next;
    });
  }

  async function guardar() {
    try {
      if (!form.nombre || !form.telefono || !form.ciudad || !form.pagina || !form.numero_orden) {
        alert("Completa nombre, teléfono, ciudad, página y número de orden");
        return;
      }

      if (items.length === 0) {
        alert("Indica la cantidad de ítems");
        return;
      }

      const itemsValidos = items.filter((i) => i.descripcion.trim());

      if (itemsValidos.length === 0) {
        alert("Debes registrar al menos un ítem");
        return;
      }

      for (const item of itemsValidos) {
        const cant = Number(item.cantidad);
        if (!Number.isInteger(cant) || cant < 1 || cant > 999) {
          alert(`Cantidad inválida para "${item.descripcion}": debe ser un número entre 1 y 999`);
          return;
        }
      }

      const res = await fetch(`${API_URL}/compras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: form.nombre,
          telefono: form.telefono,
          ciudad: form.ciudad,
          pagina: form.pagina,
          numero_orden: form.numero_orden.trim(),
          url_orden: form.url_orden.trim(),
          items: itemsValidos.map((i) => ({
            descripcion: i.descripcion.trim(),
            cantidad: Number(i.cantidad),
          })),
          fecha: form.fecha,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo guardar la compra");
      }

      setForm({
        nombre: "",
        telefono: "",
        ciudad: "",
        pagina: "",
        numero_orden: "",
        fecha: "",
        url_orden: "",
      });
      setCantidadItems("");
      setItems([]);
      setReload((prev) => prev + 1);
    } catch (err) {
      console.error("Error guardando compra:", err);
      alert(err.message || "Error guardando compra");
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <p className="ui-section-title">Compras</p>
        <h2 className="ui-page-title">Registrar compra</h2>
      </div>

      <div className="ui-card flex flex-col gap-4">
        <input
          name="nombre"
          placeholder="Nombre cliente"
          value={form.nombre}
          onChange={handleChange}
          className="ui-input"
        />

        <input
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
          className="ui-input"
        />

        <input
          name="ciudad"
          placeholder="Ciudad"
          value={form.ciudad}
          onChange={handleChange}
          className="ui-input"
        />

        <input
          name="pagina"
          placeholder="Página (Amazon, eBay...)"
          value={form.pagina}
          onChange={handleChange}
          className="ui-input"
        />

        <input
          name="numero_orden"
          placeholder="Número de orden"
          value={form.numero_orden}
          onChange={handleChange}
          className="ui-input"
        />

        <input
          name="url_orden"
          placeholder="Link de la orden"
          value={form.url_orden}
          onChange={handleChange}
          className="ui-input"
        />

        <input
          type="text"
          inputMode="numeric"
          placeholder="Cantidad de ítems"
          value={cantidadItems}
          onChange={handleCantidadItems}
          className="ui-input"
        />

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_88px] gap-2 items-center">
            <input
              placeholder={`Producto ${index + 1}`}
              value={item.descripcion}
              onChange={(e) => updateDescripcion(index, e.target.value)}
              className="ui-input !w-full min-w-0"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Cant."
              value={item.cantidad}
              onChange={(e) => updateCantidad(index, e.target.value)}
              className="ui-input !w-[88px] text-center"
            />
          </div>
        ))}

        <input
          type="date"
          name="fecha"
          value={form.fecha}
          onChange={handleChange}
          className="ui-input"
        />

        <button onClick={guardar} className="ui-button">
          Guardar compra
        </button>
      </div>

      <ComprasTable reload={reload} />
    </div>
  );
}
