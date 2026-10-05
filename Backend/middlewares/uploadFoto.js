const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Carpeta donde se guardan TODAS las fotos en el backend: ./foto
const CARPETA_FOTO = path.join(__dirname, '..', 'foto');
fs.mkdirSync(CARPETA_FOTO, { recursive: true });

const MAX_MB_USUARIO = 2;
const MAX_MB_TOUR = 5;

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const esJpg = file.mimetype === 'image/jpeg' && (ext === '.jpg' || ext === '.jpeg');
  if (!esJpg) {
    const err = new Error('Solo se permiten archivos JPG.');
    err.formatoInvalido = true;
    return cb(err);
  }
  cb(null, true);
}

function crearUpload(maxMb, nombreArchivo) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, CARPETA_FOTO),
    filename: (req, file, cb) => cb(null, nombreArchivo(req))
  });
  return multer({ storage, fileFilter, limits: { fileSize: maxMb * 1024 * 1024, files: 1 } }).single('foto');
}

// Foto de usuario: <idUsuario>_<timestamp>.jpg  (campo multipart "foto", max 2 MB)
const upload = crearUpload(MAX_MB_USUARIO, (req) => `${req.params.id}_${Date.now()}.jpg`);

// Foto de tour: tour_<timestamp>_<aleatorio>.jpg  (campo multipart "foto", max 5 MB)
const uploadTour = crearUpload(MAX_MB_TOUR, () => `tour_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.jpg`);

// Verifica la firma real del archivo (JPEG empieza con FF D8 FF), no solo el nombre/mimetype
function esJpegReal(ruta) {
  const fd = fs.openSync(ruta, 'r');
  const buf = Buffer.alloc(3);
  fs.readSync(fd, buf, 0, 3, 0);
  fs.closeSync(fd);
  return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

// Borra un archivo de ./foto a partir del valor guardado en la DB (ej: "foto/abc_123.jpg").
// Usa solo el nombre base para no salir nunca de la carpeta ./foto.
function borrarFoto(archivoFoto) {
  const nombre = path.basename(archivoFoto || '');
  if (!nombre) return;
  fs.unlink(path.join(CARPETA_FOTO, nombre), () => {});
}

function mensajeError(err, maxMb = MAX_MB_USUARIO) {
  if (err instanceof multer.MulterError) {
    return err.code === 'LIMIT_FILE_SIZE'
      ? `La foto supera el maximo de ${maxMb} MB.`
      : 'Error al recibir el archivo.';
  }
  return err.formatoInvalido ? err.message : 'No se pudo procesar el archivo.';
}

module.exports = { upload, uploadTour, esJpegReal, borrarFoto, mensajeError, CARPETA_FOTO, MAX_MB_TOUR };
