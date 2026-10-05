const mongoose = require("mongoose");
const conexion = require("../config/dbColombia"); // conexion a la base hola-colombia

const reservaSchema = new mongoose.Schema(
    {
        nombre:   { type: String, required: true },
        apellido: { type: String, required: true },
        email:    { type: String, required: true },
        fecha:    { type: String, required: true }, // formato YYYY-MM-DD
        hora:     { type: String, required: true },  // formato HH:mm
        tour:     { type: String, trim: true, default: "" } // nombre del tour reservado (las reservas antiguas no lo tienen)
    },
    { collection: "hola-reservas" }
);

module.exports = conexion.model("Reserva", reservaSchema);
