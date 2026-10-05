const Usuario = require('../models/Usuario');
const Sesion = require('../models/Sesion');
const Permiso = require('../models/Permiso');
const { sha256 } = require('../utils/hash');
const config = require('../config/config');

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: config.sessionMinutes * 60 * 1000
  };
}

// POST /auth/login  { user_name, password }
// El password puede llegar ya en SHA256 desde el front, o en texto plano;
// en ambos casos se compara aplicando SHA256 para no manejar texto plano.
async function login(req, res) {
  try {
    const { user_name, password } = req.body;
    if (!user_name || !password) {
      return res.status(400).json({ ok: false, mensaje: 'user_name y password son requeridos.' });
    }

    const usuario = await Usuario.findOne({ user_name: String(user_name).toLowerCase().trim() });
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales invalidas.' });
    }

    if (usuario.Activo !== 'Si') {
      return res.status(403).json({ ok: false, mensaje: 'El usuario esta inactivo.' });
    }

    // El front envia el password ya hasheado en SHA256; si por algun motivo
    // llega en texto plano tambien se acepta hasheandolo aqui.
    const hashRecibido = password.length === 64 ? password : sha256(password);
    if (hashRecibido !== usuario.password) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales invalidas.' });
    }

    const tiempoSesionSegundos = config.sessionMinutes * 60;
    const sesion = await Sesion.create({
      usuario: usuario._id,
      user_name: usuario.user_name,
      rol: usuario.rol,
      tiempo_sesion: tiempoSesionSegundos,
      expira: new Date(Date.now() + tiempoSesionSegundos * 1000)
    });

    res.cookie(config.sessionCookieName, sesion._id.toString(), cookieOptions());

    const permiso = await Permiso.findOne({ rol: usuario.rol });

    return res.json({
      ok: true,
      usuario: { user_name: usuario.user_name, rol: usuario.rol },
      duracion_segundos: tiempoSesionSegundos,
      expira: sesion.expira,
      paths: permiso ? permiso.paths : []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al iniciar sesion.' });
  }
}

// POST /auth/logout
async function logout(req, res) {
  try {
    if (req.sesion) {
      req.sesion.activa = false;
      req.sesion.cierre = new Date();
      req.sesion.motivo_cierre = 'logout';
      await req.sesion.save();
    }
    res.clearCookie(config.sessionCookieName);
    return res.json({ ok: true, mensaje: 'Sesion cerrada.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al cerrar sesion.' });
  }
}

// GET /auth/estado  -> usado por el temporizador del front para
// sincronizar el tiempo restante real (el que manda es el backend).
async function estado(req, res) {
  const sesion = req.sesion;
  const segundosRestantes = Math.max(0, Math.round((sesion.expira.getTime() - Date.now()) / 1000));

  const permiso = await Permiso.findOne({ rol: sesion.rol });

  return res.json({
    ok: true,
    usuario: { user_name: sesion.user_name, rol: sesion.rol },
    segundos_restantes: segundosRestantes,
    duracion_segundos: sesion.tiempo_sesion,
    paths: permiso ? permiso.paths : []
  });
}

// POST /auth/renovar
// Sesion deslizante: cada vez que el front detecta actividad del usuario, se
// reinicia el tiempo completo definido en .env (SESSION_MINUTES): se extiende
// "expira" en la coleccion sesiones y se vuelve a emitir la cookie (mismo ObjectId)
// con un maxAge nuevo. Devuelve el tiempo para que el reloj del front se actualice.
async function renovar(req, res) {
  try {
    const sesion = req.sesion;
    const segundos = config.sessionMinutes * 60;

    sesion.tiempo_sesion = segundos;
    sesion.expira = new Date(Date.now() + segundos * 1000);
    await sesion.save();

    res.cookie(config.sessionCookieName, sesion._id.toString(), cookieOptions());

    return res.json({
      ok: true,
      segundos_restantes: segundos,
      duracion_segundos: segundos,
      expira: sesion.expira
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al renovar la sesion.' });
  }
}

module.exports = { login, logout, estado, renovar };
