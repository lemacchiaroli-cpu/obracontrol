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
  // ── Estado ─────────────────────────────────────────────────────────────────
  const [obras,      setObras]     = useState(() => lsGet('oc_obras',     SEED_OBRAS))
  const [usuarios,   setUsuarios]  = useState(() => lsGet('oc_usuarios',  SEED_USUARIOS))
  const [actividades,setAct]       = useState(() => lsGet('oc_act',       SEED_ACTIVIDADES))
  const [materiales, setMat]       = useState(() => lsGet('oc_mats',      SEED_MATERIALES))
  const [tareasObra, setTObra]     = useState(() => lsGet('oc_tarea_obra',SEED_TAREAS_OBRA))
  const [tareasGral, setTGral]     = useState(() => lsGet('oc_tarea_gral',SEED_TAREAS_GENERALES))
  const [catGral,    setCatGral]   = useState(() => lsGet('oc_cat_gral',  SEED_CAT_GENERALES))
  const [historial,  setHist]      = useState(() => lsGet('oc_hist',      SEED_HISTORIAL))
  const [obraActiva, setObraActiva]= useState(() => lsGet('oc_obra_act',  'o1'))
  const [usuActivo,  setUsuActivo] = useState(() => lsGet('oc_usu_act',   'u1'))
  const [tab,        setTab]       = useState('dashboard')
  const [showUserSel,setShowUserSel] = useState(false)
  const [syncStatus, setSyncStatus]  = useState(FIREBASE_HABILITADO ? 'connecting' : 'local')

  // ── Refs para los setters — evita dependencias en useEffect ───────────────
  // Guardamos los setters en refs para que el useEffect de Firebase
  // siempre tenga acceso a la versión actual sin necesidad de re-suscribir
  const setters = useRef({
    setObras, setUsuarios, setAct, setMat,
    setTObra, setTGral, setCatGral, setHist,
  })
  useEffect(() => {
    setters.current = { setObras, setUsuarios, setAct, setMat, setTObra, setTGral, setCatGral, setHist }
  })

  // ── Escritura local + Firebase ────────────────────────────────────────────
  // Estas funciones escriben en React state, localStorage Y Firebase
  const write = useCallback((setter, lsKey, fbKey, value) => {
    setter(value)
    lsSet(lsKey, value)
    if (FIREBASE_HABILITADO) fbSet(fbKey, value)
  }, [])

  const writeObras    = useCallback(v => write(setObras,    'oc_obras',      KEYS.obras,       v), [write])
  const writeUsuarios = useCallback(v => write(setUsuarios, 'oc_usuarios',   KEYS.usuarios,    v), [write])
  const writeAct      = useCallback(v => write(setAct,      'oc_act',        KEYS.actividades, v), [write])
  const writeMat      = useCallback(v => write(setMat,      'oc_mats',       KEYS.materiales,  v), [write])
  const writeTObra    = useCallback(v => write(setTObra,    'oc_tarea_obra', KEYS.tareasObra,  v), [write])
  const writeTGral    = useCallback(v => write(setTGral,    'oc_tarea_gral', KEYS.tareasGral,  v), [write])
  const writeCatGral  = useCallback(v => write(setCatGral,  'oc_cat_gral',   KEYS.catGral,     v), [write])
  const writeHist     = useCallback(v => write(setHist,     'oc_hist',       KEYS.historial,   v), [write])

  const setObraAct = useCallback(id => { setObraActiva(id); lsSet('oc_obra_act', id) }, [])
  const setUsuAct  = useCallback(id => { setUsuActivo(id);  lsSet('oc_usu_act',  id) }, [])

  // ── addLog ─────────────────────────────────────────────────────────────────
  const usuActivoRef = useRef(usuActivo)
  useEffect(() => { usuActivoRef.current = usuActivo }, [usuActivo])

  const addLog = useCallback((tipo, det, extra = '') => {
    setHist(prev => {
      const next = [...prev, {
        id: uid(), ts: now(), tipo,
        usuarioId: usuActivoRef.current, det, extra,
      }]
      lsSet('oc_hist', next)
      if (FIREBASE_HABILITADO) fbSet(KEYS.historial, next)
      return next
    })
  }, [])

  // ── Firebase: suscripciones en tiempo real ─────────────────────────────────
  // Patrón limpio: el useEffect solo se ejecuta una vez ([] vacío).
  // Usa setters.current para siempre tener el setter actualizado.
  // NO usa fromFB ref — en su lugar simplemente actualiza state + localStorage
  // y deja que Firebase maneje la deduplicación.
  useEffect(() => {
    if (!FIREBASE_HABILITADO) return

    const unsubs = []

    const connect = async () => {
      try {
        // Subir seeds si la DB está vacía
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

        // Cada suscripción: cuando Firebase cambia → actualiza state + localStorage
        const SUBS = [
          { key: KEYS.obras,       ls: 'oc_obras',      fn: v => setters.current.setObras(v)    },
          { key: KEYS.usuarios,    ls: 'oc_usuarios',   fn: v => setters.current.setUsuarios(v) },
          { key: KEYS.actividades, ls: 'oc_act',        fn: v => setters.current.setAct(v)      },
          { key: KEYS.materiales,  ls: 'oc_mats',       fn: v => setters.current.setMat(v)      },
          { key: KEYS.tareasObra,  ls: 'oc_tarea_obra', fn: v => setters.current.setTObra(v)    },
          { key: KEYS.tareasGral,  ls: 'oc_tarea_gral', fn: v => setters.current.setTGral(v)    },
          { key: KEYS.catGral,     ls: 'oc_cat_gral',   fn: v => setters.current.setCatGral(v)  },
          { key: KEYS.historial,   ls: 'oc_hist',       fn: v => setters.current.setHist(v)     },
        ]

        SUBS.forEach(({ key, ls, fn }) => {
          const unsub = fbSubscribe(key, value => {
            // Actualiza localStorage como caché offline
            lsSet(ls, value)
            // Actualiza React state → re-render automático
            fn(value)
          })
          unsubs.push(unsub)
        })

        setSyncStatus('synced')
      } catch (e) {
        console.warn('[Firebase] Error de conexión:', e)
        setSyncStatus('error')
      }
    }

    connect()

    // Cleanup: desuscribir cuando el componente se desmonta
    return () => unsubs.forEach(u => u())
  }, []) // ← array vacío: solo se ejecuta una vez al montar

  // ── Marcar tareas vencidas al abrir ────────────────────────────────────────
  useEffect(() => {
    const today = todayISO()
    const markOverdue = arr => {
      let changed = false
      const result = arr.map(t => {
        if (!['finalizada','cancelada','vencida'].includes(t.estadoActual) && t.fechaLimite < today) {
          changed = true
          return {
            ...t,
            estadoActual: 'vencida',
            changelog: [...t.changelog, {
              id: uid(), estado: 'vencida',
              usuarioId: 'system', ts: now(),
              comentario: 'Vencimiento automático por fecha',
            }],
          }
        }
        return t
      })
      return changed ? result : arr
    }

    const to = markOverdue(lsGet('oc_tarea_obra', SEED_TAREAS_OBRA))
    const tg = markOverdue(lsGet('oc_tarea_gral', SEED_TAREAS_GENERALES))

    // Solo escribe si hubo cambios reales
    const toOrig = lsGet('oc_tarea_obra', SEED_TAREAS_OBRA)
    const tgOrig = lsGet('oc_tarea_gral', SEED_TAREAS_GENERALES)
    if (to !== toOrig) writeTObra(to)
    if (tg !== tgOrig) writeTGral(tg)
  }, [])

  // ── cambiarEstado ──────────────────────────────────────────────────────────
  const cambiarEstado = useCallback((id, nuevoEstado, comentario, esGral = false) => {
    const hacer = (arr, writer) => {
      const next = arr.map(t => t.id !== id ? t : {
        ...t,
        estadoActual: nuevoEstado,
        changelog: [...t.changelog, {
          id: uid(), estado: nuevoEstado,
          usuarioId: usuActivoRef.current,
          ts: now(), comentario: comentario || '',
        }],
      })
      writer(next)
    }
    if (esGral) hacer(tareasGral, writeTGral)
    else        hacer(tareasObra, writeTObra)
    addLog('tarea', `Tarea → ${ESTADOS[nuevoEstado]?.label}`, comentario)
  }, [tareasObra, tareasGral, writeTObra, writeTGral, addLog])

  // ── Datos derivados ────────────────────────────────────────────────────────
  const obra         = obras.find(o => o.id === obraActiva) || obras[0]
  const usuObj       = usuarios.find(u => u.id === usuActivo)
  const tareasDeObra = tareasObra.filter(t => t.obraId === obraActiva)
  const vencidasObra = tareasDeObra.filter(t => t.estadoActual === 'vencida').length
  const matBajos     = materiales.filter(m => m.obraId === obraActiva && m.s < m.min).length
  const criticas     = actividades.filter(a => a.obraId === obraActiva && a.crit && a.av < 100).length

  // ── Contexto para todos los tabs ───────────────────────────────────────────
  const CTX = {
    obra, obras, usuarios, actividades, materiales,
    tareasObra, tareasGral, catGral, historial,
    obraActiva, usuActivo, usuObj,
    setObras:    writeObras,
    setUsuarios: writeUsuarios,
    setAct:      writeAct,
    setMat:      writeMat,
    setTObra:    writeTObra,
    setTGral:    writeTGral,
    setCatGral:  writeCatGral,
    setHist:     writeHist,
    setObraAct, setUsuAct, addLog, cambiarEstado,
    ESTADOS, PRIORIDADES, TRANSICIONES, HIST_TIPOS,
    uid, now, todayISO, isOverdue,
  }

  // ── Indicador de sync ──────────────────────────────────────────────────────
  const syncCfg = {
    local:      { color: C.light, label: 'LOCAL'  },
    connecting: { color: C.gold,  label: '...'    },
    synced:     { color: C.green, label: 'LIVE'   },
    error:      { color: C.red,   label: 'OFF'    },
  }[syncStatus]

  return (
    <div style={{
      background: C.bg, minHeight: '100vh',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: C.ink, maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        button,select,input,textarea { font-family:inherit; }
        input:focus,textarea:focus,select:focus { outline:none; border-color:#C8610A!important; }
        input[type=range] { -webkit-appearance:none; height:6px; border-radius:3px; background:#E2DDD5; display:block; width:100%; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:#C8610A; cursor:pointer; }
        input[type=checkbox] { accent-color:#C8610A; width:16px; height:16px; cursor:pointer; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-thumb { background:#E2DDD5; border-radius:3px; }
        body { overflow-x:hidden; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: C.ink, position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
        <div style={{ padding: '0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🏗</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.1 }}>ObraControl</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
                {tab === 'generales' ? 'Tareas generales'
                  : tab === 'obras'  ? 'Mis obras'
                  : tab === 'config' ? 'Configuración'
                  : obra?.nombre}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Indicador sync */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={syncCfg.label}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: syncCfg.color, flexShrink: 0,
                animation: syncStatus === 'connecting' ? 'pulse 1s infinite' : 'none',
              }}/>
              <span style={{ fontSize: 9, color: syncCfg.color, fontWeight: 700 }}>{syncCfg.label}</span>
            </div>
            {criticas    > 0 && <span style={{ fontSize: 11, color: '#f97316', fontWeight: 700 }}>⚡{criticas}</span>}
            {vencidasObra > 0 && <span style={{ fontSize: 11, color: '#facc15', fontWeight: 700 }}>⚠{vencidasObra}</span>}
            {matBajos    > 0 && <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700 }}>📦{matBajos}</span>}
            <Clock/>
            <button onClick={() => setShowUserSel(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 99, padding: '3px 9px 3px 4px', cursor: 'pointer',
            }}>
              <Avatar usuario={usuObj} size={22}/>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{usuObj?.ini}</span>
            </button>
          </div>
        </div>

        {/* Banda contextual */}
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

      {/* Banner Firebase no configurado */}
      {!FIREBASE_HABILITADO && (
        <div style={{ background: C.goldL, borderBottom: `1px solid ${C.gold}44`, padding: '9px 14px', display: 'flex', gap: 9, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>Modo local — sin sincronización entre dispositivos</div>
            <div style={{ fontSize: 11, color: C.mid }}>Configurá Firebase en src/firebase.js para activar el tiempo real.</div>
          </div>
        </div>
      )}

      {/* ── Contenido ── */}
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

      {/* ── Bottom nav ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, background: C.card,
        borderTop: `1px solid ${C.border}`, display: 'flex',
        zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(t => {
          const active  = tab === t.id
          const acColor = t.global ? C.purple : C.amber
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '8px 2px 10px', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, fontFamily: 'inherit', position: 'relative',
            }}>
              {active && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: acColor, borderRadius: 99 }}/>}
              <span style={{ fontSize: 16 }}>{t.ic}</span>
              <span style={{ fontSize: 9, fontWeight: active ? 800 : 600, color: active ? acColor : C.light }}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {showUserSel && (
        <SelectUser
          usuarios={usuarios} usuActivo={usuActivo}
          onSelect={id => { setUsuAct(id); setShowUserSel(false) }}
          onClose={() => setShowUserSel(false)}
        />
      )}
    </div>
  )
}
