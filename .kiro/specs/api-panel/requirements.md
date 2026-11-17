# Requisitos: API para el panel

- WHEN se listan tickets THE SYSTEM SHALL incluir `dueAt`, `overdue` y `allowedTransitions`.
- WHEN se proporcionan filtros válidos de estado, categoría o vencimiento THE SYSTEM SHALL devolver solo los tickets correspondientes.
- WHEN `DEMO_DATA=1` THE SYSTEM SHALL iniciar con seis tickets ficticios, incluidos dos abiertos vencidos y uno resuelto.
- WHEN se consulta un ticket THE SYSTEM SHALL incluir su historial o responder 404.
- WHEN el estado cambia THE SYSTEM SHALL validar la transición y guardar su historial.
