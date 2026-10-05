import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../core/models';
import { sha256 } from '../../core/sha256';

declare var Notiflix: any;

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  usuarios: Usuario[] = [];
  rolesDisponibles: string[] = ['admin', 'usuario'];

  // formulario de creacion
  nuevoUserName = '';
  nuevoPassword = '';
  verNuevoPassword = false;
  nuevoRol = 'usuario';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.http.get<{ ok: boolean; usuarios: Usuario[] }>(`${this.apiUrl}/usuarios`, { withCredentials: true }).subscribe({
      next: (resp) => {
        this.usuarios = resp.usuarios;
        const set = new Set(this.rolesDisponibles);
        resp.usuarios.forEach((u) => set.add(u.rol));
        this.rolesDisponibles = Array.from(set);
      },
      error: () => Notiflix.Notify.failure('No se pudo cargar el listado de usuarios.')
    });
  }

  async crear(): Promise<void> {
    if (!this.nuevoUserName.trim() || !this.nuevoPassword) {
      Notiflix.Notify.warning('Correo y contrasena son requeridos.');
      return;
    }
    const passwordHash = await sha256(this.nuevoPassword);
    this.http
      .post<{ ok: boolean }>(
        `${this.apiUrl}/usuarios`,
        { user_name: this.nuevoUserName.trim(), password: passwordHash, rol: this.nuevoRol, Activo: 'Si' },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          Notiflix.Notify.success('Usuario creado.');
          this.nuevoUserName = '';
          this.nuevoPassword = '';
          this.cargarUsuarios();
        },
        error: (err) => Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo crear el usuario.')
      });
  }

  actualizarRol(u: Usuario, rol: string): void {
    this.http.put<{ ok: boolean }>(`${this.apiUrl}/usuarios/${u._id}`, { rol }, { withCredentials: true }).subscribe({
      next: () => Notiflix.Notify.success(`Rol de ${u.user_name} actualizado.`),
      error: () => Notiflix.Notify.failure('No se pudo actualizar el rol.')
    });
  }

  alternarActivo(u: Usuario): void {
    const nuevoEstado = u.Activo === 'Si' ? 'No' : 'Si';
    this.http.put<{ ok: boolean }>(`${this.apiUrl}/usuarios/${u._id}`, { Activo: nuevoEstado }, { withCredentials: true }).subscribe({
      next: () => {
        u.Activo = nuevoEstado;
        Notiflix.Notify.success(`Usuario ${nuevoEstado === 'Si' ? 'activado' : 'desactivado'}.`);
      },
      error: () => Notiflix.Notify.failure('No se pudo actualizar el estado.')
    });
  }

  eliminar(u: Usuario): void {
    Notiflix.Confirm.show('Eliminar usuario', `Eliminar a ${u.user_name}?`, 'Si', 'No', () => {
      this.http.delete<{ ok: boolean }>(`${this.apiUrl}/usuarios/${u._id}`, { withCredentials: true }).subscribe({
        next: () => {
          Notiflix.Notify.success('Usuario eliminado.');
          this.cargarUsuarios();
        },
        error: () => Notiflix.Notify.failure('No se pudo eliminar el usuario.')
      });
    });
  }
}
