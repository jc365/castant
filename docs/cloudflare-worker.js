// Cloudflare Worker - Ping a Render + R2 Monitor
const BACKEND_URL = 'https://castant-backend.onrender.com';
const ORCHESTRATOR_URL = 'https://castant-orchestrator.onrender.com';

// 🔥 Variables de entorno (solo configuración del worker)
const ENV = {
  START_HOUR: parseInt(globalThis.START_HOUR) || 10,
  END_HOUR: parseInt(globalThis.END_HOUR) || 19,
  DAYS_ALLOWED: (globalThis.DAYS_ALLOWED || '1-5').split('-').map(Number),
  R2_MONITOR_HOUR: globalThis.R2_MONITOR_HOUR ? parseInt(globalThis.R2_MONITOR_HOUR) : null
};

// 🔥 Función para obtener la hora en CEST (UTC+2)
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

// 🔥 Parsear intervalo del cron (ej: "*/15 * * * *" → 15)
function parseCronInterval(cron) {
  if (!cron) return 15;
  const match = cron.match(/^\*\/(\d+)/);
  return match ? parseInt(match[1]) : 15;
}

// 🔥 Verificar si toca ejecutar R2 Monitor
function shouldTriggerR2Monitor(cron) {
  // Si no está configurada la hora, no ejecutar
  if (ENV.R2_MONITOR_HOUR === null || isNaN(ENV.R2_MONITOR_HOUR)) {
    return false;
  }

  const { hour, minutes } = getCESTTime();
  const interval = parseCronInterval(cron);
  
  // Ventana: desde R2_MONITOR_HOUR:00 hasta R2_MONITOR_HOUR:interval
  // Ej: hora=3, cron=15 → ventana 3:00 - 3:14
  const startMinute = ENV.R2_MONITOR_HOUR * 60;
  const endMinute = startMinute + interval;
  const currentMinute = hour * 60 + minutes;

  const inWindow = currentMinute >= startMinute && currentMinute < endMinute;
  
  if (inWindow) {
    console.log(`[${isoString}] 📊 R2 Monitor: Hora ${hour}:${minutes} está en ventana ${ENV.R2_MONITOR_HOUR}:00 - ${ENV.R2_MONITOR_HOUR}:${interval} (cron cada ${interval} min)`);
  }
  
  return inWindow;
}

// 🔥 Función principal de ping
async function pingBackend() {
  const { hour, day, isoString } = getCESTTime();

  console.log(`[${isoString}] 🟢 Iniciando ping...`);
  console.log(`[${isoString}] Hora CEST: ${hour}, Día: ${day}`);
  console.log(`[${isoString}] START_HOUR: ${ENV.START_HOUR}, END_HOUR: ${ENV.END_HOUR}, DAYS_ALLOWED: ${ENV.DAYS_ALLOWED.join(',')}`);

  const isWithin = hour >= ENV.START_HOUR && hour < ENV.END_HOUR && ENV.DAYS_ALLOWED.includes(day);

  if (!isWithin) {
    console.log(`[${isoString}] ⏰ Fuera de horario (${ENV.START_HOUR}-${ENV.END_HOUR}, días ${ENV.DAYS_ALLOWED.join(',')})`);
    return;
  }

  try {
    const response = await fetch(BACKEND_URL + '/health');
    console.log(`[${isoString}] ✅ Ping a ${BACKEND_URL}: Status ${response.status}`);
  } catch (error) {
    console.error(`[${isoString}] ❌ Error al hacer ping:`, error.message);
  }
}

// 🔥 Trigger R2 Monitor en el orquestador
async function triggerR2Monitor() {
  const { isoString } = getCESTTime();
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/webhook/r2.monitor`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log(`[${isoString}] ✅ Lanzamiento de R2 Monitor: ${data.status} — ${data.result || data.message}`);
  } catch (error) {
    console.error(`[${isoString}] ❌ R2 Monitor error:`, error.message);
  }
}

// 🔥 Handler principal del cron
async function handleScheduled(event) {
  const cron = event.cron || '*/15 * * * *';
  
  await pingBackend();

  if (shouldTriggerR2Monitor(cron)) {
    await triggerR2Monitor();
  } else {
    const { isoString } = getCESTTime();
    const reason = ENV.R2_MONITOR_HOUR === null ? 'R2_MONITOR_HOUR not set' : 'not in window';
    console.log(`[${isoString}] 📊 R2 Monitor skipped: ${reason}`);
  }
}

// 🔥 Cron trigger
addEventListener('scheduled', event => {
  const { isoString } = getCESTTime();
  console.log(`[${isoString}] 🔔 Worker activado por cron: ${event.cron || '*/15 * * * *'}`);
  event.waitUntil(handleScheduled(event));
});

// 🔥 Respuesta al visitar la URL (muestra estado)
addEventListener('fetch', event => {
  const { hour, minutes, day, isoString } = getCESTTime();
  const isWithin = hour >= ENV.START_HOUR && hour < ENV.END_HOUR && ENV.DAYS_ALLOWED.includes(day);

  // Para mostrar el intervalo, necesitamos el cron. Como no lo tenemos aquí, usamos 15 como fallback
  const r2Configured = ENV.R2_MONITOR_HOUR !== null && !isNaN(ENV.R2_MONITOR_HOUR);
  const r2NextRun = r2Configured
    ? `${ENV.R2_MONITOR_HOUR}:00 - ${ENV.R2_MONITOR_HOUR}:15 CEST (aprox)`
    : 'not configured';

  const response = `
  🚀 Worker de ping para Render -v6.0-

  📅 Hora CEST: ${isoString}
  🕐 Hora: ${hour}:${minutes}, Día: ${day}
  ⏰ Horario ping: ${ENV.START_HOUR}:00 - ${ENV.END_HOUR}:00 (días ${ENV.DAYS_ALLOWED.join(',')})
  📊 Estado ping: ${isWithin ? '✅ DENTRO del horario' : '⏰ FUERA del horario'}
  🔗 Backend: ${BACKEND_URL}

  📊 R2 Monitor:
  ⏱️  Ventana: ${r2NextRun}
  🔗 Orquestador: ${ORCHESTRATOR_URL}
  `;

  event.respondWith(new Response(response, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  }));
});