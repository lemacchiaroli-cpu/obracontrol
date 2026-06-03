import { useState } from 'react'
import { C, Bar, Box, Btn, Field, SelectField, Radial, Sheet, AddButton, Chip, ChipRow, SectionLabel, Avatar } from '../ui.jsx'
import { ESTADOS_ST, nextEstadoST, fmtTS } from '../store.js'

// ── Ícono de estado de subtarea ────────────────────────────────────────────────
function STIcon({ estado, size = 20 }) {
  const cfg = {
    sin_iniciar:  { bg: '#EDE8E1', border: '#C8B8A8', color: '#9C9690', ic: ''  },
    en_ejecucion: { bg: '#FDF0E6', border: '#C8610A', color: '#C8610A', ic: '▶' },
    finalizada:   { bg: '#E8F5EE', border: '#1E7E4E', color: '#1E7E4E', ic: '✓' },
  }[estado] || { bg: '#EDE8E1', border: '#C8B8A8', color: '#9C9690', ic: '' }

  return (
    <div style={{
      width: size, height: size, borderRadius: size * .25,
      background: cfg.bg, border: `2px solid ${cfg.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * .5, color: cfg.color, fontWeight: 700,
      flexShrink: 0, cursor: 'pointer', transition: 'all .15s',
      userSelect: 'none',
    }}>
      {cfg.ic}
    </div>
  )
}

// ── Mini-barra de subtareas (3 colores) ───────────────────────────────────────
function STBar({ subtareas }) {
  if (!subtareas?.length) return null
  const fin = subtareas.filter(s => s.estado === 'finalizada').length
  const ejec = subtareas.filter(s => s.estado === 'en_ejecucion').length
  const total = subtareas.length
  const pFin  = (fin / total) * 100
  const pEjec = (ejec / total) * 100

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 7 }}>
      <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${pFin}%`,  background: '#1E7E4E', transition: 'width .4s' }}/>
        <div style={{ width: `${pEjec}%`, background: '#C8610A', transition: 'width .4s' }}/>
      </div>
      <span style={{ fontSize: 10, color: C.light, whiteSpace: 'nowrap', flexShrink: 0 }}>
        <span style={{ color: '#1E7E4E', fontWeight: 700 }}>{fin}</span>
        {ejec > 0 && <><span style={{ color: C.border }}> / </span><span style={{ color: '#C8610A', fontWeight: 700 }}>{ejec} ▶</span></>}
        <span style={{ color: C.light }}> / {total}</span>
      </span>
    </div>
  )
}

// ── Modal de detalle / actualización de actividad ─────────────────────────────
function ModalActualizar({ act, frentes, usuarios, usuActivo, onSave, onClose, uid, now }) {
  const fr = frentes.find(f => f.id === act.fr)
  const [av,       setAv]       = useState(act.av)
  const [subtareas, setSTs]     = useState(act.subtareas || [])
  const [nuevaTxt, setNuevaTxt] = useState('')

  // Cambiar estado de subtarea — cicla entre los 3 estados
  const toggleST = (id) => {
    setSTs(prev => prev.map(s => s.id !== id ? s : {
      ...s,
      estado:    nextEstadoST(s.estado),
      usuarioId: usuActivo,
      ts:        now(),
    }))
  }

  // Cambiar estado directo (desde el selector)
  const setSTEstado = (id, nuevoEstado) => {
    setSTs(prev => prev.map(s => s.id !== id ? s : {
      ...s,
      estado:    nuevoEstado,
      usuarioId: usuActivo,
      ts:        now(),
    }))
  }

  // Agregar subtarea
  const addST = () => {
    if (!nuevaTxt.trim()) return
    setSTs(prev => [...prev, {
      id:          uid(),
      txt:         nuevaTxt.trim(),
      estado:      'sin_iniciar',
      creadoEn:    now(),
      creadoPorId: usuActivo,
      usuarioId:   null,
      ts:          null,
    }])
    setNuevaTxt('')
  }

  // Eliminar subtarea
  const deleteST = (id) => {
    setSTs(prev => prev.filter(s => s.id !== id))
  }

  // Editar texto de subtarea
  const editSTTxt = (id, txt) => {
    setSTs(prev => prev.map(s => s.id !== id ? s : { ...s, txt }))
  }

  const guardar = () => {
    onSave(av, subtareas)
    onClose()
  }

  // Resumen de subtareas
  const fin  = subtareas.filter(s => s.estado === 'finalizada').length
  const ejec = subtareas.filter(s => s.estado === 'en_ejecucion').length
  const pend = subtareas.filter(s => s.estado === 'sin_iniciar').length

  return (
    <Sheet onClose={onClose} maxH="94vh">
      {/* Cabecera */}
      <div style={{ fontSize: 11, color: C.light, marginBottom: 3, textTransform: 'uppercase', letterSpacing: .4 }}>
        {fr?.ic} {fr?.label} · {act.niv}
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 16 }}>{act.nom}</div>

      {/* % Manual */}
      <SectionLabel>Avance de la actividad</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: C.mid }}>Porcentaje completado</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 22, color: av === 100 ? C.green : C.amber }}>{av}%</span>
      </div>
      <input type="range" min="0" max="100" value={av} step="1"
        onChange={e => setAv(+e.target.value)}
        style={{ marginBottom: 8 }}/>
      <Bar v={av} color={av === 100 ? C.green : C.amber} h={9} s={{ marginBottom: 16 }}/>

      {/* Subtareas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <SectionLabel s={{ margin: 0 }}>Subtareas ({subtareas.length})</SectionLabel>
        {subtareas.length > 0 && (
          <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
            <span style={{ color: C.green,  fontWeight: 700 }}>✓ {fin}</span>
            <span style={{ color: C.amber,  fontWeight: 700 }}>▶ {ejec}</span>
            <span style={{ color: C.light              }}>○ {pend}</span>
          </div>
        )}
      </div>

      {/* Leyenda de estados */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '7px 10px', background: C.bg, borderRadius: 8 }}>
        {Object.entries(ESTADOS_ST).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <STIcon estado={k} size={14}/>
            <span style={{ fontSize: 10, color: C.mid }}>{v.label}</span>
          </div>
        ))}
        <span style={{ fontSize: 10, color: C.light, marginLeft: 'auto' }}>Tocá para cambiar</span>
      </div>

      {/* Lista de subtareas */}
      {subtareas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px', color: C.light, fontSize: 13, background: C.bg, borderRadius: 9, marginBottom: 10 }}>
          Sin subtareas aún. Agregá la primera abajo.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
        {subtareas.map(s => {
          const creador = usuarios.find(u => u.id === s.creadoPorId)
          const modifico = usuarios.find(u => u.id === s.usuarioId)
          const esFin  = s.estado === 'finalizada'
          const esEjec = s.estado === 'en_ejecucion'
          return (
            <div key={s.id} style={{
              display: 'flex', gap: 9, alignItems: 'flex-start',
              padding: '10px 12px',
              background: esFin ? '#F0FBF5' : esEjec ? '#FEF7F0' : C.bg,
              borderRadius: 10,
              border: `1px solid ${esFin ? '#1E7E4E22' : esEjec ? '#C8610A22' : C.border}`,
              transition: 'background .2s',
            }}>
              {/* Ícono de estado — toca para ciclar */}
              <div onClick={() => toggleST(s.id)} style={{ marginTop: 1 }}>
                <STIcon estado={s.estado} size={22}/>
              </div>

              {/* Texto y meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={s.txt}
                  onChange={e => editSTTxt(s.id, e.target.value)}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                    color: esFin ? C.light : C.ink,
                    textDecoration: esFin ? 'line-through' : 'none',
                    outline: 'none', padding: 0,
                  }}
                />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                  {/* Selector directo de estado */}
                  <select
                    value={s.estado}
                    onChange={e => setSTEstado(s.id, e.target.value)}
                    style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      border: `1px solid ${ESTADOS_ST[s.estado]?.color}44`,
                      background: ESTADOS_ST[s.estado]?.bg,
                      color: ESTADOS_ST[s.estado]?.color,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {Object.entries(ESTADOS_ST).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>

                  {/* Quién creó */}
                  {creador && (
                    <span style={{ fontSize: 10, color: C.light, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar usuario={creador} size={13}/>
                      creó
                    </span>
                  )}

                  {/* Quién modificó y cuándo */}
                  {modifico && s.ts && (
                    <span style={{ fontSize: 10, color: ESTADOS_ST[s.estado]?.color, fontWeight: 600 }}>
                      {modifico.ini} · {new Date(s.ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Eliminar */}
              <button onClick={() => deleteST(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.light, fontSize: 15, padding: '2px', flexShrink: 0, marginTop: 1 }}>✕</button>
            </div>
          )
        })}
      </div>

      {/* Nueva subtarea */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '9px 11px', background: '#EDE8E1', border: `1.5px dashed #C8B8A8`, borderRadius: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 15, color: C.light }}>+</span>
        <input
          value={nuevaTxt}
          onChange={e => setNuevaTxt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addST()}
          placeholder="Agregar subtarea..."
          style={{ flex: 1, background: 'none', border: 'none', fontSize: 13, color: C.ink, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={addST} disabled={!nuevaTxt.trim()} style={{ background: nuevaTxt.trim() ? C.amber : C.border, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: nuevaTxt.trim() ? 'pointer' : 'default', fontFamily: 'inherit', flexShrink: 0, transition: 'background .15s' }}>
          Agregar
        </button>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 9 }}>
        <Btn s={{ flex: 1, padding: '13px 0' }} onClick={guardar}>Guardar cambios</Btn>
        <Btn outline col={C.mid} s={{ padding: '13px 18px' }} onClick={onClose}>Cancelar</Btn>
      </div>
    </Sheet>
  )
}

// ── Modal nueva actividad ──────────────────────────────────────────────────────
function ModalNuevaAct({ obra, onSave, onClose }) {
  const [f, setF] = useState({
    nom: '', niv: obra?.niveles?.[0] || '',
    fr:  obra?.frentes?.[0]?.id || '',
    meta: '', crit: false,
  })
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
        <SelectField label="Nivel" value={f.niv} onChange={upd('niv')} options={(obra?.niveles || []).map(n => ({ value: n, label: n }))}/>
        <SelectField label="Frente" value={f.fr}  onChange={upd('fr')}  options={(obra?.frentes || []).map(fr => ({ value: fr.id, label: `${fr.ic} ${fr.label}` }))}/>
        <Field label="Meta" value={f.meta} onChange={upd('meta')} placeholder="20/05"/>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Ruta crítica</div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', paddingTop: 9 }}>
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

// ── TAB PRINCIPAL ──────────────────────────────────────────────────────────────
export default function TabAvances({ obra, actividades, obraActiva, setAct, addLog, usuActivo, usuarios, uid, now }) {
  const [filtFr,    setFiltFr]   = useState('all')
  const [filtNiv,   setFiltNiv]  = useState('all')
  const [editando,  setEditando] = useState(null)
  const [nuevaModal,setNueva]    = useState(false)

  const acts    = actividades.filter(a => a.obraId === obraActiva)
  const frentes = obra?.frentes || []
  const niveles = obra?.niveles || []
  const filtd   = acts.filter(a =>
    (filtFr  === 'all' || a.fr  === filtFr) &&
    (filtNiv === 'all' || a.niv === filtNiv)
  )
  const avG = acts.length ? Math.round(acts.reduce((s, a) => s + a.av, 0) / acts.length) : 0

  const saveAct = (id, av, subtareas) => {
    const a = acts.find(x => x.id === id)
    setAct(actividades.map(x => x.id === id ? { ...x, av, subtareas } : x))
    addLog('avance', `"${a?.nom}": ${a?.av}% → ${av}%`, obra?.nombre)
  }

  const addAct = (f) => {
    setAct([...actividades, { ...f, id: uid(), obraId: obraActiva, av: 0, subtareas: [] }])
    addLog('config', `Nueva actividad: "${f.nom}"`, obra?.nombre)
  }

  const delAct = (id) => {
    const a = acts.find(x => x.id === id)
    if (window.confirm(`¿Eliminar "${a?.nom}"?`)) {
      setAct(actividades.filter(x => x.id !== id))
      addLog('config', `Actividad eliminada: "${a?.nom}"`, obra?.nombre)
    }
  }

  return (
    <div>
      {/* Resumen radial */}
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

      <AddButton onClick={() => setNueva(true)}>+ Agregar actividad</AddButton>

      {filtd.length === 0 && (
        <div style={{ textAlign: 'center', padding: 36, color: C.light, fontSize: 14 }}>Sin actividades con estos filtros.</div>
      )}

      {/* Tarjetas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {filtd.map(a => {
          const fr       = frentes.find(f => f.id === a.fr)
          const col      = a.av === 100 ? C.green : a.av > 0 ? C.amber : C.light
          const sts      = a.subtareas || []
          const finCount = sts.filter(s => s.estado === 'finalizada').length
          const ejCount  = sts.filter(s => s.estado === 'en_ejecucion').length
          const hasEjec  = ejCount > 0

          return (
            <div key={a.id} style={{
              background: C.card,
              border: `1.5px solid ${a.crit && a.av < 100 ? C.red + '44' : C.border}`,
              borderRadius: 13, padding: '13px 14px',
            }}>
              {/* Cabecera */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
                    {a.crit && a.av < 100 && (
                      <span style={{ background: C.redL, color: C.red, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>CRÍTICA</span>
                    )}
                    {hasEjec && (
                      <span style={{ background: C.amberL, color: C.amber, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>▶ EN EJECUCIÓN</span>
                    )}
                    <span style={{ fontSize: 10, color: C.light }}>{fr ? `${fr.ic} ${fr.label}` : ''} · {a.niv}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{a.nom}</div>
                  {a.meta && <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>Meta: {a.meta}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 17, color: col }}>{a.av}%</span>
                  <button onClick={() => delAct(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.light, fontSize: 16, padding: '2px 4px' }}>✕</button>
                </div>
              </div>

              {/* Barra de avance % */}
              <Bar v={a.av} color={col} h={7}/>

              {/* Subtareas preview */}
              {sts.length > 0 && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: .4 }}>Subtareas</span>
                    <span style={{ fontSize: 10, color: C.light }}>{finCount}/{sts.length} finalizadas</span>
                  </div>
                  {/* Mostrar las primeras 3 */}
                  {sts.slice(0, 3).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                      <STIcon estado={s.estado} size={14}/>
                      <span style={{ fontSize: 12, flex: 1, color: s.estado === 'finalizada' ? C.light : C.ink, textDecoration: s.estado === 'finalizada' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.txt}
                      </span>
                      {s.usuarioId && (
                        <Avatar usuario={usuarios?.find(u => u.id === s.usuarioId)} size={16}/>
                      )}
                    </div>
                  ))}
                  {sts.length > 3 && (
                    <div style={{ fontSize: 11, color: C.amber, fontWeight: 600, marginTop: 5, cursor: 'pointer' }} onClick={() => setEditando(a)}>
                      + {sts.length - 3} más...
                    </div>
                  )}
                  {/* Barra de 3 colores */}
                  <STBar subtareas={sts}/>
                </div>
              )}

              {/* Botón actualizar */}
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setEditando(a)} style={{ width: '100%', background: C.amberL, color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 8, padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  Actualizar avance y subtareas
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modales */}
      {editando && (
        <ModalActualizar
          act={editando} frentes={frentes} usuarios={usuarios}
          usuActivo={usuActivo} uid={uid} now={now}
          onSave={(av, sts) => saveAct(editando.id, av, sts)}
          onClose={() => setEditando(null)}
        />
      )}
      {nuevaModal && (
        <ModalNuevaAct obra={obra} onSave={addAct} onClose={() => setNueva(false)}/>
      )}
    </div>
  )
}
