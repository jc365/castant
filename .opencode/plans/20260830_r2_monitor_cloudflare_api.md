# Plan: Migrar R2MonitorWorkflow a Cloudflare API con Bearer Token

## Contexto

El workflow `R2MonitorWorkflow` actualmente usa `boto3` (SDK S3) para listar objetos del bucket R2 y calcular su tamaño. El problema es que requiere credenciales S3 (`access_key_id`, `secret_access_key`) y tiene problemas con SSL en desarrollo. Ya tenemos un token de Cloudflare API que funciona para listar objetos R2, por lo que migrar a la API REST de Cloudflare simplifica la configuración y elimina la dependencia de boto3.

## Archivos a modificar

### 1. `orchestration/workflows/r2_monitor.py`

**Cambios:**
- Eliminar imports: `boto3`, `botocore.config.Config`, `urllib3`, `asyncio`
- Agregar import: `httpx`
- Eliminar `urllib3.disable_warnings()` (ya no aplica)
- Reemplazar `_get_r2_size_sync()` (sync) → `_get_r2_size()` (async) usando `httpx.AsyncClient`
- Variables de entorno/config nuevas:
  - `CLOUDFLARE_ACCOUNT_ID` / `cloudflare_account_id` (antes era `CLOUDFLARE_R2_ACCOUNT_ID`)
  - `CLOUDFLARE_R2_BUCKET` / `cloudflare_r2_bucket` (sin cambio)
  - `CLOUDFLARE_API_TOKEN` / `cloudflare_api_token` (antes era `CLOUDFLARE_R2_ACCESS_KEY_ID` + `CLOUDFLARE_R2_SECRET_ACCESS_KEY`)
- API endpoint: `GET https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/objects?prefix=castant/`
- Header: `Authorization: Bearer {api_token}`
- Paginación: usar `cursor` de `result_info` en lugar de paginator de S3
- `execute()` llamará directamente `await self._get_r2_size()` (sin `asyncio.to_thread`)

**Líneas clave a reemplazar:**
- Líneas 8-15: imports → reemplazar por `import httpx`
- Línea 24: `urllib3.disable_warnings()` → eliminar
- Línea 38: `await asyncio.to_thread(self._get_r2_size_sync)` → `await self._get_r2_size()`
- Líneas 60-108: método `_get_r2_size_sync()` → reemplazar completamente

### 2. `orchestration/workflows/r2_monitor_async.py`

**Cambios:**
- Mismos cambios que `r2_monitor.py` pero este ya tiene el método async
- Eliminar imports: `boto3`, `botocore.config.Config`
- Eliminar `ssl`, `urllib3` inline
- Variables de entorno: mismas que arriba
- Reemplazar bloque S3 (líneas 56-116) con httpx Cloudflare API

### 3. `orchestration/requirements.txt`

- Eliminar: `boto3>=1.35.0` (solo se usaba en estos dos archivos)
- Verificar que `httpx>=0.27.0` ya está presente (sí, línea 3)

### 4. `orchestration/.env.example`

Agregar las nuevas variables de entorno (las R2 antiguas no estaban ahí):
- `CLOUDFLARE_ACCOUNT_ID=`
- `CLOUDFLARE_API_TOKEN=`
- `CLOUDFLARE_R2_BUCKET=`

### 5. Configuración en BD (Config table)

Las configs del orquestador se leen de la tabla Config vía `get_config()`. Actualizar las entries existentes o crear nuevas:
- `cloudflare_account_id` (antes `cloudflare_r2_account_id`)
- `cloudflare_api_token` (nueva, reemplaza `cloudflare_r2_access_key_id` + `cloudflare_r2_secret_access_key`)
- `cloudflare_r2_bucket` (sin cambio)

## Flujo del nuevo método `_get_r2_size()`

```
1. Leer config: account_id, bucket_name, api_token
2. Validar que los tres estén presentes
3. GET https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/objects
   - Header: Authorization: Bearer {api_token}
   - Params: prefix=castant/, cursor=<si existe>
4. Parsear respuesta JSON
5. Verificar data.success == true
6. Sumar obj.size de cada objeto en data.result
7. Si data.result_info.cursor existe, repetir desde paso 3
8. Retornar total_size
```

## Verificación

1. **Typecheck del orquestador:** `cd orchestration && python -c "from orchestration.workflows.r2_monitor import R2MonitorWorkflow; print('OK')"`
2. **Tests existentes:** `cd orchestration && PYTHONPATH=.. pytest tests/ -v` (verificar que no se rompen)
3. **Verificar que boto3 ya no se importa:** `grep -r "boto3" orchestration/`
4. **Test manual:** Si hay token configurado, ejecutar el workflow y verificar que obtiene el tamaño real del bucket

## Notas

- El backend (`backend/src/infrastructure/storage/`) SÍ sigue usando boto3/S3 para subir objetos — eso no se modifica
- Solo el orquestador cambia su forma de **leer** el tamaño del bucket (de S3 API a Cloudflare REST API)
- `httpx` ya está en requirements.txt, no se necesita instalar nada nuevo
