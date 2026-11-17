import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { TicketService } from './tickets.js';

describe('API de tickets', () => {
  it('crea, asigna, resuelve y consulta el historial', async () => {
    const app = createApp();
    const created = await request(app).post('/tickets').send({ title: 'VPN' }).expect(201);
    const id = created.body.id;
    await request(app).patch(`/tickets/${id}`).send({ status: 'ASIGNADO', assigneeId: 'agente-1', author: 'Ana' }).expect(200);
    await request(app).patch(`/tickets/${id}`).send({ status: 'EN_PROGRESO', author: 'Ana' }).expect(200);
    await request(app).patch(`/tickets/${id}`).send({ status: 'RESUELTO', resolutionNote: 'Restaurado', author: 'Ana' }).expect(200);
    const detail = await request(app).get(`/tickets/${id}`).expect(200);
    expect(detail.body).toMatchObject({ status: 'RESUELTO', resolutionNote: 'Restaurado', overdue: false });
    const history = await request(app).get(`/tickets/${id}/historial`).expect(200);
    expect(history.body).toHaveLength(4);
    expect(history.body[3]).toMatchObject({ author: 'Ana', to: 'RESUELTO' });
  });

  it('rechaza entrada inválida, agente inactivo y transiciones imposibles', async () => {
    const app = createApp();
    const invalid = await request(app).post('/tickets').send({}).expect(400);
    expect(invalid.body.error).toEqual({ code: 'VALIDATION_ERROR', message: 'Revisa los datos enviados.' });
    const created = await request(app).post('/tickets').send({ title: 'Acceso' }).expect(201);
    const id = created.body.id;
    await request(app).patch(`/tickets/${id}`).send({ status: 'ASIGNADO', assigneeId: 'agente-inactivo' }).expect(400);
    await request(app).patch(`/tickets/${id}`).send({ status: 'RESUELTO', resolutionNote: 'Listo' }).expect(409);
    const unchanged = await request(app).get(`/tickets/${id}`).expect(200);
    expect(unchanged.body.status).toBe('NUEVO');
    await request(app).get('/tickets?status=INVALIDO').expect(400);
    await request(app).get('/no-existe').expect(404);
  });

  it('filtra los datos de demostración y registra una reasignación', async () => {
    const service = new TicketService(() => new Date('2026-01-01T00:00:00Z'));
    service.seedDemo();
    const app = createApp(service);
    const all = await request(app).get('/tickets').expect(200);
    const overdue = await request(app).get('/tickets?overdue=true').expect(200);
    expect(all.body).toHaveLength(6);
    expect(overdue.body).toHaveLength(2);
    expect(all.body.filter((ticket: { status: string }) => ticket.status === 'RESUELTO')).toHaveLength(1);
    const resolved = all.body.find((ticket: { status: string }) => ticket.status === 'RESUELTO');
    expect(resolved.history.map((entry: { to: string }) => entry.to))
      .toEqual(['NUEVO', 'ASIGNADO', 'EN_PROGRESO', 'RESUELTO']);
    const assigned = all.body.find((ticket: { status: string }) => ticket.status === 'ASIGNADO');
    await request(app).patch(`/tickets/${assigned.id}/assignee`).send({ assigneeId: 'agente-2', author: 'Supervisora' }).expect(200);
    const detail = await request(app).get(`/tickets/${assigned.id}`).expect(200);
    expect(detail.body.history.at(-1)).toMatchObject({ type: 'ASIGNACION', to: 'agente-2', author: 'Supervisora' });
  });
});
