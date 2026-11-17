# Auditoría del panel

- **Hallazgo corregido:** el resumen de indicadores tenía `aria-label` sobre un `div` sin rol; ahora usa `role="group"` ([index.html](../../public/panel/index.html)).
- **Automatización:** axe-core 4.14.1 con reglas WCAG 2 A/AA y 2.1 A/AA no detectó violaciones ni comprobaciones inconclusas en el panel o el diálogo abierto.
- **Comprobaciones manuales:** el foco inicial llega al título; Escape cierra el diálogo; a 375 px no se observó desplazamiento horizontal; el error de conexión se muestra.
- **Limitaciones:** no se evaluó con lectores de pantalla reales ni se recorrieron exhaustivamente todos los caminos con teclado. La auditoría automática no certifica conformidad WCAG.
