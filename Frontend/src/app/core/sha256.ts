/**
 * SHA256 en el navegador usando la Web Crypto API (nativa, sin dependencias).
 * El password nunca viaja en texto plano hacia el backend.
 */
export async function sha256(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', datos);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
