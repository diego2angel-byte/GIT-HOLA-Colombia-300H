const express = require("express");
const router = express.Router();
const contactoController = require("../controllers/contacto.controller");

router.post("/Guardar", contactoController.guardar);
router.put("/Actualizar", contactoController.actualizar);
router.delete("/Eliminar", contactoController.eliminar);
router.get("/ListarTodos", contactoController.listarTodos);

module.exports = router;
