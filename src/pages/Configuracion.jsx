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
      className={`ui-input ui-input-sm ${className}`}
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
      className={`ui-input ui-input-sm ${className}`}
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
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td className="py-2 px-3">
        <CampoTexto value={form.nombre} onChange={(v) => set("nombre", v)} />
      </td>
      <td className="py-2 px-3">
        <select
          value={form.tipo_calculo}
          onChange={(e) => set("tipo_calculo", e.target.value)}
          className="ui-select ui-input-sm"
          style={{ width: "auto" }}
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
          className="w-4 h-4"
          style={{ accentColor: "var(--accent)" }}
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          value={form.orden}
          onChange={(e) => { set("orden", e.target.value); }}
          className="ui-input ui-input-sm w-16"
        />
      </td>
      <td className="py-2 px-3 whitespace-nowrap">
        <button
          onClick={guardar}
          disabled={!dirty || saving}
          className="ui-button ui-button-sm disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {msg && (
          <span className="ml-2 text-xs" style={{ color: msg.ok ? "var(--success)" : "var(--danger)" }}>
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
    <tr style={{ borderBottom: "1px dashed var(--border)", background: "var(--surface-2)" }}>
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
          className="ui-select ui-input-sm"
          style={{ width: "auto" }}
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
          className="w-4 h-4"
          style={{ accentColor: "var(--accent)" }}
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="number"
          value={form.orden}
          onChange={(e) => set("orden", e.target.value)}
          className="ui-input ui-input-sm w-16"
        />
      </td>
      <td className="py-2 px-3 whitespace-nowrap">
        <button
          onClick={crear}
          disabled={saving}
          className="ui-button-success ui-button-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Creando…" : "Crear"}
        </button>
        {msg && (
          <span className="ml-2 text-xs" style={{ color: msg.ok ? "var(--success)" : "var(--danger)" }}>
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
    <div className="module-shell">
      <div className="module-header">
        <p className="ui-section-title">Sistema</p>
        <h1 className="ui-page-title">Configuración</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>Parámetros del sistema operativo.</p>
      </div>

      <div className="module-body">
      <div className="scroll-area pb-6 flex flex-col gap-8">

      <section className="ui-section-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Categorías operativas
          </h2>
          <button
            onClick={cargar}
            className="text-xs transition"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
          >
            Recargar
          </button>
        </div>

        {cargando && (
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Cargando…</p>
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        )}

        {!cargando && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Nombre", "Tipo cálculo", "Ref. USD", "Activa", "Orden", ""].map((h, i) => (
                    <th key={i} className="ui-th">{h}</th>
                  ))}
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
      </div>{/* scroll-area */}
      </div>{/* module-body */}
    </div>
  );
}
