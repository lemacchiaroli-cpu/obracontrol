import { useState } from 'react'
import { C, Bar, Box, Btn, Field, SelectField, Radial, Sheet, AddButton, Chip, ChipRow, SectionLabel } from '../ui.jsx'

function ModalAvance({ act, frentes, onSave, onClose }) {
  const [av, setAv] = useState(act.av)
  const fr = frentes.find(f => f.id === act.fr)
  return (
    <Sheet onClose={onClose}>
      <div style={{ fontSize: 11, color: C.light, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
        {fr?.ic} {fr?.label} · {act.niv}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 20 }}>{act.nom}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: C.mid }}>Avance actual</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 22, color: av === 100 ? C.green : C.amber }}>{av}%</span>
      </div>
      <input type="range" min="0" max="100" value={av} step="1" onChange={e => setAv(+e.target.value)} style={{ marginBottom: 12 }}/>
      <Bar v={av} color={av === 100 ? C.green : C.amber} h={10}/>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Btn s={{ flex: 1, padding: '13px 0' }} onClick={() => { onSave(av); onClose() }}>Guardar</Btn>
        <Btn outline col={C.mid} s={{ padding: '13px 18px' }} onClick={onClose}>Cancelar</Btn>
      </div>
    </Sheet>
  )
}

function ModalNuevaAct({ obra, onSave, onClose }) {
  const [f, setF] = useState({ nom: '', niv: obra?.niveles?.[0] || '', fr: obra?.frentes?.[0]?.id || '', meta: '', crit: false })
  const upd = k => v => setF(p => ({ ...p, [k]: v }))
  const guardar = () => {
    if (!f.nom.trim()) return
    onSave(f); onClose()
  }
  return (
    <Sheet onClose={onClose}>
      <div style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 16 }}>Nueva actividad</div>
      <Field label="Nombre" value={f.nom} onChange={upd('nom')} placeholder="Ej: Encofrado columnas N2" required s={{ marginBottom: 12 }}/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <SelectField label="Nivel" value={f.niv} onChange={upd('niv')}
          options={(obra?.niveles || []).map(n => ({ value: n, label: n }))}/>
        <SelectField label="Frente" value={f.fr} onChange={upd('fr')}
          options={(obra?.frentes || []).map(fr => ({ value: fr.id, label: `${fr.ic} ${fr.label}` }))}/>
        <Field label="Meta" value={f.meta} onChange={upd('meta')} placeholder="20/05"/>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Ruta crítica</div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', paddingTop: 8 }}>
            <input type="checkbox" checked={f.crit} onChange={e => upd('crit')(e.target.checked)}/>
            <span style={{ fontSize: 13, color: C.mid }}>Sí</span>
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn s={{ flex: 1 }} onClick={guardar}>Agregar</Btn>
        <Btn outline col={C.mid} s={{ padding: '10px 18px' }} onClick={onClose}>Cancelar</Btn>
      </div>
    </Sheet>
  )
}

export default function TabAvances({ obra, actividades, obraActiva, setAct, addLog, usuActivo, uid, now }) {
  const [filtFr,  setFiltFr]  = useState('all')
  const [filtNiv, setFiltNiv] = useState('all')
  const [editando, setEditando] = useState(null)
  const [nuevaModal, setNuevaModal] = useState(false)

  const acts    = actividades.filter(a => a.obraId === obraActiva)
  const frentes = obra?.frentes || []
  const niveles = obra?.niveles || []
  const filtd   = acts.filter(a => (filtFr === 'all' || a.fr === filtFr) && (filtNiv === 'all' || a.niv === filtNiv))
  const avG     = acts.length ? Math.round(acts.reduce((s, a) => s + a.av, 0) / acts.length) : 0

  const saveAv = (id, av) => {
    const a = acts.find(x => x.id === id)
    setAct(actividades.map(x => x.id === id ? { ...x, av } : x))
    addLog('avance', `"${a?.nom}": ${a?.av}% → ${av}%`, obra?.nombre)
  }

  const addAct = (f) => {
    const nueva = { ...f, id: uid(), obraId: obraActiva, av: 0 }
    setAct([...actividades, nueva])
    addLog('config', `Nueva actividad: "${f.nom}"`, obra?.nombre)
  }

  const delAct = id => {
    const a = acts.find(x => x.id === id)
    if (window.confirm(`¿Eliminar "${a?.nom}"?`)) {
      setAct(actividades.filter(x => x.id !== id))
      addLog('config', `Actividad eliminada: "${a?.nom}"`, obra?.nombre)
    }
  }

  return (
    <div>
      {/* Radial + resumen */}
      <Box s={{ marginBottom: 14, display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Radial v={avG} size={72} color={avG === 100 ? C.green : C.amber}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: avG === 100 ? C.green : C.amber }}>{avG}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 4 }}>Avance general</div>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 8 }}>
            {acts.filter(a => a.av === 100).length}/{acts.length} completadas ·{' '}
            <span style={{ color: C.red, fontWeight: 700 }}>{acts.filter(a => a.crit && a.av < 100).length} rutas críticas</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {frentes.map(f => {
              const ta = acts.filter(a => a.fr === f.id)
              const av = ta.length ? Math.round(ta.reduce((s, a) => s + a.av, 0) / ta.length) : 0
              return ta.length ? <span key={f.id} style={{ fontSize: 11, color: C.mid }}><b style={{ color: C.ink }}>{f.ic}</b> {av}%</span> : null
            })}
          </div>
        </div>
      </Box>

      {/* Filtros */}
      <ChipRow>
        <Chip active={filtFr === 'all'} onClick={() => setFiltFr('all')}>Todos</Chip>
        {frentes.map(f => <Chip key={f.id} active={filtFr === f.id} onClick={() => setFiltFr(f.id)}>{f.ic} {f.label}</Chip>)}
      </ChipRow>
      <ChipRow>
        <Chip active={filtNiv === 'all'} onClick={() => setFiltNiv('all')}>Todos niveles</Chip>
        {niveles.map(n => <Chip key={n} active={filtNiv === n} onClick={() => setFiltNiv(n)}>{n}</Chip>)}
      </ChipRow>

      <AddButton onClick={() => setNuevaModal(true)}>+ Agregar actividad</AddButton>

      {filtd.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px', color: C.light, fontSize: 14 }}>Sin actividades con estos filtros.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtd.map(a => {
          const fr  = frentes.find(f => f.id === a.fr)
          const col = a.av === 100 ? C.green : a.av > 0 ? C.amber : C.light
          return (
            <div key={a.id} style={{
              background: C.card,
              border: `1.5px solid ${a.crit && a.av < 100 ? C.red + '44' : C.border}`,
              borderRadius: 13, padding: '13px 15px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
                    {a.crit && a.av < 100 && (
                      <span style={{ background: C.redL, color: C.red, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>CRÍTICA</span>
                    )}
                    <span style={{ fontSize: 10, color: C.light }}>{fr ? `${fr.ic} ${fr.label}` : ''} · {a.niv}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{a.nom}</div>
                  {a.meta && <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>Meta: {a.meta}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: col }}>{a.av}%</span>
                  <button onClick={() => delAct(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16, padding: '2px 4px' }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}><Bar v={a.av} color={col} h={8}/></div>
                <button onClick={() => setEditando(a)} style={{
                  background: C.amberL, color: C.amber, border: `1px solid ${C.amber}44`,
                  borderRadius: 8, padding: '6px 13px', fontWeight: 700, cursor: 'pointer',
                  fontSize: 12, fontFamily: 'inherit', flexShrink: 0,
                }}>
                  Actualizar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editando && (
        <ModalAvance act={editando} frentes={frentes} onSave={av => saveAv(editando.id, av)} onClose={() => setEditando(null)}/>
      )}
      {nuevaModal && (
        <ModalNuevaAct obra={obra} onSave={addAct} onClose={() => setNuevaModal(false)}/>
      )}
    </div>
  )
}
