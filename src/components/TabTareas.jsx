import { useState, useCallback, useRef } from 'react'
import { C, Sheet, Btn, Field, SelectField, EstadoTag, PrioTag, Avatar, AdjPills, AddButton, Chip, ChipRow, SectionLabel, Alert } from '../ui.jsx'
import { ESTADOS, PRIORIDADES, TRANSICIONES, fmtDate, fmtDateShort, fmtTS, isOverdue, todayISO } from '../store.js'

// ── Modal detalle de tarea ─────────────────────────────────────────────────────
function ModalDetalle({ tarea, usuarios, catList, usuActivo, esGral, cambiarEstado, onClose, onEditar, tareasObra, tareasGral }) {
  const [showCambio, setShowCambio] = useState(false)
  const [nuevoEst,   setNuevoEst]   = useState('')
  const [comentario, setComentario] = useState('')
  const [error,      setError]      = useState('')
  const fileRef = useRef()

  const tActual = (esGral ? tareasGral : tareasObra).find(t => t.id === tarea.id) || tarea

  const asignado = usuarios.find(u => u.id === tActual.asignadoId)
  const creador  = usuarios.find(u => u.id === tActual.creadoPorId)
  const cat      = catList.find(c => c.id === tActual.catId)
  const esAsig   = usuActivo === tActual.asignadoId
  const esCrea   = usuActivo === tActual.creadoPorId
  const trans    = TRANSICIONES[tActual.estadoActual] || { asignado: [], creador: [] }
  const posibles = [...new Set([...(esAsig ? trans.asignado : []), ...(esCrea ? trans.creador : [])])]

  const CLCOLORS = { pendiente:'#B7950B', en_progreso:'#1A5276', esperando_respuesta:'#C8610A', finalizada:'#1E7E4E', no_puedo:'#6D28D9', vencida:'#C0392B', cancelada:'#9C9690' }

  const confirmar = () => {
    if (!nuevoEst) { setError('Seleccioná un estado.'); return }
    if (nuevoEst === 'no_puedo' && !comentario.trim()) { setError('El comentario es obligatorio para este estado.'); return }
    cambiarEstado(tActual.id, nuevoEst, comentario, esGral)
    setShowCambio(false); setNuevoEst(''); setComentario(''); setError('')
  }

  return (
    <Sheet onClose={onClose} maxH="92vh">
      {/* Tags + título */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        <EstadoTag estado={tActual.estadoActual} ESTADOS={ESTADOS}/>
        {tActual.prioridad !== 'normal' && <PrioTag prio={tActual.prioridad} PRIORIDADES={PRIORIDADES}/>}
        {cat && <span style={{ background: cat.color + '22', color: cat.color, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>{cat.label}</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: C.ink, flex: 1, marginRight: 10, lineHeight: 1.3 }}>{tActual.titulo}</div>
        <button onClick={onEditar} style={{ background: C.amberL, color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Editar</button>
      </div>
      {tActual.desc && <div style={{ fontSize: 13, color: C.mid, marginBottom: 12, lineHeight: 1.5 }}>{tActual.desc}</div>}

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Asignada a', content: <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar usuario={asignado} size={22}/><span style={{ fontSize: 12, fontWeight: 700 }}>{asignado?.nombre || '—'}</span></div> },
          { l: 'Creada por',  content: <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar usuario={creador}  size={22}/><span style={{ fontSize: 12, fontWeight: 700 }}>{creador?.nombre  || '—'}</span></div> },
          { l: 'Asignada el', content: <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtDateShort(tActual.creadoEn)}</div> },
          { l: 'Respuesta esperada', content: <div style={{ fontSize: 13, fontWeight: 700, color: isOverdue(tActual.fechaLimite) && !['finalizada','cancelada'].includes(tActual.estadoActual) ? C.red : C.ink }}>{fmtDateShort(tActual.fechaLimite)}</div>, warn: isOverdue(tActual.fechaLimite) },
        ].map(({ l, content, warn }) => (
          <div key={l} style={{ background: warn ? C.redL : C.bg, borderRadius: 9, padding: '8px 11px' }}>
            <div style={{ fontSize: 10, color: C.light, marginBottom: 4 }}>{l}</div>
            {content}
          </div>
        ))}
      </div>

      {/* Adjuntos existentes */}
      {tActual.adjuntos?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Adjuntos ({tActual.adjuntos.length})</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
            {tActual.adjuntos.filter(a => a.tipo === 'img').map(a => (
              <div key={a.id} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, aspectRatio: '1', background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={a.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none' }}/>
              </div>
            ))}
          </div>
          {tActual.adjuntos.filter(a => a.tipo === 'pdf').map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.redL, borderRadius: 8, marginBottom: 5, border: `1px solid ${C.red}33` }}>
              <span style={{ background: C.red, color: '#fff', borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>PDF</span>
              <span style={{ fontSize: 12, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
            </div>
          ))}
        </div>
      )}

      {/* Historial */}
      <SectionLabel>Historial de cambios</SectionLabel>
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 1.5, background: C.border, borderRadius: 1 }}/>
        {[...tActual.changelog].reverse().map(cl => {
          const u = cl.usuarioId === 'system' ? null : usuarios.find(u => u.id === cl.usuarioId)
          const e = ESTADOS[cl.estado] || ESTADOS.pendiente
          return (
            <div key={cl.id} style={{ display: 'flex', gap: 10, paddingBottom: 10, paddingLeft: 2 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: CLCOLORS[cl.estado] || C.mid, flexShrink: 0, marginTop: 4, zIndex: 1, border: `2px solid ${C.card}` }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ background: e.bg, color: e.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{e.label}</span>
                  <span style={{ fontSize: 10, color: C.light, whiteSpace: 'nowrap' }}>{fmtTS(cl.ts)}</span>
                </div>
                {cl.comentario && <div style={{ fontSize: 12, color: C.mid, marginTop: 4, fontStyle: 'italic' }}>"{cl.comentario}"</div>}
                <div style={{ fontSize: 11, color: C.light, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {u ? <><Avatar usuario={u} size={14}/>{u.nombre}</> : 'Sistema'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cambiar estado */}
      {!showCambio && posibles.length > 0 && (
        <button onClick={() => setShowCambio(true)} style={{ width: '100%', padding: '12px 0', background: C.amber, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Actualizar estado
        </button>
      )}
      {!showCambio && posibles.length === 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: C.light, padding: '8px 0' }}>
          {['finalizada','cancelada'].includes(tActual.estadoActual) ? 'Tarea cerrada.' : 'Cambiá el usuario activo para modificar el estado.'}
        </div>
      )}
      {showCambio && (
        <div>
          <SectionLabel>Nuevo estado</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {posibles.map(est => {
              const e = ESTADOS[est]
              return (
                <button key={est} onClick={() => setNuevoEst(est)} style={{
                  padding: '7px 13px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${nuevoEst === est ? e.color : C.border}`,
                  background: nuevoEst === est ? e.bg : 'none',
                  color: nuevoEst === est ? e.color : C.mid,
                }}>
                  {e.label}
                </button>
              )
            })}
          </div>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)}
            placeholder={nuevoEst === 'no_puedo' ? 'Comentario obligatorio — explicá por qué no podés...' : 'Comentario opcional...'}
            rows={3} style={{ width: '100%', padding: '9px 11px', background: '#FAFAF7', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.ink, fontSize: 13, fontFamily: 'inherit', resize: 'none', marginBottom: 8 }}/>
          {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 9 }}>
            <Btn onClick={confirmar} disabled={!nuevoEst} s={{ flex: 1, padding: '12px 0' }}>Confirmar</Btn>
            <Btn outline col={C.mid} onClick={() => { setShowCambio(false); setNuevoEst(''); setComentario(''); setError('') }} s={{ padding: '12px 18px' }}>Cancelar</Btn>
          </div>
        </div>
      )}
    </Sheet>
  )
}

// ── Modal crear/editar tarea ───────────────────────────────────────────────────
function ModalEditar({ tarea, usuarios, catList, usuActivo, esGral, onSave, onClose, uid, now, setTObra, setTGral, tareasObra, tareasGral }) {
  const empty = {
    titulo: '', desc: '', catId: catList[0]?.id || '',
    asignadoId: usuActivo, fechaLimite: todayISO(7), prioridad: 'normal',
  }
  const [f, setF]       = useState(tarea ? { titulo: tarea.titulo, desc: tarea.desc || '', catId: tarea.catId, asignadoId: tarea.asignadoId, fechaLimite: tarea.fechaLimite, prioridad: tarea.prioridad } : empty)
  const [adjPend, setAdj] = useState([])
  const [error, setError] = useState('')
  const fileRef = useRef()
  const upd = k => v => setF(p => ({ ...p, [k]: v }))

  const handleFiles = e => {
    Array.from(e.target.files).forEach(file => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const adj = { id: uid(), tipo: isPdf ? 'pdf' : 'img', nombre: file.name, ts: now(), url: '' }
      if (!isPdf) {
        const r = new FileReader()
        r.onload = ev => { adj.url = ev.target.result; setAdj(p => [...p, adj]) }
        r.readAsDataURL(file)
      } else {
        setAdj(p => [...p, adj])
      }
    })
    e.target.value = ''
  }

  const guardar = () => {
    if (!f.titulo.trim()) { setError('El título es obligatorio.'); return }
    if (!f.fechaLimite)   { setError('La fecha es obligatoria.'); return }
    onSave(f, adjPend)
    onClose()
  }

  return (
    <Sheet onClose={onClose} maxH="92vh">
      <div style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 16 }}>
        {tarea ? 'Editar tarea' : `Nueva ${esGral ? 'tarea general' : 'tarea de obra'}`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Título" value={f.titulo} onChange={upd('titulo')} placeholder="Ej: Pedir material al corralón" required/>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Descripción (opcional)</div>
          <textarea value={f.desc} onChange={e => upd('desc')(e.target.value)} placeholder="Contexto, instrucciones..." rows={3}
            style={{ width: '100%', padding: '9px 12px', background: '#FAFAF7', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.ink, fontSize: 13, fontFamily: 'inherit', resize: 'none' }}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SelectField label="Categoría" value={f.catId} onChange={upd('catId')} options={catList.map(c => ({ value: c.id, label: c.label }))}/>
          <SelectField label="Prioridad" value={f.prioridad} onChange={upd('prioridad')} options={Object.entries(PRIORIDADES).map(([k, v]) => ({ value: k, label: v.label }))}/>
        </div>
        <SelectField label="Asignar a" value={f.asignadoId} onChange={upd('asignadoId')} options={usuarios.map(u => ({ value: u.id, label: `${u.nombre} (${u.rol})` }))}/>
        <Field label="Fecha de respuesta esperada" type="date" value={f.fechaLimite} onChange={upd('fechaLimite')} required/>

        {/* Adjuntos */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>Adjuntos (fotos y PDFs)</div>
          {adjPend.filter(a => a.tipo === 'img').length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
              {adjPend.filter(a => a.tipo === 'img').map(a => (
                <div key={a.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', border: `1px solid ${C.border}` }}>
                  <img src={a.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  <button onClick={() => setAdj(p => p.filter(x => x.id !== a.id))} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {adjPend.filter(a => a.tipo === 'pdf').map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.redL, borderRadius: 8, marginBottom: 5, border: `1px solid ${C.red}33` }}>
              <span style={{ background: C.red, color: '#fff', borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>PDF</span>
              <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
              <button onClick={() => setAdj(p => p.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 14 }}>✕</button>
            </div>
          ))}
          <button onClick={() => fileRef.current.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 10, background: '#EDE8E1', border: `1.5px dashed #C8B8A8`, borderRadius: 9, cursor: 'pointer', color: C.mid, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
            📎 Agregar fotos o PDF
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFiles}/>
        </div>

        {error && <div style={{ fontSize: 12, color: C.red, background: C.redL, padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={guardar} s={{ flex: 1, padding: '13px 0' }}>{tarea ? 'Guardar cambios' : 'Crear tarea'}</Btn>
          <Btn outline col={C.mid} onClick={onClose} s={{ padding: '13px 18px' }}>Cancelar</Btn>
        </div>
      </div>
    </Sheet>
  )
}

// ── Tab principal ──────────────────────────────────────────────────────────────
export default function TabTareas({ obra, tareasObra, tareasGral, usuarios, usuActivo, cambiarEstado, setTObra, setTGral, catGral, addLog, uid, now, esGral, obraActiva }) {
  const [filtEst,    setFiltEst]   = useState('all')
  const [filtCat,    setFiltCat]   = useState('all')
  const [filtUser,   setFiltUser]  = useState('all')
  const [buscar,     setBuscar]    = useState('')
  const [detalle,    setDetalle]   = useState(null)
  const [editando,   setEditando]  = useState(null)
  const [creando,    setCreando]   = useState(false)

  const tareas  = esGral ? tareasGral : tareasObra.filter(t => t.obraId === obraActiva)
  const catList = esGral ? catGral    : (obra?.catTareas || [])
  const setArr  = esGral ? setTGral   : v => setTObra(v)
  const allArr  = esGral ? tareasGral : tareasObra

  const filtradas = tareas.filter(t => {
    if (filtEst  !== 'all' && t.estadoActual !== filtEst)  return false
    if (filtCat  !== 'all' && t.catId        !== filtCat)  return false
    if (filtUser !== 'all' && t.asignadoId   !== filtUser) return false
    if (buscar && !t.titulo.toLowerCase().includes(buscar.toLowerCase()) && !(t.desc || '').toLowerCase().includes(buscar.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    const ord = { vencida: 0, pendiente: 1, en_progreso: 2, esperando_respuesta: 3, finalizada: 4, cancelada: 5 }
    return (ord[a.estadoActual] || 3) - (ord[b.estadoActual] || 3) || new Date(a.fechaLimite) - new Date(b.fechaLimite)
  })

  const kpis = [
    { l: 'Total',      v: tareas.length,                                                             c: C.ink   },
    { l: 'Pendiente',  v: tareas.filter(t => t.estadoActual === 'pendiente').length,                 c: C.gold  },
    { l: 'En curso',   v: tareas.filter(t => ['en_progreso','esperando_respuesta'].includes(t.estadoActual)).length, c: C.blue  },
    { l: 'Vencidas',   v: tareas.filter(t => t.estadoActual === 'vencida').length,                   c: C.red   },
    { l: 'Listas',     v: tareas.filter(t => t.estadoActual === 'finalizada').length,                c: C.green },
  ]

  const crearTarea = (f, adjPend) => {
    const t = {
      id: uid(), titulo: f.titulo, desc: f.desc, catId: f.catId,
      asignadoId: f.asignadoId, creadoPorId: usuActivo,
      creadoEn: now(), fechaLimite: f.fechaLimite, prioridad: f.prioridad,
      estadoActual: 'pendiente',
      adjuntos: adjPend || [],
      ...(esGral ? {} : { obraId: obraActiva }),
      changelog: [{ id: uid(), estado: 'pendiente', usuarioId: usuActivo, ts: now(), comentario: 'Tarea creada y asignada' }],
    }
    setArr(esGral ? [...tareasGral, t] : [...allArr, t])
    addLog('tarea', `Nueva tarea: "${f.titulo}"`, esGral ? 'General' : obra?.nombre)
  }

  const editarTarea = (f, adjPend) => {
    const upd = arr => arr.map(t => t.id !== editando.id ? t : {
      ...t, titulo: f.titulo, desc: f.desc, catId: f.catId,
      asignadoId: f.asignadoId, fechaLimite: f.fechaLimite, prioridad: f.prioridad,
      adjuntos: [...(t.adjuntos || []), ...(adjPend || [])],
      changelog: [...t.changelog, { id: uid(), estado: t.estadoActual, usuarioId: usuActivo, ts: now(), comentario: 'Tarea editada' }],
    })
    setArr(esGral ? upd(tareasGral) : upd(allArr))
    addLog('tarea', `Tarea editada: "${f.titulo}"`)
    setDetalle(null)
  }

  const acColor = esGral ? C.purple : C.amber

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7, marginBottom: 13 }}>
        {kpis.map(k => (
          <div key={k.l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 5px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 19, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 9, color: C.mid, marginTop: 1 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar tareas..."
        style={{ width: '100%', padding: '9px 12px', background: '#FAFAF7', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.ink, fontSize: 13, fontFamily: 'inherit', marginBottom: 10 }}/>

      {/* Filtro estado */}
      <ChipRow>
        <Chip active={filtEst === 'all'} onClick={() => setFiltEst('all')} activeColor={acColor}>Todos</Chip>
        {Object.entries(ESTADOS).map(([k, v]) => (
          <Chip key={k} active={filtEst === k} onClick={() => setFiltEst(k)} activeColor={v.color} activeBg={v.bg}>{v.label}</Chip>
        ))}
      </ChipRow>

      {/* Filtros cat + user */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={filtCat} onChange={e => setFiltCat(e.target.value)} style={{ flex: 1, padding: '7px 10px', background: '#EDE8E1', border: '1px solid #C8B8A8', borderRadius: 8, color: C.mid, fontSize: 12, fontFamily: 'inherit', minWidth: 120 }}>
          <option value="all">Todas las categorías</option>
          {catList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={filtUser} onChange={e => setFiltUser(e.target.value)} style={{ flex: 1, padding: '7px 10px', background: '#EDE8E1', border: '1px solid #C8B8A8', borderRadius: 8, color: C.mid, fontSize: 12, fontFamily: 'inherit', minWidth: 120 }}>
          <option value="all">Todas las personas</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>

      <AddButton onClick={() => setCreando(true)} color={acColor}>
        + Nueva {esGral ? 'tarea general' : 'tarea de obra'}
      </AddButton>

      {filtradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px', color: C.light, fontSize: 14 }}>
          {tareas.length === 0 ? 'Sin tareas aún. ¡Creá la primera!' : 'Sin tareas con estos filtros.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtradas.map(t => {
          const asig = usuarios.find(u => u.id === t.asignadoId)
          const cat  = catList.find(c => c.id === t.catId)
          const e    = ESTADOS[t.estadoActual] || ESTADOS.pendiente
          const p    = PRIORIDADES[t.prioridad] || PRIORIDADES.normal
          const venc = isOverdue(t.fechaLimite) && !['finalizada','cancelada'].includes(t.estadoActual)
          return (
            <div key={t.id} onClick={() => setDetalle(t)} style={{
              background: C.card, cursor: 'pointer',
              border: `1.5px solid ${t.estadoActual === 'vencida' ? C.red + '44' : t.estadoActual === 'esperando_respuesta' ? C.amber + '44' : C.border}`,
              borderRadius: 13, padding: '12px 14px',
              transition: 'border-color .15s',
            }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                <span style={{ background: e.bg, color: e.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{e.label}</span>
                {t.prioridad !== 'normal' && <span style={{ background: p.bg, color: p.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{p.label}</span>}
                {cat && <span style={{ background: cat.color + '22', color: cat.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{cat.label}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: t.estadoActual === 'cancelada' ? 'line-through' : 'none' }}>{t.titulo}</div>
              {t.desc && <div style={{ fontSize: 11, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{t.desc}</div>}
              <AdjPills adjuntos={t.adjuntos}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Avatar usuario={asig} size={20}/>
                  <span style={{ fontSize: 11, color: C.mid }}>{asig?.nombre}</span>
                  <span style={{ fontSize: 11, color: venc ? C.red : C.light }}>· {fmtDateShort(t.fechaLimite)}</span>
                </div>
                <span style={{ fontSize: 10, color: C.light }}>{t.changelog.length} cambios</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modales */}
      {detalle && (
        <ModalDetalle
          tarea={detalle} usuarios={usuarios} catList={catList}
          usuActivo={usuActivo} esGral={esGral}
          cambiarEstado={cambiarEstado}
          tareasObra={tareasObra} tareasGral={tareasGral}
          onClose={() => setDetalle(null)}
          onEditar={() => { setEditando(detalle); setDetalle(null) }}
        />
      )}
      {editando && (
        <ModalEditar tarea={editando} usuarios={usuarios} catList={catList} usuActivo={usuActivo} esGral={esGral} uid={uid} now={now} setTObra={setTObra} setTGral={setTGral} tareasObra={tareasObra} tareasGral={tareasGral} onSave={editarTarea} onClose={() => setEditando(null)}/>
      )}
      {creando && (
        <ModalEditar tarea={null} usuarios={usuarios} catList={catList} usuActivo={usuActivo} esGral={esGral} uid={uid} now={now} setTObra={setTObra} setTGral={setTGral} tareasObra={tareasObra} tareasGral={tareasGral} onSave={crearTarea} onClose={() => setCreando(false)}/>
      )}
    </div>
  )
}
