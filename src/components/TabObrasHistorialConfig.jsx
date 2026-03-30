// ── TabObras ──────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { C, Bar, Box, Btn, Field, Sheet, SectionLabel, Avatar } from '../ui.jsx'
import { uid, todayISO, HIST_TIPOS, fmtTS } from '../store.js'

const PAL = ['#378ADD','#639922','#BA7517','#C0392B','#6D28D9','#1E7E4E','#0E7490','#B7950B']

export function TabObras({ obras, setObras, obraActiva, setObraAct, tareasObra, actividades, materiales, addLog }) {
  const [creando, setCreando] = useState(false)
  const [nv, setNv] = useState({ nombre: '', ubicacion: '', inicio: todayISO(), fin: todayISO(365) })
  const upd = k => v => setNv(p => ({ ...p, [k]: v }))

  const crear = () => {
    if (!nv.nombre.trim()) return
    const id = uid()
    const nueva = {
      id, nombre: nv.nombre, ubicacion: nv.ubicacion,
      inicio: nv.inicio, fin: nv.fin,
      niveles: ['Planta baja', 'Nivel 1', 'Nivel 2'],
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
    }
    setObras([...obras, nueva])
    addLog('config', `Nueva obra creada: "${nv.nombre}"`)
    setNv({ nombre: '', ubicacion: '', inicio: todayISO(), fin: todayISO(365) })
    setCreando(false)
    setObraAct(id)
  }

  const del = id => {
    const o = obras.find(x => x.id === id)
    if (obras.length <= 1) { alert('Debe haber al menos una obra.'); return }
    if (!window.confirm(`¿Eliminar "${o?.nombre}"? Se borrarán todas sus actividades y materiales.`)) return
    setObras(obras.filter(x => x.id !== id))
    if (obraActiva === id) setObraAct(obras.find(x => x.id !== id)?.id || '')
    addLog('config', `Obra eliminada: "${o?.nombre}"`)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: C.ink }}>Mis obras</div>
        <Btn onClick={() => setCreando(true)} s={{ padding: '8px 14px', fontSize: 13 }}>+ Nueva obra</Btn>
      </div>

      {creando && (
        <Box s={{ marginBottom: 14, border: `1.5px solid ${C.amber}55` }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Nueva obra</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Field label="Nombre de la obra" value={nv.nombre} onChange={upd('nombre')} placeholder="Ej: Edificio Las Acacias" required/>
            <Field label="Ubicación" value={nv.ubicacion} onChange={upd('ubicacion')} placeholder="Ciudad, Provincia"/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Inicio" type="date" value={nv.inicio} onChange={upd('inicio')}/>
              <Field label="Fin estimado" type="date" value={nv.fin} onChange={upd('fin')}/>
            </div>
            <div style={{ fontSize: 12, color: C.mid, background: C.bg, borderRadius: 8, padding: '9px 12px' }}>
              Se crea con niveles y frentes por defecto. Personalizalos en Configuración.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn onClick={crear} s={{ flex: 1 }}>Crear obra</Btn>
            <Btn outline col={C.mid} onClick={() => setCreando(false)} s={{ padding: '10px 18px' }}>Cancelar</Btn>
          </div>
        </Box>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {obras.map((o, i) => {
          const col    = PAL[i % PAL.length]
          const acts   = actividades.filter(a => a.obraId === o.id)
          const avG    = acts.length ? Math.round(acts.reduce((s, a) => s + a.av, 0) / acts.length) : 0
          const tasks  = tareasObra.filter(t => t.obraId === o.id)
          const venc   = tasks.filter(t => t.estadoActual === 'vencida').length
          const mBaj   = materiales.filter(m => m.obraId === o.id && m.s < m.min).length
          const active = o.id === obraActiva
          return (
            <div key={o.id} style={{ background: C.card, border: `1.5px solid ${active ? col : C.border}`, borderRadius: 14, overflow: 'hidden', ...(active ? { background: col + '08' } : {}) }}>
              <div style={{ padding: '13px 15px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, flexShrink: 0 }}/>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.ink }}>{o.nombre}</div>
                    {active && <span style={{ background: col + '22', color: col, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>ACTIVA</span>}
                  </div>
                  {o.ubicacion && <div style={{ fontSize: 12, color: C.mid, marginLeft: 18 }}>{o.ubicacion}</div>}
                  <div style={{ fontSize: 11, color: C.light, marginLeft: 18, marginTop: 2 }}>{o.inicio} → {o.fin}</div>
                </div>
                <div style={{ display: 'flex', gap: 7, flexShrink: 0, marginLeft: 10 }}>
                  {!active && (
                    <button onClick={() => setObraAct(o.id)} style={{ background: col, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 13px', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      Seleccionar
                    </button>
                  )}
                  {obras.length > 1 && (
                    <button onClick={() => del(o.id)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 11px', cursor: 'pointer', color: C.red, fontSize: 14, fontFamily: 'inherit' }}>✕</button>
                  )}
                </div>
              </div>
              <div style={{ padding: '12px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: C.mid }}>Avance general</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 12, color: col }}>{avG}%</span>
                </div>
                <Bar v={avG} color={col} h={5}/>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: C.light }}>{acts.length} actividades</span>
                  <span style={{ fontSize: 11, color: C.light }}>·</span>
                  <span style={{ fontSize: 11, color: C.light }}>{tasks.length} tareas</span>
                  {venc > 0 && <><span style={{ fontSize: 11, color: C.light }}>·</span><span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>{venc} vencidas</span></>}
                  {mBaj > 0 && <><span style={{ fontSize: 11, color: C.light }}>·</span><span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>{mBaj} mat. bajos</span></>}
                </div>
              </div>
            </div>
          )
        })}
        {/* Botón nueva obra */}
        <div onClick={() => setCreando(true)} style={{ border: `1.5px dashed ${C.border}`, borderRadius: 14, padding: '18px', textAlign: 'center', cursor: 'pointer', color: C.mid, fontSize: 13, fontWeight: 700 }}>
          + Nueva obra
        </div>
      </div>
    </div>
  )
}

// ── TabHistorial ──────────────────────────────────────────────────────────────
export function TabHistorial({ historial, setHist, usuarios }) {
  const [fil, setFil] = useState('all')
  const [bus, setBus] = useState('')

  const items = [...historial]
    .filter(e => (fil === 'all' || e.tipo === fil) && (!bus || e.det.toLowerCase().includes(bus.toLowerCase())))
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 13 }}>
        {[
          { l: 'Total',      v: historial.length,                                    c: C.ink   },
          { l: 'Tareas',     v: historial.filter(e => e.tipo === 'tarea').length,    c: C.blue  },
          { l: 'Avances',    v: historial.filter(e => e.tipo === 'avance').length,   c: C.amber },
          { l: 'Materiales', v: historial.filter(e => e.tipo === 'material').length, c: C.gold  },
        ].map(k => (
          <div key={k.l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 6px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 19, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 9, color: C.mid }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Búsqueda y filtros */}
      <input value={bus} onChange={e => setBus(e.target.value)} placeholder="Buscar en el historial..."
        style={{ width: '100%', padding: '9px 12px', background: '#FAFAF7', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.ink, fontSize: 13, fontFamily: 'inherit', marginBottom: 10 }}/>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, scrollbarWidth: 'none' }}>
        {[['all','Todos'],['tarea','Tareas'],['avance','Avances'],['material','Materiales'],['config','Config.'],['reporte','Reportes']].map(([v, l]) => (
          <button key={v} onClick={() => setFil(v)} style={{
            padding: '4px 11px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            border: `1.5px solid ${fil === v ? C.amber : '#C8B8A8'}`,
            background: fil === v ? C.amberL : '#EDE8E1',
            color: fil === v ? C.amber : C.mid, fontWeight: 700, fontSize: 11,
          }}>{l}</button>
        ))}
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: C.light, fontSize: 14 }}>
          {historial.length === 0 ? 'Sin eventos aún.' : 'Sin coincidencias.'}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 17, top: 4, bottom: 4, width: 1.5, background: C.border, borderRadius: 1 }}/>
          {items.map(e => {
            const tipo = HIST_TIPOS[e.tipo] || HIST_TIPOS.config
            const u    = e.usuarioId && e.usuarioId !== 'system' ? usuarios.find(u => u.id === e.usuarioId) : null
            return (
              <div key={e.id} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: tipo.bg, border: `2px solid ${tipo.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, zIndex: 1 }}>
                    {tipo.ic}
                  </div>
                </div>
                <div style={{ flex: 1, paddingBottom: 6, paddingTop: 2, minWidth: 0 }}>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ background: tipo.bg, color: tipo.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{e.tipo}</span>
                        <div style={{ fontWeight: 600, fontSize: 12, color: C.ink, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.det}</div>
                        {e.extra && <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{e.extra}</div>}
                        {u && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                            <Avatar usuario={u} size={14}/>
                            <span style={{ fontSize: 11, color: C.light }}>{u.nombre}</span>
                          </div>
                        )}
                        {!u && <div style={{ fontSize: 11, color: C.light, marginTop: 4 }}>Sistema</div>}
                      </div>
                      <div style={{ fontSize: 10, color: C.light, whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'right' }}>{fmtTS(e.ts)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {historial.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => { if (window.confirm('¿Borrar todo el historial?')) setHist([]) }}
            style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: C.red, fontSize: 13, fontFamily: 'inherit' }}>
            Borrar historial
          </button>
        </div>
      )}
    </div>
  )
}

// ── TabConfig ─────────────────────────────────────────────────────────────────
const ICONS_FR = ['🏛','🧱','⚡','🪟','🔧','🚰','🏗','🎨','🔌','🪝','📐','🛠']
const COLS_CAT  = ['#1A5276','#C8610A','#6D28D9','#1E7E4E','#C0392B','#5C5750','#0E7490','#B7950B']

export function TabConfig({ obra, obras, setObras, obraActiva, usuarios, setUsuarios, catGral, setCatGral, addLog }) {
  const [sec, setSec] = useState('general')

  const updObra = (key, val) => setObras(obras.map(o => o.id !== obraActiva ? o : { ...o, [key]: val }))

  const SECS = [
    { id: 'general',  l: 'Datos generales' },
    { id: 'niveles',  l: 'Niveles' },
    { id: 'frentes',  l: 'Frentes' },
    { id: 'cat_obra', l: 'Cat. tareas obra' },
    { id: 'equipo',   l: 'Equipo' },
    { id: 'cat_gral', l: 'Cat. tareas gral.' },
  ]

  if (!obra) return <div style={{ textAlign: 'center', padding: 24, color: C.light }}>Sin obra activa.</div>

  return (
    <div>
      {/* Tabs de sección */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4, scrollbarWidth: 'none' }}>
        {SECS.map(s => (
          <button key={s.id} onClick={() => setSec(s.id)} style={{
            padding: '6px 13px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            border: `1.5px solid ${sec === s.id ? C.amber : '#C8B8A8'}`,
            background: sec === s.id ? C.amberL : '#EDE8E1',
            color: sec === s.id ? C.amber : C.mid, fontWeight: 700, fontSize: 12,
          }}>{s.l}</button>
        ))}
      </div>

      {/* GENERAL */}
      {sec === 'general' && (
        <Box>
          <SectionLabel>Datos de la obra</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Nombre" value={obra.nombre}    onChange={v => updObra('nombre', v)}/>
            <Field label="Ubicación" value={obra.ubicacion || ''} onChange={v => updObra('ubicacion', v)}/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Fecha de inicio" type="date" value={obra.inicio || ''} onChange={v => updObra('inicio', v)}/>
              <Field label="Fecha fin" type="date" value={obra.fin || ''} onChange={v => updObra('fin', v)}/>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.mid, marginTop: 10 }}>Los cambios se guardan automáticamente.</div>
        </Box>
      )}

      {/* NIVELES */}
      {sec === 'niveles' && (
        <Box>
          <SectionLabel>Niveles de la obra</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {(obra.niveles || []).map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: C.bg, borderRadius: 9, border: `1px solid ${C.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: C.amberL, color: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                <input value={n} onChange={e => { const lvls = [...obra.niveles]; lvls[i] = e.target.value; updObra('niveles', lvls) }}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: 'inherit', outline: 'none' }}/>
                <button onClick={() => updObra('niveles', obra.niveles.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16 }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => updObra('niveles', [...(obra.niveles || []), 'Nuevo nivel'])}
            style={{ background: 'none', border: `1.5px solid ${C.amber}`, borderRadius: 8, padding: '7px 14px', color: C.amber, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            + Agregar nivel
          </button>
        </Box>
      )}

      {/* FRENTES */}
      {sec === 'frentes' && (
        <Box>
          <SectionLabel>Frentes de trabajo</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 12 }}>
            {(obra.frentes || []).map((f, i) => (
              <div key={f.id} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '9px 12px', background: C.bg, borderRadius: 9, border: `1px solid ${C.border}` }}>
                <select value={f.ic} onChange={e => { const fs = [...obra.frentes]; fs[i] = { ...f, ic: e.target.value }; updObra('frentes', fs) }}
                  style={{ padding: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 17, width: 36, cursor: 'pointer' }}>
                  {ICONS_FR.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input value={f.label} onChange={e => { const fs = [...obra.frentes]; fs[i] = { ...f, label: e.target.value }; updObra('frentes', fs) }}
                  style={{ flex: 1, padding: '7px 9px', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'inherit' }}/>
                <button onClick={() => updObra('frentes', obra.frentes.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16 }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => updObra('frentes', [...(obra.frentes || []), { id: uid(), label: 'Nuevo frente', ic: '🔧' }])}
            style={{ background: 'none', border: `1.5px solid ${C.amber}`, borderRadius: 8, padding: '7px 14px', color: C.amber, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            + Agregar frente
          </button>
        </Box>
      )}

      {/* CAT TAREAS OBRA */}
      {sec === 'cat_obra' && (
        <Box>
          <SectionLabel>Categorías de tareas — esta obra</SectionLabel>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 12 }}>Solo aplican a "{obra.nombre}"</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {(obra.catTareas || []).map((cat, i) => (
              <div key={cat.id} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '9px 12px', background: cat.color + '11', borderRadius: 9, border: `1px solid ${cat.color}33` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: cat.color, flexShrink: 0 }}/>
                <input value={cat.label} onChange={e => { const cs = [...obra.catTareas]; cs[i] = { ...cat, label: e.target.value }; updObra('catTareas', cs) }}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'inherit', outline: 'none' }}/>
                <select value={cat.color} onChange={e => { const cs = [...obra.catTareas]; cs[i] = { ...cat, color: e.target.value }; updObra('catTareas', cs) }}
                  style={{ background: cat.color, color: '#fff', border: 'none', borderRadius: 6, padding: '3px 7px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {COLS_CAT.map(c => <option key={c} value={c} style={{ background: c }}>{c}</option>)}
                </select>
                <button onClick={() => updObra('catTareas', (obra.catTareas || []).filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16 }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => updObra('catTareas', [...(obra.catTareas || []), { id: uid(), label: 'Nueva categoría', color: COLS_CAT[Math.floor(Math.random() * COLS_CAT.length)] }])}
            style={{ background: 'none', border: `1.5px solid ${C.amber}`, borderRadius: 8, padding: '7px 14px', color: C.amber, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            + Nueva categoría
          </button>
        </Box>
      )}

      {/* EQUIPO */}
      {sec === 'equipo' && (
        <Box>
          <SectionLabel>Equipo de trabajo</SectionLabel>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 12 }}>Compartido entre todas las obras.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 12 }}>
            {usuarios.map((u, i) => (
              <div key={u.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 13px', background: u.color + '11', borderRadius: 10, border: `1px solid ${u.color}33` }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.color + '22', border: `2px solid ${u.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: u.color, flexShrink: 0 }}>{u.ini}</div>
                <div style={{ flex: 1 }}>
                  <input value={u.nombre} onChange={e => setUsuarios(usuarios.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                    style={{ width: '100%', background: 'none', border: 'none', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: 'inherit', outline: 'none' }}/>
                  <input value={u.rol} onChange={e => setUsuarios(usuarios.map((x, j) => j === i ? { ...x, rol: e.target.value } : x))}
                    style={{ width: '100%', background: 'none', border: 'none', fontSize: 12, color: C.mid, fontFamily: 'inherit', outline: 'none' }}/>
                </div>
                <input value={u.ini} maxLength={2} onChange={e => setUsuarios(usuarios.map((x, j) => j === i ? { ...x, ini: e.target.value.toUpperCase().slice(0, 2) } : x))}
                  style={{ width: 34, padding: '4px 5px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontWeight: 700, textAlign: 'center', fontFamily: 'inherit' }}/>
                {usuarios.length > 1 && (
                  <button onClick={() => setUsuarios(usuarios.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 15 }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setUsuarios([...usuarios, { id: uid(), nombre: 'Nuevo usuario', rol: 'Rol', ini: 'NU', color: COLS_CAT[usuarios.length % COLS_CAT.length] }])}
            style={{ background: 'none', border: `1.5px solid ${C.amber}`, borderRadius: 8, padding: '7px 14px', color: C.amber, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            + Agregar persona
          </button>
        </Box>
      )}

      {/* CAT GENERALES */}
      {sec === 'cat_gral' && (
        <Box>
          <SectionLabel>Categorías de tareas generales</SectionLabel>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 12 }}>Para la pestaña "Tareas gral."</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {catGral.map((cat, i) => (
              <div key={cat.id} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '9px 12px', background: cat.color + '11', borderRadius: 9, border: `1px solid ${cat.color}33` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: cat.color, flexShrink: 0 }}/>
                <input value={cat.label} onChange={e => setCatGral(catGral.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'inherit', outline: 'none' }}/>
                <select value={cat.color} onChange={e => setCatGral(catGral.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
                  style={{ background: cat.color, color: '#fff', border: 'none', borderRadius: 6, padding: '3px 7px', fontSize: 11, cursor: 'pointer' }}>
                  {COLS_CAT.map(c => <option key={c} value={c} style={{ background: c }}>{c}</option>)}
                </select>
                <button onClick={() => setCatGral(catGral.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16 }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => setCatGral([...catGral, { id: uid(), label: 'Nueva categoría', color: C.purple }])}
            style={{ background: 'none', border: `1.5px solid ${C.purple}`, borderRadius: 8, padding: '7px 14px', color: C.purple, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            + Nueva categoría general
          </button>
        </Box>
      )}
    </div>
  )
}
