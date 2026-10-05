import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

declare var Notiflix: any;

/** Solo deja entrar a un usuario con sesion valida Y rol admin (ej: /admin_toures2). */
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authGuard: AuthGuard, private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authGuard.canActivate().pipe(
      map((conSesion) => {
        if (!conSesion) return false;
        if (this.auth.usuarioActual?.rol === 'admin') return true;
        Notiflix.Notify.failure('Esta pagina es solo para usuarios con rol admin.');
        this.router.navigate(['/dashboard']);
        return false;
      })
    );
  }
}
