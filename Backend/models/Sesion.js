const mongoose = require('mongoose');

const SesionSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    user_name: { type: String, required: true },
    rol: { type: String, required: true },
    tiempo_sesion: { type: Number, required: true }, // duracion configurada, en segundos
    inicio: { type: Date, default: Date.now },
    expira: { type: Date, required: true },
    activa: { type: Boolean, default: true },
    cierre: { type: Date, default: null },
    motivo_cierre: { type: String, default: null } // 'logout' | 'expirada'
  },
  { timestamps: true, collection: 'sesiones' }
);

module.exports = mongoose.model('Sesion', SesionSchema);
