import { C, Bar, Box, KpiCard, SectionLabel, EstadoTag, Avatar, Alert } from '../ui.jsx'
import { isOverdue, fmtDateShort } from '../store.js'

export default function TabDashboard({ obra, actividades, materiales, tareasObra, tareasGral, usuarios, obraActiva, ESTADOS }) {
  const acts  = actividades.filter(a => a.obraId === obraActiva)
  const mats  = materiales.filter(m => m.obraId === obraActiva)
  const tasks = tareasObra.filter(t => t.obraId === obraActiva)

  const avG      = acts.length  ? Math.round(acts.reduce((s, a) => s + a.av, 0) / acts.length) : 0
  const criticas = acts.filter(a => a.crit && a.av < 100).length
  const matBajos = mats.filter(m => m.s < m.min).length
  const tvenc    = tasks.filter(t => t.estadoActual === 'vencida').length
  const tGralV   = tareasGral.filter(t => t.estadoActual === 'vencida').length
  const urgentes = tasks.filter(t => t.estadoActual === 'vencida' || t.prioridad === 'urgente')
    .sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite)).slice(0, 5)

  return (
    <div>
      {obra && <div style={{ fontWeight: 800, fontSize: 17, color: C.ink, marginBottom: 12 }}>{obra.nombre}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 9, marginBottom: 14 }}>
        <KpiCard label="Avance global" value={`${avG}%`} color={C.amber} sub={`${acts.filter(a => a.av === 100).length}/${acts.length} completadas`}/>
        <KpiCard label="Rutas críticas" value={criticas} color={criticas > 0 ? C.red : C.green} sub="actividades activas"/>
        <KpiCard label="Tareas vencidas" value={tvenc} color={tvenc > 0 ? C.red : C.green} sub="en esta obra"/>
        <KpiCard label="Mat. bajo stock" value={matBajos} color={matBajos > 0 ? C.gold : C.green} sub="materiales"/>
      </div>

      {tGralV > 0 && (
        <Alert color={C.purple} s={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>📝</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.purple }}>
                {tGralV} tarea{tGralV !== 1 ? 's' : ''} general{tGralV !== 1 ? 'es' : ''} vencida{tGralV !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 11, color: C.mid }}>Revisá la pestaña "Tareas gral."</div>
            </div>
          </div>
        </Alert>
      )}

      {/* Avance por frente */}
      <Box s={{ marginBottom: 12 }}>
        <SectionLabel>Avance por frente de trabajo</SectionLabel>
        {(obra?.frentes || []).map(f => {
          const ta = acts.filter(a => a.fr === f.id)
          if (!ta.length) return null
          const av = Math.round(ta.reduce((s, a) => s + a.av, 0) / ta.length)
          return (
            <div key={f.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{f.ic} {f.label}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 12, color: av === 100 ? C.green : C.amber }}>{av}%</span>
              </div>
              <Bar v={av} color={av === 100 ? C.green : C.amber} h={7}/>
            </div>
          )
        })}
      </Box>

      {/* Urgentes */}
      {urgentes.length > 0 && (
        <Box>
          <SectionLabel>Urgentes / vencidas</SectionLabel>
          {urgentes.map(t => {
            const u = usuarios.find(x => x.id === t.asignadoId)
            const e = ESTADOS[t.estadoActual]
            return (
              <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: e?.color || C.amber, flexShrink: 0, marginTop: 5 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</div>
                  <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{u?.nombre} · {fmtDateShort(t.fechaLimite)}</div>
                </div>
                <EstadoTag estado={t.estadoActual} ESTADOS={ESTADOS}/>
              </div>
            )
          })}
        </Box>
      )}
    </div>
  )
}
