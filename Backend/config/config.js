require('dotenv').config();

module.exports = {
  // Un solo servidor para todo el sistema (antes: 3000 hola-colombia y 4000 sesiones)
  port: process.env.PORT || 3000,
  // Base de usuarios, permisos y sesiones
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hola_admin_sesiones',
  // Base del sitio: hola-reservas, hola-contactos y hola-toures
  mongoUriColombia: process.env.MONGO_URI_COLOMBIA || 'mongodb://127.0.0.1:27017/hola-colombia',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',

  // === Duracion de sesion configurable ===
  // Todo el sistema (cookie, documento Sesion, temporizador del front) se
  // basa en este unico valor. Cambialo aqui (o en el .env con SESSION_MINUTES)
  // para modificar cuanto dura una sesion antes de vencer.
  sessionMinutes: parseInt(process.env.SESSION_MINUTES, 10) || 5,

  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'session_id',

  // === Correo (SMTP) para avisar al usuario que su contrasena cambio ===
  // Se configura en el .env (nunca en el codigo). Para Gmail se requiere una
  // "contrasena de aplicacion" (cuenta con verificacion en 2 pasos).
  smtp: {
    usuario: process.env.SMTP_USUARIO || '',
    clave: process.env.SMTP_CLAVE || '',
    remite: process.env.SMTP_REMITE || 'Hola Colombia',
    server: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    starttls: String(process.env.SMTP_STARTTLS ?? 'true').toLowerCase() !== 'false'
  },

  adminEmail: process.env.ADMIN_EMAIL || 'admin@admin.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin1234',

  // Paths iniciales del rol admin. Se cargan una sola vez en el seed.
  adminPaths: [
    { path: '/reservas/Eliminar', metodo: 'DELETE' },
    { path: '/reservas/ListarTodos', metodo: 'GET' },
    { path: '/reservas/Guardar', metodo: 'POST' },
    { path: '/reservas/Actualizar', metodo: 'PUT' },
    { path: '/contactos/Eliminar', metodo: 'DELETE' },
    { path: '/contactos/ListarTodos', metodo: 'GET' },
    { path: '/contactos/Guardar', metodo: 'POST' },
    { path: '/contactos/Actualizar', metodo: 'PUT' },
    { path: '/usuarios/Eliminar', metodo: 'DELETE' },
    { path: '/usuarios/ListarTodos', metodo: 'GET' },
    { path: '/usuarios/Guardar', metodo: 'POST' },
    { path: '/usuarios/Actualizar', metodo: 'PUT' },
    { path: '/toures/Eliminar', metodo: 'DELETE' },
    { path: '/toures/ListarTodos', metodo: 'GET' },
    { path: '/toures/Guardar', metodo: 'POST' },
    { path: '/toures/Actualizar', metodo: 'PUT' }
  ],

  // Paths agregados despues de la primera version: el seed los incorpora al rol admin
  // si la base ya existia (ver seed.js).
  pathsToures: [
    { path: '/toures/Eliminar', metodo: 'DELETE' },
    { path: '/toures/ListarTodos', metodo: 'GET' },
    { path: '/toures/Guardar', metodo: 'POST' },
    { path: '/toures/Actualizar', metodo: 'PUT' }
  ]
};
