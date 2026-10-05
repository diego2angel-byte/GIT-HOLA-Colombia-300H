const Reserva = require("../models/reserva.model");
const { validarCampos } = require("../utils/validaciones");
const { enviarConfirmacionReserva } = require("../services/correo");

const CAMPOS_REQUERIDOS = ["nombre", "apellido", "email", "fecha", "hora"];

// Limite de correos por IP (este endpoint es publico y envia un email a la direccion escrita):
// maximo 10 correos cada 10 minutos por IP. La reserva se guarda igual; solo se omite el correo.
const VENTANA_MS = 10 * 60 * 1000;
const MAX_CORREOS = 10;
const correosPorIp = new Map();

function puedeEnviarCorreo(ip) {
    const ahora = Date.now();
    const recientes = (correosPorIp.get(ip) || []).filter((t) => ahora - t < VENTANA_MS);
    if (recientes.length >= MAX_CORREOS) {
        correosPorIp.set(ip, recientes);
        return false;
    }
    recientes.push(ahora);
    correosPorIp.set(ip, recientes);
    return true;
}

// POST /reservas/Guardar  (boton "Confirmar Reserva")
// Guarda la reserva con el nombre del tour y envia un correo HTML de confirmacion al email registrado.
async function guardar(req, res) {
    const data = req.body;

    const { valido, mensaje } = validarCampos(data, [...CAMPOS_REQUERIDOS, "tour"]);
    if (!valido) {
        return res.json({ state: false, mensaje });
    }

    try {
        const nuevaReserva = new Reserva({
            nombre: data.nombre.trim(),
            apellido: data.apellido.trim(),
            email: data.email.trim(),
            fecha: data.fecha.trim(),
            hora: data.hora.trim(),
            tour: data.tour.trim()
        });

        await nuevaReserva.save();

        // La reserva ya quedo guardada; si el correo falla (o se supera el limite) se informa en "correo".
        const correo = puedeEnviarCorreo(req.ip)
            ? await enviarConfirmacionReserva(nuevaReserva)
            : { enviado: false, mensaje: "Se alcanzo el limite de correos desde esta conexion; la reserva quedo guardada." };

        return res.json({ state: true, mensaje: "Reserva guardada correctamente", correo });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al guardar: " + error.message });
    }
}

// PUT /reservas/Actualizar (llave: email; si hay repetidos, usa el último registro encontrado)
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
        const ultima = await Reserva.findOne({ email: data.email.trim() }).sort({ _id: -1 });

        if (!ultima) {
            return res.json({ state: false, mensaje: "Reserva no encontrada" });
        }

        ultima.nombre = data.nombre.trim();
        ultima.apellido = data.apellido.trim();
        ultima.fecha = data.fecha.trim();
        ultima.hora = data.hora.trim();
        if (data.tour !== undefined && String(data.tour).trim() !== "") {
            const validoTour = validarCampos(data, ["tour"]);
            if (!validoTour.valido) {
                return res.json({ state: false, mensaje: validoTour.mensaje });
            }
            ultima.tour = data.tour.trim(); // si no viene, se conserva el tour que ya tenia
        }
        await ultima.save();

        return res.json({ state: true, mensaje: "Reserva actualizada correctamente" });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al actualizar: " + error.message });
    }
}

// DELETE /reservas/Eliminar (llave: email; si hay repetidos, elimina el último registro encontrado)
async function eliminar(req, res) {
    const { email } = req.body;

    if (!email || String(email).trim() === "") {
        return res.json({ state: false, mensaje: 'El campo "email" es requerido para eliminar' });
    }

    try {
        const ultima = await Reserva.findOne({ email: email.trim() }).sort({ _id: -1 });

        if (!ultima) {
            return res.json({ state: false, mensaje: "Reserva no encontrada" });
        }

        await Reserva.findByIdAndDelete(ultima._id);

        return res.json({ state: true, mensaje: "Reserva eliminada correctamente" });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al eliminar: " + error.message });
    }
}

// GET /reservas/ListarTodos
async function listarTodos(req, res) {
    try {
        const reservas = await Reserva.find().sort({ fecha: -1, hora: -1 });
        return res.json({ state: true, mensaje: "Consulta exitosa", total: reservas.length, reservas });
    } catch (error) {
        return res.json({ state: false, mensaje: "Error al listar: " + error.message });
    }
}

module.exports = { guardar, actualizar, eliminar, listarTodos };
