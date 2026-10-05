import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { RecursosMockService } from './recursos-mock.service';

declare var Notiflix: any;

@Injectable({ providedIn: 'root' })
export class PermisosService {
  constructor(private auth: AuthService, private recursos: RecursosMockService) {}

  /**
   * Verifica que el rol actual tenga permitido el path+metodo indicados
   * (la lista de paths llega del backend al iniciar sesion / refrescar
   * estado). Si no lo tiene, muestra el aviso de "sin privilegios" con
   * Notiflix y no ejecuta ninguna accion.
   */
  tienePermiso(path: string, metodo: 'GET' | 'POST' | 'PUT' | 'DELETE'): boolean {
    const paths = this.auth.paths$.value || [];
    const permitido = paths.some((p) => p.path === path && p.metodo === metodo);
    if (!permitido) {
      Notiflix.Report.failure(
        'Sin privilegios',
        `El usuario "${this.auth.usuarioActual?.user_name ?? ''}" no tiene permisos para ${metodo} ${path}.`,
        'Entendido'
      );
    }
    return permitido;
  }

  /**
   * Estos 4 metodos son el unico punto por el que el resto del front
   * accede al recurso (antes era HTTP contra mock-api en :3000, ahora es
   * el servicio en memoria RecursosMockService). El chequeo de permiso
   * ocurre siempre ANTES de tocar el recurso, sin importar de donde venga.
   */
  get<T>(path: string): Observable<T> {
    if (!this.tienePermiso(path, 'GET')) return throwError(() => new Error('SIN_PRIVILEGIOS'));
    return this.recursos.listarTodos(path) as unknown as Observable<T>;
  }

  post<T>(path: string, body: any): Observable<T> {
    if (!this.tienePermiso(path, 'POST')) return throwError(() => new Error('SIN_PRIVILEGIOS'));
    return this.recursos.guardar(path, body) as unknown as Observable<T>;
  }

  put<T>(path: string, body: any): Observable<T> {
    if (!this.tienePermiso(path, 'PUT')) return throwError(() => new Error('SIN_PRIVILEGIOS'));
    return this.recursos.actualizar(path, body) as unknown as Observable<T>;
  }

  delete<T>(path: string, id: number): Observable<T> {
    if (!this.tienePermiso(path, 'DELETE')) return throwError(() => new Error('SIN_PRIVILEGIOS'));
    return this.recursos.eliminar(path, id) as unknown as Observable<T>;
  }
}
