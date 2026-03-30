import { C, Sheet, Avatar } from '../ui.jsx'

export default function SelectUser({ usuarios, usuActivo, onSelect, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 4 }}>¿Quién está usando la app?</div>
      <div style={{ fontSize: 12, color: C.mid, marginBottom: 16 }}>
        El usuario seleccionado quedará registrado en todos los cambios que hagas.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {usuarios.map(u => (
          <button key={u.id} onClick={() => onSelect(u.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderRadius: 12, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
            border: u.id === usuActivo ? `1.5px solid ${u.color}` : `1px solid ${C.border}`,
            background: u.id === usuActivo ? u.color + '11' : C.card,
            transition: 'all .15s',
          }}>
            <Avatar usuario={u} size={40}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{u.nombre}</div>
              <div style={{ fontSize: 12, color: C.mid }}>{u.rol}</div>
            </div>
            {u.id === usuActivo && (
              <span style={{ fontSize: 11, color: u.color, fontWeight: 700 }}>activo ✓</span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
