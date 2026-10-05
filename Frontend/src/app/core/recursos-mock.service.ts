import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

/**
 * Simula, dentro del propio Angular, el recurso protegido que antes
 * exponia un servidor aparte (mock-api en el puerto 3000).
 * Cada "tabla" vive en memoria mientras dura la sesion del navegador.
 * La firma de los metodos imita una API REST real (ListarTodos, Guardar,
 * Actualizar, Eliminar) para que PermisosService los intercepte igual
 * que si fueran peticiones HTTP salientes.
 */
@Injectable({ providedIn: 'root' })
export class RecursosMockService {
  private datos: Record<string, any[]> = {
    reservas: [
      { id: 1, nombre: 'Mesa 4 personas', fecha: '2026-08-20' },
      { id: 2, nombre: 'Salon evento', fecha: '2026-08-25' }
    ],
    contactos: [{ id: 1, nombre: 'Diego Angel', email: 'diego2angel@gmail.com' }],
    usuarios: [{ id: 1, nombre: 'Usuario demo', rol: 'usuario' }]
  };

  private siguienteId: Record<string, number> = { reservas: 3, contactos: 2, usuarios: 2 };

  /** clave: 'reservas' | 'contactos' | 'usuarios', extraida del path '/reservas/ListarTodos' */
  private clave(path: string): string {
    return path.split('/').filter(Boolean)[0];
  }

  listarTodos(path: string): Observable<{ ok: boolean; total: number; datos: any[] }> {
    const clave = this.clave(path);
    const lista = this.datos[clave] || [];
    return of({ ok: true, total: lista.length, datos: [...lista] }).pipe(delay(250));
  }

  guardar(path: string, body: any): Observable<{ ok: boolean; mensaje: string; datos: any }> {
    const clave = this.clave(path);
    if (!this.datos[clave]) return throwError(() => new Error('Recurso no encontrado'));
    const nuevo = { id: this.siguienteId[clave]++, ...body };
    this.datos[clave].push(nuevo);
    return of({ ok: true, mensaje: `${clave} guardado.`, datos: nuevo }).pipe(delay(250));
  }

  actualizar(path: string, body: any): Observable<{ ok: boolean; mensaje: string; datos: any }> {
    const clave = this.clave(path);
    const lista = this.datos[clave] || [];
    const idx = lista.findIndex((d) => d.id === Number(body.id));
    if (idx === -1) return throwError(() => ({ error: { mensaje: 'No encontrado.' } }));
    lista[idx] = { ...lista[idx], ...body, id: Number(body.id) };
    return of({ ok: true, mensaje: `${clave} actualizado.`, datos: lista[idx] }).pipe(delay(250));
  }

  eliminar(path: string, id: number): Observable<{ ok: boolean; mensaje: string }> {
    const clave = this.clave(path);
    const lista = this.datos[clave] || [];
    const antes = lista.length;
    this.datos[clave] = lista.filter((d) => d.id !== id);
    if (this.datos[clave].length === antes) return throwError(() => ({ error: { mensaje: 'No encontrado.' } }));
    return of({ ok: true, mensaje: `${clave} eliminado.` }).pipe(delay(250));
  }
}
