// ══════════════════════════════════════════════════════════════════════════════
// OBRACONTROL — Firebase Realtime Database
// ══════════════════════════════════════════════════════════════════════════════
//
// INSTRUCCIONES DE CONFIGURACIÓN (solo una vez, ~15 minutos):
//
// 1. Ir a https://console.firebase.google.com
// 2. "Agregar proyecto" → nombre: obracontrol → sin Google Analytics → Crear
// 3. Build → Realtime Database → "Crear base de datos"
//    → Ubicación: us-central1 → "Iniciar en modo de prueba" → Listo
// 4. Ícono </> (Web) → nombre: obracontrol → Registrar app
//    → Copiar el objeto firebaseConfig que aparece
// 5. Reemplazar los valores de FIREBASE_CONFIG abajo con los tuyos
// 6. Realtime Database → Reglas → Reemplazar con las reglas de abajo → Publicar
// 7. Subir archivos actualizados a GitHub → Vercel redeploya automático
//
// ── REGLAS DE SEGURIDAD (copiar en Firebase → Realtime DB → Reglas) ──────────
//
// {
//   "rules": {
//     ".read": true,
//     ".write": true
//   }
// }
//
// Nota: estas reglas son abiertas (modo de prueba, válido 30 días).
// Después de probar, contactar para configurar reglas con autenticación.
//
// ══════════════════════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database'

// ── REEMPLAZÁ ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE ──────────────────
onst firebaseConfig = {
  apiKey: "AIzaSyBYVHQYKVFngOrFtfe_LZed0EXZSIanlAc",
  authDomain: "obracontrol-eidos.firebaseapp.com",
  projectId: "obracontrol-eidos",
  storageBucket: "obracontrol-eidos.firebasestorage.app",
  messagingSenderId: "1028182070341",
  appId: "1:1028182070341:web:2e1a122410665206f03f2c"
};
// ─────────────────────────────────────────────────────────────────────────────

// Detectar si Firebase está configurado (no tiene valores placeholder)
export const FIREBASE_HABILITADO = !FIREBASE_CONFIG.apiKey.includes('TU_')

let app = null
let db  = null

if (FIREBASE_HABILITADO) {
  try {
    app = initializeApp(FIREBASE_CONFIG)
    db  = getDatabase(app)
    console.log('[ObraControl] Firebase conectado ✓')
  } catch (e) {
    console.warn('[ObraControl] Error al conectar Firebase:', e.message)
  }
}

// ── Nodo raíz en Firebase ─────────────────────────────────────────────────────
const ROOT = 'obracontrol_v2'

// ── Claves de colecciones ─────────────────────────────────────────────────────
export const KEYS = {
  obras:      `${ROOT}/obras`,
  usuarios:   `${ROOT}/usuarios`,
  actividades:`${ROOT}/actividades`,
  materiales: `${ROOT}/materiales`,
  tareasObra: `${ROOT}/tareasObra`,
  tareasGral: `${ROOT}/tareasGral`,
  catGral:    `${ROOT}/catGral`,
  historial:  `${ROOT}/historial`,
}

// ── Escribir colección completa en Firebase ───────────────────────────────────
export async function fbSet(key, value) {
  if (!FIREBASE_HABILITADO || !db) return false
  try {
    await set(ref(db, key), value)
    return true
  } catch (e) {
    console.warn(`[Firebase] Error escribiendo ${key}:`, e.message)
    return false
  }
}

// ── Leer colección una vez ────────────────────────────────────────────────────
export async function fbGet(key) {
  if (!FIREBASE_HABILITADO || !db) return null
  try {
    const snap = await get(ref(db, key))
    return snap.exists() ? snap.val() : null
  } catch (e) {
    console.warn(`[Firebase] Error leyendo ${key}:`, e.message)
    return null
  }
}

// ── Suscribirse a cambios en tiempo real ─────────────────────────────────────
// Retorna función de unsubscribe
export function fbSubscribe(key, callback) {
  if (!FIREBASE_HABILITADO || !db) return () => {}
  const r = ref(db, key)
  onValue(r, snap => {
    if (snap.exists()) callback(snap.val())
  })
  return () => off(r)
}

// ── Inicializar Firebase con datos seed si la DB está vacía ──────────────────
export async function initFirebaseIfEmpty(seeds) {
  if (!FIREBASE_HABILITADO || !db) return false
  try {
    const snap = await get(ref(db, ROOT))
    if (!snap.exists()) {
      // Primera vez — subir todos los datos iniciales
      await set(ref(db, ROOT), seeds)
      console.log('[Firebase] Datos iniciales subidos ✓')
      return true
    }
    return false // Ya tenía datos
  } catch (e) {
    console.warn('[Firebase] Error en initFirebaseIfEmpty:', e.message)
    return false
  }
}

export { db, ref }
