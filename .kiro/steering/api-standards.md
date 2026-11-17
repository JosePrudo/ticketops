---
inclusion: fileMatch
fileMatchPattern: ["src/**/routes/**/*.ts", "src/**/*.routes.ts", "src/app.ts"]
---

# Estándares de API

Validar todas las entradas con zod. Responder errores como `{ "error": { "code": string, "message": string } }`: 400 para validación, 404 para recursos inexistentes y 409 para transiciones inválidas. Cada endpoint nuevo incluye pruebas de éxito y error.
