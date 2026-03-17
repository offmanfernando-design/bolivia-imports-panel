import { useEffect, useState } from "react";

export default function ComprasTable({ reload }) {
  const [compras, setCompras] = useState([]);
  const [trackingEdit, setTrackingEdit] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
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
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        Cargando compras...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Compras registradas
        </h3>

        <span className="text-xs text-gray-400">
          {compras.length} registros
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">

          {/* Head */}
          <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="text-left px-3">Cliente</th>
              <th className="text-left px-3">Producto</th>
              <th className="text-left px-3">Página</th>
              <th className="text-left px-3">Orden</th>
              <th className="text-left px-3">Link</th>
              <th className="text-left px-3">Fecha</th>
              <th className="text-left px-3">Tracking</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {compras.map((compra) => {
              const tracking = compra.tracking_number;

              return (
                <tr
                  key={compra.id}
                  className="bg-gray-50 dark:bg-[#181818] rounded-xl"
                >
                  {/* Cliente */}
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {compra.cliente_nombre}
                  </td>

                  {/* Producto */}
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
                    {compra.descripcion_producto || "—"}
                  </td>

                  {/* Página */}
                  <td className="px-3 py-3">
                    {compra.proveedor}
                  </td>

                  {/* Orden */}
                  <td className="px-3 py-3">
                    {compra.numero_orden || "—"}
                  </td>

                  {/* Link */}
                  <td className="px-3 py-3">
                    {compra.url_orden ? (
                      <a
                        href={compra.url_orden}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline text-xs"
                      >
                        Abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Fecha */}
                  <td className="px-3 py-3 text-gray-400">
                    {compra.fecha_estimada
                      ? new Date(compra.fecha_estimada).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* Tracking */}
                  <td className="px-3 py-3">
                    {tracking ? (
                      <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs">
                        {tracking}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tracking"
                          className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-[#111]"
                          onChange={(e) =>
                            setTrackingEdit({
                              ...trackingEdit,
                              [compra.id]: e.target.value,
                            })
                          }
                        />

                        <button
                          onClick={() => guardarTracking(compra.id)}
                          className="px-3 py-1 bg-black text-white rounded text-xs hover:opacity-80"
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
    </div>
  );
}