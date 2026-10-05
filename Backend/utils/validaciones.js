// Expresiones regulares de validación
const REGEX = {
    nombre: /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{2,50}$/,
    apellido: /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{2,50}$/,
    email: /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/,
    edad: /^\d{1,3}$/,
    fecha: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    hora: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm 24h
    tour: /^[^\r\n]{2,120}$/ // nombre del tour: texto de una linea, 2 a 120 caracteres
};

/**
 * Valida un objeto de datos contra un conjunto de campos requeridos.
 * Rechaza si el campo viene vacío/undefined o si no cumple la regex.
 * @param {Object} data - objeto con los datos a validar
 * @param {Array<string>} campos - lista de campos a validar (deben existir en REGEX)
 * @returns {{valido: boolean, mensaje: string}}
 */
function validarCampos(data, campos) {
    for (const campo of campos) {
        const valor = data[campo];

        if (valor === undefined || valor === null || String(valor).trim() === "") {
            return { valido: false, mensaje: `El campo "${campo}" no puede estar vacío` };
        }

        const regex = REGEX[campo];
        if (regex && !regex.test(String(valor).trim())) {
            return { valido: false, mensaje: `El campo "${campo}" tiene un formato inválido` };
        }
    }

    return { valido: true, mensaje: "Datos válidos" };
}

module.exports = { REGEX, validarCampos };
