const mongoose = require('mongoose');
const conexion = require('../config/dbColombia'); // base hola-colombia

// Coleccion hola-toures: exactamente 5 campos (mas el _id de Mongo)
const tourSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 }, // nombre del tour especial
    ciudad: { type: String, required: true, trim: true, maxlength: 80 },  // Bogota, Cartagena...
    descripcion: { type: String, required: true, trim: true, maxlength: 1500 }, // historia del tour
    precio: { type: Number, required: true, min: 0 },                     // pesos, sin separadores
    foto: { type: String, default: '' }                                   // path en el backend: foto/<archivo>.jpg
  },
  { collection: 'hola-toures', versionKey: false, timestamps: false }
);

module.exports = conexion.model('Tour', tourSchema);
