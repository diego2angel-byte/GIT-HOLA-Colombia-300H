const crypto = require('crypto');

// SHA256 en hexadecimal (64 caracteres), igual al que genera el frontend
function sha256(texto) {
  return crypto.createHash('sha256').update(String(texto)).digest('hex');
}

module.exports = { sha256 };
