const mongoose = require('mongoose');
const config = require('./config');
const conexionColombia = require('./dbColombia');

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri); // hola_admin_sesiones
    console.log(`[MongoDB] Conectado a ${config.mongoUri}`);
    await conexionColombia.asPromise(); // hola-colombia
    console.log(`[MongoDB] Conectado a ${config.mongoUriColombia}`);
  } catch (err) {
    console.error('[MongoDB] Error de conexion:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
