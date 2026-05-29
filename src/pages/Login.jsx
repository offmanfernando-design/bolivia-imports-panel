import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../config/api"
import { setAuth } from "../utils/auth"

export default function Login() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Error al iniciar sesión")
        return
      }
      setAuth(json.token, json.user)
      navigate("/", { replace: true })
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6"
        style={{
          background:   "var(--surface)",
          border:       "1px solid var(--border)",
          boxShadow:    "var(--shadow-lg)",
        }}
      >
        {/* Logo + título */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm select-none"
            style={{ background: "#1E3A4A", color: "#6FA4B7" }}
          >
            BI
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Bolivia Imports
          </h1>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Acceso al panel interno
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="ui-input"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="ui-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ui-button w-full"
            style={{ marginTop: "4px" }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  )
}
