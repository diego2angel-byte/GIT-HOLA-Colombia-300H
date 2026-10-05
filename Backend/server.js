require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config/config');
const connectDB = require('./config/db');
const seed = require('./seed');

const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const permisosRoutes = require('./routes/permisosRoutes');
const contactoRoutes = require('./routes/contacto.routes');
const reservaRoutes = require('./routes/reserva.routes');
const tourRoutes = require('./routes/tour.routes');

const app = express();

app.use(
  cors({
    origin: config.corsOrigin, // origen del front Angular (http://localhost:4200)
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded (Postman)
app.use(cookieParser());

// Fotos de usuario (./foto) servidas como archivos estaticos: http://localhost:3000/foto/<archivo>.jpg (fotos de usuarios y de toures)
app.use('/foto', express.static(path.join(__dirname, 'foto')));

app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/permisos', permisosRoutes);
app.use('/contactos', contactoRoutes); // base hola-colombia > hola-contactos
app.use('/reservas', reservaRoutes);   // base hola-colombia > hola-reservas
app.use('/toures', tourRoutes);        // base hola-colombia > hola-toures

app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'API Hola Colombia (sitio + administracion de sesiones) activa.' });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' });
});

async function iniciar() {
  await connectDB();
  await seed();
  app.listen(config.port, () => {
    console.log(`[server] backend Hola Colombia escuchando en http://localhost:${config.port}`);
    console.log(`[server] Duracion de sesion configurada: ${config.sessionMinutes} minuto(s)`);
  });
}

iniciar();
