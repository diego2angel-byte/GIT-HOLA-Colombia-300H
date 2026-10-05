const nodemailer = require('nodemailer');
const path = require('path');
const config = require('../config/config');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'Hola-Colombia.jpg');
const LOGO_CID = 'logo-hola-colombia';
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function smtpConfigurado() {
  return !!config.smtp.usuario && !!config.smtp.clave;
}

function crearTransporte() {
  const { server, port, usuario, clave, starttls } = config.smtp;
  return nodemailer.createTransport({
    host: server,
    port,
    secure: port === 465,                 // 465 = SSL directo; 587 = STARTTLS
    requireTLS: starttls && port !== 465, // exige STARTTLS (smtp_starttls: True)
    auth: { user: usuario, pass: clave },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Marco comun de los correos de Hola Colombia: logo arriba, contenido en el medio y franja amarilla abajo. */
function envolverHtml(cuerpoHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td align="center" style="padding:24px 24px 8px 24px;">
              <img src="cid:${LOGO_CID}" alt="Hola Colombia" width="150" style="display:block; border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px; color:#333333; font-size:15px; line-height:1.5;">
${cuerpoHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#fff3b0; padding:12px; font-size:12px; color:#555555;">
              Hola Colombia &middot; Free Tour Libre
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function htmlAvisoPassword(userName, fecha) {
  return envolverHtml(`              <h2 style="margin:0 0 12px 0; color:#222222;">Tu contrase&ntilde;a fue cambiada</h2>
              <p style="margin:0 0 12px 0;">Hola <strong>${escaparHtml(userName)}</strong>,</p>
              <p style="margin:0 0 12px 0;">Te informamos que la contrase&ntilde;a de tu cuenta fue modificada el <strong>${escaparHtml(fecha)}</strong>.</p>
              <p style="margin:0;">Si no reconoces este cambio, comun&iacute;cate con el administrador lo antes posible.</p>`);
}

/** "2026-10-10" -> "sábado, 10 de octubre de 2026" (sin desfase de zona horaria) */
function formatearFechaReserva(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || ''));
  if (!m) return String(fecha || '');
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** "15:30" -> "3:30 p. m." */
function formatearHoraReserva(hora) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hora || ''));
  if (!m) return String(hora || '');
  const h = Number(m[1]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

function htmlConfirmacionReserva({ nombre, apellido, tour, fecha, hora }) {
  const fila = (etiqueta, valor) => `                <tr>
                  <td style="padding:6px 0; color:#777777; width:90px;">${etiqueta}</td>
                  <td style="padding:6px 0; color:#222222;"><strong>${escaparHtml(valor)}</strong></td>
                </tr>`;
  return envolverHtml(`              <h2 style="margin:0 0 12px 0; color:#222222;">&iexcl;Tu reserva est&aacute; confirmada!</h2>
              <p style="margin:0 0 12px 0;">Hola <strong>${escaparHtml(`${nombre} ${apellido}`.trim())}</strong>,</p>
              <p style="margin:0 0 12px 0;">Recibimos tu reserva con estos datos:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbe6; border-left:4px solid #f7d54d; padding:8px 14px; margin:0 0 16px 0;">
${fila('Tour', tour || 'Por confirmar')}
${fila('Fecha', formatearFechaReserva(fecha))}
${fila('Hora', formatearHoraReserva(hora))}
              </table>
              <p style="margin:0;">Si necesitas cambiar o cancelar tu reserva, escr&iacute;benos o ll&aacute;manos al 302-8288827.</p>`);
}

function describirError(err) {
  if (err && err.code === 'EAUTH') {
    return 'El servidor SMTP rechazo las credenciales (revise SMTP_USUARIO y SMTP_CLAVE; Gmail requiere una contrasena de aplicacion).';
  }
  if (err && (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION' || err.code === 'ESOCKET' || err.code === 'EDNS')) {
    return 'No se pudo conectar con el servidor SMTP.';
  }
  return 'No se pudo enviar el correo de notificacion.';
}

/** Envio comun: valida destinatario y SMTP, manda el correo con el logo incrustado y NUNCA lanza excepcion. */
async function enviarCorreo({ destinatario, asunto, texto, html, transporte, exito }) {
  if (!REGEX_CORREO.test(String(destinatario || ''))) {
    return { enviado: false, mensaje: 'El correo del destinatario no es valido; no se envio la notificacion.' };
  }
  if (!transporte && !smtpConfigurado()) {
    return { enviado: false, mensaje: 'Correo no configurado (faltan SMTP_USUARIO y SMTP_CLAVE en el .env).' };
  }

  try {
    const t = transporte || crearTransporte();
    await t.sendMail({
      from: { name: config.smtp.remite, address: config.smtp.usuario },
      to: destinatario,
      subject: asunto,
      text: texto,
      html,
      attachments: [{ filename: 'Hola-Colombia.jpg', path: LOGO_PATH, cid: LOGO_CID }]
    });
    return { enviado: true, mensaje: exito };
  } catch (err) {
    console.error('Error enviando correo:', err.code || '', err.message);
    return { enviado: false, mensaje: describirError(err) };
  }
}

/**
 * Notifica al usuario que su contrasena cambio. NO incluye la contrasena.
 * Devuelve { enviado, mensaje }. `transporte` es opcional (se usa en pruebas).
 */
async function enviarAvisoCambioPassword(destinatario, transporte) {
  const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  return enviarCorreo({
    destinatario,
    transporte,
    asunto: 'Tu contrasena fue cambiada - Hola Colombia',
    texto:
      `Hola ${destinatario},\n\nTe informamos que la contrasena de tu cuenta fue modificada el ${fecha}.\n` +
      'Si no reconoces este cambio, comunicate con el administrador lo antes posible.\n\nHola Colombia',
    html: htmlAvisoPassword(destinatario, fecha),
    exito: `Notificacion enviada a ${destinatario}.`
  });
}

/**
 * Confirma una reserva al email registrado: tour, fecha y hora de la reserva.
 * `reserva` = { nombre, apellido, email, fecha (YYYY-MM-DD), hora (HH:mm), tour }
 */
async function enviarConfirmacionReserva(reserva, transporte) {
  const { nombre, apellido, email, fecha, hora, tour } = reserva;
  return enviarCorreo({
    destinatario: email,
    transporte,
    asunto: 'Reserva confirmada - Hola Colombia',
    texto:
      `Hola ${nombre} ${apellido},\n\nTu reserva esta confirmada.\n\n` +
      `Tour: ${tour || 'Por confirmar'}\nFecha: ${formatearFechaReserva(fecha)}\nHora: ${formatearHoraReserva(hora)}\n\n` +
      'Si necesitas cambiar o cancelar tu reserva, escribenos o llamanos al 302-8288827.\n\nHola Colombia',
    html: htmlConfirmacionReserva(reserva),
    exito: `Confirmacion enviada a ${email}.`
  });
}

module.exports = { enviarAvisoCambioPassword, enviarConfirmacionReserva, smtpConfigurado };
