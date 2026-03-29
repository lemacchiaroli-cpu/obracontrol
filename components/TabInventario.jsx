import { useState } from 'react'
import { C, Bar, Box, Btn, Field, Sheet, AddButton, Chip, ChipRow, SectionLabel } from '../ui.jsx'
import { uid } from '../store.js'

const mEst  = m => m.s / m.min <= 0.3 ? 'crit' : m.s < m.min ? 'bajo' : 'ok'
const EC    = { ok: '#1E7E4E', bajo: '#B7950B', crit: '#C0392B' }
const EB    = { ok: '#E8F5EE', bajo: '#FEF9E7', crit: '#FDEDEB' }
const EL    = { ok: 'OK',     bajo: 'Stock bajo', crit: 'Crítico' }

function ModalEditMat({ mat, onSave, onClose }) {
  const [s, setS]   = useState(mat.s)
  const [ped, setPed] = useState(mat.ped)
  return (
    <Sheet onClose={onClose}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 18 }}>{mat.nom}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: C.mid }}>Stock actual</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 22, color: C.amber }}>{s} {mat.u}</span>
      </div>
      <input type="range" min="0" max={mat.min * 3} value={s} step="1" onChange={e => setS(+e.target.value)} style={{ marginBottom: 6 }}/>
      <div style={{ fontSize: 11, color: C.light, marginBottom: 16 }}>Mínimo: {mat.min} {mat.u}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.mid, marginBottom: 20 }}>
        <input type="checkbox" checked={ped} onChange={e => setPed(e.target.checked)}/>
        Pedido activado
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn s={{ flex: 1 }} onClick={() => { onSave(s, ped); onClose() }}>Guardar</Btn>
        <Btn outline col={C.mid} s={{ padding: '10px 18px' }} onClick={onClose}>Cancelar</Btn>
      </div>
    </Sheet>
  )
}

function ModalNuevoMat({ obraId, onSave, onClose }) {
  const [f, setF] = useState({ nom: '', u: 'unid.', s: 0, min: 10, cat: 'General' })
  const upd = k => v => setF(p => ({ ...p, [k]: v }))
  return (
    <Sheet onClose={onClose}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Nuevo material</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <Field label="Nombre" value={f.nom} onChange={upd('nom')} placeholder="Cemento Portland..." required/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Unidad" value={f.u} onChange={upd('u')} placeholder="sacos, m³..."/>
          <Field label="Categoría" value={f.cat} onChange={upd('cat')} placeholder="Estructura..."/>
          <Field label="Stock inicial" type="number" value={String(f.s)} onChange={v => upd('s')(+v)}/>
          <Field label="Stock mínimo" type="number" value={String(f.min)} onChange={v => upd('min')(+v)}/>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn s={{ flex: 1 }} onClick={() => { if (f.nom.trim()) { onSave(f); onClose() } }}>Agregar</Btn>
          <Btn outline col={C.mid} s={{ padding: '10px 18px' }} onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Sheet>
  )
}

export default function TabInventario({ materiales, setMat, obraActiva, addLog, obra }) {
  const [fil,    setFil]    = useState('all')
  const [editM,  setEditM]  = useState(null)
  const [nuevo,  setNuevo]  = useState(false)

  const mats = materiales.filter(m => m.obraId === obraActiva)
  const cats = [...new Set(mats.map(m => m.cat))]
  const filtd = mats.filter(m => fil === 'all' ? true : fil === 'alerta' ? mEst(m) !== 'ok' : m.cat === fil)

  const cr = mats.filter(m => mEst(m) === 'crit').length
  const bj = mats.filter(m => mEst(m) === 'bajo').length
  const pd = mats.filter(m => m.ped).length

  const saveMat = (id, s, ped) => {
    const m = mats.find(x => x.id === id)
    setMat(materiales.map(x => x.id === id ? { ...x, s, ped } : x))
    if (m) addLog('material', `Stock "${m.nom}": ${m.s} → ${s} ${m.u}`, obra?.nombre)
  }

  const togPed = id => {
    const m = mats.find(x => x.id === id)
    setMat(materiales.map(x => x.id === id ? { ...x, ped: !x.ped } : x))
    if (m) addLog('material', `${m.ped ? 'Pedido cancelado' : 'Pedido activado'}: "${m.nom}"`, obra?.nombre)
  }

  const delMat = id => {
    const m = mats.find(x => x.id === id)
    if (window.confirm(`¿Eliminar "${m?.nom}"?`)) {
      setMat(materiales.filter(x => x.id !== id))
      addLog('material', `Eliminado: "${m?.nom}"`, obra?.nombre)
    }
  }

  const addMat = f => {
    const nuevo = { ...f, id: uid(), obraId: obraActiva, s: +f.s, min: +f.min, ped: false }
    setMat([...materiales, nuevo])
    addLog('material', `Nuevo material: "${f.nom}"`, obra?.nombre)
  }

  return (
    <div>
      {/* KPIs stock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginBottom: 13 }}>
        {[
          { l: 'Críticos',    v: cr, c: C.red,   b: '#FDEDEB' },
          { l: 'Stock bajo',  v: bj, c: C.gold,  b: '#FEF9E7' },
          { l: 'Con pedido',  v: pd, c: C.blue,  b: '#EBF2F8' },
        ].map(k => (
          <div key={k.l} style={{ background: k.v > 0 ? k.b : '#E8F5EE', border: `1.5px solid ${k.v > 0 ? k.c + '33' : C.green + '33'}`, borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 24, color: k.v > 0 ? k.c : C.green }}>{k.v}</div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <ChipRow>
        <Chip active={fil === 'all'}    onClick={() => setFil('all')}>Todos</Chip>
        <Chip active={fil === 'alerta'} onClick={() => setFil('alerta')}>Con alerta</Chip>
        {cats.map(c => <Chip key={c} active={fil === c} onClick={() => setFil(c)}>{c}</Chip>)}
      </ChipRow>

      <AddButton onClick={() => setNuevo(true)}>+ Agregar material</AddButton>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtd.map(m => {
          const est = mEst(m)
          const pc  = Math.min(100, Math.round(m.s / (m.min * 2) * 100))
          return (
            <div key={m.id} style={{ background: C.card, border: `1.5px solid ${est !== 'ok' ? EC[est] + '44' : C.border}`, borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{m.nom}</div>
                  <div style={{ fontSize: 11, color: C.light }}>{m.cat} · Mín: {m.min} {m.u}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 10 }}>
                  <span style={{ background: EB[est], color: EC[est], borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{EL[est]}</span>
                  {m.ped && <span style={{ background: '#EBF2F8', color: C.blue, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>Pedido</span>}
                  <button onClick={() => delMat(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 15, padding: '2px' }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}><Bar v={pc} color={EC[est]} h={7}/></div>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: EC[est], flexShrink: 0 }}>
                  {m.s} <span style={{ fontSize: 10, fontWeight: 400, color: C.light }}>{m.u}</span>
                </span>
                <button onClick={() => togPed(m.id)} style={{ background: m.ped ? '#EBF2F8' : '#EDE8E1', color: m.ped ? C.blue : C.mid, border: `1.5px solid ${m.ped ? C.blue + '55' : '#C8B8A8'}`, borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>
                  {m.ped ? 'Pedido ✓' : 'Pedir'}
                </button>
                <button onClick={() => setEditM(m)} style={{ background: C.amberL, color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 7, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', flexShrink: 0 }}>
                  Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editM && <ModalEditMat mat={editM} onSave={(s, ped) => saveMat(editM.id, s, ped)} onClose={() => setEditM(null)}/>}
      {nuevo  && <ModalNuevoMat obraId={obraActiva} onSave={addMat} onClose={() => setNuevo(false)}/>}
    </div>
  )
}
