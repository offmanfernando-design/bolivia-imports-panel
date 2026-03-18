import { useState } from "react";

export default function PackageDrawer({ pkg }) {

  const [editingField, setEditingField] = useState(null);
  const [warehouseImage, setWarehouseImage] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [data, setData] = useState({
    cliente: pkg?.cliente || "",
    peso: "2.4 kg",
    volumen: "0.03 m³",
    ubicacion: "A3-14",
    fecha: "12 Mar 2026"
  });

  const events = [
    { event: "Carga creada", date: "03 Mar 2026" },
    { event: "Recibido en Miami", date: "07 Mar 2026" },
    { event: "Llegó a almacén Santa Cruz", date: "11 Mar 2026" },
    { event: "En ruta a cliente", date: "12 Mar 2026" }
  ];

  if (!pkg) return null;

  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const renderEditable = (field, value) => {
    if (editingField === field) {
      return (
        <input
          autoFocus
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => setEditingField(null)}
          className="bg-transparent border-b border-neutral-300 dark:border-neutral-600 outline-none text-sm text-neutral-900 dark:text-neutral-200"
        />
      );
    }

    return (
      <p
        onClick={() => setEditingField(field)}
        className="font-medium text-neutral-900 dark:text-neutral-200 cursor-pointer hover:text-black dark:hover:text-white transition-colors"
      >
        {value}
      </p>
    );
  };

  async function handleUpload() {
    if (!warehouseImage) return;

    try {
      setLoadingUpload(true);

      // ⚠️ TEMPORAL (luego Cloudinary)
      const fakeUrl = URL.createObjectURL(warehouseImage);

      await fetch(
        `https://bolivia-imports-backend-pg.fly.dev/api/compras/${pkg.id}/warehouse`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imagen_url: fakeUrl,
          }),
        }
      );

      alert("Confirmado en warehouse ✅");

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUpload(false);
    }
  }

  return (
    <div className="w-full flex justify-center animate-[fadeIn_.25s_ease]">

      <div className="w-full max-w-3xl flex flex-col gap-14">

        {/* HEADER */}
        <div className="flex flex-col gap-2">

          <p className="text-xs text-neutral-400 uppercase tracking-widest">
            Tracking
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-200">
            {pkg.tracking}
          </h2>

          <div className="flex gap-2">

            <span className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
              {pkg.estado}
            </span>

            <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {pkg.pago}
            </span>

          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-3">

          <button className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            Imprimir etiqueta
          </button>

          <button className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            Cambiar estado
          </button>

          <button className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            Marcar pagado
          </button>

        </div>

        {/* INFO CARD */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">

          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Información del paquete
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">

            <div>
              <p className="text-neutral-500">Cliente</p>
              {renderEditable("cliente", data.cliente)}
            </div>

            <div>
              <p className="text-neutral-500">Tracking</p>
              <p className="font-medium">{pkg.tracking}</p>
            </div>

            <div>
              <p className="text-neutral-500">Peso</p>
              {renderEditable("peso", data.peso)}
            </div>

            <div>
              <p className="text-neutral-500">Volumen</p>
              {renderEditable("volumen", data.volumen)}
            </div>

            <div>
              <p className="text-neutral-500">Ubicación</p>
              {renderEditable("ubicacion", data.ubicacion)}
            </div>

            <div>
              <p className="text-neutral-500">Fecha llegada</p>
              {renderEditable("fecha", data.fecha)}
            </div>

          </div>

        </div>

        {/* 🔥 WAREHOUSE CARD */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">

          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Confirmación Warehouse (USA)
          </h3>

          <div className="flex flex-col gap-4">

            {!pkg.warehouse_confirmado && (
              <>
                <input
                  type="file"
                  onChange={(e) => setWarehouseImage(e.target.files[0])}
                  className="text-sm"
                />

                <button
                  onClick={handleUpload}
                  disabled={loadingUpload}
                  className="px-4 py-2 bg-black text-white rounded-md text-sm hover:opacity-80 transition"
                >
                  {loadingUpload ? "Subiendo..." : "Confirmar llegada"}
                </button>
              </>
            )}

            {pkg.warehouse_confirmado && (
              <div className="flex flex-col gap-2">

                <span className="text-sm text-green-600 dark:text-green-400">
                  ✔ Confirmado en warehouse
                </span>

                {pkg.warehouse_fecha && (
                  <span className="text-xs text-neutral-400">
                    {new Date(pkg.warehouse_fecha).toLocaleString()}
                  </span>
                )}

                {pkg.warehouse_imagen && (
                  <img
                    src={pkg.warehouse_imagen}
                    alt="warehouse"
                    className="rounded-lg max-h-40 object-cover border"
                  />
                )}

              </div>
            )}

          </div>

        </div>

        {/* HISTORIAL */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">

          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Historial
          </h3>

          <div className="flex flex-col gap-4">

            {events.map((item, index) => (
              <div key={index} className="flex justify-between">
                <p>{item.event}</p>
                <span className="text-xs text-neutral-400">{item.date}</span>
              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}