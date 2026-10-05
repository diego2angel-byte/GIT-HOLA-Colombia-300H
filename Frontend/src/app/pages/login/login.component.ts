import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { sha256 } from '../../core/sha256';

declare var Notiflix: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  user_name = '';
  password = '';
  verPassword = false;
  cargando = false;

  constructor(private auth: AuthService, private router: Router) {}

  async iniciarSesion(): Promise<void> {
    if (!this.user_name || !this.password) {
      Notiflix.Notify.warning('Ingrese usuario y contrasena.');
      return;
    }

    this.cargando = true;
    const passwordHash = await sha256(this.password);

    this.auth.login(this.user_name.trim().toLowerCase(), passwordHash).subscribe({
      next: (resp) => {
        this.cargando = false;
        Notiflix.Notify.success(`Bienvenido ${resp.usuario.user_name}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        const mensaje = err?.error?.mensaje || 'No se pudo iniciar sesion.';
        Notiflix.Notify.failure(mensaje);
      }
    });
  }
}
