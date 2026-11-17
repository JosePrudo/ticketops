# API de TicketOps

La API guarda datos en memoria y los pierde al reiniciar. Los escalamientos se calculan al consultar o modificar tickets; no hay notificaciones externas ni tareas en segundo plano.

Todos los errores tienen la forma `{"error":{"code":"...","message":"..."}}`. La validación devuelve 400, los recursos inexistentes 404 y las transiciones incompatibles 409.

| Método y ruta | Descripción | Respuestas |
|---|---|---|
| `GET /` | Servicio y lista de endpoints | 200 |
| `GET /health` | Estado `{"status":"ok"}` | 200 |
| `GET /agents` | Agentes activos ficticios | 200 |
| `GET /tickets` | Lista con `dueAt`, `overdue`, `escalated` y `allowedTransitions`; filtros `status`, `category` y `overdue=true/false` | 200, 400 |
| `POST /tickets` | Crea un ticket; `title` es obligatorio; `description`, `category`, `priority`, `requester` y `author` son opcionales | 201, 400 |
| `GET /tickets/:id` | Detalle e historial | 200, 404 |
| `PATCH /tickets/:id` | Cambia `status`; acepta `author`, `assigneeId` y `resolutionNote` | 200, 400, 404, 409 |
| `PATCH /tickets/:id/assignee` | Reasigna a `assigneeId` activo; acepta `author` | 200, 400, 404, 409 |
| `GET /tickets/:id/historial` | Historial de creación, estado y asignación | 200, 404 |
| `GET /panel/` | Panel web | 200 |

El título admite entre 1 y 200 caracteres; descripción y nota admiten hasta 4000. Una asignación inicial exige `assigneeId` activo y resolver exige `resolutionNote`. Los valores de estado, categoría y prioridad se describen en las especificaciones del núcleo.
