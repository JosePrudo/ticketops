# Diseño: núcleo de tickets

La aplicación Express exporta `createApp` sin abrir puertos; `server.ts` inicia el servidor. Un servicio en memoria recibe un reloj inyectable y almacena tickets, agentes e historial. Los datos se pierden al reiniciar.

Cada ticket tiene ID, título, descripción, categoría, prioridad, solicitante, responsable opcional, estado, fechas, historial y nota de resolución. Los agentes activos se consultan en `GET /agents`; el proyecto utiliza agentes ficticios.

El SLA usa horas corridas, empezando en la creación. El tiempo en EN_ESPERA se acumula y extiende el vencimiento; mientras está en espera el reloj de SLA permanece detenido. La evaluación del vencimiento y el escalamiento ocurre al leer o modificar tickets, no mediante un proceso de fondo. El escalamiento es un indicador observable para el supervisor; no se envía correo ni mensaje externo.

Transiciones: NUEVO → ASIGNADO → EN_PROGRESO; EN_PROGRESO → EN_ESPERA o RESUELTO; EN_ESPERA → EN_PROGRESO; RESUELTO → CERRADO o EN_PROGRESO. La asignación requiere un agente activo. La reapertura está permitida desde RESUELTO, no desde CERRADO.

Endpoints: `GET /`, `GET /health`, `GET /agents`, `GET /tickets`, `POST /tickets`, `GET /tickets/:id`, `PATCH /tickets/:id`, `PATCH /tickets/:id/assignee` y `GET /tickets/:id/historial`. La lista admite `status`, `overdue` y `category`. Los errores usan `{ "error": { "code": "...", "message": "..." } }`.

Las pruebas unitarias verifican el reloj y las transiciones; las pruebas HTTP verifican validación, respuestas, historial y filtros. El panel se valida mediante recorridos en navegador con datos ficticios.
