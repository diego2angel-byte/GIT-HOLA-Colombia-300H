import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

declare var Notiflix: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  usuario$ = this.auth.usuario$;

  constructor(private auth: AuthService, private router: Router) {}

  cerrarSesion(): void {
    this.auth.logout(false);
    this.router.navigate(['/']);
    Notiflix.Notify.success('Sesion cerrada correctamente.');
  }
}
