import { useState, useEffect, useCallback, useRef } from 'react'
import {
  lsGet, lsSet, uid, now, todayISO, isOverdue,
  ESTADOS, PRIORIDADES, TRANSICIONES, HIST_TIPOS,
  SEED_OBRAS, SEED_USUARIOS, SEED_ACTIVIDADES, SEED_MATERIALES,
  SEED_TAREAS_OBRA, SEED_TAREAS_GENERALES, SEED_CAT_GENERALES, SEED_HISTORIAL,
} from './store.js'
import {
  FIREBASE_HABILITADO, KEYS, fbSet, fbSubscribe, initFirebaseIfEmpty,
} from './firebase.js'
import { C, Clock, Avatar } from './ui.jsx'
import TabDashboard   from './components/TabDashboard.jsx'
import TabAvances     from './components/TabAvances.jsx'
import TabTareas      from './components/TabTareas.jsx'
import TabInventario  from './components/TabInventario.jsx'
import TabObras       from './components/TabObras.jsx'
import TabHistorial   from './components/TabHistorial.jsx'
import TabConfig      from './components/TabConfig.jsx'
import SelectUser     from './components/SelectUser.jsx'

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',    ic: '📊' },
  { id: 'avances',    label: 'Avances',      ic: '📋' },
  { id: 'tareas',     label: 'Tareas obra',  ic: '✅' },
  { id: 'generales',  label: 'Tareas gral.', ic: '📝', global: true },
  { id: 'inventario', label: 'Inventario',   ic: '📦' },
  { id: 'historial',  label: 'Historial',    ic: '🕓' },
  { id: 'obras',      label: 'Mis obras',    ic: '🏗' },
  { id: 'config',     label: 'Config.',      ic: '⚙️' },
]

export default function App() {
  const [obras,      setObrasRaw]    = useState(() => lsGet('oc_obras',     SEED_OBRAS))
  const [usuarios,   setUsuariosRaw] = useState(() => lsGet('oc_usuarios',  SEED_USUARIOS))
  const [actividades,setActRaw]      = useState(() => lsGet('oc_act',       SEED_ACTIVIDADES))
  const [materiales, setMatRaw]      = useState(() => lsGet('oc_mats',      SEED_MATERIALES))
  const [tareasObra, setTObraRaw]    = useState(() => lsGet('oc_tarea_obra',SEED_TAREAS_OBRA))
  const [tareasGral, setTGralRaw]    = useState(() => lsGet('oc_tarea_gral',SEED_TAREAS_GENERALES))
  const [catGral,    setCatGralRaw]  = useState(() => lsGet('oc_cat_gral',  SEED_CAT_GENERALES))
  const [historial,  setHistRaw]     = useState(() => lsGet('oc_hist',      SEED_HISTORIAL))
  const [obraActiva, setObraActRaw]  = useState(() => lsGet('oc_obra_act',  'o1'))
  const [usuActivo,  setUsuActRaw]   = useState(() => lsGet('oc_usu_act',   'u1'))
  const [tab,        setTab]         = useState('dashboard')
  const [showUserSel,setShowUserSel] = useState(false)
  const [syncStatus, setSyncStatus]  = useState(FIREBASE_HABILITADO ? 'connecting' : 'local')

  // Evitar bucle: cuando Firebase nos manda datos, no los re-enviamos a Firebase
  const fromFB = useRef(false)

  // ── Factory de setters: escribe en state + localStorage + Firebase ─────────
  const mkSet = useCallback((rawSetter, lsKey, fbKey) => v => {
    rawSetter(v)
    lsSet(lsKey, v)
    if (FIREBASE_HABILITADO && !fromFB.current) fbSet(fbKey, v)
  }, [])

  const setObras    = useCallback(v => mkSet(setObrasRaw,    'oc_obras',      KEYS.obras)(v),       [mkSet])
  const setUsuarios = useCallback(v => mkSet(setUsuariosRaw, 'oc_usuarios',   KEYS.usuarios)(v),    [mkSet])
  const setAct      = useCallback(v => mkSet(setActRaw,      'oc_act',        KEYS.actividades)(v), [mkSet])
  const setMat      = useCallback(v => mkSet(setMatRaw,      'oc_mats',       KEYS.materiales)(v),  [mkSet])
  const setTObra    = useCallback(v => mkSet(setTObraRaw,    'oc_tarea_obra', KEYS.tareasObra)(v),  [mkSet])
  const setTGral    = useCallback(v => mkSet(setTGralRaw,    'oc_tarea_gral', KEYS.tareasGral)(v),  [mkSet])
  const setCatGral  = useCallback(v => mkSet(setCatGralRaw,  'oc_cat_gral',   KEYS.catGral)(v),     [mkSet])
  const setHist     = useCallback(v => mkSet(setHistRaw,     'oc_hist',       KEYS.historial)(v),   [mkSet])
  const setObraAct  = useCallback(id => { setObraActRaw(id); lsSet('oc_obra_act', id) }, [])
  const setUsuAct   = useCallback(id => { setUsuActRaw(id);  lsSet('oc_usu_act', id)  }, [])

  // ── addLog ─────────────────────────────────────────────────────────────────
  const addLog = useCallback((tipo, det, extra = '') => {
    setHist(prev => {
      const next = [...prev, { id: uid(), ts: now(), tipo, usuarioId: usuActivo, det, extra }]
      lsSet('oc_hist', next)
      if (FIREBASE_HABILITADO && !fromFB.current) fbSet(KEYS.historial, next)
      return next
    })
  }, [usuActivo])

  // ── Firebase: conectar y suscribir en tiempo real ──────────────────────────
  useEffect(() => {
    if (!FIREBASE_HABILITADO) return
    let unsubs = []

    const connect = async () => {
      try {
        // Si la DB está vacía, subir datos actuales como punto de partida
        await initFirebaseIfEmpty({
          obras:       lsGet('oc_obras',      SEED_OBRAS),
          usuarios:    lsGet('oc_usuarios',   SEED_USUARIOS),
          actividades: lsGet('oc_act',        SEED_ACTIVIDADES),
          materiales:  lsGet('oc_mats',       SEED_MATERIALES),
          tareasObra:  lsGet('oc_tarea_obra', SEED_TAREAS_OBRA),
          tareasGral:  lsGet('oc_tarea_gral', SEED_TAREAS_GENERALES),
          catGral:     lsGet('oc_cat_gral',   SEED_CAT_GENERALES),
          historial:   lsGet('oc_hist',       SEED_HISTORIAL),
        })

        // Suscripciones — cada vez que Firebase cambia, actualiza state + localStorage
        const subs = [
          [KEYS.obras,       (v, s) => { fromFB.current=true; s(v); lsSet('oc_obras',v);      fromFB.current=false }, setObrasRaw],
          [KEYS.usuarios,    (v, s) => { fromFB.current=true; s(v); lsSet('oc_usuarios',v);   fromFB.current=false }, setUsuariosRaw],
          [KEYS.actividades, (v, s) => { fromFB.current=true; s(v); lsSet('oc_act',v);        fromFB.current=false }, setActRaw],
          [KEYS.materiales,  (v, s) => { fromFB.current=true; s(v); lsSet('oc_mats',v);       fromFB.current=false }, setMatRaw],
          [KEYS.tareasObra,  (v, s) => { fromFB.current=true; s(v); lsSet('oc_tarea_obra',v); fromFB.current=false }, setTObraRaw],
          [KEYS.tareasGral,  (v, s) => { fromFB.current=true; s(v); lsSet('oc_tarea_gral',v); fromFB.current=false }, setTGralRaw],
          [KEYS.catGral,     (v, s) => { fromFB.current=true; s(v); lsSet('oc_cat_gral',v);   fromFB.current=false }, setCatGralRaw],
          [KEYS.historial,   (v, s) => { fromFB.current=true; s(v); lsSet('oc_hist',v);       fromFB.current=false }, setHistRaw],
        ]
        unsubs = subs.map(([key, cb, setter]) => fbSubscribe(key, v => cb(v, setter)))
        setSyncStatus('synced')
      } catch (e) {
        console.warn('[Firebase] Error de conexión:', e)
        setSyncStatus('error')
      }
    }

    connect()
    return () => unsubs.forEach(u => u())
  }, [])

  // ── Marcar tareas vencidas al abrir ────────────────────────────────────────
  useEffect(() => {
    const today = todayISO()
    const markOverdue = arr => arr.map(t =>
      !['finalizada','cancelada','vencida'].includes(t.estadoActual) && t.fechaLimite < today
        ? { ...t, estadoActual: 'vencida', changelog: [...t.changelog, { id: uid(), estado: 'vencida', usuarioId: 'system', ts: now(), comentario: 'Vencimiento automático por fecha' }] }
        : t
    )
    setTObra(markOverdue(lsGet('oc_tarea_obra', SEED_TAREAS_OBRA)))
    setTGral(markOverdue(lsGet('oc_tarea_gral', SEED_TAREAS_GENERALES)))
  }, [])

  // ── cambiarEstado ──────────────────────────────────────────────────────────
  const cambiarEstado = useCallback((id, nuevoEstado, comentario, esGral = false) => {
    const upd = arr => arr.map(t => t.id !== id ? t : {
      ...t, estadoActual: nuevoEstado,
      changelog: [...t.changelog, { id: uid(), estado: nuevoEstado, usuarioId: usuActivo, ts: now(), comentario: comentario || '' }],
    })
    if (esGral) setTGral(upd(tareasGral))
    else        setTObra(upd(tareasObra))
    addLog('tarea', `Tarea → ${ESTADOS[nuevoEstado]?.label}`, comentario)
  }, [usuActivo, tareasObra, tareasGral, setTObra, setTGral, addLog])

  // ── Datos derivados ────────────────────────────────────────────────────────
  const obra         = obras.find(o => o.id === obraActiva) || obras[0]
  const usuObj       = usuarios.find(u => u.id === usuActivo)
  const tareasDeObra = tareasObra.filter(t => t.obraId === obraActiva)
  const vencidasObra = tareasDeObra.filter(t => t.estadoActual === 'vencida').length
  const matBajos     = materiales.filter(m => m.obraId === obraActiva && m.s < m.min).length
  const criticas     = actividades.filter(a => a.obraId === obraActiva && a.crit && a.av < 100).length

  const CTX = {
    obra, obras, usuarios, actividades, materiales,
    tareasObra, tareasGral, catGral, historial,
    obraActiva, usuActivo, usuObj,
    setObras, setUsuarios, setAct, setMat,
    setTObra, setTGral, setCatGral, setHist,
    setObraAct, setUsuAct, addLog, cambiarEstado,
    ESTADOS, PRIORIDADES, TRANSICIONES, HIST_TIPOS,
    uid, now, todayISO, isOverdue,
  }

  // ── Indicador de sincronización ────────────────────────────────────────────
  const syncCfg = {
    local:      { color: C.light, label: 'LOCAL'  },
    connecting: { color: C.gold,  label: '...'    },
    synced:     { color: C.green, label: 'LIVE'   },
    error:      { color: C.red,   label: 'OFF'    },
  }[syncStatus]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", color: C.ink, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        button,select,input,textarea{font-family:inherit;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#C8610A!important;}
        input[type=range]{-webkit-appearance:none;height:6px;border-radius:3px;background:#E2DDD5;display:block;width:100%;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#C8610A;cursor:pointer;}
        input[type=checkbox]{accent-color:#C8610A;width:16px;height:16px;cursor:pointer;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-thumb{background:#E2DDD5;border-radius:3px;}
        body{overflow-x:hidden;}
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.ink, position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
        <div style={{ padding: '0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🏗</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.1 }}>ObraControl</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
                {tab === 'generales' ? 'Tareas generales' : tab === 'obras' ? 'Mis obras' : tab === 'config' ? 'Configuración' : obra?.nombre}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Dot de sincronización */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={syncCfg.label}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: syncCfg.color, flexShrink: 0, animation: syncStatus === 'connecting' ? 'pulse 1s infinite' : 'none' }}/>
              <span style={{ fontSize: 9, color: syncCfg.color, fontWeight: 700 }}>{syncCfg.label}</span>
            </div>
            {criticas    > 0 && <span style={{ fontSize: 11, color: '#f97316', fontWeight: 700 }}>⚡{criticas}</span>}
            {vencidasObra > 0 && <span style={{ fontSize: 11, color: '#facc15', fontWeight: 700 }}>⚠{vencidasObra}</span>}
            {matBajos    > 0 && <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700 }}>📦{matBajos}</span>}
            <Clock/>
            <button onClick={() => setShowUserSel(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,.2)', borderRadius: 99, padding: '3px 9px 3px 4px', cursor: 'pointer' }}>
              <Avatar usuario={usuObj} size={22}/>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{usuObj?.ini}</span>
            </button>
          </div>
        </div>

        {/* Banda obra / generales */}
        {!['generales','obras','config'].includes(tab) ? (
          <div style={{ background: C.amberL, borderBottom: `1px solid ${C.border}`, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.amber, whiteSpace: 'nowrap' }}>OBRA:</span>
            <select value={obraActiva} onChange={e => setObraAct(e.target.value)} style={{ flex: 1, background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: C.amber, cursor: 'pointer', fontFamily: 'inherit' }}>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </div>
        ) : tab === 'generales' ? (
          <div style={{ background: C.purpleL, borderBottom: `1px solid ${C.border}`, padding: '5px 14px' }}>
            <span style={{ fontSize: 11, color: C.purple, fontWeight: 700 }}>📝 Tareas generales — independientes de obras</span>
          </div>
        ) : null}
      </div>

      {/* Banner si Firebase no está configurado */}
      {!FIREBASE_HABILITADO && (
        <div style={{ background: C.goldL, borderBottom: `1px solid ${C.gold}44`, padding: '9px 14px', display: 'flex', gap: 9, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>Modo local — sin sincronización entre dispositivos</div>
            <div style={{ fontSize: 11, color: C.mid }}>Configurá Firebase en src/firebase.js para activar el tiempo real.</div>
          </div>
        </div>
      )}

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '14px 12px 80px', overflowY: 'auto' }}>
        {tab === 'dashboard'  && <TabDashboard  {...CTX}/>}
        {tab === 'avances'    && <TabAvances    {...CTX}/>}
        {tab === 'tareas'     && <TabTareas     {...CTX} esGral={false}/>}
        {tab === 'generales'  && <TabTareas     {...CTX} esGral={true}/>}
        {tab === 'inventario' && <TabInventario {...CTX}/>}
        {tab === 'historial'  && <TabHistorial  {...CTX}/>}
        {tab === 'obras'      && <TabObras      {...CTX}/>}
        {tab === 'config'     && <TabConfig     {...CTX}/>}
      </div>

      {/* ── Bottom nav ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(t => {
          const active  = tab === t.id
          const acColor = t.global ? C.purple : C.amber
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px 2px 10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: 'inherit', position: 'relative' }}>
              {active && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: acColor, borderRadius: 99 }}/>}
              <span style={{ fontSize: 16 }}>{t.ic}</span>
              <span style={{ fontSize: 9, fontWeight: active ? 800 : 600, color: active ? acColor : C.light }}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {showUserSel && (
        <SelectUser usuarios={usuarios} usuActivo={usuActivo} onSelect={id => { setUsuAct(id); setShowUserSel(false) }} onClose={() => setShowUserSel(false)}/>
      )}
    </div>
  )
}
