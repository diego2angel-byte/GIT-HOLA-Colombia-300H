const Sesion = require('../models/Sesion');
const config = require('../config/config');

/**
 * Verifica que exista una cookie de sesion valida y no vencida.
 * Si la sesion vencio, la marca como inactiva, limpia la cookie
 * y responde 401 para que el front fuerce logout.
 */
async function requireSesion(req, res, next) {
  const sessionId = req.cookies[config.sessionCookieName];

  if (!sessionId) {
    return res.status(401).json({ ok: false, mensaje: 'No hay sesion activa. Inicie sesion.' });
  }

  const sesion = await Sesion.findById(sessionId);

  if (!sesion || !sesion.activa) {
    res.clearCookie(config.sessionCookieName);
    return res.status(401).json({ ok: false, mensaje: 'Sesion invalida. Inicie sesion nuevamente.' });
  }

  if (sesion.expira.getTime() <= Date.now()) {
    sesion.activa = false;
    sesion.cierre = new Date();
    sesion.motivo_cierre = 'expirada';
    await sesion.save();
    res.clearCookie(config.sessionCookieName);
    return res.status(401).json({ ok: false, mensaje: 'La sesion ha expirado.' });
  }

  req.sesion = sesion;
  req.usuarioActual = { id: sesion.usuario, user_name: sesion.user_name, rol: sesion.rol };
  next();
}

/**
 * Restringe una ruta al rol admin.
 */
function requireAdmin(req, res, next) {
  if (!req.usuarioActual || req.usuarioActual.rol !== 'admin') {
    return res.status(403).json({ ok: false, mensaje: 'Requiere privilegios de administrador.' });
  }
  next();
}

module.exports = { requireSesion, requireAdmin };
