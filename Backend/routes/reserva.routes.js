const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reserva.controller");

router.post("/Guardar", reservaController.guardar);
router.put("/Actualizar", reservaController.actualizar);
router.delete("/Eliminar", reservaController.eliminar);
router.get("/ListarTodos", reservaController.listarTodos);

module.exports = router;
