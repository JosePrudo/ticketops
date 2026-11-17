import { readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

let event;
try {
  event = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  console.error('No se pudo interpretar el evento de guardado.');
  process.exit(1);
}
const path = event.file_path ?? event.filePath ?? event.path ?? event.tool_input?.path;
if (typeof path !== 'string') {
  console.error('El evento de guardado no contiene la ruta del archivo.');
  process.exit(1);
}
const file = relative(process.cwd(), resolve(process.cwd(), path));
if (!file.startsWith(`src${sep}`) || !file.endsWith('.ts')) {
  console.error('La ruta no es un archivo TypeScript de src.');
  process.exit(1);
}
for (const args of [
  ['node_modules/eslint/bin/eslint.js', '--fix', file],
  ['node_modules/vitest/vitest.mjs', 'related', '--run', '--passWithNoTests', file],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message ?? `La verificación terminó con código ${result.status}.`);
    process.exit(result.status || 1);
  }
}
