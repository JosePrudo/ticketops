# Riesgos de TicketOps

Revisión local del código; no se ejecutó como workflow de Kiro.

1. **Alto — pérdida de datos y de historial entre procesos.** El almacén es un `Map` en memoria ([src/tickets.ts:61](../../src/tickets.ts#L61)) y el historial se modifica dentro del proceso ([src/tickets.ts:143](../../src/tickets.ts#L143)). Reiniciar el servidor pierde los tickets; varias instancias no comparten estado. Una migración a DynamoDB requiere escritura condicional y control de concurrencia.
2. **Alto — datos accesibles sin identidad.** Las rutas HTTP no aplican autenticación ni autorización ([src/app.ts:40](../../src/app.ts#L40)). Es aceptable solo para la demostración local con datos ficticios.
3. **Medio — escalamiento no proactivo.** El vencimiento se calcula al presentar el ticket ([src/tickets.ts:77](../../src/tickets.ts#L77)); no existe un proceso que avise al supervisor mientras nadie consulta. Definir un trabajo programado y un canal de notificación antes de producción.
4. **Medio — registro de errores.** Los errores internos completos se escriben en la consola ([src/app.ts:74](../../src/app.ts#L74)), aunque la respuesta HTTP es genérica. Si futuros errores incluyen datos sensibles, aplicar redacción y control de acceso a logs.
5. **Medio — cambios simultáneos.** Las transiciones inválidas se rechazan ([src/tickets.ts:120](../../src/tickets.ts#L120)), pero no existe versión para detectar reasignaciones concurrentes. El requisito EARS del núcleo exige control de concurrencia al migrar a persistencia compartida.
