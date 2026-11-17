import express, { type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { agents, AppError, categories, priorities, statuses, TicketService } from './tickets.js';

const text = z.string().trim().min(1).max(200);
const ticketInput = z.object({
  title: text,
  description: z.string().trim().max(4000).default(''),
  category: z.enum(categories).default('APLICACIONES'),
  priority: z.enum(priorities).default('MEDIA'),
  requester: text.default('No especificado'),
  author: text.default('Sistema'),
}).strict();
const statusInput = z.object({
  status: z.enum(statuses),
  author: text.default('Sistema'),
  assigneeId: text.optional(),
  resolutionNote: z.string().trim().min(1).max(4000).optional(),
}).strict();
const assigneeInput = z.object({ assigneeId: text, author: text.default('Sistema') }).strict();
const filtersInput = z.object({
  status: z.enum(statuses).optional(),
  category: z.enum(categories).optional(),
  overdue: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
}).strict();

export function createApp(service = new TicketService()) {
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  app.use('/panel', express.static('public/panel'));

  app.get('/', (_req, res) => res.json({
    name: 'TicketOps', status: 'ok',
    endpoints: ['GET /health', 'GET /agents', 'GET /tickets', 'POST /tickets',
      'GET /tickets/:id', 'PATCH /tickets/:id', 'PATCH /tickets/:id/assignee',
      'GET /tickets/:id/historial', 'GET /panel/'],
  }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/agents', (_req, res) => res.json(agents.filter((agent) => agent.active)));
  app.get('/tickets', (req, res) => res.json(service.list(filtersInput.parse(req.query))));
  app.post('/tickets', (req, res) => {
    const { author, ...input } = ticketInput.parse(req.body);
    res.status(201).json(service.create(input, author));
  });
  app.get('/tickets/:id/historial', (req, res) => res.json(service.get(req.params.id).history));
  app.get('/tickets/:id', (req, res) => res.json(service.get(req.params.id)));
  app.patch('/tickets/:id/assignee', (req, res) => {
    const input = assigneeInput.parse(req.body);
    res.json(service.reassign(req.params.id, input.assigneeId, input.author));
  });
  app.patch('/tickets/:id', (req, res) => {
    const input = statusInput.parse(req.body);
    res.json(service.changeStatus(req.params.id, input.status, input.author, input.assigneeId, input.resolutionNote));
  });
  app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'No se encontró la ruta.')));

  const errors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Revisa los datos enviados.' } });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El JSON enviado no es válido.' } });
      return;
    }
    if (error instanceof Error && 'status' in error && error.status === 413) {
      res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'La solicitud es demasiado grande.' } });
      return;
    }
    console.error('Error interno de TicketOps:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'No se pudo completar la solicitud.' } });
  };
  app.use(errors);
  return app;
}
