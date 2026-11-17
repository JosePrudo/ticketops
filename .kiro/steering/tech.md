# Tecnología

- Node.js 20.19 o una versión superior compatible, TypeScript 5.9, Express, zod y Vitest.
- Usar pnpm, nunca npm ni yarn. Comandos: `pnpm install`, `pnpm test`, `pnpm build` y `pnpm lint`.
- No compilar archivos `*.test.ts` a `dist`.
- Aprobar únicamente scripts necesarios cuando pnpm los bloquee.
- La aplicación usa almacenamiento en memoria; el despliegue futuro se diseñará para API Gateway, Lambda y DynamoDB con SAM o CDK.
- No guardar credenciales AWS en el repositorio; usar roles IAM y variables de entorno.
