const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema(
  {
    user_name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // guardado como hash SHA256
    rol: { type: String, required: true, default: 'usuario' },
    Activo: { type: String, enum: ['Si', 'No'], default: 'Si' },
    archivo_foto: { type: String, default: '' } // path relativo + nombre en el backend, ej: foto/<id>_<timestamp>.jpg
  },
  { timestamps: true, collection: 'usuarios' }
);

module.exports = mongoose.model('Usuario', UsuarioSchema);
