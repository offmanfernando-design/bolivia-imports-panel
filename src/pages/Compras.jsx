import { useState } from "react";
import ComprasTable from "../components/compras/ComprasTable";

export default function Compras() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    ciudad: "",
    pagina: "",
    numero_orden: "",
    fecha: "",
    url_orden: "",
    cantidad_items: "",
  });

  const [items, setItems] = useState([]);
  const [reload, setReload] = useState(0);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "cantidad_items") {
      const cantidad = parseInt(value) || 0;

      setItems((prev) => {
        const nuevos = Array.from({ length: cantidad }, (_, index) => prev[index] || "");
        return nuevos;
      });
    }
  }

  function handleItemChange(index, value) {
    setItems((prev) => {
      const nuevos = [...prev];
      nuevos[index] = value;
      return nuevos;
    });
  }

  async function guardar() {
    try {
      // evitar guardar compra vacía
      if (!form.nombre || !form.telefono || !form.numero_orden) {
        alert("Faltan datos obligatorios");
        return;
      }

      const itemsLimpios = items
        .map((item) => item.trim())
        .filter((item) => item);

      await fetch("https://bolivia-imports-backend-pg.fly.dev/api/compras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_nombre: form.nombre,
          telefono: form.telefono,
          ciudad: form.ciudad,
          pagina: form.pagina,
          numero_orden: form.numero_orden.trim(),
          url_orden: form.url_orden.trim(),
          descripcion_producto: itemsLimpios.length > 0
            ? itemsLimpios.join(" | ")
            : "",
          items: itemsLimpios,
          fecha: form.fecha,
        }),
      });

      // limpiar formulario
      setForm({
        nombre: "",
        telefono: "",
        ciudad: "",
        pagina: "",
        numero_orden: "",
        fecha: "",
        url_orden: "",
        cantidad_items: "",
      });

      setItems([]);

      // recargar tabla
      setReload((prev) => prev + 1);
    } catch (err) {
      console.error("Error guardando compra:", err);
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
          name="cantidad_items"
          type="number"
          min="0"
          placeholder="Cantidad de ítems"
          value={form.cantidad_items}
          onChange={handleChange}
          className="ui-input"
        />

        {items.map((item, index) => (
          <input
            key={index}
            placeholder={`Descripción del producto ${index + 1}`}
            value={item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            className="ui-input"
          />
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