import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../core/models';
import { sha256 } from '../../core/sha256';

declare var Notiflix: any;

@Component({
  selector: 'app-usuarios-crud',
  templateUrl: './usuarios-crud.component.html'
})
export class UsuariosCrudComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  private readonly MIN_PASSWORD = 6;

  usuarios: Usuario[] = [];
  rolesDisponibles: string[] = ['admin', 'usuario'];
  cargando = false;

  // ---------- CREAR ----------
  nuevo = { user_name: '', password: '', rol: 'usuario', Activo: 'Si' as 'Si' | 'No' };

  // ---------- EDITAR (rol / Activo; el user_name NO se puede editar) ----------
  editando: Usuario | null = null;
  editRol = '';
  editActivo: 'Si' | 'No' = 'Si';

  // ---------- FOTO (solo JPG, max 2 MB) ----------
  private readonly MAX_FOTO_BYTES = 2 * 1024 * 1024;
  nuevaFoto: File | null = null;
  nuevaFotoPreview: string | null = null;
  editFoto: File | null = null;
  editFotoPreview: string | null = null;
  @ViewChild('inputFotoNueva') inputFotoNueva?: ElementRef<HTMLInputElement>;

  // ---------- RESTABLECER PASSWORD ----------
  usuarioPassword: Usuario | null = null;
  passwordNueva = '';
  passwordConfirmar = '';
  guardandoPassword = false;

  // ---------- OJITO (mostrar / ocultar contrasena al escribir) ----------
  verPasswordNuevo = false;
  verPasswordReset = false;
  verPasswordConfirmar = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // ================= READ =================
  cargarUsuarios(): void {
    this.cargando = true;
    this.http
      .get<{ ok: boolean; usuarios: Usuario[] }>(`${this.apiUrl}/usuarios`, { withCredentials: true })
      .subscribe({
        next: (resp) => {
          this.usuarios = resp.usuarios;
          const roles = new Set(this.rolesDisponibles);
          resp.usuarios.forEach((u) => roles.add(u.rol));
          this.rolesDisponibles = Array.from(roles);
          this.cargando = false;
        },
        error: (err) => {
          this.cargando = false;
          Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo cargar el listado de usuarios.');
        }
      });
  }

  // ================= CREATE =================
  async crear(): Promise<void> {
    const user_name = this.nuevo.user_name.trim().toLowerCase();
    if (!user_name || !this.nuevo.password) {
      Notiflix.Notify.warning('Usuario y contrasena son requeridos.');
      return;
    }
    if (this.nuevo.password.length < this.MIN_PASSWORD) {
      Notiflix.Notify.warning(`La contrasena debe tener al menos ${this.MIN_PASSWORD} caracteres.`);
      return;
    }

    const passwordHash = await sha256(this.nuevo.password);
    const foto = this.nuevaFoto;
    this.http
      .post<{ ok: boolean; usuario: Usuario }>(
        `${this.apiUrl}/usuarios`,
        { user_name, password: passwordHash, rol: this.nuevo.rol, Activo: this.nuevo.Activo },
        { withCredentials: true }
      )
      .subscribe({
        next: (resp) => {
          this.nuevo = { user_name: '', password: '', rol: 'usuario', Activo: 'Si' };
          this.limpiarFoto('nuevo');
          if (foto) {
            this.subirFoto(resp.usuario._id, foto).subscribe({
              next: () => {
                Notiflix.Notify.success('Usuario creado con foto.');
                this.cargarUsuarios();
              },
              error: (err) => {
                Notiflix.Notify.warning(
                  'Usuario creado, pero la foto no se subio: ' + (err?.error?.mensaje || 'error desconocido')
                );
                this.cargarUsuarios();
              }
            });
          } else {
            Notiflix.Notify.success('Usuario creado.');
            this.cargarUsuarios();
          }
        },
        error: (err) => Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo crear el usuario.')
      });
  }

  // ================= UPDATE (rol / Activo) =================
  abrirEditar(u: Usuario): void {
    this.cancelarPassword();
    this.editando = u;
    this.editRol = u.rol;
    this.editActivo = u.Activo;
    this.limpiarFoto('edit');
  }

  cancelarEditar(): void {
    this.editando = null;
    this.limpiarFoto('edit');
  }

  guardarEdicion(): void {
    if (!this.editando) return;
    const u = this.editando;
    const foto = this.editFoto;
    this.http
      .put<{ ok: boolean }>(
        `${this.apiUrl}/usuarios/${u._id}`,
        { rol: this.editRol, Activo: this.editActivo },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          if (!foto) {
            Notiflix.Notify.success(`Usuario ${u.user_name} actualizado.`);
            this.cancelarEditar();
            this.cargarUsuarios();
            return;
          }
          // Si eligio una foto nueva, se sube y el path en la DB se sobre-escribe
          this.subirFoto(u._id, foto).subscribe({
            next: () => {
              Notiflix.Notify.success(`Usuario ${u.user_name} actualizado con la nueva foto.`);
              this.cancelarEditar();
              this.cargarUsuarios();
            },
            error: (err) =>
              Notiflix.Notify.failure(err?.error?.mensaje || 'Se actualizo el usuario, pero no se pudo subir la foto.')
          });
        },
        error: (err) => Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo actualizar el usuario.')
      });
  }

  // ================= FOTO =================
  fotoUrl(u: Usuario): string | null {
    return u.archivo_foto ? `${this.apiUrl}/${u.archivo_foto}` : null;
  }

  seleccionarFoto(ev: Event, destino: 'nuevo' | 'edit'): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files && input.files[0];
    this.limpiarFoto(destino, false);
    if (!archivo) return;

    const esJpg = archivo.type === 'image/jpeg' && /\.jpe?g$/i.test(archivo.name);
    if (!esJpg) {
      Notiflix.Notify.warning('Solo se permiten archivos JPG.');
      input.value = '';
      return;
    }
    if (archivo.size > this.MAX_FOTO_BYTES) {
      Notiflix.Notify.warning('La foto no puede superar 2 MB.');
      input.value = '';
      return;
    }

    const preview = URL.createObjectURL(archivo);
    if (destino === 'nuevo') {
      this.nuevaFoto = archivo;
      this.nuevaFotoPreview = preview;
    } else {
      this.editFoto = archivo;
      this.editFotoPreview = preview;
    }
  }

  limpiarFoto(destino: 'nuevo' | 'edit', limpiarInput = true): void {
    if (destino === 'nuevo') {
      if (this.nuevaFotoPreview) URL.revokeObjectURL(this.nuevaFotoPreview);
      this.nuevaFoto = null;
      this.nuevaFotoPreview = null;
      if (limpiarInput && this.inputFotoNueva) this.inputFotoNueva.nativeElement.value = '';
    } else {
      if (this.editFotoPreview) URL.revokeObjectURL(this.editFotoPreview);
      this.editFoto = null;
      this.editFotoPreview = null;
    }
  }

  private subirFoto(id: string, archivo: File): Observable<{ ok: boolean; usuario: Usuario }> {
    const datos = new FormData();
    datos.append('foto', archivo, archivo.name);
    return this.http.put<{ ok: boolean; usuario: Usuario }>(`${this.apiUrl}/usuarios/${id}/foto`, datos, {
      withCredentials: true
    });
  }

  // ================= UPDATE (restablecer password) =================
  abrirPassword(u: Usuario): void {
    this.cancelarEditar();
    this.usuarioPassword = u;
    this.passwordNueva = '';
    this.passwordConfirmar = '';
    this.verPasswordReset = false;
    this.verPasswordConfirmar = false;
  }

  cancelarPassword(): void {
    this.usuarioPassword = null;
    this.passwordNueva = '';
    this.passwordConfirmar = '';
    this.verPasswordReset = false;
    this.verPasswordConfirmar = false;
  }

  async guardarPassword(): Promise<void> {
    if (!this.usuarioPassword || this.guardandoPassword) return;
    if (this.passwordNueva.length < this.MIN_PASSWORD) {
      Notiflix.Notify.warning(`La contrasena debe tener al menos ${this.MIN_PASSWORD} caracteres.`);
      return;
    }
    if (this.passwordNueva !== this.passwordConfirmar) {
      Notiflix.Notify.warning('Las contrasenas no coinciden.');
      return;
    }

    const u = this.usuarioPassword;
    const passwordHash = await sha256(this.passwordNueva);
    this.guardandoPassword = true;
    this.http
      .put<{ ok: boolean; correo?: { enviado: boolean; mensaje: string } }>(
        `${this.apiUrl}/usuarios/${u._id}/password`,
        { password: passwordHash },
        { withCredentials: true }
      )
      .subscribe({
        next: (resp) => {
          this.guardandoPassword = false;
          Notiflix.Notify.success(`Contrasena de ${u.user_name} restablecida.`);
          // P3: la contrasena se cambia igual; si el correo fallo, se avisa aparte.
          if (resp.correo && resp.correo.enviado) {
            Notiflix.Notify.info(resp.correo.mensaje);
          } else {
            Notiflix.Notify.warning(
              'La contrasena cambio, pero el correo de aviso no salio: ' + (resp.correo?.mensaje || 'sin detalle.'),
              { timeout: 8000 }
            );
          }
          this.cancelarPassword();
          this.cargarUsuarios();
        },
        error: (err) => {
          this.guardandoPassword = false;
          Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo restablecer la contrasena.');
        }
      });
  }

  // ================= DELETE =================
  eliminar(u: Usuario): void {
    Notiflix.Confirm.show('Eliminar usuario', `Eliminar a ${u.user_name}?`, 'Si', 'No', () => {
      this.http.delete<{ ok: boolean }>(`${this.apiUrl}/usuarios/${u._id}`, { withCredentials: true }).subscribe({
        next: () => {
          Notiflix.Notify.success('Usuario eliminado.');
          this.cargarUsuarios();
        },
        error: (err) => Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo eliminar el usuario.')
      });
    });
  }

  // ================= UTILIDADES =================
  formatearFecha(iso?: string): string {
    if (!iso) return '';
    const f = new Date(iso);
    if (isNaN(f.getTime())) return iso;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(f.getDate())}/${p(f.getMonth() + 1)}/${f.getFullYear()} ${p(f.getHours())}:${p(f.getMinutes())}:${p(f.getSeconds())}`;
  }
}
