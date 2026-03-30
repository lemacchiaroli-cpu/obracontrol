# ObraControl 2.0

App PWA para gestión integral de obras en construcción.

## Módulos
- 📊 Dashboard — KPIs y alertas por obra
- 📋 Avances — Actividades por frente con slider de progreso
- ✅ Tareas obra — Con estados, historial, adjuntos y changelog
- 📝 Tareas gral. — Independientes de obras
- 📦 Inventario — Stock con alertas
- 🕓 Historial — Timeline de todos los cambios
- 🏗 Mis obras — Gestión multi-obra
- ⚙️ Config. — Niveles, frentes, equipo, categorías

## Deploy en Vercel — paso a paso

### 1. Crear cuenta en GitHub (gratis)
- Ir a https://github.com → Sign up
- Completar: email, contraseña, nombre de usuario

### 2. Subir el proyecto
1. Crear repositorio nuevo → Nombre: `obracontrol` → Public → Create
2. Click en "uploading an existing file"
3. Arrastrar TODOS los archivos de esta carpeta
4. Click en "Commit changes"

### 3. Publicar en Vercel (gratis)
1. Ir a https://vercel.com → Sign up with GitHub
2. Add New Project → seleccionar `obracontrol`
3. Vercel detecta Vite automáticamente → Deploy
4. En 2 minutos tenés la URL: `obracontrol.vercel.app`

### 4. Instalar en Android (Chrome)
1. Abrir la URL en Chrome
2. Menú (3 puntos) → "Agregar a pantalla de inicio"
3. Confirmar → ícono en pantalla de inicio

### 5. Instalar en iPhone (Safari — OBLIGATORIO)
1. Abrir la URL en Safari (no Chrome)
2. Botón compartir ↑ → "Agregar a pantalla de inicio"
3. Confirmar → ícono en pantalla de inicio

## Datos
Todos los datos se guardan en localStorage del dispositivo.
Funciona offline después de la primera carga.
