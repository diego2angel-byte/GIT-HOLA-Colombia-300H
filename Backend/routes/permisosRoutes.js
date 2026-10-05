const express = require('express');
const router = express.Router();
const permisosController = require('../controllers/permisosController');
const { requireSesion, requireAdmin } = require('../middlewares/authMiddleware');

// Consultar los paths de un rol lo puede hacer cualquier sesion valida
// (lo usa el propio usuario logueado para saber que puede ver).
router.get('/:rol', requireSesion, permisosController.obtenerPorRol);

// Administrar roles/paths requiere ser admin.
router.get('/', requireSesion, requireAdmin, permisosController.listar);
router.post('/', requireSesion, requireAdmin, permisosController.crearRol);
router.put('/:rol', requireSesion, requireAdmin, permisosController.actualizarPaths);

module.exports = router;
