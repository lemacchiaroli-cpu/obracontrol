// ── Persistencia ──────────────────────────────────────────────────────────────
export const lsGet = (k, d) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d }
}
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ── Utilidades ────────────────────────────────────────────────────────────────
export const uid      = () => Math.random().toString(36).slice(2, 9)
export const now      = () => new Date().toISOString()
export const todayISO = (offset = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
export const isOverdue = (dateStr) => dateStr && dateStr < todayISO()

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
export const fmtTS = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
export const fmtDateShort = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

// ── Constantes de dominio ─────────────────────────────────────────────────────
export const ESTADOS = {
  pendiente:            { label: 'Pendiente',           color: '#B7950B', bg: '#FEF9E7' },
  en_progreso:          { label: 'En progreso',         color: '#1A5276', bg: '#EBF2F8' },
  esperando_respuesta:  { label: 'Esperando respuesta', color: '#C8610A', bg: '#FDF0E6' },
  finalizada:           { label: 'Finalizada',          color: '#1E7E4E', bg: '#E8F5EE' },
  no_puedo:             { label: 'No puedo ejecutarla', color: '#6D28D9', bg: '#EDE9FE' },
  vencida:              { label: 'Vencida',             color: '#C0392B', bg: '#FDEDEB' },
  cancelada:            { label: 'Cancelada',           color: '#9C9690', bg: '#F5F2EC' },
}

export const PRIORIDADES = {
  normal:  { label: 'Normal',  color: '#9C9690', bg: '#F5F2EC' },
  alta:    { label: 'Alta',    color: '#C8610A', bg: '#FDF0E6' },
  urgente: { label: 'Urgente', color: '#C0392B', bg: '#FDEDEB' },
}

// Quién puede transicionar a qué estado
export const TRANSICIONES = {
  pendiente:           { asignado: ['en_progreso', 'no_puedo'],                       creador: ['cancelada'] },
  en_progreso:         { asignado: ['esperando_respuesta', 'finalizada', 'no_puedo'], creador: ['cancelada'] },
  esperando_respuesta: { asignado: ['en_progreso', 'finalizada'],                     creador: ['cancelada'] },
  finalizada:          { asignado: [],                                                creador: [] },
  no_puedo:            { asignado: [],                                                creador: ['pendiente', 'cancelada'] },
  vencida:             { asignado: ['en_progreso', 'finalizada'],                     creador: ['cancelada'] },
  cancelada:           { asignado: [],                                                creador: [] },
}

export const HIST_TIPOS = {
  avance:   { color: '#C8610A', bg: '#FDF0E6', ic: '📊' },
  tarea:    { color: '#1A5276', bg: '#EBF2F8', ic: '✅' },
  material: { color: '#B7950B', bg: '#FEF9E7', ic: '📦' },
  config:   { color: '#6D28D9', bg: '#EDE9FE', ic: '⚙️' },
  plano:    { color: '#0E7490', bg: '#E0F2FE', ic: '📐' },
  reporte:  { color: '#C0392B', bg: '#FDEDEB', ic: '📄' },
}

// ── Seeds de datos ────────────────────────────────────────────────────────────
export const SEED_USUARIOS = [
  { id: 'u1', nombre: 'Ing. Fuentes',  rol: 'Director de obra', ini: 'IF', color: '#1A5276' },
  { id: 'u2', nombre: 'Carlos Moreno', rol: 'Maestro de obra',  ini: 'CM', color: '#C8610A' },
  { id: 'u3', nombre: 'Pedro Ramírez', rol: 'Oficial',          ini: 'PR', color: '#1E7E4E' },
  { id: 'u4', nombre: 'Luis Torres',   rol: 'Electricista',     ini: 'LT', color: '#6D28D9' },
  { id: 'u5', nombre: 'Andrés Vargas', rol: 'Plomero',          ini: 'AV', color: '#B7950B' },
]

export const SEED_OBRAS = [
  {
    id: 'o1',
    nombre:    'Torre Residencial Ópalo',
    ubicacion: 'City Bell, Buenos Aires',
    inicio:    '2025-01-15',
    fin:       '2026-06-30',
    niveles:   ['Subsuelo', 'Planta baja', 'Nivel 1', 'Nivel 2', 'Cubierta'],
    frentes: [
      { id: 'est', label: 'Estructura',    ic: '🏛' },
      { id: 'mam', label: 'Mampostería',   ic: '🧱' },
      { id: 'ins', label: 'Instalaciones', ic: '⚡' },
      { id: 'aca', label: 'Acabados',      ic: '🪟' },
    ],
    catTareas: [
      { id: 'ct1', label: 'Estructura',     color: '#1A5276' },
      { id: 'ct2', label: 'Mampostería',    color: '#C8610A' },
      { id: 'ct3', label: 'Instalaciones',  color: '#6D28D9' },
      { id: 'ct4', label: 'Acabados',       color: '#1E7E4E' },
      { id: 'ct5', label: 'Seguridad',      color: '#C0392B' },
      { id: 'ct6', label: 'Administrativa', color: '#5C5750' },
    ],
  },
  {
    id: 'o2',
    nombre:    'Edificio Foresta',
    ubicacion: 'La Plata, Buenos Aires',
    inicio:    '2025-03-01',
    fin:       '2026-12-31',
    niveles:   ['Planta baja', 'Piso 1', 'Piso 2', 'Terraza'],
    frentes: [
      { id: 'est', label: 'Estructura',    ic: '🏛' },
      { id: 'ins', label: 'Instalaciones', ic: '⚡' },
      { id: 'aca', label: 'Acabados',      ic: '🪟' },
    ],
    catTareas: [
      { id: 'ct1', label: 'Estructura',     color: '#1A5276' },
      { id: 'ct2', label: 'Instalaciones',  color: '#6D28D9' },
      { id: 'ct3', label: 'Administrativa', color: '#5C5750' },
    ],
  },
]

export const SEED_ACTIVIDADES = [
  { id: 'a1',  obraId: 'o1', niv: 'Subsuelo',    fr: 'est', nom: 'Cimentación y losa',             av: 100, meta: todayISO(-20), crit: false },
  { id: 'a2',  obraId: 'o1', niv: 'Subsuelo',    fr: 'ins', nom: 'Cisterna hidrosanitaria',         av: 85,  meta: todayISO(-5),  crit: true  },
  { id: 'a3',  obraId: 'o1', niv: 'Planta baja', fr: 'est', nom: 'Columnas y losa PB',              av: 72,  meta: todayISO(5),   crit: true  },
  { id: 'a4',  obraId: 'o1', niv: 'Planta baja', fr: 'mam', nom: 'Muros PB frente',                 av: 55,  meta: todayISO(8),   crit: false },
  { id: 'a5',  obraId: 'o1', niv: 'Planta baja', fr: 'ins', nom: 'Instalación eléctrica PB',        av: 40,  meta: todayISO(10),  crit: false },
  { id: 'a6',  obraId: 'o1', niv: 'Nivel 1',     fr: 'est', nom: 'Columnas N1',                     av: 20,  meta: todayISO(18),  crit: true  },
  { id: 'a7',  obraId: 'o1', niv: 'Nivel 1',     fr: 'mam', nom: 'Muros N1',                        av: 0,   meta: todayISO(25),  crit: false },
  { id: 'a8',  obraId: 'o1', niv: 'Cubierta',    fr: 'aca', nom: 'Impermeabilización cubierta',     av: 0,   meta: todayISO(60),  crit: false },
  { id: 'a9',  obraId: 'o2', niv: 'Planta baja', fr: 'est', nom: 'Excavación fundación bloque B',   av: 45,  meta: todayISO(10),  crit: true  },
  { id: 'a10', obraId: 'o2', niv: 'Piso 1',      fr: 'ins', nom: 'Proyecto ejecutivo instalaciones', av: 10,  meta: todayISO(20),  crit: false },
]

export const SEED_MATERIALES = [
  { id: 'm1', obraId: 'o1', nom: 'Cemento Portland', u: 'sacos',  s: 310, min: 120, ped: false, cat: 'Estructura'    },
  { id: 'm2', obraId: 'o1', nom: 'Varilla 1/2"',     u: 'qq',     s: 44,  min: 60,  ped: true,  cat: 'Estructura'    },
  { id: 'm3', obraId: 'o1', nom: 'Block 15x20x40',   u: 'unid.',  s: 2400,min: 800, ped: false, cat: 'Mampostería'   },
  { id: 'm4', obraId: 'o1', nom: 'Arena cernida',    u: 'm³',     s: 22,  min: 12,  ped: false, cat: 'Estructura'    },
  { id: 'm5', obraId: 'o1', nom: 'Cable THHN #12',   u: 'metros', s: 120, min: 300, ped: false, cat: 'Instalaciones' },
  { id: 'm6', obraId: 'o1', nom: 'Tubo PVC 4"',      u: 'tramos', s: 18,  min: 10,  ped: false, cat: 'Instalaciones' },
  { id: 'm7', obraId: 'o2', nom: 'Cemento Portland', u: 'sacos',  s: 180, min: 100, ped: false, cat: 'Estructura'    },
  { id: 'm8', obraId: 'o2', nom: 'Hierro redondo',   u: 'kg',     s: 950, min: 500, ped: false, cat: 'Estructura'    },
]

const mkCL = (estado, usuarioId, comentario = '') => ({
  id: uid(),
  estado,
  usuarioId,
  ts: new Date(Date.now() - Math.random() * 4 * 24 * 3600 * 1000).toISOString(),
  comentario,
})

const mkTarea = (id, obraId, titulo, catId, asignadoId, creadoPorId, fechaLimite, estado, prioridad, extraCL = [], adjuntos = []) => ({
  id, obraId, titulo, desc: '', catId, asignadoId, creadoPorId,
  creadoEn: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  fechaLimite, prioridad: prioridad || 'normal',
  estadoActual: estado,
  adjuntos,
  changelog: [
    mkCL('pendiente', creadoPorId, 'Tarea creada y asignada'),
    ...extraCL,
    ...(estado !== 'pendiente' ? [mkCL(estado, asignadoId, '')] : []),
  ],
})

export const SEED_TAREAS_OBRA = [
  mkTarea('to1', 'o1', 'Verificar armadura eje 3',        'ct1', 'u2', 'u1', todayISO(-2),  'vencida',             'urgente', [], []),
  mkTarea('to2', 'o1', 'Levantado muros PB frente',       'ct2', 'u3', 'u1', todayISO(5),   'en_progreso',         'normal'),
  mkTarea('to3', 'o1', 'Instalación eléctrica PB',        'ct3', 'u4', 'u1', todayISO(8),   'en_progreso',         'normal', [], [
    { id: 'adj1', tipo: 'pdf', nombre: 'plano_electrico_PB.pdf', ts: new Date(Date.now() - 3 * 864e5).toISOString() }
  ]),
  mkTarea('to4', 'o1', 'Certificado AFIP contratista',    'ct6', 'u1', 'u1', todayISO(-3),  'vencida',             'urgente'),
  mkTarea('to5', 'o1', 'Pedir material al corralón',      'ct6', 'u2', 'u1', todayISO(4),   'esperando_respuesta', 'alta', [
    mkCL('en_progreso',        'u2', 'Llamé al corralón, esperando cotización'),
    mkCL('esperando_respuesta','u2', 'Enviaron cotización, esperando aprobación del Ing.'),
  ]),
  mkTarea('to6', 'o1', 'Baranda terraza N2',              'ct4', 'u5', 'u1', todayISO(20),  'pendiente',           'normal'),
  mkTarea('to7', 'o1', 'Señalética de seguridad',         'ct5', 'u2', 'u1', todayISO(10),  'pendiente',           'normal'),
  mkTarea('to8', 'o1', 'Revisión planos aprobados',       'ct6', 'u1', 'u1', todayISO(15),  'pendiente',           'normal'),
  mkTarea('to9', 'o2', 'Hormigón fundación bloque B',     'ct1', 'u3', 'u1', todayISO(6),   'en_progreso',         'alta'),
  mkTarea('to10','o2', 'Proyecto ejecutivo plomería',     'ct2', 'u4', 'u1', todayISO(15),  'pendiente',           'normal'),
]

export const SEED_TAREAS_GENERALES = [
  {
    id: 'tg1', titulo: 'Renovar seguro de obra', desc: 'Seguro vence el 30 de abril. Contactar aseguradora.',
    catId: 'gc1', asignadoId: 'u1', creadoPorId: 'u1',
    creadoEn: new Date(Date.now() - 3 * 864e5).toISOString(),
    fechaLimite: todayISO(15), prioridad: 'alta', estadoActual: 'pendiente',
    adjuntos: [{ id: 'ag1', tipo: 'pdf', nombre: 'poliza_vigente.pdf', ts: new Date(Date.now() - 2 * 864e5).toISOString() }],
    changelog: [mkCL('pendiente', 'u1', 'Tarea creada')],
  },
  {
    id: 'tg2', titulo: 'Reunión mensual con inversores', desc: 'Preparar presentación de avance y proyección financiera.',
    catId: 'gc2', asignadoId: 'u1', creadoPorId: 'u1',
    creadoEn: new Date(Date.now() - 864e5).toISOString(),
    fechaLimite: todayISO(7), prioridad: 'urgente', estadoActual: 'en_progreso',
    adjuntos: [],
    changelog: [
      mkCL('pendiente',   'u1', 'Tarea creada'),
      mkCL('en_progreso', 'u1', 'Armando la presentación en PowerPoint'),
    ],
  },
  {
    id: 'tg3', titulo: 'Actualizar planilla de costos general', desc: '',
    catId: 'gc2', asignadoId: 'u1', creadoPorId: 'u1',
    creadoEn: new Date(Date.now() - 7 * 864e5).toISOString(),
    fechaLimite: todayISO(-2), prioridad: 'normal', estadoActual: 'vencida',
    adjuntos: [],
    changelog: [mkCL('pendiente', 'u1', 'Tarea creada')],
  },
]

export const SEED_CAT_GENERALES = [
  { id: 'gc1', label: 'Legal / Seguros',  color: '#C0392B' },
  { id: 'gc2', label: 'Administrativo',   color: '#1A5276' },
  { id: 'gc3', label: 'Financiero',       color: '#1E7E4E' },
  { id: 'gc4', label: 'Recursos humanos', color: '#6D28D9' },
  { id: 'gc5', label: 'Comercial',        color: '#C8610A' },
]

export const SEED_HISTORIAL = [
  { id: uid(), ts: new Date(Date.now() - 5 * 864e5).toISOString(), tipo: 'config',   usuarioId: 'u1', det: 'App iniciada · Datos de obra cargados',            extra: '' },
  { id: uid(), ts: new Date(Date.now() - 2 * 864e5).toISOString(), tipo: 'avance',   usuarioId: 'u2', det: 'Muros PB frente: 40% → 55%',                       extra: 'Torre Ópalo' },
  { id: uid(), ts: new Date(Date.now() - 864e5).toISOString(),      tipo: 'tarea',    usuarioId: 'u2', det: '"Pedir material" → Esperando respuesta',            extra: 'Torre Ópalo' },
  { id: uid(), ts: new Date(Date.now() - 3600e3).toISOString(),     tipo: 'material', usuarioId: 'u3', det: 'Stock Varilla 1/2": 60 → 44 qq',                   extra: 'Torre Ópalo' },
]
