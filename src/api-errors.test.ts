import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('contrato de errores', () => {
  it('devuelve errores estándar y exige nota antes de resolver', async () => {
    const app = createApp();
    const created = await request(app).post('/tickets').send({ title: 'Servicio' }).expect(201);
    const id = created.body.id;
    await request(app).patch(`/tickets/${id}`).send({ status: 'ASIGNADO', assigneeId: 'agente-1' }).expect(200);
    await request(app).patch(`/tickets/${id}`).send({ status: 'EN_PROGRESO' }).expect(200);
    const missing = await request(app).patch(`/tickets/${id}`).send({ status: 'RESUELTO' }).expect(400);
    expect(missing.body.error).toHaveProperty('code', 'RESOLUTION_REQUIRED');
    await request(app).get('/tickets/desconocido').expect(404);
    const malformed = await request(app).post('/tickets').set('Content-Type', 'application/json').send('{').expect(400);
    expect(malformed.body.error.code).toBe('INVALID_JSON');
  });
});
