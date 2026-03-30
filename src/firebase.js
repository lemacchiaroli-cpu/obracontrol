// OBRACONTROL — Firebase Realtime Database
//
// INSTRUCCIONES DE CONFIGURACION (solo una vez, ~15 minutos):
//
// PASO 1: Ir a https://console.firebase.google.com
// PASO 2: "Agregar proyecto" → nombre: obracontrol → sin Google Analytics → Crear
// PASO 3: Build → Realtime Database → "Crear base de datos"
//         → Ubicacion: us-central1 → "Iniciar en modo de prueba" → Listo
// PASO 4: Icono </> (Web) → nombre: obracontrol → Registrar app
//         → Copiar el objeto firebaseConfig que aparece
// PASO 5: Reemplazar los valores de FIREBASE_CONFIG abajo con los tuyos
// PASO 6: Realtime Database → Reglas → pegar esto y publicar:
//
//    ".read": true,  ".write": true
//    (envolverlo en: { "rules": { ".read": true, ".write": true } } )
//
// PASO 7: Subir firebase.js actualizado a GitHub → Vercel redeploya automatico
//
// REGLAS COMPLETAS PARA COPIAR EN FIREBASE (Realtime DB → Reglas):
// Pegar exactamente esto (sin las barras //):
//   INICIO_REGLAS
//   {
//     "rules": {
//       ".read": true,
//       ".write": true
//     }
//   }
//   FIN_REGLAS

import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database'

// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE
const FIREBASE_CONFIG = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  databaseURL:       "https://TU_PROYECTO-default-rtdb.firebaseio.com",
  projectId:         "TU_PROYECTO",
  storageBucket:     "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID",
}

// Detectar si Firebase esta configurado (no tiene valores placeholder)
export const FIREBASE_HABILITADO = !FIREBASE_CONFIG.apiKey.includes('TU_')

let app = null
let db  = null

if (FIREBASE_HABILITADO) {
  try {
    app = initializeApp(FIREBASE_CONFIG)
    db  = getDatabase(app)
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

export async function fbSet(key, value) {
  if (!FIREBASE_HABILITADO || !db) return false
  try {
    await set(ref(db, key), value)
    return true
  } catch (e) {
    console.warn('[Firebase] Error escribiendo ' + key + ':', e.message)
    return false
  }
}

export async function fbGet(key) {
  if (!FIREBASE_HABILITADO || !db) return null
  try {
    const snap = await get(ref(db, key))
    return snap.exists() ? snap.val() : null
  } catch (e) {
    console.warn('[Firebase] Error leyendo ' + key + ':', e.message)
    return null
  }
}

export function fbSubscribe(key, callback) {
  if (!FIREBASE_HABILITADO || !db) return function() {}
  const r = ref(db, key)
  onValue(r, function(snap) {
    if (snap.exists()) callback(snap.val())
  })
  return function() { off(r) }
}

export async function initFirebaseIfEmpty(seeds) {
  if (!FIREBASE_HABILITADO || !db) return false
  try {
    const snap = await get(ref(db, ROOT))
    if (!snap.exists()) {
      await set(ref(db, ROOT), seeds)
      console.log('[Firebase] Datos iniciales subidos OK')
      return true
    }
    return false
  } catch (e) {
    console.warn('[Firebase] Error en initFirebaseIfEmpty:', e.message)
    return false
  }
}

export { db, ref }
