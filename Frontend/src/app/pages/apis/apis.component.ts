import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Permiso, PathPermitido } from '../../core/models';

declare var Notiflix: any;

const CATALOGO_PATHS: PathPermitido[] = [
  { path: '/reservas/Eliminar', metodo: 'DELETE' },
  { path: '/reservas/ListarTodos', metodo: 'GET' },
  { path: '/reservas/Guardar', metodo: 'POST' },
  { path: '/reservas/Actualizar', metodo: 'PUT' },
  { path: '/contactos/Eliminar', metodo: 'DELETE' },
  { path: '/contactos/ListarTodos', metodo: 'GET' },
  { path: '/contactos/Guardar', metodo: 'POST' },
  { path: '/contactos/Actualizar', metodo: 'PUT' },
  { path: '/usuarios/Eliminar', metodo: 'DELETE' },
  { path: '/usuarios/ListarTodos', metodo: 'GET' },
  { path: '/usuarios/Guardar', metodo: 'POST' },
  { path: '/usuarios/Actualizar', metodo: 'PUT' }
];

@Component({
  selector: 'app-apis',
  templateUrl: './apis.component.html'
})
export class ApisComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  catalogo = CATALOGO_PATHS;
  permisos: Permiso[] = [];
  rolSeleccionado = '';
  seleccion = new Set<string>(); // claves "METODO path"
  nuevoRol = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPermisos();
  }

  clave(p: PathPermitido): string {
    return `${p.metodo} ${p.path}`;
  }

  cargarPermisos(): void {
    this.http.get<{ ok: boolean; permisos: Permiso[] }>(`${this.apiUrl}/permisos`, { withCredentials: true }).subscribe({
      next: (resp) => (this.permisos = resp.permisos),
      error: () => Notiflix.Notify.failure('No se pudo cargar la lista de roles/permisos.')
    });
  }

  seleccionarRol(rol: string): void {
    this.rolSeleccionado = rol;
    const permiso = this.permisos.find((p) => p.rol === rol);
    this.seleccion = new Set((permiso?.paths || []).map((p) => this.clave(p)));
  }

  toggle(p: PathPermitido): void {
    const k = this.clave(p);
    if (this.seleccion.has(k)) this.seleccion.delete(k);
    else this.seleccion.add(k);
  }

  estaMarcado(p: PathPermitido): boolean {
    return this.seleccion.has(this.clave(p));
  }

  crearRol(): void {
    if (!this.nuevoRol.trim()) {
      Notiflix.Notify.warning('Ingrese el nombre del nuevo rol.');
      return;
    }
    this.http.post<{ ok: boolean }>(`${this.apiUrl}/permisos`, { rol: this.nuevoRol.trim() }, { withCredentials: true }).subscribe({
      next: () => {
        Notiflix.Notify.success('Rol creado.');
        this.nuevoRol = '';
        this.cargarPermisos();
      },
      error: (err) => Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo crear el rol.')
    });
  }

  guardar(): void {
    if (!this.rolSeleccionado) {
      Notiflix.Notify.warning('Seleccione un rol primero.');
      return;
    }
    const paths = this.catalogo.filter((p) => this.seleccion.has(this.clave(p)));
    this.http
      .put<{ ok: boolean }>(`${this.apiUrl}/permisos/${this.rolSeleccionado}`, { paths }, { withCredentials: true })
      .subscribe({
        next: () => {
          Notiflix.Notify.success(`Paths actualizados para el rol "${this.rolSeleccionado}".`);
          this.cargarPermisos();
        },
        error: () => Notiflix.Notify.failure('No se pudieron guardar los paths.')
      });
  }
}
