const Usuario = require('../models/Usuario');
const fs = require('fs');
const mongoose = require('mongoose');
const { sha256 } = require('../utils/hash');
const { upload, esJpegReal, borrarFoto, mensajeError } = require('../middlewares/uploadFoto');
const { enviarAvisoCambioPassword } = require('../services/correo');

// GET /usuarios
async function listar(req, res) {
  const usuarios = await Usuario.find({}, '-password').sort({ user_name: 1 });
  res.json({ ok: true, usuarios });
}

// POST /usuarios  { user_name, password, rol, Activo }
async function crear(req, res) {
  try {
    const { user_name, password, rol, Activo } = req.body;
    if (!user_name || !password || !rol) {
      return res.status(400).json({ ok: false, mensaje: 'user_name, password y rol son requeridos.' });
    }
    const existe = await Usuario.findOne({ user_name: user_name.toLowerCase().trim() });
    if (existe) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un usuario con ese correo.' });
    }
    const hashRecibido = password.length === 64 ? password : sha256(password);
    const usuario = await Usuario.create({
      user_name: user_name.toLowerCase().trim(),
      password: hashRecibido,
      rol: rol.toLowerCase().trim(),
      Activo: Activo === 'No' ? 'No' : 'Si'
    });
    const { password: _p, ...usuarioSinPassword } = usuario.toObject();
    res.status(201).json({ ok: true, usuario: usuarioSinPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al crear el usuario.' });
  }
}

// PUT /usuarios/:id/rol  { rol }
// Endpoint principal de la pantalla "Roles": cambia el rol de un usuario.
async function actualizarRol(req, res) {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    if (!rol) return res.status(400).json({ ok: false, mensaje: 'rol es requerido.' });

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { rol: rol.toLowerCase().trim() },
      { new: true, fields: '-password' }
    );
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    res.json({ ok: true, usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al actualizar el rol.' });
  }
}

// PUT /usuarios/:id  { rol, Activo }  -> edicion general usada en pantallas Usuarios
// El user_name NO se puede modificar (es la llave del login) y el password
// se cambia solo por PUT /usuarios/:id/password.
// updatedAt se actualiza solo (schema con timestamps: true).
async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const cambios = {};
    if (req.body.rol) cambios.rol = req.body.rol.toLowerCase().trim();
    if (req.body.Activo) cambios.Activo = req.body.Activo === 'No' ? 'No' : 'Si';

    const usuario = await Usuario.findByIdAndUpdate(id, cambios, { new: true, fields: '-password' });
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    res.json({ ok: true, usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al actualizar el usuario.' });
  }
}

// PUT /usuarios/:id/password  { password }
// Despues de cambiarla, envia un correo HTML de aviso al user_name (con el logo).
// Restablece la contrasena: se guarda siempre como hash SHA256 y se
// actualiza automaticamente el campo updatedAt.
async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ ok: false, mensaje: 'password es requerido.' });
    }
    const hashRecibido = password.length === 64 ? password : sha256(password);

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { password: hashRecibido },
      { new: true, fields: '-password' }
    );
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });

    // Aviso por correo al usuario (sin incluir la contrasena). Si el correo falla,
    // la contrasena ya quedo cambiada y se informa el fallo en "correo".
    const correo = await enviarAvisoCambioPassword(usuario.user_name);
    res.json({ ok: true, mensaje: 'Contrasena restablecida.', usuario, correo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al restablecer la contrasena.' });
  }
}

// PUT /usuarios/:id/foto   (multipart/form-data, campo "foto", solo JPG, max 2 MB)
// Guarda el archivo en ./foto y sobre-escribe archivo_foto (path + nombre) en la DB.
// La foto anterior se elimina del disco. updatedAt se actualiza solo (timestamps).
async function subirFoto(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id de usuario invalido.' });
    }
    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });

    upload(req, res, async (err) => {
      try {
        if (err) return res.status(400).json({ ok: false, mensaje: mensajeError(err) });
        if (!req.file) {
          return res.status(400).json({ ok: false, mensaje: 'Debe enviar la foto en el campo "foto".' });
        }
        if (!esJpegReal(req.file.path)) {
          fs.unlink(req.file.path, () => {});
          return res.status(400).json({ ok: false, mensaje: 'El archivo no es un JPG valido.' });
        }

        const anterior = usuario.archivo_foto;
        const actualizado = await Usuario.findByIdAndUpdate(
          id,
          { archivo_foto: `foto/${req.file.filename}` },
          { new: true, fields: '-password' }
        );
        borrarFoto(anterior);
        res.json({ ok: true, mensaje: 'Foto actualizada.', usuario: actualizado });
      } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, mensaje: 'Error interno al guardar la foto.' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al subir la foto.' });
  }
}

// DELETE /usuarios/:id
async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    borrarFoto(usuario.archivo_foto);
    res.json({ ok: true, mensaje: 'Usuario eliminado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error interno al eliminar el usuario.' });
  }
}

module.exports = { listar, crear, actualizarRol, actualizar, resetPassword, subirFoto, eliminar };
