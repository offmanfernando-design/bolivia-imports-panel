import { useState, useEffect } from "react";
import Badge from "../ui/Badge";
import Table from "../ui/Table";

export default function OperativoTable({ onOpenPackage }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://bolivia-imports-backend-pg.fly.dev/api/compras/operativo"
        );
        const json = await res.json();

        setData(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // 🔎 filtro simple (sin hook externo para evitar conflictos)
  const dataset = data.filter((c) => {
    const texto = search.toLowerCase();

    return (
      c.cliente_nombre?.toLowerCase().includes(texto) ||
      c.tracking_number?.toLowerCase().includes(texto) ||
      c.numero_orden?.toLowerCase().includes(texto)
    );
  });

  function formatEstado(estado) {
    switch (estado) {
      case "reparto":
        return "En Reparto";
      case "entregado":
        return "En Warehouse";
      case "recibido":
        return "En Bolivia";
      default:
        return "Reparto";
    }
  }

  function getEstadoColor(estado) {
    switch (estado) {
      case "reparto":
        return "warning";
      case "entregado":
        return "info";
      case "recibido":
        return "success";
      default:
        return "default";
    }
  }

  const columns = [
    "Tracking",
    "Cliente",
    "Producto",
    "Estado",
  ];

  const rows = dataset.map((c) => [
    c.tracking_number || "—",
    c.cliente_nombre || "—",
    c.descripcion_producto || "—",

    <Badge type={getEstadoColor(c.estado)}>
      {formatEstado(c.estado)}
    </Badge>,
  ]);

  const openRow = (index) => {
    const pkg = dataset[index];
    onOpenPackage(pkg.entrega_id || pkg.id);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
        Cargando paquetes...
      </div>
    );
  }

  return (
    <div
      className="
      bg-white dark:bg-neutral-950
      border border-neutral-200 dark:border-neutral-800
      rounded-xl
      p-6
      flex flex-col gap-6
      shadow-sm dark:shadow-black/20
      "
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">
          Operativo (en tránsito)
        </h3>

        <span className="text-xs text-neutral-400">
          {dataset.length} paquetes
        </span>
      </div>

      <input
        type="text"
        placeholder="Buscar cliente, tracking..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full
          px-4 py-2.5
          rounded-lg
          border border-neutral-200 dark:border-neutral-800
          bg-white dark:bg-neutral-900
          text-sm
          text-neutral-900 dark:text-neutral-100
          placeholder-neutral-400
          focus:outline-none
          focus:ring-2 focus:ring-neutral-300/40
          transition
        "
      />

      <Table
        columns={columns}
        data={rows}
        onRowClick={openRow}
      />
    </div>
  );
}