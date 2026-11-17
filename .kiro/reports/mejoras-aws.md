# Propuestas para AWS

La URL de la guía indicada en el laboratorio devolvió 404. Se consultó la [documentación vigente de AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/) directamente, no mediante la conexión MCP de Kiro.

1. **Seguridad:** autenticar y autorizar las rutas, aplicar mínimo privilegio a las funciones y evitar datos sensibles en los registros.
2. **Fiabilidad:** sustituir el almacén en memoria por DynamoDB, con escritura condicional, recuperación y pruebas de concurrencia del historial.
3. **Excelencia operacional:** instrumentar métricas, alarmas y un proceso programado para detectar SLA vencidos y notificar al supervisor sin depender de una consulta.

Son propuestas para un diseño futuro; no se ha desplegado infraestructura.
