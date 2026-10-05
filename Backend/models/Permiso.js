const mongoose = require('mongoose');

const PathPermitidoSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, trim: true },
    metodo: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      uppercase: true
    }
  },
  { _id: false }
);

const PermisoSchema = new mongoose.Schema(
  {
    rol: { type: String, required: true, unique: true, trim: true, lowercase: true },
    paths: { type: [PathPermitidoSchema], default: [] }
  },
  { timestamps: true, collection: 'permisos' }
);

module.exports = mongoose.model('Permiso', PermisoSchema);
