import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../config/api";

const TIPO_CALCULO_OPTS = ["kg", "unidad"];

function filaVacia() {
  return { nombre: "", tipo_calculo: "kg", precio_referencia_usd: "", activa: true, orden: 0 };
}

function CampoTexto({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full ${className}`}
    />
  );
}

function CampoNumero({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full ${className}`}
    />
  );
}

function FilaCategoria({ cat, onSaved }) {
  const [form, setForm] = useState({
    nombre: cat.nombre,
    tipo_calculo: cat.tipo_calculo,
    precio_referencia_usd: cat.precio_referencia_usd != null ? String(cat.precio_referencia_usd) : "",
    activa: cat.activa,
    orden: String(cat.orden),
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
    setMsg(null);
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      setMsg({ ok: false, text: "Nombre requerido" });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const body = {
        nombre: form.nombre.trim(),
        tipo_calculo: form.tipo_calculo,
        precio_referencia_usd: form.precio_referencia_usd !== "" ? Number(form.precio_referencia_usd) : null,
        activa: form.activa,
        orden: Number(form.orden) || 0,
      };
      const res = await fetch(`${API_URL}/operativo/categorias/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error al guardar");
      setDirty(false);
      setMsg({ ok: true, text: "Guardado" });
      onSaved(data.data);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-neutral-200 dark:border-neutral-700">
      <td className="py-2 px-3">
        <CampoTexto value={form.nombre} onChange={(v) => set("nombre", v)} />
      </td>
      <td className="py-2 px-3">
        <select
          value={form.tipo_calculo}
          onChange={(e) => set("tipo_calculo", e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          {TIPO_CALCULO_OPTS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </td>
      <td className="py-2 px-3">
        <CampoNumero value={form.precio_referencia_usd} onChange={(v) => set("precio_referencia_usd", v)} placeholder="—" className="w-24" />
      </td>
      <td className="py-2 px-3 text-center">
        <input
          type="checkbox"
          checked={form.activa}
          onChange={(e) => set("activa", e.target.checked)}
          className="accent-blue-500 w-4 h-4"
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          value={form.orden}
          onChange={(e) => { set("orden", e.target.value); }}
          className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-400 w-16"
        />
      </td>
      <td className="py-2 px-3 whitespace-nowrap">
        <button
          onClick={guardar}
          disabled={!dirty || saving}
          className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {msg && (
          <span className={`ml-2 text-xs ${msg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {msg.text}
          </span>
        )}
      </td>
    </tr>
  );
}

function FilaNueva({ onCreated }) {
  const [form, setForm] = useState(filaVacia());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [touched, setTouched] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setMsg(null);
  }

  async function crear() {
    setTouched(true);
    if (!form.nombre.trim()) {
      setMsg({ ok: false, text: "Nombre requerido" });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const body = {
        nombre: form.nombre.trim(),
        tipo_calculo: form.tipo_calculo,
        precio_referencia_usd: form.precio_referencia_usd !== "" ? Number(form.precio_referencia_usd) : null,
        activa: form.activa,
        orden: Number(form.orden) || 0,
      };
      const res = await fetch(`${API_URL}/operativo/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error al crear");
      setForm(filaVacia());
      setTouched(false);
      setMsg({ ok: true, text: "Creado" });
      onCreated(data.data);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-dashed border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
      <td className="py-2 px-3">
        <CampoTexto
          value={form.nombre}
          onChange={(v) => set("nombre", v)}
          placeholder="Nueva categoría"
          className={touched && !form.nombre.trim() ? "border-red-400" : ""}
        />
      </td>
      <td className="py-2 px-3">
        <select
          value={form.tipo_calculo}
          onChange={(e) => set("tipo_calculo", e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          {TIPO_CALCULO_OPTS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </td>
      <td className="py-2 px-3">
        <CampoNumero value={form.precio_referencia_usd} onChange={(v) => set("precio_referencia_usd", v)} placeholder="—" className="w-24" />
      </td>
      <td className="py-2 px-3 text-center">
        <input
          type="checkbox"
          checked={form.activa}
          onChange={(e) => set("activa", e.target.checked)}
          className="accent-blue-500 w-4 h-4"
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          value={form.orden}
          onChange={(e) => set("orden", e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-400 w-16"
        />
      </td>
      <td className="py-2 px-3 whitespace-nowrap">
        <button
          onClick={crear}
          disabled={saving}
          className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "Creando…" : "Crear"}
        </button>
        {msg && (
          <span className={`ml-2 text-xs ${msg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {msg.text}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function Configuracion() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/operativo/categorias/admin`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error cargando categorías");
      setCategorias(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function onSaved(updated) {
    setCategorias((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function onCreated(nueva) {
    setCategorias((prev) => [...prev, nueva].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">Configuración</h1>
        <p className="text-sm text-neutral-500 mt-1">Parámetros del sistema operativo.</p>
      </div>

      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-700 dark:text-neutral-200">
            Categorías operativas
          </h2>
          <button
            onClick={cargar}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
          >
            Recargar
          </button>
        </div>

        {cargando && (
          <p className="text-sm text-neutral-400">Cargando…</p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!cargando && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="pb-2 px-3 font-medium">Nombre</th>
                  <th className="pb-2 px-3 font-medium">Tipo cálculo</th>
                  <th className="pb-2 px-3 font-medium">Ref. USD</th>
                  <th className="pb-2 px-3 font-medium text-center">Activa</th>
                  <th className="pb-2 px-3 font-medium">Orden</th>
                  <th className="pb-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => (
                  <FilaCategoria key={cat.id} cat={cat} onSaved={onSaved} />
                ))}
                <FilaNueva onCreated={onCreated} />
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
