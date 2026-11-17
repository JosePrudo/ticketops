const form = document.querySelector('#create-form');
const title = document.querySelector('#title');
const message = document.querySelector('#message');
const rows = document.querySelector('#tickets');
const filter = document.querySelector('#filter');
const dialog = document.querySelector('#resolution-dialog');
const resolutionForm = document.querySelector('#resolution-form');
const resolutionNote = document.querySelector('#resolution-note');
let resolvingId = null;
let lastAction = null;

const labels = {
  NUEVO: 'Nuevo', ASIGNADO: 'Asignado', EN_PROGRESO: 'En progreso', EN_ESPERA: 'En espera',
  RESUELTO: 'Resuelto', CERRADO: 'Cerrado', CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media',
  BAJA: 'Baja', INFRAESTRUCTURA: 'Infraestructura', ACCESOS: 'Accesos',
  APLICACIONES: 'Aplicaciones', INSTALACIONES: 'Instalaciones',
};
const actions = { ASIGNADO: 'Asignar', EN_ESPERA: 'Poner en espera', RESUELTO: 'Resolver', CERRADO: 'Cerrar' };

async function api(path, options) {
  let response;
  try { response = await fetch(path, options); }
  catch { throw new Error('No se pudo conectar con la API. Comprueba la conexión e inténtalo de nuevo.'); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'No se pudo completar la operación.');
  return data;
}

function cell(row, label, value) {
  const td = document.createElement('td');
  td.dataset.label = label;
  td.textContent = value;
  row.append(td);
  return td;
}

function deadline(ticket) {
  if (ticket.status === 'RESUELTO' || ticket.status === 'CERRADO') return 'Completado';
  const difference = Date.parse(ticket.dueAt) - Date.now();
  const minutes = Math.max(1, Math.ceil(Math.abs(difference) / 60000));
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
  return ticket.overdue ? `hace ${duration}` : `en ${duration}`;
}

function render(tickets) {
  rows.replaceChildren();
  for (const ticket of tickets) {
    const row = document.createElement('tr');
    cell(row, 'ID', ticket.id.slice(0, 8));
    cell(row, 'Título', ticket.title);
    cell(row, 'Categoría', labels[ticket.category]);
    cell(row, 'Prioridad', labels[ticket.priority]);
    cell(row, 'Estado', labels[ticket.status]);
    const due = cell(row, 'Vencimiento', deadline(ticket));
    if (ticket.overdue) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'VENCIDO';
      due.append(document.createElement('br'), badge);
    }
    const actionCell = cell(row, 'Acciones', '');
    const container = document.createElement('div');
    actionCell.append(container);
    for (const next of ticket.allowedTransitions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = next === 'EN_PROGRESO'
        ? ticket.status === 'RESUELTO' ? 'Reabrir' : ticket.status === 'EN_ESPERA' ? 'Reanudar' : 'Iniciar'
        : actions[next];
      button.setAttribute('aria-label', `${button.textContent}: ${ticket.title}`);
      button.addEventListener('click', () => changeStatus(ticket, next, button));
      container.append(button);
    }
    rows.append(row);
  }
}

async function refresh() {
  message.textContent = 'Cargando tickets…';
  try {
    const all = await api('/tickets');
    document.querySelector('#open-count').textContent = all.filter((ticket) => !['RESUELTO', 'CERRADO'].includes(ticket.status)).length;
    document.querySelector('#overdue-count').textContent = all.filter((ticket) => ticket.overdue).length;
    document.querySelector('#resolved-count').textContent = all.filter((ticket) => ticket.status === 'RESUELTO').length;
    const query = filter.value === 'all' ? '' : filter.value === 'overdue' ? '?overdue=true' : `?status=${encodeURIComponent(filter.value)}`;
    const visible = query ? await api(`/tickets${query}`) : all;
    render(visible);
    message.textContent = visible.length ? `${visible.length} tickets encontrados.` : 'No hay tickets para mostrar.';
  } catch (error) {
    rows.replaceChildren();
    message.textContent = error.message;
  }
}

async function patch(id, body) {
  await api(`/tickets/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  await refresh();
}

async function changeStatus(ticket, next, button) {
  if (next === 'RESUELTO') {
    resolvingId = ticket.id;
    lastAction = button;
    resolutionNote.value = '';
    document.querySelector('#resolution-error').textContent = '';
    dialog.showModal();
    resolutionNote.focus();
    return;
  }
  button.disabled = true;
  try {
    const body = { status: next };
    if (next === 'ASIGNADO') {
      const agents = await api('/agents');
      if (!agents.length) throw new Error('No hay agentes activos para asignar el ticket.');
      body.assigneeId = agents[0].id;
    }
    await patch(ticket.id, body);
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const titleError = document.querySelector('#title-error');
  if (!title.value.trim()) {
    titleError.textContent = 'Escribe un título para el ticket.';
    title.focus();
    return;
  }
  titleError.textContent = '';
  const values = Object.fromEntries(new FormData(form));
  if (!values.requester.trim()) delete values.requester;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await api('/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    form.reset();
    await refresh();
  } catch (error) { message.textContent = error.message; }
  finally { submit.disabled = false; }
});
resolutionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!resolutionNote.value.trim()) {
    document.querySelector('#resolution-error').textContent = 'La nota de resolución es obligatoria.';
    resolutionNote.focus();
    return;
  }
  try {
    await patch(resolvingId, { status: 'RESUELTO', resolutionNote: resolutionNote.value });
    dialog.close();
  } catch (error) { document.querySelector('#resolution-error').textContent = error.message; }
});
document.querySelector('#cancel-resolution').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { if (lastAction?.isConnected) lastAction.focus(); else filter.focus(); });
document.querySelector('#refresh').addEventListener('click', refresh);
filter.addEventListener('change', refresh);
refresh();
