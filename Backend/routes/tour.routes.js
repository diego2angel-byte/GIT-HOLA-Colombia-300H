const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tour.controller');
const { requireSesion, requireAdmin } = require('../middlewares/authMiddleware');

// Publico: la pagina /toures2 del sitio lista los toures sin iniciar sesion
router.get('/ListarTodos', tourController.listarTodos);

// Administracion (/admin_toures2): solo sesion valida con rol admin
router.post('/Guardar', requireSesion, requireAdmin, tourController.guardar);
router.put('/Actualizar', requireSesion, requireAdmin, tourController.actualizar);
router.delete('/Eliminar', requireSesion, requireAdmin, tourController.eliminar);

module.exports = router;
