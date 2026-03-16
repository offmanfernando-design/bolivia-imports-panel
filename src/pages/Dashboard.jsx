import { useState, useEffect } from "react";
import StatCard from "../components/ui/StatCard";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Drawer from "../components/ui/Drawer";
import PackageDrawer from "../components/packages/PackageDrawer";
import useSearch from "../hooks/useSearch";

import { Package, Truck, DollarSign } from "lucide-react";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { results: searchResults, loading: searchLoading } = useSearch(search);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const statsRes = await fetch(
          "https://bolivia-imports-backend-pg.fly.dev/api/dashboard",
        );
        const statsData = await statsRes.json();

        const packagesRes = await fetch(
          "https://bolivia-imports-backend-pg.fly.dev/api/entregas",
        );
        const packagesData = await packagesRes.json();

        setStats(statsData);
        setData(packagesData.data);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const columns = ["Tracking", "Cliente", "Estado", "Pago"];

  const filteredData = search.length >= 2 ? searchResults : data;

  const isEmpty = filteredData.length === 0;

  const tableData = filteredData.map((row) => [
    row.codigo,

    row.cliente || row.cliente_nombre,

    <Badge type={row.estado_operativo}>
      {row.estado_operativo === "en_almacen" && "En almacén"}
      {row.estado_operativo === "en_transito" && "En tránsito"}
      {row.estado_operativo === "lista_para_entrega" && "Lista entrega"}
      {row.estado_operativo === "entregada" && "Entregado"}
      {row.estado_operativo === "creada" && "Creada"}
    </Badge>,

    <Badge type={row.estado_pago}>
      {row.estado_pago === "pagado" ? "Pagado" : "Pendiente"}
    </Badge>,
  ]);

  const handleRowClick = (index) => {
    const pkg = filteredData[index];
    setSelectedPackage(pkg);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-8 w-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>

        <div className="h-64 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-neutral-400 uppercase tracking-widest">
          Overview
        </p>

        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Paquetes en almacén"
          value={stats?.en_almacen ?? "-"}
          icon={<Package size={20} />}
        />

        <StatCard
          title="Entregas hoy"
          value={stats?.entregas_hoy ?? "-"}
          icon={<Truck size={20} />}
        />

        <StatCard
          title="Cobros pendientes"
          value={stats?.pendiente_cobro ?? "-"}
          icon={<DollarSign size={20} />}
        />
      </div>

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
            Paquetes recientes
          </h3>
        </div>

        <input
          type="text"
          placeholder="Buscar tracking, cliente o teléfono..."
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

        {searchLoading && (
          <p className="text-xs text-neutral-400">Buscando...</p>
        )}

        {isEmpty ? (
          <div
            className="
            flex flex-col items-center justify-center
            py-16
            text-neutral-400
            text-sm
            border border-dashed border-neutral-200 dark:border-neutral-800
            rounded-lg
          "
          >
            No se encontraron paquetes
          </div>
        ) : (
          <Table
            columns={columns}
            data={tableData}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <PackageDrawer pkg={selectedPackage} />
      </Drawer>
    </div>
  );
}
