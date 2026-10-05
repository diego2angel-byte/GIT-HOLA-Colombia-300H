import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';

declare var Notiflix: any;

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    if (this.auth.estaLogueado) {
      return of(true);
    }
    // Puede que haya cookie de sesion valida pero se recargo la app: se
    // valida contra el backend antes de mandar al login.
    return this.auth.refrescarEstado().pipe(
      map((resp) => {
        if (resp.ok) {
          this.auth.restaurarSesion(resp.usuario, resp.paths, resp.segundos_restantes, resp.duracion_segundos);
          return true;
        }
        this.irALogin();
        return false;
      }),
      catchError(() => {
        this.irALogin();
        return of(false);
      })
    );
  }

  private irALogin(): void {
    Notiflix.Notify.warning('Debe iniciar sesion para continuar.');
    this.router.navigate(['/login']);
  }
}
