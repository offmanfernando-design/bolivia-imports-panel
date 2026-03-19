import { useState, useEffect } from "react";

export default function PackageDrawer({ pkg }) {
  const [editingField, setEditingField] = useState(null);
  const [warehouseImage, setWarehouseImage] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [events, setEvents] = useState([]);

  // 🔥 NUEVO: estado local sincronizado
  const [localPkg, setLocalPkg] = useState(pkg);

  // 🔥 sync cuando cambia pkg
  useEffect(() => {
    setLocalPkg(pkg);
  }, [pkg]);

  // 🔥 DATA LIMPIA
  const [data, setData] = useState({
    cliente: pkg?.cliente || pkg?.cliente_nombre || "",
    peso: "",
    volumen: "",
    ubicacion: "",
  });

  useEffect(() => {
    if (!pkg?.id) return;

    fetch(`https://bolivia-imports-backend-pg.fly.dev/api/compras/${pkg.id}/eventos`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setEvents(data.data);
      })
      .catch(console.error);
  }, [pkg?.id]);

  if (!localPkg) return null;

  const tracking = localPkg.tracking || localPkg.tracking_number;

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
        {value || "—"}
      </p>
    );
  };

  async function handleUpload() {
    if (!warehouseImage) return;

    try {
      setLoadingUpload(true);

      const formData = new FormData();
      formData.append("file", warehouseImage);

      const res = await fetch(
        `https://bolivia-imports-backend-pg.fly.dev/api/compras/${localPkg.id}/warehouse`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const result = await res.json();

      if (result.ok) {
        alert("Confirmado en warehouse ✅");

        // 🔥 UPDATE INMEDIATO SIN REFRESH
        setLocalPkg(prev => ({
          ...prev,
          warehouse_confirmado: true,
          warehouse_imagen: result.data.warehouse_imagen,
          warehouse_fecha: result.data.warehouse_fecha,
          estado: result.data.estado,
        }));

        // 🔥 actualizar timeline
        fetch(`https://bolivia-imports-backend-pg.fly.dev/api/compras/${localPkg.id}/eventos`)
          .then(res => res.json())
          .then(data => {
            if (data.ok) setEvents(data.data);
          })
          .catch(console.error);
      }
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
            Paquete
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-200">
            {tracking || "Sin tracking"}
          </h2>

          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
              {localPkg.estado || "en proceso"}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md">
            Imprimir etiqueta
          </button>

          <button className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md">
            Cambiar estado
          </button>
        </div>

        {/* INFO */}
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
              <p className="font-medium">{tracking || "—"}</p>
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
              <p className="text-neutral-500">Llegada warehouse</p>
              <p className="font-medium">
                {localPkg.warehouse_fecha
                  ? new Date(localPkg.warehouse_fecha).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* WAREHOUSE */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Confirmación Warehouse (USA)
          </h3>

          <div className="flex flex-col gap-4">
            {!localPkg.warehouse_confirmado && (
              <>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) setWarehouseImage(file);
                  }}
                  className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer"
                >
                  {warehouseImage ? (
                    <p className="text-sm">📦 {warehouseImage.name}</p>
                  ) : (
                    <p className="text-sm text-neutral-400">
                      Arrastra imagen aquí
                    </p>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={loadingUpload}
                  className="px-4 py-2 bg-black text-white rounded-md text-sm"
                >
                  {loadingUpload ? "Subiendo..." : "Confirmar llegada"}
                </button>
              </>
            )}

            {localPkg.warehouse_confirmado && (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-green-600">
                  ✔ Confirmado en warehouse
                </span>

                {localPkg.warehouse_fecha && (
                  <span className="text-xs text-neutral-400">
                    {new Date(localPkg.warehouse_fecha).toLocaleString()}
                  </span>
                )}

                {localPkg.warehouse_imagen && (
                  <img
                    src={localPkg.warehouse_imagen}
                    alt="warehouse"
                    onClick={() =>
                      window.open(localPkg.warehouse_imagen, "_blank")
                    }
                    className="rounded-lg max-h-40 object-cover border cursor-pointer hover:opacity-80"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
            Historial
          </h3>

          <div className="flex flex-col gap-6">
            {events.map((item, index) => (
              <div key={index} className="flex flex-col">
                <p className="text-sm">{item.descripcion}</p>
                <span className="text-xs text-neutral-400">
                  {item.fecha
                    ? new Date(item.fecha).toLocaleString()
                    : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}