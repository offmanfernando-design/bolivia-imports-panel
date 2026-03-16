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
    descripcion_producto: "",
  });

  const [reload, setReload] = useState(0);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function guardar() {
    try {
      await fetch("https://bolivia-imports-backend-pg.fly.dev/api/compras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      setForm({
        nombre: "",
        telefono: "",
        ciudad: "",
        pagina: "",
        numero_orden: "",
        fecha: "",
      });

      setReload((prev) => prev + 1);
    } catch (err) {
      console.error(err);
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
          name="descripcion_producto"
          placeholder="Descripción del producto"
          value={form.descripcion_producto}
          onChange={handleChange}
          className="ui-input"
        />

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
