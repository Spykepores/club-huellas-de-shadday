# Club Huellas de Shadday ⛺

Plataforma web oficial del **Club de Conquistadores Huellas de Shadday** (Aventureros · Conquistadores · Guías Jóvenes).

## ✨ Funcionalidades

- **Inicio futurista** con la presentación del club, unidades y estadísticas en vivo
- **Desafío Seven**: página del evento anual con reglas, itinerario e inscripción
- **Perfiles de conquistadores** con foto, portada, álbumes, publicaciones y muro de logros
- **Rankings y podio** por puntos de especialidades
- **Eventos del club** con confirmación de asistencia (✋)
- **Biblioteca**: banco de información con archivos adjuntos (PDF, Word, imágenes…)
- **Música estilo Spotify**: canciones por artista, playlist personal de favoritas y **reproductor global persistente** que sigue sonando en toda la página
- **Chat del club en vivo**: usuarios conectados, mensajes de texto + emojis (400+), privados 1 a 1 y notificaciones con sonido
- **Panel de administración**: crear, **editar** ✏️ y eliminar canciones, recursos, especialidades y eventos

## 🧱 Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Hono + tRPC 11 + Drizzle ORM + MySQL
- **Autenticación**: Kimi OAuth

## 🚀 Puesta en marcha

```bash
npm install
cp .env.example .env              # completa las credenciales de la base de datos
npm run build
NODE_ENV=production node dist/boot.js
```

> **Nota sobre los assets**: los logos y sonidos de `public/assets/` (6 archivos:
> logo-club.png, logo-seven.png, favicon-club.png, ambiente.mp3,
> sonido_bienvenida.mp3, sonido_registro.mp3) se suben manualmente desde la web de
> GitHub (Add file → Upload files) porque el respaldo se hizo por API de texto.

## 📁 Estructura

```
api/            Servidor (rutas tRPC, auth, boot)
db/             Esquema Drizzle y seed
src/pages/      Home, Desafío Seven, Música, Biblioteca, Perfiles, Admin…
src/components/ ChatWidget, PlayerBar, ProfileCard…
src/providers/  Reproductor global (player) y cliente tRPC
public/assets/  Logos y sonidos del club
```
