import { useEffect, useState } from "react";

export default function ComprasTable({ reload }) {
  const [compras, setCompras] = useState([]);
  const [trackingEdit, setTrackingEdit] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    console.log("LOAD COMPRAS");

    try {
      const res = await fetch(
        "https://bolivia-imports-backend-pg.fly.dev/api/compras",
      );
      const json = await res.json();

      setCompras(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [reload]);

  async function guardarTracking(id) {
    try {
      const tracking = trackingEdit[id];

      await fetch(
        `https://bolivia-imports-backend-pg.fly.dev/api/compras/${id}/tracking`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tracking_number: tracking,
          }),
        },
      );

      setCompras((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, tracking_number: tracking } : c,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6">Cargando compras...</div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-6 space-y-6">
      <h3 className="text-sm uppercase tracking-widest text-neutral-500">
        Compras registradas
      </h3>

      <table className="w-full text-sm">
        <thead className="text-left text-neutral-500">
          <tr>
            <th className="py-2">Cliente</th>
            <th>Producto</th>
            <th>Página</th>
            <th>Orden</th>
            <th>Link</th>
            <th>Tracking</th>
          </tr>
        </thead>

        <tbody>
          {compras.map((compra) => {
            const tracking = compra.tracking_number;

            return (
              <tr key={compra.id} className="border-t">
                <td className="py-3">{compra.cliente_nombre}</td>

                <td>{compra.descripcion_producto || "—"}</td>

                <td>{compra.proveedor}</td>

                <td>{compra.numero_orden || "—"}</td>

                <td>
                  {compra.url_orden ? (
                    <a
                      href={compra.url_orden}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-xs"
                    >
                      Abrir
                    </a>
                  ) : (
                    "—"
                  )}
                </td>

                <td>
                  {tracking ? (
                    <span className="px-2 py-1 rounded bg-neutral-200">
                      {tracking}
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tracking"
                        className="px-2 py-1 border rounded text-xs"
                        onChange={(e) =>
                          setTrackingEdit({
                            ...trackingEdit,
                            [compra.id]: e.target.value,
                          })
                        }
                      />

                      <button
                        onClick={() => guardarTracking(compra.id)}
                        className="px-3 py-1 bg-neutral-900 text-white rounded text-xs"
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
