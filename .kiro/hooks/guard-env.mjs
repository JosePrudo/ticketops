import { readFileSync } from 'node:fs';

let event;
try {
  event = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  console.error('No se puede verificar la solicitud de lectura.');
  process.exit(2);
}

function containsEnv(value) {
  if (typeof value === 'string') return /(^|[\\/])\.env(?:\.[^\\/]*)?($|[\\/])/i.test(value);
  if (Array.isArray(value)) return value.some(containsEnv);
  if (value && typeof value === 'object') return Object.values(value).some(containsEnv);
  return false;
}

if (!event.tool_input || typeof event.tool_input !== 'object') {
  console.error('No se puede verificar la ruta solicitada.');
  process.exit(2);
}
if (containsEnv(event.tool_input)) {
  console.error('Lectura denegada: los archivos de entorno pueden contener secretos.');
  process.exit(2);
}
