# Plan: Añadir R2 Monitor diario al Cloudflare Worker

## Contexto

El worker Cloudflare ejecuta un cron cada N minutos para mantener el backend de Render despierto. Se quiere añadir la ejecución del R2 Monitor una vez al día, en una hora configurable (CEST).

El intervalo del cron está disponible en `event.cron` (ej: `"*/15 * * * *"`), no necesita env var separada.

## Archivo a modificar

`docs/cloudflare-worker.js`

## Cambios

### 1. Variable de entorno `R2_MONITOR_HOUR`

Añadir al bloque `ENV` (línea 6-9):
```js
R2_MONITOR_HOUR: globalThis.R2_MONITOR_HOUR ? parseInt(globalThis.R2_MONITOR_HOUR) : null
```
- `null` o `NaN`: no se ejecuta el monitor
- Número 0-23: se ejecuta en esa hora (CEST)

### 2. Función `parseCronInterval(cron)`

Parsea el string cron para extraer el intervalo en minutos:
```js
function parseCronInterval(cron) {
  // "*/15 * * * *" → 15, "0 * * * *" → 60, "*/5 * * * *" → 5
  const match = cron.match(/^\*\/(\d+)/);
  return match ? parseInt(match[1]) : 60;
}
```

### 3. Función `shouldTriggerR2Monitor(cron)`

```js
function shouldTriggerR2Monitor(cron) {
  if (ENV.R2_MONITOR_HOUR === null || isNaN(ENV.R2_MONITOR_HOUR)) return false;
  
  const { hour, minutes } = getCESTTime();
  const interval = parseCronInterval(cron);
  
  return hour === ENV.R2_MONITOR_HOUR && minutes < interval;
}
```

Lógica: ejecuta solo si la hora CEST coincide con `R2_MONITOR_HOUR` y los minutos son menores al intervalo del cron. Garantiza una única ejecución por día.

### 4. Función `triggerR2Monitor()`

```js
async function triggerR2Monitor() {
  const { isoString } = getCESTTime();
  try {
    const response = await fetch('https://castant-orchestrator.onrender.com/webhook/r2.monitor', {
      method: 'POST'
    });
    const data = await response.json();
    console.log(`[${isoString}] 📊 R2 Monitor: ${data.status} — ${data.result}`);
  } catch (error) {
    console.error(`[${isoString}] ❌ R2 Monitor error:`, error.message);
  }
}
```

### 5. Integrar en el cron handler

En `addEventListener('scheduled', ...)` (línea 47-51), pasar `event` al handler y añadir:

```js
addEventListener('scheduled', event => {
  const { isoString } = getCESTTime();
  console.log(`[${isoString}] 🔔 Worker activado por cron`);
  event.waitUntil(handleScheduled(event));
});

async function handleScheduled(event) {
  await pingBackend();
  
  const cron = event.cron || '*/15 * * * *';
  if (shouldTriggerR2Monitor(cron)) {
    await triggerR2Monitor();
  } else {
    const { isoString } = getCESTTime();
    const reason = ENV.R2_MONITOR_HOUR === null ? 'R2_MONITOR_HOUR not set' : 'not in window';
    console.log(`[${isoString}] 📊 R2 Monitor skipped: ${reason}`);
  }
}
```

### 6. Actualizar getCESTTime()

Añadir `minutes` al retorno:
```js
function getCESTTime() {
  const now = new Date();
  const cest = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    hour: cest.getHours(),
    minutes: cest.getMinutes(),
    day: cest.getDay(),
    isoString: cest.toISOString()
  };
}
```

### 7. Actualizar la respuesta del fetch (status page)

Añadir en la respuesta HTML (línea 58-66):
- `R2_MONITOR_HOUR` configurado
- Próxima ejecución estimada del R2 Monitor

## Notas

- El endpoint es `POST /webhook/r2.monitor` (no GET)
- Sin `R2_MONITOR_HOUR`: worker funciona igual que antes, solo ping
- Con `R2_MONITOR_HOUR=12`: monitor se ejecuta entre 12:00 y 12:{interval-1} CEST
- `event.cron` se parsea para obtener el intervalo (no necesita env var extra)

## Verificación

1. Sin `R2_MONITOR_HOUR`: logs muestran "R2 Monitor skipped: R2_MONITOR_HOUR not set"
2. Con `R2_MONITOR_HOUR=12` y cron `*/15`: ejecuta entre 12:00-12:14
3. Fuera de la ventana: logs muestran "R2 Monitor skipped: not in window"
