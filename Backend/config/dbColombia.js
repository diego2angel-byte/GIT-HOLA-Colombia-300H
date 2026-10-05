// Conexion a la base de datos hola-colombia (colecciones: hola-reservas, hola-contactos, hola-toures).
// La base hola_admin_sesiones (usuarios, permisos, sesiones) usa la conexion principal de mongoose
// (ver config/db.js). Son dos bases distintas dentro del mismo servidor Node.
const mongoose = require('mongoose');
const config = require('./config');

const conexion = mongoose.createConnection(config.mongoUriColombia);

conexion.on('error', (err) => console.error('[MongoDB hola-colombia] Error de conexion:', err.message));

module.exports = conexion;
