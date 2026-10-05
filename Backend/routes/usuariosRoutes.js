const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { requireSesion, requireAdmin } = require('../middlewares/authMiddleware');

router.use(requireSesion, requireAdmin);

router.get('/', usuariosController.listar);
router.post('/', usuariosController.crear);
router.put('/:id/rol', usuariosController.actualizarRol);
router.put('/:id/password', usuariosController.resetPassword);
router.put('/:id/foto', usuariosController.subirFoto);
router.put('/:id', usuariosController.actualizar);
router.delete('/:id', usuariosController.eliminar);

module.exports = router;
