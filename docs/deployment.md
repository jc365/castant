
# Despliegue de Castant - Documentación Técnica

**Fecha:** 2026-08-28
**Versión:** 1.0.0

---

## 📋 Resumen

El sistema Castant está desplegado en producción utilizando servicios gratuitos de diferentes proveedores, todos ellos en sus tiers gratuitos. La arquitectura está compuesta por cinco componentes principales que se comunican entre sí.

---

## 🗺️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Usuarios                                                               │
│  https://castant.vercel.app                                             │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend (Vercel)                                                      │
│  - React + Vite                                                         │
│  - SPA con React Router                                                 │
│  - Variables: VITE_API_URL                                              │
└─────────────────────────────────────────────────────────────────────────┘
       │
       │ Peticiones API
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Backend (Render)                                                       │
│  - Node.js + Express + tsx                                              │
│  - Autenticación JWT                                                    │
│  - CORS configurado                                                     │
│  - Endpoint: /health                                                    │
└─────────────────────────────────────────────────────────────────────────┘
       │                                            │
       │                                            │
       ▼                                            ▼
┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│  Base de Datos (Neon.tech)              │   │  Orquestador (Render)                   │
│  - PostgreSQL serverless                │   │  - Python + FastAPI                     │
│  - 0.5 GB gratis                        │   │  - Workflows: video_processor, cleanup  │
│  - SSL: verify-full                     │   │  - Polling cada 5s                      │
└─────────────────────────────────────────┘   └─────────────────────────────────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────────────────────────────────┐
                                            │  Cloudflare Worker (Ping)               │
                                            │  - Mantiene el backend activo           │
                                            │  - Cron cada 15 min (16-20h L-V)        │
                                            └─────────────────────────────────────────┘
```

---

## 🔧 Componentes

### 1. Base de Datos (Neon.tech)

| Aspecto | Detalle |
|---------|---------|
| **URL** | `postgresql://castant:***@ep-xxx.aws.neon.tech/neondb?sslmode=verify-full` |
| **Plan** | Free Tier |
| **Almacenamiento** | 0.5 GB |
| **Región** | AWS US East 2 (Ohio) |
| **SSL** | `sslmode=verify-full` |
| **Pooled URL** | `?pool_mode=transaction` (recomendado para producción) |

**Comandos útiles:**
```bash
# Verificar conexión
psql -d "postgresql://castant:***@ep-xxx.aws.neon.tech/neondb?sslmode=verify-full"
```

---

### 2. Backend (Render)

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://castant-backend.onrender.com |
| **Runtime** | Node.js 24 |
| **Framework** | Express 5 |
| **Comando de inicio** | `npx tsx src/index.ts` |
| **Health check** | `/health` |
| **Plan** | Starter (750h/mes) |

**Variables de entorno:**
| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (URL de Neon.tech) |
| `JWT_SECRET` | (secreto fuerte) |
| `CORS_ORIGIN` | `https://castant.vercel.app,http://localhost:5173` |
| `DEMO_MODE` | `true` |
| `ADMIT_TOKENS` | (token para orquestador) |
| `LOG_LEVEL` | `info` |

**Endpoints principales:**
- `GET /health` → `{ "status": "ok" }`
- `POST /api/v1/auth/login` → Login (email/password o demo)
- `GET /api/v1/castings` → Listar castings
- `GET /api/v1/config` → Configuración global

---

### 3. Frontend (Vercel)

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://castant.vercel.app |
| **Framework** | React + Vite |
| **Routing** | React Router (SPA) |
| **Variables** | `VITE_API_URL=https://castant-backend.onrender.com/api/v1` |
| **Config** | `vercel.json` para SPA routing |

**Dominios asociados:**
- `castant.vercel.app` (producción)
- `castant-git-release-02-*.vercel.app` (preview)

**Configuración de Vercel:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### 4. Orquestador (Render)

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://castant-orchestrator.onrender.com |
| **Runtime** | Python 3.14 |
| **Framework** | FastAPI |
| **Comando de inicio** | `python -m uvicorn orchestration.webhooks.server:app --host 0.0.0.0 --port 10000` |
| **PYTHONPATH** | `.` |
| **Plan** | Starter (750h/mes) |

**Variables de entorno:**
| Variable | Valor |
|----------|-------|
| `SEND_TOKEN` | (token para autenticación con backend) |
| `CASTANT_BACKEND_URL` | `https://castant-backend.onrender.com` |
| `LOG_LEVEL` | `INFO` |
| `ENVIRONMENT` | `production` |

**Workflows:**
- `submission.created` → Procesamiento de video
- `review.completed` → Notificaciones
- `cleanup.daily` → Limpieza de archivos

**Polling:** Cada 5 segundos consulta eventos pendientes.

---

### 5. Cloudflare Worker (Ping)

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://castant-ping.correo-enero-2019.workers.dev/|
| **Runtime** | Cloudflare Workers (JavaScript) |
| **Cron** | `*/15 * * * *` (cada 15 minutos) |
| **Horario** | 16:00 - 20:00 (Lunes a Viernes) |
| **Propósito** | Mantener el backend de Render activo |

**Variables:**
| Variable | Valor |
|----------|-------|
| `START_HOUR` | `16` |
| `END_HOUR` | `20` |
| `DAYS_ALLOWED` | `1-2-3-4-5` |

**Comportamiento:**
- Dentro del horario: Ping a `/health` cada 15 minutos
- Fuera del horario: No hace ping (ahorra recursos)

**Código:** `docs/cloudflare-worker.js`

**Endpoints:**
- `GET /` → Muestra estado del Worker (sin ejecutar ping)

---

## 🔗 URLs de Producción

| Componente | URL |
|------------|-----|
| **Frontend** | https://castant.vercel.app |
| **Backend** | https://castant-backend.onrender.com |
| **Health** | https://castant-backend.onrender.com/health |
| **Orquestador** | https://castant-orchestrator.onrender.com |
| **Worker** | https://castant-ping.correo-enero-2019.workers.dev/ |

---

## 🛠️ Comandos de Diagnóstico

### Verificar backend
```bash
curl https://castant-backend.onrender.com/health
# → { "status": "ok" }
```

### Verificar orquestador
```bash
curl https://castant-orchestrator.onrender.com/webhook/submission.created \
  -H "Content-Type: application/json" \
  -d '{"submission_id":"test"}'
# → { "status": "queued" }
```

### Verificar Worker
```bash
curl https://castant-ping.correo-enero-2019.workers.dev/
# → Muestra estado del Worker
```

### Verificar frontend
```bash
curl -I https://castant.vercel.app
# → HTTP/2 200
```

---

## ⚠️ Notas importantes

1. **Cold start del backend:** El backend de Render se duerme tras 15 minutos sin actividad. El Cloudflare Worker lo mantiene activo durante el horario configurado (16-20h L-V). **Es una medida para facilitar la evaluacion del TFM sin esperas.**

2. **CORS:** El backend solo acepta peticiones desde `https://castant.vercel.app` y `http://localhost:5173`.

3. **SSL:** La conexión a Neon.tech usa `sslmode=verify-full` (certificado validado).

4. **Variables de entorno:** Las URLs de conexión deben actualizarse en caso de cambio de proveedor.

5. **Backups:** La base de datos en Neon.tech no tiene backups automáticos en el plan gratuito.

---

## 📋 Pendientes

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| R2 Monitor | ⏳ Pendiente | 🟡 Media |
| Mailing (Mailrelay) | ⏳ Pendiente | 🟢 Baja |
| Orquestador - Cleanup automático | ⏳ Pendiente | 🟡 Media |

---

### Última actualización:  29-08-2026 / 00:30

