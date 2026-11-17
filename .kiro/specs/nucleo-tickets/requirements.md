# Requisitos: núcleo de tickets

- WHEN se recibe un ticket válido THE SYSTEM SHALL crearlo en estado NUEVO con identificador y fecha de creación.
- WHEN falta el título, está vacío o supera 200 caracteres THE SYSTEM SHALL rechazar la solicitud con 400.
- WHEN se recibe un valor de categoría, prioridad o estado desconocido THE SYSTEM SHALL rechazarlo con 400.
- WHEN un ticket se asigna THE SYSTEM SHALL aceptar únicamente agentes activos.
- WHEN se solicita un cambio de estado permitido THE SYSTEM SHALL registrar el estado, la fecha y el autor en el historial.
- WHEN se solicita resolver un ticket THE SYSTEM SHALL exigir una nota de resolución no vacía.
- WHEN transcurren 4, 8, 24 o 72 horas de SLA para prioridades CRITICA, ALTA, MEDIA o BAJA respectivamente THE SYSTEM SHALL marcar vencido el ticket abierto y escalarlo al supervisor.
- WHILE el ticket está EN_ESPERA THE SYSTEM SHALL pausar el cómputo de SLA.
- WHEN el ticket vuelve a EN_PROGRESO THE SYSTEM SHALL extender su fecha límite por el tiempo acumulado en espera.
- WHEN un supervisor consulta los vencidos THE SYSTEM SHALL permitir filtrarlos por categoría.
- WHEN un ticket se resuelve o cierra THE SYSTEM SHALL excluirlo de la lista de vencidos.
- WHEN un ticket CRITICA permanece sin responsable durante 15 minutos THE SYSTEM SHALL escalarlo al supervisor.
- WHEN se pide una transición no permitida THE SYSTEM SHALL devolver 409 sin modificar el ticket.
- THE SYSTEM SHALL no eliminar tickets; un ticket RESUELTO podrá cerrarse o reabrirse.
- WHEN una ruta no existe THE SYSTEM SHALL devolver 404 con un error estándar.
- THE SYSTEM SHALL ofrecer una API en memoria y un panel accesible en español, sin despliegue ni credenciales de AWS.
- IF la persistencia se migra a un servicio compartido THE SYSTEM SHALL aplicar controles de concurrencia que impidan perder cambios simultáneos en el historial.
