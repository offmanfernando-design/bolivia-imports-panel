import { useState, useEffect } from "react";
import StatCard from "../components/ui/StatCard";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Drawer from "../components/ui/Drawer";
import PackageDrawer from "../components/packages/PackageDrawer";
import useSearch from "../hooks/useSearch";

import { Package, Truck, DollarSign } from "lucide-react";
import { API_URL } from "../config/api";

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
        const statsRes = await fetch(`${API_URL}/dashboard`);
        const statsData = await statsRes.json();

        const packagesRes = await fetch(`${API_URL}/entregas`);
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
      <div className="flex flex-col gap-8">
        <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: "var(--surface-3)" }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[92px] rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* CABECERA */}
      <div className="flex flex-col gap-1">
        <p className="ui-section-title">Overview</p>
        <h2 className="ui-page-title">Dashboard</h2>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Paquetes en almacén"
          value={stats?.en_almacen ?? "—"}
          icon={<Package size={19} />}
          accent="cyan"
        />
        <StatCard
          title="Entregas hoy"
          value={stats?.entregas_hoy ?? "—"}
          icon={<Truck size={19} />}
          accent="emerald"
        />
        <StatCard
          title="Cobros pendientes"
          value={stats?.pendiente_cobro ?? "—"}
          icon={<DollarSign size={19} />}
          accent="amber"
        />
      </div>

      {/* TABLA */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>

        {/* Header tabla */}
        <div className="px-6 py-4 flex items-center justify-between gap-4"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <div>
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              Paquetes recientes
            </h3>
          </div>
          {!loading && data.length > 0 && (
            <span className="text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-full"
              style={{ background: "var(--surface-3)", color: "var(--text-3)" }}>
              {filteredData.length} {filteredData.length === 1 ? "paquete" : "paquetes"}
            </span>
          )}
        </div>

        {/* Búsqueda */}
        <div className="px-6 py-3.5 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <input
            type="text"
            placeholder="Buscar tracking, cliente o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input max-w-sm"
          />
          {searchLoading && (
            <span className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>Buscando...</span>
          )}
        </div>

        {/* Estado vacío */}
        {isEmpty ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {search.length >= 2 ? "Sin resultados para la búsqueda." : "No se encontraron paquetes."}
            </p>
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
