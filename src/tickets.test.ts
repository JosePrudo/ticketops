import { describe, expect, it } from 'vitest';
import { TicketService, type TicketInput } from './tickets.js';

const input: TicketInput = {
  title: 'Incidente ficticio', description: '', category: 'ACCESOS', priority: 'CRITICA', requester: 'Solicitante',
};

describe('SLA y transiciones', () => {
  it('pausa el SLA durante la espera y reanuda el vencimiento', () => {
    let time = Date.parse('2026-01-01T00:00:00Z');
    const service = new TicketService(() => new Date(time));
    const ticket = service.create(input);
    service.changeStatus(ticket.id, 'ASIGNADO', 'Agente', 'agente-1');
    service.changeStatus(ticket.id, 'EN_PROGRESO', 'Agente');
    time += 60 * 60_000;
    service.changeStatus(ticket.id, 'EN_ESPERA', 'Agente');
    time += 10 * 60 * 60_000;
    expect(service.get(ticket.id).overdue).toBe(false);
    service.changeStatus(ticket.id, 'EN_PROGRESO', 'Agente');
    expect(service.get(ticket.id).dueAt).toBe('2026-01-01T14:00:00.000Z');
    time += 3 * 60 * 60_000;
    expect(service.get(ticket.id)).toMatchObject({ overdue: true, escalated: true, escalationReason: 'SLA_VENCIDO' });
  });

  it('escala un ticket crítico sin asignar a los 15 minutos', () => {
    let time = Date.parse('2026-01-01T00:00:00Z');
    const service = new TicketService(() => new Date(time));
    const ticket = service.create(input);
    time += 14 * 60_000;
    expect(service.get(ticket.id).escalated).toBe(false);
    time += 60_000;
    expect(service.get(ticket.id)).toMatchObject({ escalated: true, escalationReason: 'CRITICA_SIN_ASIGNAR' });
  });

  it('excluye tickets resueltos y cerrados, pero conserva los vencidos abiertos', () => {
    let time = Date.parse('2026-01-01T00:00:00Z');
    const service = new TicketService(() => new Date(time));
    const resolved = service.create(input);
    const closed = service.create(input);
    const open = service.create(input);
    for (const ticket of [resolved, closed]) {
      service.changeStatus(ticket.id, 'ASIGNADO', 'Agente', 'agente-1');
      service.changeStatus(ticket.id, 'EN_PROGRESO', 'Agente');
      service.changeStatus(ticket.id, 'RESUELTO', 'Agente', undefined, 'Solucionado');
    }
    service.changeStatus(closed.id, 'CERRADO', 'Agente');
    time += 5 * 60 * 60_000;
    expect(service.list({ overdue: true }).map((ticket) => ticket.id)).toEqual([open.id]);
    expect(service.get(resolved.id).overdue).toBe(false);
    expect(service.get(closed.id).overdue).toBe(false);
  });
});
