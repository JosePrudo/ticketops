import { createApp } from './app.js';
import { TicketService } from './tickets.js';

const service = new TicketService();
if (process.env.DEMO_DATA === '1') service.seedDemo();
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto válido.');
createApp(service).listen(port, '127.0.0.1', () => {
  console.log(`TicketOps escuchando en http://localhost:${port}`);
});
