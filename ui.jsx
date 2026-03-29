import { useState, useEffect } from 'react'

// ── Design tokens (también en CSS, aquí para JS inline) ───────────────────────
export const C = {
  bg: '#F5F2EC', card: '#FFFFFF', border: '#E2DDD5', ink: '#1A1714',
  mid: '#5C5750', light: '#9C9690',
  amber: '#C8610A', amberL: '#FDF0E6',
  green: '#1E7E4E', greenL: '#E8F5EE',
  red:   '#C0392B', redL:   '#FDEDEB',
  blue:  '#1A5276', blueL:  '#EBF2F8',
  gold:  '#B7950B', goldL:  '#FEF9E7',
  purple:'#6D28D9', purpleL:'#EDE9FE',
  teal:  '#0E7490', tealL:  '#E0F2FE',
}

// ── Primitivos ─────────────────────────────────────────────────────────────────
export const Bar = ({ v, color = C.amber, h = 6, s = {} }) => (
  <div style={{ background: C.border, borderRadius: 99, height: h, overflow: 'hidden', ...s }}>
    <div style={{ width: `${Math.min(100, Math.max(0, v))}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s ease' }} />
  </div>
)

export const Tag = ({ color, bg, children, s = {} }) => (
  <span style={{
    background: bg, color, borderRadius: 4, padding: '2px 7px',
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
    flexShrink: 0, letterSpacing: .3, ...s,
  }}>
    {children}
  </span>
)

export const EstadoTag = ({ estado, ESTADOS }) => {
  const e = ESTADOS[estado] || ESTADOS.pendiente
  return <Tag color={e.color} bg={e.bg}>{e.label}</Tag>
}

export const PrioTag = ({ prio, PRIORIDADES }) => {
  const p = PRIORIDADES[prio] || PRIORIDADES.normal
  if (prio === 'normal') return null
  return <Tag color={p.color} bg={p.bg}>{p.label}</Tag>
}

export const Avatar = ({ usuario, size = 28 }) => {
  if (!usuario) return null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: usuario.color + '22',
      border: `2px solid ${usuario.color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.37), fontWeight: 700,
      color: usuario.color, flexShrink: 0,
    }}>
      {usuario.ini}
    </div>
  )
}

export const Box = ({ children, s = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 14, padding: 16, ...s,
  }}>
    {children}
  </div>
)

export const Btn = ({ children, onClick, disabled, col = C.amber, outline = false, s = {}, type = 'button' }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{
    background: outline ? 'transparent' : disabled ? '#CCCCCC' : col,
    color: outline ? col : '#fff',
    border: `1.5px solid ${outline ? col : disabled ? '#CCCCCC' : col}`,
    borderRadius: 10, padding: '10px 18px', fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13,
    fontFamily: 'inherit', transition: 'opacity .15s',
    opacity: disabled ? .7 : 1, ...s,
  }}>
    {children}
  </button>
)

export const Field = ({ label, value, onChange, type = 'text', placeholder, s = {}, required, min, max }) => (
  <div style={s}>
    {label && (
      <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </div>
    )}
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      min={min} max={max}
      style={{
        width: '100%', padding: '9px 12px',
        background: '#FAFAF7', border: `1.5px solid ${C.border}`,
        borderRadius: 9, color: C.ink, fontSize: 13,
        fontFamily: 'inherit',
      }}
    />
  </div>
)

export const SelectField = ({ label, value, onChange, options, s = {} }) => (
  <div style={s}>
    {label && (
      <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
        {label}
      </div>
    )}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', padding: '9px 12px',
      background: '#FAFAF7', border: `1.5px solid ${C.border}`,
      borderRadius: 9, color: C.ink, fontSize: 13,
      fontFamily: 'inherit', cursor: 'pointer',
    }}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
)

export const SectionLabel = ({ children, s = {} }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: C.mid,
    textTransform: 'uppercase', letterSpacing: .8,
    margin: '14px 0 8px', ...s,
  }}>
    {children}
  </div>
)

export const Chip = ({ active, onClick, children, activeColor = C.amber, activeBg }) => (
  <button onClick={onClick} style={{
    padding: '5px 12px', borderRadius: 99, cursor: 'pointer',
    border: `1.5px solid ${active ? activeColor : '#C8B8A8'}`,
    background: active ? (activeBg || activeColor + '18') : '#EDE8E1',
    color: active ? activeColor : C.mid,
    fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
    whiteSpace: 'nowrap', transition: 'all .15s',
  }}>
    {children}
  </button>
)

export const ChipRow = ({ children }) => (
  <div style={{
    display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
    marginBottom: 10, scrollbarWidth: 'none',
  }}>
    {children}
  </div>
)

export const AddButton = ({ children, onClick, color = C.amber }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    width: '100%', padding: 11,
    background: color + '15',
    border: `1.5px solid ${color}88`,
    borderRadius: 11, cursor: 'pointer',
    color, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
    marginBottom: 10, transition: 'all .15s',
  }}>
    {children}
  </button>
)

// ── Radial progress ────────────────────────────────────────────────────────────
export const Radial = ({ v, size = 70, stroke = 7, color = C.amber }) => {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash  = (v / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s ease' }}/>
    </svg>
  )
}

// ── Reloj ──────────────────────────────────────────────────────────────────────
export function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.light }}>
      {t.toLocaleTimeString('es-AR')}
    </span>
  )
}

// ── Bottom sheet modal ─────────────────────────────────────────────────────────
export function Sheet({ onClose, children, maxH = '90vh' }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
        zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480, maxHeight: maxH,
          overflowY: 'auto', padding: '18px 15px 32px',
          boxShadow: '0 -8px 40px rgba(0,0,0,.2)',
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: '0 auto 16px' }}/>
        {children}
      </div>
    </div>
  )
}

// ── KPI card pequeña ───────────────────────────────────────────────────────────
export const KpiCard = ({ label, value, color = C.ink, sub, s = {} }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '10px 12px', ...s,
  }}>
    <div style={{ fontSize: 11, color: C.light, marginBottom: 3 }}>{label}</div>
    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 24, color }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{sub}</div>}
  </div>
)

// ── Alerta inline ──────────────────────────────────────────────────────────────
export const Alert = ({ color = C.amber, bg, children, s = {} }) => (
  <div style={{
    background: bg || color + '15', border: `1px solid ${color}33`,
    borderRadius: 10, padding: '10px 13px', marginBottom: 10, ...s,
  }}>
    {children}
  </div>
)

// ── Adjuntos mini-preview ──────────────────────────────────────────────────────
export const AdjPills = ({ adjuntos }) => {
  if (!adjuntos?.length) return null
  const imgs = adjuntos.filter(a => a.tipo === 'img')
  const pdfs = adjuntos.filter(a => a.tipo === 'pdf')
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
      {imgs.length > 0 && (
        <span style={{ background: C.blueL, color: C.blue, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
          📷 {imgs.length} foto{imgs.length !== 1 ? 's' : ''}
        </span>
      )}
      {pdfs.length > 0 && (
        <span style={{ background: C.redL, color: C.red, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
          📄 {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
