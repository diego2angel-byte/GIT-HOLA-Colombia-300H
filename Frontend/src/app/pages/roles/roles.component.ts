import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../core/models';

declare var Notiflix: any;

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  usuarios: Usuario[] = [];
  rolesDisponibles: string[] = ['admin', 'usuario'];

  usuarioSeleccionado = '';
  rolSeleccionado = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.http.get<{ ok: boolean; usuarios: Usuario[] }>(`${this.apiUrl}/usuarios`, { withCredentials: true }).subscribe({
      next: (resp) => {
        this.usuarios = resp.usuarios;
        const rolesUnicos = new Set(this.rolesDisponibles);
        resp.usuarios.forEach((u) => rolesUnicos.add(u.rol));
        this.rolesDisponibles = Array.from(rolesUnicos);
      },
      error: () => Notiflix.Notify.failure('No se pudo cargar el listado de usuarios.')
    });
  }

  modificar(): void {
    if (!this.usuarioSeleccionado || !this.rolSeleccionado) {
      Notiflix.Notify.warning('Seleccione un usuario y un rol.');
      return;
    }
    this.http
      .put<{ ok: boolean }>(`${this.apiUrl}/usuarios/${this.usuarioSeleccionado}/rol`, { rol: this.rolSeleccionado }, { withCredentials: true })
      .subscribe({
        next: () => {
          Notiflix.Notify.success('Rol actualizado correctamente.');
          this.cargarUsuarios();
        },
        error: (err) => Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo actualizar el rol.')
      });
  }
}
