import { useEffect, useState } from "react";

export default function ComprasTable({ reload }) {
  const [compras, setCompras] = useState([]);
  const [trackingEdit, setTrackingEdit] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

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

  async function cambiarEstado(id, estado) {
    try {
      await fetch(
        `https://bolivia-imports-backend-pg.fly.dev/api/compras/${id}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado }),
        },
      );

      setCompras((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, estado } : c,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }

  function formatEstado(estado) {
    switch (estado) {
      case "reparto":
        return "En Reparto";
      case "entregado":
        return "En WHEREHOUSE";
      case "recibido":
        return "En Bolivia";
      default:
        return "Reparto";
    }
  }

  function getEstadoColor(estado) {
    switch (estado) {
      case "reparto":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "entregado":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "recibido":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  const comprasFiltradas = compras.filter((c) => {
    const texto = filtro.toLowerCase();

    return (
      c.cliente_nombre?.toLowerCase().includes(texto) ||
      c.descripcion_producto?.toLowerCase().includes(texto) ||
      c.proveedor?.toLowerCase().includes(texto) ||
      c.numero_orden?.toLowerCase().includes(texto)
    );
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        Cargando compras...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6">
      
      <div className="flex justify-between items-center">
        <h3 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Compras registradas
        </h3>

        <span className="text-xs text-gray-400">
          {compras.length} registros
        </span>
      </div>

      <input
        type="text"
        placeholder="Buscar cliente, producto, página..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded dark:bg-[#111]"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">

          <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="text-left px-3">Cliente</th>
              <th className="text-left px-3">Producto</th>
              <th className="text-left px-3">Página</th>
              <th className="text-left px-3">Orden</th>
              <th className="text-left px-3">Link</th>
              <th className="text-left px-3">Destino</th>
              <th className="text-left px-3">Fecha</th>
              <th className="text-left px-3">Estado</th>
              <th className="text-left px-3">Tracking</th>
            </tr>
          </thead>

          <tbody>
            {comprasFiltradas.map((compra) => {
              const tracking = compra.tracking_number;
              const estadoActual = compra.estado || "reparto";

              const fechaFormateada = compra.fecha_estimada
                ? new Date(compra.fecha_estimada + "T00:00:00").toLocaleDateString("es-BO")
                : "—";

              return (
                <tr
                  key={compra.id}
                  className="bg-gray-50 dark:bg-[#181818] rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] transition"
                >
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {compra.cliente_nombre}
                  </td>

                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
                    {compra.descripcion_producto || "—"}
                  </td>

                  <td className="px-3 py-3">
                    {compra.proveedor}
                  </td>

                  <td className="px-3 py-3">
                    {compra.numero_orden || "—"}
                  </td>

                  <td className="px-3 py-3">
                    {compra.url_orden ? (
                      <a
                        href={compra.url_orden}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline text-xs hover:text-blue-400"
                      >
                        Abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {compra.destino || "—"}
                  </td>

                  <td className="px-3 py-3 text-gray-400">
                    {fechaFormateada}
                  </td>

                  <td className="px-3 py-3">
                    <select
                      value={estadoActual}
                      onChange={(e) => cambiarEstado(compra.id, e.target.value)}
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer
                        ${getEstadoColor(estadoActual)}
                        hover:opacity-80 transition
                      `}
                    >
                      <option value="reparto">{formatEstado("reparto")}</option>
                      <option value="entregado">{formatEstado("entregado")}</option>
                      <option value="recibido">{formatEstado("recibido")}</option>
                    </select>
                  </td>

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