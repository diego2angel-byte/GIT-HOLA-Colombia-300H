const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../models/tour.model');
const { uploadTour, esJpegReal, borrarFoto, mensajeError, MAX_MB_TOUR } = require('../middlewares/uploadFoto');

// Ejecuta multer (multipart/form-data) como promesa: deja los campos de texto en req.body
// y el archivo (campo "foto") en req.file.
function recibirMultipart(req, res) {
  return new Promise((resolve, reject) => {
    uploadTour(req, res, (err) => (err ? reject(err) : resolve()));
  });
}

function descartarArchivo(req) {
  if (req.file) fs.unlink(req.file.path, () => {});
}

// Valida y normaliza los campos de texto del tour. Devuelve { error } o { datos }.
function validarCampos(body) {
  const nombre = String(body.nombre || '').trim();
  const ciudad = String(body.ciudad || '').trim();
  const descripcion = String(body.descripcion || '').trim();
  const precioTexto = String(body.precio ?? '').trim();
  const precio = Number(precioTexto);

  if (!nombre) return { error: 'El campo "nombre" es obligatorio.' };
  if (!ciudad) return { error: 'El campo "ciudad" es obligatorio.' };
  if (!descripcion) return { error: 'El campo "descripcion" es obligatorio.' };
  if (precioTexto === '' || !Number.isFinite(precio) || precio < 0) {
    return { error: 'El campo "precio" debe ser un numero mayor o igual a 0.' };
  }
  if (nombre.length > 120) return { error: 'El nombre no puede superar 120 caracteres.' };
  if (ciudad.length > 80) return { error: 'La ciudad no puede superar 80 caracteres.' };
  if (descripcion.length > 1500) return { error: 'La descripcion no puede superar 1500 caracteres.' };
  return { datos: { nombre, ciudad, descripcion, precio } };
}

// POST /toures/Guardar   (multipart/form-data: nombre, ciudad, descripcion, precio, foto)
async function guardar(req, res) {
  try {
    try {
      await recibirMultipart(req, res);
    } catch (err) {
      return res.status(400).json({ state: false, mensaje: mensajeError(err, MAX_MB_TOUR) });
    }

    const { error, datos } = validarCampos(req.body);
    if (error) {
      descartarArchivo(req);
      return res.status(400).json({ state: false, mensaje: error });
    }
    if (!req.file) {
      return res.status(400).json({ state: false, mensaje: 'Debe subir la foto del tour (JPG).' });
    }
    if (!esJpegReal(req.file.path)) {
      descartarArchivo(req);
      return res.status(400).json({ state: false, mensaje: 'El archivo no es un JPG valido.' });
    }

    const tour = await Tour.create({ ...datos, foto: `foto/${req.file.filename}` });
    return res.status(201).json({ state: true, mensaje: 'Tour guardado correctamente', tour });
  } catch (error) {
    descartarArchivo(req);
    console.error(error);
    return res.status(500).json({ state: false, mensaje: 'Error interno al guardar el tour.' });
  }
}

// PUT /toures/Actualizar   (multipart/form-data: _id, nombre, ciudad, descripcion, precio, foto opcional)
// Si llega una foto nueva, el path de "foto" se sobre-escribe y la foto anterior se borra del disco.
async function actualizar(req, res) {
  try {
    try {
      await recibirMultipart(req, res);
    } catch (err) {
      return res.status(400).json({ state: false, mensaje: mensajeError(err, MAX_MB_TOUR) });
    }

    const id = String(req.body._id || '').trim();
    if (!mongoose.isValidObjectId(id)) {
      descartarArchivo(req);
      return res.status(400).json({ state: false, mensaje: 'El campo "_id" es obligatorio y debe ser valido.' });
    }

    const { error, datos } = validarCampos(req.body);
    if (error) {
      descartarArchivo(req);
      return res.status(400).json({ state: false, mensaje: error });
    }

    const existente = await Tour.findById(id);
    if (!existente) {
      descartarArchivo(req);
      return res.status(404).json({ state: false, mensaje: 'Tour no encontrado.' });
    }

    const fotoAnterior = existente.foto; // se guarda antes de actualizar para poder borrarla despues
    const cambios = { ...datos };
    if (req.file) {
      if (!esJpegReal(req.file.path)) {
        descartarArchivo(req);
        return res.status(400).json({ state: false, mensaje: 'El archivo no es un JPG valido.' });
      }
      cambios.foto = `foto/${req.file.filename}`;
    }

    const tour = await Tour.findByIdAndUpdate(id, cambios, { new: true, runValidators: true });
    if (req.file) borrarFoto(fotoAnterior);
    return res.json({ state: true, mensaje: 'Tour actualizado correctamente', tour });
  } catch (error) {
    descartarArchivo(req);
    console.error(error);
    return res.status(500).json({ state: false, mensaje: 'Error interno al actualizar el tour.' });
  }
}

// DELETE /toures/Eliminar   (body JSON { _id } o query ?_id=...)
async function eliminar(req, res) {
  try {
    const id = String((req.body && req.body._id) || req.query._id || '').trim();
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ state: false, mensaje: 'El campo "_id" es obligatorio y debe ser valido.' });
    }
    const tour = await Tour.findByIdAndDelete(id);
    if (!tour) return res.status(404).json({ state: false, mensaje: 'Tour no encontrado.' });
    borrarFoto(tour.foto);
    return res.json({ state: true, mensaje: 'Tour eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ state: false, mensaje: 'Error interno al eliminar el tour.' });
  }
}

// GET /toures/ListarTodos   (publico: lo usa la pagina /toures2). Orden de ingreso (el nuevo queda al final).
async function listarTodos(req, res) {
  try {
    const toures = await Tour.find().sort({ _id: 1 });
    return res.json({ state: true, total: toures.length, toures });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ state: false, mensaje: 'Error interno al listar los toures.' });
  }
}

module.exports = { guardar, actualizar, eliminar, listarTodos };
