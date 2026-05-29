# Pendientes post-despliegue — Bolivia Imports

## Estado actual de despliegue

- [x] Panel interno publicado en Cloudflare Pages  
  URL: https://app.bolivia-import.com

- [x] Formulario público publicado en Cloudflare Pages  
  URL: https://envio.bolivia-import.com

- [x] API pública funcionando por Cloudflare Tunnel  
  URL: https://api.bolivia-import.com

- [x] Archivos migrados a Cloudflare R2  
  URL base: https://archivos.bolivia-import.com

- [x] Backend Node/Express corriendo con PM2  
  Proceso: `bolivia-imports-api`

- [x] Cloudflare Tunnel instalado como servicio en macOS  
  Servicio: `com.cloudflare.cloudflared`

---

## Pendientes de limpieza de despliegue anterior

### 1. Revisar y desvincular Fly.io

- [ ] Revisar si el backend antiguo sigue desplegado en Fly.io.
- [ ] Confirmar si existe app activa en Fly.io relacionada con Bolivia Imports.
- [ ] Verificar si alguna URL `fly.dev` sigue siendo usada en:
  - frontend
  - formulario
  - backend
  - variables de entorno
  - documentación interna
- [ ] Si ya no se usa:
  - [ ] desactivar app en Fly.io
  - [ ] eliminar secrets antiguos
  - [ ] eliminar deploy antiguo
  - [ ] confirmar que no haya costos activos

### 2. Revisar y desvincular Vercel

- [ ] Revisar si existen proyectos antiguos:
  - `bolivia-imports-panel`
  - `bolivia-imports-formulario`
  - variantes antiguas
- [ ] Confirmar que ninguna URL `vercel.app` esté activa como API o frontend principal.
- [ ] Confirmar que Cloudflare Pages reemplazó completamente esos despliegues.
- [ ] Si ya no se usa:
  - [ ] desactivar/eliminar proyectos antiguos en Vercel
  - [ ] quitar variables antiguas
  - [ ] confirmar que no haya dominios apuntando a Vercel

### 3. Revisar y eliminar dependencias de ngrok

- [ ] Buscar referencias a `ngrok` en:
  - backend
  - frontend
  - formulario
  - README/documentación
- [ ] Confirmar que no exista ninguna URL ngrok activa en producción.
- [ ] Eliminar comentarios obsoletos si confunden.
- [ ] Mantener ngrok solo como herramienta temporal de emergencia, no como parte del sistema.

### 4. Revisar DNS antiguos

- [ ] Revisar registros DNS en Cloudflare.
- [ ] Confirmar que los dominios principales apunten a Cloudflare:
  - `app.bolivia-import.com`
  - `envio.bolivia-import.com`
  - `api.bolivia-import.com`
  - `archivos.bolivia-import.com`
- [ ] Eliminar registros DNS antiguos que apunten a:
  - Fly.io
  - Vercel
  - ngrok
  - IPs locales
  - servicios que ya no se usan

### 5. Revisar repositorios antiguos

- [ ] Confirmar repositorios activos:
  - `bolivia-imports-backend-v1`
  - `bolivia-imports-panel`
  - `bolivia-imports-formulario`
- [ ] Revisar si existen repos antiguos que ya no se usan.
- [ ] No borrar repos sin confirmar:
  - remoto usado
  - historial necesario
  - deploy conectado
  - respaldo del código

---

## Bugs internos pendientes

### Dashboard

- [ ] Revisar endpoint:
  `GET https://api.bolivia-import.com/api/dashboard`

- [ ] Error actual:
  `invalid input value for enum estado_operativo_enum: "en_almacen"`

- [ ] Diagnosticar:
  - archivo del módulo dashboard
  - query que usa `en_almacen`
  - valores reales del enum `estado_operativo_enum`
  - si corresponde cambiar query o migración

- [ ] No es bloqueo de despliegue.
- [ ] Corregir después de priorizar flujos operativos principales.

---

## Validaciones periódicas rápidas

### API

```bash
curl https://api.bolivia-import.com/health
```

Respuesta esperada: `{"status":"OK","service":"Bolivia Imports API - PG"}`

### Tunnel

```bash
sudo launchctl list | grep cloudflared
cloudflared tunnel info bolivia-import-api
```

Debe mostrar conexiones activas (`EDGE`).

### PM2

```bash
pm2 status
pm2 logs bolivia-imports-api --lines 20 --err
```

### R2

```bash
curl -I https://archivos.bolivia-import.com/solicitudes-terminal/HUMBERTO_SERRANO_e4724f06/envios/envio_20260528_102935.jpg
```

Respuesta esperada: `HTTP/2 200`

### CORS (preflight)

```bash
curl -s -I -X OPTIONS \
  -H "Origin: https://app.bolivia-import.com" \
  -H "Access-Control-Request-Method: POST" \
  https://api.bolivia-import.com/api/receptores \
  | grep -i "access-control"
```

---

## Notas de arquitectura

| Componente | Tecnología | URL |
|---|---|---|
| Panel interno | Cloudflare Pages (React/Vite) | https://app.bolivia-import.com |
| Formulario público | Cloudflare Pages (HTML/JS estático) | https://envio.bolivia-import.com |
| API | Node/Express + PM2 + Cloudflare Tunnel | https://api.bolivia-import.com |
| Archivos | Cloudflare R2 | https://archivos.bolivia-import.com |
| DB | PostgreSQL local | localhost:5432 |
| Tunnel ID | `5880d6ee-a234-4580-b396-5133b2f73730` | — |

---

*Documento creado: 2026-05-29*
