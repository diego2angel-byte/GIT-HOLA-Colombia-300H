import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { UsuarioSesion } from '../core/models';

declare var Notiflix: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit, OnDestroy {
  usuario$: Observable<UsuarioSesion | null> = this.auth.usuario$;
  segundosRestantes$ = this.auth.segundosRestantes$;
  duracionSegundos$ = this.auth.duracionSegundos$;

  private usuarioSub?: Subscription;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Si la sesion se cae (expira) en cualquier momento, regresa al login.
    this.usuarioSub = this.usuario$.subscribe((usuario) => {
      if (!usuario) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.usuarioSub?.unsubscribe();
  }

  cerrarSesion(): void {
    Notiflix.Confirm.show(
      'Cerrar sesion',
      'Esta seguro que desea cerrar la sesion?',
      'Si, salir',
      'Cancelar',
      () => {
        this.auth.logout(false);
        this.router.navigate(['/login']);
        Notiflix.Notify.success('Sesion cerrada correctamente.');
      }
    );
  }

  formatearTiempo(segundos: number): string {
    const m = Math.floor(segundos / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(segundos % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }
}
