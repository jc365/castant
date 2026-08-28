// Cloudflare Worker - Ping a Render
const BACKEND_URL = 'https://castant-backend.onrender.com';

// 🔥 Variables de entorno con fallback
const ENV = {
  START_HOUR: parseInt(globalThis.START_HOUR) || 10,
  END_HOUR: parseInt(globalThis.END_HOUR) || 19,
  DAYS_ALLOWED: (globalThis.DAYS_ALLOWED || '1-5').split('-').map(Number)
};

// 🔥 Función para obtener la hora en CEST (UTC+2)
function getCESTTime() {
  const now = new Date();
  // Cloudflare Workers usa UTC, sumamos 2 horas para CEST
  const cest = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    hour: cest.getHours(),
    day: cest.getDay(),
    isoString: cest.toISOString()
  };
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

// 🔥 Cron trigger (cada 15 minutos)
addEventListener('scheduled', event => {
  const { isoString } = getCESTTime();
  console.log(`[${isoString}] 🔔 Worker activado por cron`);
  event.waitUntil(pingBackend());
});

// 🔥 Respuesta al visitar la URL (muestra estado sin ejecutar ping)
addEventListener('fetch', event => {
  const { hour, day, isoString } = getCESTTime();
  const isWithin = hour >= ENV.START_HOUR && hour < ENV.END_HOUR && ENV.DAYS_ALLOWED.includes(day);
  
  const response = `
  🚀 Worker de ping para Render -v4.2-
  
  📅 Hora CEST: ${isoString}
  🕐 Hora: ${hour}, Día: ${day}
  ⏰ Horario configurado: ${ENV.START_HOUR}:00 - ${ENV.END_HOUR}:00 (días ${ENV.DAYS_ALLOWED.join(',')})
  📊 Estado actual: ${isWithin ? '✅ DENTRO del horario' : '⏰ FUERA del horario'}
  🔗 Backend: ${BACKEND_URL}
  `;
  
  event.respondWith(new Response(response, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  }));
});