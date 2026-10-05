const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireSesion } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/logout', requireSesion, authController.logout);
router.get('/estado', requireSesion, authController.estado);
router.post('/renovar', requireSesion, authController.renovar);

module.exports = router;
