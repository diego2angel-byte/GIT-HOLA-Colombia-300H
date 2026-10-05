const Contacto = require("../models/contacto.model");
const { validarCampos } = require("../utils/validaciones");

const CAMPOS_REQUERIDOS = ["nombre", "apellido", "edad", "email"];

// POST /contactos/Guardar
async function guardar(req, res) {
    const data = req.body;

    const { valido, mensaje } = validarCampos(data, CAMPOS_REQUERIDOS);
    if (!valido) {
        return res.json({ state: false, mensaje });
    }

    try {
        const nuevoContacto = new Contacto({
            nombre: data.nombre.trim(),
            apellido: data.apellido.trim(),
            edad: Number(data.edad),
            email: data.email.trim(),
            tour: data.tour ? data.tour.trim() : ""
        });

        await nuevoContacto.save();
        return res.json({ state: true, mensaje: "Contacto guardado correctamente" });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al guardar: " + error.message });
    }
}

// PUT /contactos/Actualizar (llave: email; si hay repetidos, usa el último registro encontrado)
async function actualizar(req, res) {
    const data = req.body;

    if (!data.email || String(data.email).trim() === "") {
        return res.json({ state: false, mensaje: 'El campo "email" es requerido para actualizar' });
    }

    const { valido, mensaje } = validarCampos(data, CAMPOS_REQUERIDOS);
    if (!valido) {
        return res.json({ state: false, mensaje });
    }

    try {
        // Busca todos los documentos con ese email y toma el último (más reciente) por _id
        const ultimo = await Contacto.findOne({ email: data.email.trim() }).sort({ _id: -1 });

        if (!ultimo) {
            return res.json({ state: false, mensaje: "Contacto no encontrado" });
        }

        ultimo.nombre = data.nombre.trim();
        ultimo.apellido = data.apellido.trim();
        ultimo.edad = Number(data.edad);
        ultimo.tour = data.tour ? data.tour.trim() : ultimo.tour;
        await ultimo.save();

        return res.json({ state: true, mensaje: "Contacto actualizado correctamente" });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al actualizar: " + error.message });
    }
}

// DELETE /contactos/Eliminar (llave: email; si hay repetidos, elimina el último registro encontrado)
async function eliminar(req, res) {
    const { email } = req.body;

    if (!email || String(email).trim() === "") {
        return res.json({ state: false, mensaje: 'El campo "email" es requerido para eliminar' });
    }

    try {
        const ultimo = await Contacto.findOne({ email: email.trim() }).sort({ _id: -1 });

        if (!ultimo) {
            return res.json({ state: false, mensaje: "Contacto no encontrado" });
        }

        await Contacto.findByIdAndDelete(ultimo._id);

        return res.json({ state: true, mensaje: "Contacto eliminado correctamente" });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al eliminar: " + error.message });
    }
}

// GET /contactos/ListarTodos
async function listarTodos(req, res) {
    try {
        const contactos = await Contacto.find().sort({ fechaRegistro: -1 });
        return res.json({ state: true, mensaje: "Consulta exitosa", total: contactos.length, contactos });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al listar: " + error.message });
    }
}

module.exports = { guardar, actualizar, eliminar, listarTodos };
