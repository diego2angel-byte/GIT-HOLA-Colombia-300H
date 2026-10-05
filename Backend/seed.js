// Crea, si no existen, el usuario admin@admin.com y el rol admin con
// todos los paths permitidos. Se ejecuta automaticamente al levantar el
// server (server.js) y tambien se puede correr manualmente con:
//   npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config/config');
const Usuario = require('./models/Usuario');
const Permiso = require('./models/Permiso');
const { sha256 } = require('./utils/hash');

async function seed() {
  // 1) Rol/permiso inicial: admin con acceso a todos los paths
  let permisoAdmin = await Permiso.findOne({ rol: 'admin' });
  if (!permisoAdmin) {
    permisoAdmin = await Permiso.create({ rol: 'admin', paths: config.adminPaths });
    console.log('[seed] Rol "admin" creado con todos los paths permitidos.');
  } else {
    // Base creada con una version anterior: agrega al rol admin los paths nuevos de /toures
    const faltantes = config.pathsToures.filter(
      (n) => !permisoAdmin.paths.some((p) => p.path === n.path && p.metodo === n.metodo)
    );
    if (faltantes.length) {
      permisoAdmin.paths.push(...faltantes);
      await permisoAdmin.save();
      console.log(`[seed] Se agregaron ${faltantes.length} path(s) de /toures al rol admin.`);
    }
  }

  // 2) Usuario administrador inicial
  let admin = await Usuario.findOne({ user_name: config.adminEmail.toLowerCase() });
  if (!admin) {
    admin = await Usuario.create({
      user_name: config.adminEmail.toLowerCase(),
      password: sha256(config.adminPassword),
      rol: 'admin',
      Activo: 'Si'
    });
    console.log(`[seed] Usuario administrador creado: ${config.adminEmail} / ${config.adminPassword}`);
  }

  return { admin, permisoAdmin };
}

module.exports = seed;

// Permite ejecutar "node seed.js" de forma independiente
if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(seed)
    .then(() => {
      console.log('[seed] Listo.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
