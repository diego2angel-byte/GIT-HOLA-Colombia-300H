const Permiso = require('../models/Permiso');

// GET /permisos  -> lista todos los roles con sus paths (pantalla Apis)
async function listar(req, res) {
  const permisos = await Permiso.find().sort({ rol: 1 });
  res.json({ ok: true, permisos });
}

// GET /permisos/:rol -> paths de un rol especifico (usado por el front tras login)
async function obtenerPorRol(req, res) {
  const { rol } = req.params;
  const permiso = await Permiso.findOne({ rol: rol.toLowerCase().trim() });
  res.json({ ok: true, rol, paths: permiso ? permiso.paths : [] });
}

// POST /permisos  { rol }  -> crea un rol nuevo sin paths
async function crearRol(req, res) {
  try {
    const { rol } = req.body;
    if (!rol) return res.status(400).json({ ok: false, mensaje: 'rol es requerido.' });
    const rolNormalizado = rol.toLowerCase().trim();
    const existe = await Permiso.findOne({ rol: rolNormalizado });
    if (existe) return res.status(409).json({ ok: false, mensaje: 'Ese rol ya existe.' });
    const permiso = await Permiso.create({ rol: rolNormalizado, paths: [] });
    res.status(201).json({ ok: true, permiso });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al crear el rol.' });
  }
}

// PUT /permisos/:rol  { paths: [{path, metodo}, ...] }
// Reemplaza la lista completa de paths permitidos para un rol.
async function actualizarPaths(req, res) {
  try {
    const { rol } = req.params;
    const { paths } = req.body;
    if (!Array.isArray(paths)) {
      return res.status(400).json({ ok: false, mensaje: 'paths debe ser un arreglo.' });
    }
    const permiso = await Permiso.findOneAndUpdate(
      { rol: rol.toLowerCase().trim() },
      { paths },
      { new: true, upsert: true }
    );
    res.json({ ok: true, permiso });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al actualizar los paths.' });
  }
}

module.exports = { listar, obtenerPorRol, crearRol, actualizarPaths };
