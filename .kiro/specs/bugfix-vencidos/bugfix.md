# Corrección: tickets resueltos en vencidos

Actual: una implementación defectuosa puede incluir tickets RESUELTO o CERRADO al comparar solo la fecha límite.
Esperado: los tickets resueltos o cerrados nunca se muestran vencidos, incluso después de su límite.
Sin cambios: los tickets abiertos que agotan su SLA siguen apareciendo y escalándose.
Regresión: probar ambos estados finalizados y un ticket abierto con reloj inyectado.
