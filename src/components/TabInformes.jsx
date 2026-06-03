import { useState, useRef } from 'react'
import { C, Box, Btn, Field, SelectField, SectionLabel, AddButton, Avatar } from '../ui.jsx'
import { uid, now, todayISO, fmtDate, fmtDateShort } from '../store.js'

// ── Estados de informe ─────────────────────────────────────────────────────────
const ESTADOS_INF = {
  borrador:   { label: 'Borrador',    color: '#B7950B', bg: '#FEF9E7' },
  revision:   { label: 'En revisión', color: '#C8610A', bg: '#FDF0E6' },
  finalizado: { label: 'Finalizado',  color: '#1E7E4E', bg: '#E8F5EE' },
}

const TIPOS_INF = [
  { value: 'semanal',      label: 'Semanal'      },
  { value: 'mensual',      label: 'Mensual'      },
  { value: 'hito',         label: 'Por hito'     },
  { value: 'personalizado',label: 'Personalizado'},
]

// ── Generador de HTML para imprimir ───────────────────────────────────────────
function generarHTMLImpresion(informe, obra, frentes, usuarios, actividades) {
  const director = usuarios.find(u => u.id === informe.creadoPorId)
  const actsObra = actividades.filter(a => a.obraId === obra?.id)
  const avGlobal = actsObra.length
    ? Math.round(actsObra.reduce((s, a) => s + a.av, 0) / actsObra.length)
    : 0

  const fmtD = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const seccionesHTML = informe.secciones.map(sec => {
    const fr     = frentes.find(f => f.id === sec.frenteId)
    const delta  = sec.avActual - sec.avAnterior
    const deltaColor = delta >= 0 ? '#1E7E4E' : '#C0392B'
    const deltaSign  = delta >= 0 ? '+' : ''
    const barPct     = Math.min(100, Math.max(0, sec.avActual))
    const barColor   = sec.avActual === 100 ? '#1E7E4E' : '#C8610A'

    return `
      <div class="seccion">
        <div class="sec-header">
          <div class="sec-title">
            <span class="sec-ic">${fr?.ic || ''}</span>
            <span>${fr?.label || sec.frenteId}</span>
          </div>
          <div class="sec-badges">
            <span class="badge" style="background:#EBF2F8;color:#1A5276;">Anterior: ${sec.avAnterior}%</span>
            <span class="badge" style="background:#FDF0E6;color:#C8610A;font-weight:700;">Actual: ${sec.avActual}%</span>
            <span class="badge" style="color:${deltaColor};background:${delta >= 0 ? '#E8F5EE' : '#FDEDEB'};">${deltaSign}${delta}%</span>
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${barPct}%;background:${barColor};"></div>
        </div>
        ${sec.nota ? `<div class="nota">"${sec.nota}"</div>` : ''}
        ${sec.fotos?.length > 0 ? `
          <div class="fotos-grid">
            ${sec.fotos.filter(f => f.tipo === 'img').map(f =>
              `<div class="foto"><img src="${f.url}" alt=""/></div>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `
  }).join('')

  const firmasHTML = informe.opciones?.incluirFirmas ? `
    <div class="firmas">
      <div class="firma-box">
        <div class="firma-lbl">Director de obra</div>
        <div class="firma-line"></div>
        <div class="firma-name">${director?.nombre || '—'}</div>
      </div>
      <div class="firma-box">
        <div class="firma-lbl">Fecha de emisión</div>
        <div class="firma-line"></div>
        <div class="firma-name">${fmtD(informe.hasta || now())}</div>
      </div>
    </div>
  ` : ''

  const tablaHTML = informe.opciones?.incluirTablaAvance ? `
    <div class="tabla-avance">
      <div class="tabla-title">Resumen de avance por frente</div>
      <table>
        <thead>
          <tr>
            <th>Frente</th>
            <th>Avance anterior</th>
            <th>Avance actual</th>
            <th>Variación</th>
          </tr>
        </thead>
        <tbody>
          ${informe.secciones.map(sec => {
            const fr    = frentes.find(f => f.id === sec.frenteId)
            const delta = sec.avActual - sec.avAnterior
            return `
              <tr>
                <td>${fr?.ic || ''} ${fr?.label || sec.frenteId}</td>
                <td>${sec.avAnterior}%</td>
                <td><strong>${sec.avActual}%</strong></td>
                <td style="color:${delta >= 0 ? '#1E7E4E' : '#C0392B'};font-weight:600;">${delta >= 0 ? '+' : ''}${delta}%</td>
              </tr>
            `
          }).join('')}
          <tr class="total-row">
            <td><strong>Avance global</strong></td>
            <td></td>
            <td><strong>${avGlobal}%</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${informe.titulo} — ${obra?.nombre}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',Arial,sans-serif;color:#1A1714;background:#fff;font-size:11pt;}
  .page{max-width:800px;margin:0 auto;padding:32px 40px;}

  /* Header del informe */
  .inf-header{background:#1A1714;padding:20px 24px;border-radius:8px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;}
  .inf-brand{color:#C8610A;font-family:'DM Serif Display',serif;font-size:18pt;}
  .inf-brand-sub{color:rgba(255,255,255,.45);font-size:9pt;margin-top:3px;}
  .inf-meta{text-align:right;}
  .inf-num{color:rgba(255,255,255,.4);font-size:9pt;letter-spacing:.5px;}
  .inf-date{color:#fff;font-size:11pt;font-weight:600;margin-top:2px;}

  /* Datos de obra */
  .obra-block{margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #E2DDD5;}
  .obra-nombre{font-family:'DM Serif Display',serif;font-size:20pt;color:#1A1714;margin-bottom:4px;}
  .obra-meta{font-size:10pt;color:#5C5750;}
  .obra-dest{display:inline-block;font-size:9pt;font-weight:600;background:#FDF0E6;color:#C8610A;padding:3px 10px;border-radius:4px;margin-top:6px;}

  /* KPIs */
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
  .kpi{background:#F5F2EC;border-radius:8px;padding:12px 14px;border:1px solid #E2DDD5;}
  .kpi-v{font-size:24pt;font-weight:700;color:#C8610A;line-height:1;margin-bottom:3px;}
  .kpi-l{font-size:9pt;color:#9C9690;}

  /* Resumen */
  .resumen-block{background:#F5F2EC;border-left:4px solid #C8610A;padding:12px 16px;margin-bottom:24px;border-radius:0 6px 6px 0;}
  .resumen-title{font-size:9pt;font-weight:700;color:#9C9690;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
  .resumen-txt{font-size:11pt;color:#5C5750;line-height:1.6;}

  /* Secciones */
  .seccion{margin-bottom:20px;padding:16px 18px;border:1px solid #E2DDD5;border-radius:8px;break-inside:avoid;}
  .sec-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;}
  .sec-title{font-size:13pt;font-weight:700;color:#1A1714;display:flex;align-items:center;gap:8px;}
  .sec-ic{font-size:16pt;}
  .sec-badges{display:flex;gap:6px;flex-wrap:wrap;}
  .badge{font-size:9pt;padding:2px 8px;border-radius:4px;font-weight:500;}
  .bar-track{height:8px;background:#E2DDD5;border-radius:99px;overflow:hidden;margin-bottom:10px;}
  .bar-fill{height:100%;border-radius:99px;}
  .nota{font-size:10pt;color:#5C5750;font-style:italic;background:#FAFAF7;padding:9px 12px;border-radius:5px;border:1px solid #E2DDD5;line-height:1.5;}

  /* Fotos */
  .fotos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;}
  .foto{aspect-ratio:4/3;border-radius:6px;overflow:hidden;border:1px solid #E2DDD5;background:#F5F2EC;}
  .foto img{width:100%;height:100%;object-fit:cover;display:block;}

  /* Tabla */
  .tabla-avance{margin-bottom:20px;}
  .tabla-title{font-size:10pt;font-weight:700;color:#9C9690;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
  table{width:100%;border-collapse:collapse;font-size:10pt;}
  th{background:#1A1714;color:#fff;padding:7px 10px;text-align:left;font-size:9pt;}
  td{padding:7px 10px;border-bottom:1px solid #E2DDD5;}
  tr:nth-child(even) td{background:#F5F2EC;}
  .total-row td{background:#FDF0E6;font-weight:600;}

  /* Firmas */
  .firmas{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;padding-top:24px;border-top:1px solid #E2DDD5;}
  .firma-box{text-align:center;}
  .firma-lbl{font-size:9pt;color:#9C9690;margin-bottom:32px;}
  .firma-line{height:1px;background:#5C5750;margin-bottom:6px;}
  .firma-name{font-size:10pt;font-weight:600;color:#5C5750;}

  /* Footer */
  .inf-footer{margin-top:24px;padding-top:12px;border-top:1px solid #E2DDD5;display:flex;justify-content:space-between;font-size:8pt;color:#9C9690;}

  @media print {
    body{font-size:10pt;}
    .page{padding:16px 24px;max-width:100%;}
    .no-print{display:none!important;}
    .seccion{break-inside:avoid;}
  }
</style>
</head>
<body>
<div class="no-print" style="background:#1A1714;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100;">
  <span style="color:#fff;font-size:13px;font-weight:700;">📄 ${informe.titulo}</span>
  <div style="display:flex;gap:10px;">
    <button onclick="window.print()" style="background:#C8610A;color:#fff;border:none;border-radius:7px;padding:8px 18px;font-size:12px;font-weight:700;cursor:pointer;">🖨 Imprimir / Guardar PDF</button>
    <button onclick="window.close()" style="background:none;border:1px solid rgba(255,255,255,.3);color:rgba(255,255,255,.7);border-radius:7px;padding:8px 14px;font-size:12px;cursor:pointer;">✕ Cerrar</button>
  </div>
</div>
<div class="page">
  <div class="inf-header">
    <div>
      <div class="inf-brand">ObraControl</div>
      <div class="inf-brand-sub">Informe de avance de obra</div>
    </div>
    <div class="inf-meta">
      <div class="inf-num">INFORME #${String(informe.numero).padStart(3,'0')}</div>
      <div class="inf-date">${fmtD(informe.desde)} — ${fmtD(informe.hasta)}</div>
    </div>
  </div>

  <div class="obra-block">
    <div class="obra-nombre">${obra?.nombre || '—'}</div>
    <div class="obra-meta">${obra?.ubicacion || ''} · ${TIPOS_INF.find(t=>t.value===informe.tipo)?.label || informe.tipo}</div>
    ${informe.destinatario ? `<div class="obra-dest">Para: ${informe.destinatario}</div>` : ''}
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-v">${avGlobal}%</div>
      <div class="kpi-l">Avance global de obra</div>
    </div>
    <div class="kpi">
      <div class="kpi-v">${informe.secciones.length}</div>
      <div class="kpi-l">Frentes reportados</div>
    </div>
    <div class="kpi">
      <div class="kpi-v" style="color:#1E7E4E;">${informe.secciones.reduce((s,sec)=>s+(sec.avActual-sec.avAnterior),0) >= 0 ? '+' : ''}${informe.secciones.reduce((s,sec)=>s+(sec.avActual-sec.avAnterior),0)}%</div>
      <div class="kpi-l">Avance total del período</div>
    </div>
  </div>

  ${informe.resumen ? `
  <div class="resumen-block">
    <div class="resumen-title">Resumen ejecutivo</div>
    <div class="resumen-txt">${informe.resumen}</div>
  </div>
  ` : ''}

  ${tablaHTML}

  <div style="font-size:10pt;font-weight:700;color:#9C9690;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Detalle por frente de trabajo</div>
  ${seccionesHTML}

  ${firmasHTML}

  <div class="inf-footer">
    <span>Generado con ObraControl · ${new Date().toLocaleDateString('es-AR', {day:'2-digit',month:'long',year:'numeric'})}</span>
    <span>${director?.nombre || ''} — ${obra?.nombre || ''}</span>
  </div>
</div>
</body>
</html>`
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function TabInformes({
  obra, obras, actividades, materiales, usuarios, historial,
  informes, setInformes, obraActiva, usuActivo, addLog, uid: uidFn, now: nowFn,
}) {
  const [screen,    setScreen]   = useState('lista')  // 'lista' | 'form' | 'preview'
  const [editing,   setEditing]  = useState(null)     // informe en edición
  const [previewing,setPreviewing] = useState(null)   // informe a previsualizar

  const infObra = (informes || []).filter(i => i.obraId === obraActiva)
  const frentes = obra?.frentes || []

  // ── Inicializar nuevo informe ─────────────────────────────────────────────
  const nuevoInforme = () => {
    const acts = actividades.filter(a => a.obraId === obraActiva)
    const numero = infObra.length + 1
    const inf = {
      id:           uidFn(),
      obraId:       obraActiva,
      tipo:         'semanal',
      numero,
      titulo:       `Informe semanal — Semana ${numero}`,
      desde:        todayISO(-7),
      hasta:        todayISO(),
      destinatario: '',
      resumen:      '',
      frentesIds:   frentes.map(f => f.id),
      secciones:    frentes.map(f => {
        const factsF = acts.filter(a => a.fr === f.id)
        const avAct  = factsF.length ? Math.round(factsF.reduce((s,a) => s+a.av, 0) / factsF.length) : 0
        return { frenteId: f.id, avAnterior: Math.max(0, avAct - 5), avActual: avAct, nota: '', fotos: [] }
      }),
      opciones: { incluirTablaAvance: true, incluirFirmas: true, incluirMateriales: false },
      estado:      'borrador',
      creadoPorId: usuActivo,
      creadoEn:    nowFn(),
    }
    setEditing(inf)
    setScreen('form')
  }

  const editarInforme = (inf) => { setEditing({ ...inf }); setScreen('form') }

  const guardarInforme = (inf) => {
    const existe = (informes || []).find(i => i.id === inf.id)
    if (existe) setInformes((informes || []).map(i => i.id === inf.id ? inf : i))
    else        setInformes([...(informes || []), inf])
    addLog('reporte', `Informe guardado: "${inf.titulo}"`, obra?.nombre)
  }

  const eliminarInforme = (id) => {
    if (!window.confirm('¿Eliminar este informe?')) return
    setInformes((informes || []).filter(i => i.id !== id))
    addLog('reporte', 'Informe eliminado', obra?.nombre)
  }

  const abrirPreview = (inf) => {
    const html = generarHTMLImpresion(inf, obra, frentes, usuarios, actividades)
    const win  = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  // ── PANTALLA: Lista ───────────────────────────────────────────────────────
  if (screen === 'lista') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--serif, serif)', fontWeight: 800, fontSize: 17, color: C.ink }}>Informes</div>
          <Btn onClick={nuevoInforme} s={{ padding: '8px 14px', fontSize: 12 }}>+ Nuevo</Btn>
        </div>

        <AddButton onClick={nuevoInforme}>📄 Crear nuevo informe de avance</AddButton>

        {infObra.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.light, fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
            <div>Sin informes aún.</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Creá el primero con el botón de arriba.</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[...infObra].reverse().map(inf => {
            const e = ESTADOS_INF[inf.estado] || ESTADOS_INF.borrador
            return (
              <div key={inf.id} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
                {/* Franja de estado */}
                <div style={{ height: 3, background: e.color }}/>
                <div style={{ padding: '13px 15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: .5 }}>
                      Informe #{String(inf.numero).padStart(3,'0')} · {TIPOS_INF.find(t=>t.value===inf.tipo)?.label}
                    </div>
                    <span style={{ background: e.bg, color: e.color, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{e.label}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 3 }}>{inf.titulo}</div>
                  <div style={{ fontSize: 11, color: C.mid }}>
                    {fmtDateShort(inf.desde)} — {fmtDateShort(inf.hasta)}
                    {inf.destinatario && <span> · Para: {inf.destinatario}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: C.light }}>📋 {inf.secciones.length} frentes</span>
                    {inf.secciones.some(s => s.fotos?.length) && (
                      <span style={{ fontSize: 11, color: C.light }}>📷 {inf.secciones.reduce((t,s)=>t+(s.fotos?.length||0),0)} fotos</span>
                    )}
                    <span style={{ fontSize: 11, color: C.light }}>
                      {new Date(inf.creadoEn).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}
                    </span>
                  </div>
                </div>
                {/* Acciones */}
                <div style={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
                  <button onClick={() => abrirPreview(inf)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.green, fontFamily: 'inherit', borderRight: `1px solid ${C.border}` }}>
                    🖨 Ver / Imprimir
                  </button>
                  <button onClick={() => editarInforme(inf)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.amber, fontFamily: 'inherit', borderRight: `1px solid ${C.border}` }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => eliminarInforme(inf.id)} style={{ padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.light, fontFamily: 'inherit' }}>
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── PANTALLA: Formulario ──────────────────────────────────────────────────
  if (screen === 'form' && editing) {
    return <FormInforme
      inf={editing} frentes={frentes} usuarios={usuarios}
      actividades={actividades} obraActiva={obraActiva} usuActivo={usuActivo}
      uid={uidFn} now={nowFn}
      onSave={(inf) => { guardarInforme(inf); setScreen('lista') }}
      onCancel={() => setScreen('lista')}
      onPreview={(inf) => { guardarInforme(inf); abrirPreview(inf) }}
    />
  }

  return null
}

// ── Formulario de informe ──────────────────────────────────────────────────────
function FormInforme({ inf, frentes, usuarios, actividades, obraActiva, usuActivo, uid, now, onSave, onCancel, onPreview }) {
  const fileRefs = useRef({})
  const [f, setF] = useState({ ...inf })

  const upd = (key, val) => setF(p => ({ ...p, [key]: val }))
  const updOpt = (key, val) => setF(p => ({ ...p, opciones: { ...p.opciones, [key]: val } }))
  const updSec = (frenteId, key, val) => setF(p => ({
    ...p,
    secciones: p.secciones.map(s => s.frenteId === frenteId ? { ...s, [key]: val } : s),
  }))

  // Toggle frente incluido
  const toggleFrente = (frenteId) => {
    const ids = f.frentesIds || []
    const next = ids.includes(frenteId) ? ids.filter(id => id !== frenteId) : [...ids, frenteId]
    // Si se agrega, crear sección si no existe
    let secciones = [...f.secciones]
    if (!ids.includes(frenteId)) {
      const acts = actividades.filter(a => a.obraId === obraActiva && a.fr === frenteId)
      const avAct = acts.length ? Math.round(acts.reduce((s,a) => s+a.av, 0) / acts.length) : 0
      if (!secciones.find(s => s.frenteId === frenteId)) {
        secciones.push({ frenteId, avAnterior: Math.max(0, avAct-5), avActual: avAct, nota: '', fotos: [] })
      }
    }
    setF(p => ({ ...p, frentesIds: next, secciones }))
  }

  // Adjuntar fotos a una sección
  const handleFotos = (frenteId, e) => {
    Array.from(e.target.files).forEach(file => {
      const adj = { id: uid(), tipo: file.type === 'application/pdf' ? 'pdf' : 'img', nombre: file.name, ts: now(), url: '' }
      if (adj.tipo === 'img') {
        const r = new FileReader()
        r.onload = ev => {
          adj.url = ev.target.result
          updSec(frenteId, 'fotos', [...(f.secciones.find(s=>s.frenteId===frenteId)?.fotos||[]), adj])
        }
        r.readAsDataURL(file)
      }
    })
    e.target.value = ''
  }

  const seccionesVisibles = f.secciones.filter(s => (f.frentesIds || []).includes(s.frenteId))

  return (
    <div>
      <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.mid, fontFamily: 'inherit', marginBottom: 14, padding: 0 }}>
        ← Volver
      </button>
      <div style={{ fontWeight: 800, fontSize: 17, color: C.ink, marginBottom: 16 }}>
        {f.id && (informes => informes)(false) ? 'Editar informe' : 'Nuevo informe'}
      </div>

      {/* Datos básicos */}
      <Box s={{ marginBottom: 12 }}>
        <SectionLabel>Datos del informe</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <SelectField label="Tipo" value={f.tipo} onChange={v => upd('tipo', v)} options={TIPOS_INF}/>
          <Field label="N° Informe" value={String(f.numero)} onChange={v => upd('numero', +v)} type="number"/>
        </div>
        <Field label="Título" value={f.titulo} onChange={v => upd('titulo', v)} s={{ marginBottom: 10 }}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <Field label="Desde" type="date" value={f.desde} onChange={v => upd('desde', v)}/>
          <Field label="Hasta"  type="date" value={f.hasta}  onChange={v => upd('hasta',  v)}/>
        </div>
        <Field label="Destinatario (opcional)" value={f.destinatario} onChange={v => upd('destinatario', v)} placeholder="Ej: Grupo Rinaldi, Inversores..."/>
      </Box>

      {/* Resumen ejecutivo */}
      <Box s={{ marginBottom: 12 }}>
        <SectionLabel>Resumen ejecutivo</SectionLabel>
        <textarea value={f.resumen} onChange={e => upd('resumen', e.target.value)}
          placeholder="Describí las novedades más importantes del período, decisiones tomadas, alertas..."
          rows={4} style={{ width: '100%', padding: '9px 12px', background: '#FAFAF7', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.ink, fontSize: 13, fontFamily: 'inherit', resize: 'none' }}/>
      </Box>

      {/* Selección de frentes */}
      <Box s={{ marginBottom: 12 }}>
        <SectionLabel>Frentes a incluir</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {frentes.map(fr => {
            const on = (f.frentesIds || []).includes(fr.id)
            return (
              <button key={fr.id} onClick={() => toggleFrente(fr.id)} style={{
                padding: '6px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                border: `1.5px solid ${on ? fr.ic === '🏛' ? C.blue : fr.ic === '🧱' ? C.amber : fr.ic === '⚡' ? C.purple : C.green : '#C8B8A8'}`,
                background: on ? '#EBF2F8' : '#EDE8E1',
                color: on ? C.blue : C.mid,
                fontWeight: 700, fontSize: 12,
                transition: 'all .15s',
              }}>
                {fr.ic} {fr.label}
              </button>
            )
          })}
        </div>
      </Box>

      {/* Secciones por frente */}
      {seccionesVisibles.map(sec => {
        const fr = frentes.find(f2 => f2.id === sec.frenteId)
        const delta = sec.avActual - sec.avAnterior
        return (
          <Box key={sec.frenteId} s={{ marginBottom: 12 }}>
            {/* Header de sección */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{fr?.ic} {fr?.label}</div>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: delta >= 0 ? C.green : C.red }}>
                {delta >= 0 ? '+' : ''}{delta}% este período
              </span>
            </div>

            {/* Avances */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>% anterior</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min="0" max="100" value={sec.avAnterior} onChange={e => updSec(sec.frenteId, 'avAnterior', +e.target.value)} style={{ flex: 1 }}/>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: C.light, width: 34 }}>{sec.avAnterior}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>% actual</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min="0" max="100" value={sec.avActual} onChange={e => updSec(sec.frenteId, 'avActual', +e.target.value)} style={{ flex: 1 }}/>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: C.amber, width: 34 }}>{sec.avActual}%</span>
                </div>
              </div>
            </div>

            {/* Nota */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Nota del período</div>
              <textarea value={sec.nota} onChange={e => updSec(sec.frenteId, 'nota', e.target.value)}
                placeholder="Describí el avance, novedades, problemas o próximos pasos..."
                rows={3} style={{ width: '100%', padding: '9px 11px', background: '#FAFAF7', border: `1.5px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 13, fontFamily: 'inherit', resize: 'none' }}/>
            </div>

            {/* Fotos */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 7, textTransform: 'uppercase', letterSpacing: .5 }}>
                Fotos ({sec.fotos?.length || 0})
              </div>
              {sec.fotos?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                  {sec.fotos.filter(f2 => f2.tipo === 'img').map(foto => (
                    <div key={foto.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', border: `1px solid ${C.border}` }}>
                      <img src={foto.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      <button onClick={() => updSec(sec.frenteId, 'fotos', sec.fotos.filter(x => x.id !== foto.id))} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { fileRefs.current[sec.frenteId]?.click() }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 9, background: '#EDE8E1', border: `1.5px dashed #C8B8A8`, borderRadius: 8, cursor: 'pointer', color: C.mid, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                📷 Agregar fotos
              </button>
              <input ref={el => fileRefs.current[sec.frenteId] = el} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleFotos(sec.frenteId, e)}/>
            </div>
          </Box>
        )
      })}

      {/* Opciones */}
      <Box s={{ marginBottom: 14 }}>
        <SectionLabel>Opciones del informe</SectionLabel>
        {[
          { key: 'incluirTablaAvance',  label: 'Incluir tabla resumen de avance por frente' },
          { key: 'incluirFirmas',       label: 'Incluir sección de firmas' },
          { key: 'incluirMateriales',   label: 'Incluir materiales con alertas de stock' },
        ].map(opt => (
          <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, color: C.mid, marginBottom: 10 }}>
            <input type="checkbox" checked={f.opciones?.[opt.key] || false} onChange={e => updOpt(opt.key, e.target.checked)} style={{ accentColor: C.amber }}/>
            {opt.label}
          </label>
        ))}
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Estado del informe</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {Object.entries(ESTADOS_INF).map(([k, v]) => (
              <button key={k} onClick={() => upd('estado', k)} style={{ padding: '6px 13px', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', border: `2px solid ${f.estado === k ? v.color : C.border}`, background: f.estado === k ? v.bg : 'none', color: f.estado === k ? v.color : C.mid }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </Box>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 9, marginBottom: 8 }}>
        <Btn onClick={() => onSave(f)} s={{ flex: 1, padding: '13px 0' }}>💾 Guardar</Btn>
        <Btn outline col={C.mid} onClick={onCancel} s={{ padding: '13px 18px' }}>Cancelar</Btn>
      </div>
      <button onClick={() => onPreview(f)} style={{ width: '100%', padding: '12px', background: C.greenL, color: C.green, border: `1.5px solid ${C.green}44`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
        🖨 Guardar y ver previa para imprimir
      </button>
    </div>
  )
}
