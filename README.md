# TicketOps

Laboratorio local de gestión de tickets operacionales con Node.js 20.19 o superior compatible, TypeScript 5.9, Express, zod y Vitest. Los datos son ficticios y se guardan en memoria: se pierden al detener el proceso.

```powershell
pnpm install
pnpm test
pnpm lint
pnpm build
$env:DEMO_DATA = '1'
pnpm start
```

Abre `http://localhost:3000/panel/`. El servidor escucha solo en la interfaz local. Sin `DEMO_DATA=1`, comienza sin tickets. Para seleccionar otro puerto usa `$env:PORT = '3001'`. Para quitar la demostración usa `Remove-Item Env:DEMO_DATA`.

El contrato HTTP está en [docs/api.md](docs/api.md). El SLA usa horas corridas, se pausa en espera y el escalamiento se calcula al acceder a los datos: no envía notificaciones. No hay autenticación ni persistencia, por lo que este laboratorio no es apto para producción.

La plantilla [infra/template.yaml](infra/template.yaml) es ilustrativa: no existe aún el adaptador Lambda ni la integración DynamoDB, y no debe desplegarse como está.

El directorio `.kiro/` contiene especificaciones y configuración para Kiro. Los hooks y el agente dependen de la versión y permisos de Kiro y deben verificarse en una sesión real; la exclusión `.kiroignore` y el hook de lectura directa no sustituyen controles de acceso del sistema operativo.

## Estado del laboratorio

Se probaron la API, el panel, el SLA, el error de conexión y la regresión de tickets vencidos. Se validó la configuración del agente y se instalaron los powers de TicketOps y AWS en Kiro CLI. La auditoría automática y sus limitaciones se describen en [.kiro/reports/accesibilidad-panel.md](.kiro/reports/accesibilidad-panel.md).

Queda por comprobar en Kiro: las memorias y su recuperación en una sesión nueva; la activación real de hooks, MCP, skills y powers; el workflow en segundo plano; y el agente revisor interactivo y headless. El informe de riesgos se elaboró localmente, no mediante un workflow de Kiro.
