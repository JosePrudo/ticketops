import { randomUUID } from 'node:crypto';

export const categories = ['INFRAESTRUCTURA', 'ACCESOS', 'APLICACIONES', 'INSTALACIONES'] as const;
export const priorities = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'] as const;
export const statuses = ['NUEVO', 'ASIGNADO', 'EN_PROGRESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO'] as const;
export type Category = typeof categories[number];
export type Priority = typeof priorities[number];
export type Status = typeof statuses[number];
export type Clock = () => Date;

const slaHours: Record<Priority, number> = { CRITICA: 4, ALTA: 8, MEDIA: 24, BAJA: 72 };
const transitions: Record<Status, Status[]> = {
  NUEVO: ['ASIGNADO'],
  ASIGNADO: ['EN_PROGRESO'],
  EN_PROGRESO: ['EN_ESPERA', 'RESUELTO'],
  EN_ESPERA: ['EN_PROGRESO'],
  RESUELTO: ['CERRADO', 'EN_PROGRESO'],
  CERRADO: [],
};
export const agents = [
  { id: 'agente-1', name: 'Agente de operaciones', active: true },
  { id: 'agente-2', name: 'Agente de soporte', active: true },
  { id: 'agente-inactivo', name: 'Agente inactivo', active: false },
];

export interface TicketInput {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  requester: string;
}

interface HistoryEntry {
  at: string;
  author: string;
  type: 'CREACION' | 'ESTADO' | 'ASIGNACION';
  from?: string;
  to: string;
}

interface Ticket extends TicketInput {
  id: string;
  status: Status;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  resolutionNote: string | null;
  pausedMs: number;
  waitingSince: string | null;
  history: HistoryEntry[];
}

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export class TicketService {
  private tickets = new Map<string, Ticket>();

  constructor(private clock: Clock = () => new Date()) {}

  private find(id: string): Ticket {
    const ticket = this.tickets.get(id);
    if (!ticket) throw new AppError(404, 'NOT_FOUND', 'No se encontró el ticket.');
    return ticket;
  }

  private validateAgent(id: string): void {
    if (!agents.some((agent) => agent.id === id && agent.active)) {
      throw new AppError(400, 'INVALID_AGENT', 'Selecciona un agente activo.');
    }
  }

  private present(ticket: Ticket) {
    const now = this.clock().getTime();
    const waiting = ticket.waitingSince ? Math.max(0, now - Date.parse(ticket.waitingSince)) : 0;
    const due = Date.parse(ticket.createdAt) + slaHours[ticket.priority] * 3_600_000 + ticket.pausedMs + waiting;
    const open = ticket.status !== 'RESUELTO' && ticket.status !== 'CERRADO';
    const overdue = open && (ticket.waitingSince ? Date.parse(ticket.waitingSince) : now) >= due - waiting;
    const criticalUnassigned = open && ticket.priority === 'CRITICA' && !ticket.assigneeId
      && now >= Date.parse(ticket.createdAt) + 15 * 60_000;
    return {
      ...ticket,
      history: ticket.history.map((entry) => ({ ...entry })),
      dueAt: new Date(due).toISOString(),
      overdue,
      escalated: overdue || criticalUnassigned,
      escalationReason: overdue ? 'SLA_VENCIDO' : criticalUnassigned ? 'CRITICA_SIN_ASIGNAR' : null,
      allowedTransitions: [...transitions[ticket.status]],
    };
  }

  create(input: TicketInput, author = 'Sistema') {
    const now = this.clock().toISOString();
    const ticket: Ticket = {
      ...input, id: randomUUID(), status: 'NUEVO', assigneeId: null, createdAt: now, updatedAt: now,
      resolutionNote: null, pausedMs: 0, waitingSince: null,
      history: [{ at: now, author, type: 'CREACION', to: 'NUEVO' }],
    };
    this.tickets.set(ticket.id, ticket);
    return this.present(ticket);
  }

  get(id: string) {
    return this.present(this.find(id));
  }

  list(filters: { status?: Status; overdue?: boolean; category?: Category } = {}) {
    return [...this.tickets.values()].map((ticket) => this.present(ticket)).filter((ticket) =>
      (filters.status === undefined || ticket.status === filters.status)
      && (filters.overdue === undefined || ticket.overdue === filters.overdue)
      && (filters.category === undefined || ticket.category === filters.category));
  }

  changeStatus(id: string, status: Status, author: string, assigneeId?: string, resolutionNote?: string) {
    const ticket = this.find(id);
    if (!transitions[ticket.status].includes(status)) {
      throw new AppError(409, 'INVALID_TRANSITION', 'La transición de estado no está permitida.');
    }
    if (status === 'ASIGNADO') {
      if (!assigneeId) throw new AppError(400, 'INVALID_AGENT', 'Selecciona un agente activo.');
      this.validateAgent(assigneeId);
    }
    const resolution = resolutionNote?.trim();
    if (status === 'RESUELTO' && !resolution) {
      throw new AppError(400, 'RESOLUTION_REQUIRED', 'La nota de resolución es obligatoria.');
    }
    const now = this.clock().toISOString();
    const previous = ticket.status;
    if (ticket.waitingSince) {
      ticket.pausedMs += Math.max(0, Date.parse(now) - Date.parse(ticket.waitingSince));
      ticket.waitingSince = null;
    }
    if (status === 'EN_ESPERA') ticket.waitingSince = now;
    if (status === 'ASIGNADO') ticket.assigneeId = assigneeId ?? null;
    if (status === 'RESUELTO' && resolution) ticket.resolutionNote = resolution;
    if (status === 'EN_PROGRESO' && previous === 'RESUELTO') ticket.resolutionNote = null;
    ticket.status = status;
    ticket.updatedAt = now;
    ticket.history.push({ at: now, author, type: 'ESTADO', from: previous, to: status });
    return this.present(ticket);
  }

  reassign(id: string, assigneeId: string, author: string) {
    const ticket = this.find(id);
    if (ticket.status === 'NUEVO' || ticket.status === 'RESUELTO' || ticket.status === 'CERRADO') {
      throw new AppError(409, 'INVALID_TRANSITION', 'Solo se pueden reasignar tickets abiertos ya asignados.');
    }
    this.validateAgent(assigneeId);
    const now = this.clock().toISOString();
    const previous = ticket.assigneeId;
    ticket.assigneeId = assigneeId;
    ticket.updatedAt = now;
    ticket.history.push({ at: now, author, type: 'ASIGNACION', from: previous ?? undefined, to: assigneeId });
    return this.present(ticket);
  }

  seedDemo(): void {
    if (this.tickets.size) throw new Error('Los datos de demostración requieren un almacén vacío.');
    const now = this.clock().getTime();
    const examples: Array<[string, Category, Priority, Status, number]> = [
      ['VPN sin acceso', 'ACCESOS', 'CRITICA', 'NUEVO', 5],
      ['Servidor de archivos', 'INFRAESTRUCTURA', 'ALTA', 'EN_PROGRESO', 10],
      ['Actualización de aplicación', 'APLICACIONES', 'MEDIA', 'RESUELTO', 4],
      ['Revisión de climatización', 'INSTALACIONES', 'BAJA', 'ASIGNADO', 2],
      ['Acceso a repositorio', 'ACCESOS', 'MEDIA', 'NUEVO', 1],
      ['Reinicio programado', 'INFRAESTRUCTURA', 'BAJA', 'EN_ESPERA', 1],
    ];
    for (const [title, category, priority, status, age] of examples) {
      const created = new Date(now - age * 3_600_000).toISOString();
      const ticket: Ticket = {
        id: randomUUID(), title, description: 'Incidente ficticio de demostración.', category, priority,
        requester: 'Solicitante de demostración', assigneeId: status === 'NUEVO' ? null : 'agente-1',
        status, createdAt: created, updatedAt: created, pausedMs: 0,
        waitingSince: status === 'EN_ESPERA' ? created : null,
        resolutionNote: status === 'RESUELTO' ? 'Incidente solucionado.' : null,
        history: [{ at: created, author: 'Sistema', type: 'CREACION', to: 'NUEVO' }],
      };
      const path: Status[] = status === 'ASIGNADO' ? ['ASIGNADO']
        : status === 'EN_PROGRESO' ? ['ASIGNADO', 'EN_PROGRESO']
          : status === 'EN_ESPERA' ? ['ASIGNADO', 'EN_PROGRESO', 'EN_ESPERA']
            : status === 'RESUELTO' ? ['ASIGNADO', 'EN_PROGRESO', 'RESUELTO'] : [];
      let previous: Status = 'NUEVO';
      for (const next of path) {
        ticket.history.push({ at: created, author: 'Sistema', type: 'ESTADO', from: previous, to: next });
        previous = next;
      }
      this.tickets.set(ticket.id, ticket);
    }
  }
}
