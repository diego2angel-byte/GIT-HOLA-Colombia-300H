const mongoose = require("mongoose");
const conexion = require("../config/dbColombia"); // conexion a la base hola-colombia

const contactoSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true },
        apellido: { type: String, required: true },
        edad: { type: Number, required: true },
        email: { type: String, required: true },
        tour: { type: String, required: true },
        fechaRegistro: { type: Date, default: Date.now }
    },
    { collection: "hola-contactos" } // fuerza el nombre exacto de la colección (sin pluralizar)
);

module.exports = conexion.model("Contacto", contactoSchema);
