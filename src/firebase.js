// OBRACONTROL — Firebase Realtime Database
//
// INSTRUCCIONES DE CONFIGURACION (solo una vez):
// PASO 1: console.firebase.google.com → Agregar proyecto → obracontrol
// PASO 2: Build → Realtime Database → Crear base de datos → modo de prueba
// PASO 3: Icono </> → registrar app → copiar firebaseConfig
// PASO 4: Reemplazar valores de FIREBASE_CONFIG abajo
// PASO 5: Realtime Database → Reglas → pegar y publicar:
//         { "rules": { ".read": true, ".write": true } }
// PASO 6: Subir a GitHub → Vercel redeploya automatico

import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database'

// ── REEMPLAZAR CON LOS VALORES DE TU PROYECTO FIREBASE ───────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBYVHQYKVFngOrFtfe_LZed0EXZSIanlAc",
  authDomain: "obracontrol-eidos.firebaseapp.com",
  databaseURL: https://obracontrol-eidos-default-rtdb.firebaseio.com/,
  projectId: "obracontrol-eidos",
  storageBucket: "obracontrol-eidos.firebasestorage.app",
  messagingSenderId: "1028182070341",
  appId: "1:1028182070341:web:2e1a122410665206f03f2c"
};
// ─────────────────────────────────────────────────────────────────────────────

export const FIREBASE_HABILITADO = !FIREBASE_CONFIG.apiKey.includes('TU_')

let db = null

if (FIREBASE_HABILITADO) {
  try {
    const app = initializeApp(FIREBASE_CONFIG)
    db = getDatabase(app)
    console.log('[ObraControl] Firebase conectado OK')
  } catch (e) {
    console.warn('[ObraControl] Error al conectar Firebase:', e.message)
  }
}

const ROOT = 'obracontrol_v2'

export const KEYS = {
  obras:       ROOT + '/obras',
  usuarios:    ROOT + '/usuarios',
  actividades: ROOT + '/actividades',
  materiales:  ROOT + '/materiales',
  tareasObra:  ROOT + '/tareasObra',
  tareasGral:  ROOT + '/tareasGral',
  catGral:     ROOT + '/catGral',
  historial:   ROOT + '/historial',
}

// ── Escribir en Firebase ──────────────────────────────────────────────────────
export async function fbSet(key, value) {
  if (!FIREBASE_HABILITADO || !db) return false
  try {
    console.log('[Firebase] Escribiendo:', key)
    await set(ref(db, key), value)
    console.log('[Firebase] Escritura OK:', key)
    return true
  } catch (e) {
    console.error('[Firebase] ERROR al escribir:', key, e.message)
    return false
  }
}

// ── Suscribirse a cambios en tiempo real ─────────────────────────────────────
export function fbSubscribe(key, callback) {
  if (!FIREBASE_HABILITADO || !db) return function() {}
  console.log('[Firebase] Suscribiendo a:', key)
  const r = ref(db, key)
  onValue(r, function(snap) {
    if (snap.exists()) {
      console.log('[Firebase] Dato recibido de:', key)
      callback(snap.val())
    }
  })
  return function() { off(r) }
}

// ── Seed inicial: solo escribe si la coleccion esta vacia ─────────────────────
// Se llama DESPUES de suscribirse, no antes
export async function seedIfEmpty(key, value) {
  if (!FIREBASE_HABILITADO || !db) return false
  try {
    const snap = await get(ref(db, key))
    if (!snap.exists()) {
      await set(ref(db, key), value)
      console.log('[Firebase] Seed cargado:', key)
      return true
    }
    return false
  } catch (e) {
    console.warn('[Firebase] Error en seed:', key, e.message)
    return false
  }
}

export { db, ref }
