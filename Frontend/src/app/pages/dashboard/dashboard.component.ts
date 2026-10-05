import { Component } from '@angular/core';
import { PermisosService } from '../../core/permisos.service';
import { AuthService } from '../../core/auth.service';

declare var Notiflix: any;

interface EntidadUI {
  clave: string; // 'reservas' | 'contactos' | 'usuarios'
  titulo: string;
  icono: string;
  datos: any[];
  cargando: boolean;
  nuevoNombre: string;
  actualizarId: string;
  actualizarNombre: string;
  eliminarId: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  entidades: EntidadUI[] = [
    this.crearEntidad('reservas', 'Reservas', 'bi-calendar-check'),
    this.crearEntidad('contactos', 'Contactos', 'bi-person-lines-fill'),
    this.crearEntidad('usuarios', 'Usuarios (recurso)', 'bi-people')
  ];

  constructor(private permisos: PermisosService, private auth: AuthService) {}

  get esAdmin(): boolean {
    return this.auth.usuarioActual?.rol === 'admin';
  }

  private crearEntidad(clave: string, titulo: string, icono: string): EntidadUI {
    return {
      clave,
      titulo,
      icono,
      datos: [],
      cargando: false,
      nuevoNombre: '',
      actualizarId: '',
      actualizarNombre: '',
      eliminarId: ''
    };
  }

  listarTodos(e: EntidadUI): void {
    e.cargando = true;
    this.permisos.get<any>(`/${e.clave}/ListarTodos`).subscribe({
      next: (resp) => {
        e.datos = resp.datos || [];
        e.cargando = false;
      },
      error: () => {
        e.cargando = false;
      }
    });
  }

  guardar(e: EntidadUI): void {
    if (!e.nuevoNombre.trim()) {
      Notiflix.Notify.warning('Ingrese un nombre antes de guardar.');
      return;
    }
    this.permisos.post<any>(`/${e.clave}/Guardar`, { nombre: e.nuevoNombre.trim() }).subscribe({
      next: () => {
        Notiflix.Notify.success('Registro guardado.');
        e.nuevoNombre = '';
        this.listarTodos(e);
      },
      error: () => {}
    });
  }

  actualizar(e: EntidadUI): void {
    if (!e.actualizarId || !e.actualizarNombre.trim()) {
      Notiflix.Notify.warning('Ingrese id y nombre para actualizar.');
      return;
    }
    this.permisos.put<any>(`/${e.clave}/Actualizar`, { id: Number(e.actualizarId), nombre: e.actualizarNombre.trim() }).subscribe({
      next: () => {
        Notiflix.Notify.success('Registro actualizado.');
        e.actualizarId = '';
        e.actualizarNombre = '';
        this.listarTodos(e);
      },
      error: () => {}
    });
  }

  eliminar(e: EntidadUI): void {
    if (!e.eliminarId) {
      Notiflix.Notify.warning('Ingrese el id a eliminar.');
      return;
    }
    this.permisos.delete<any>(`/${e.clave}/Eliminar`, Number(e.eliminarId)).subscribe({
      next: () => {
        Notiflix.Notify.success('Registro eliminado.');
        e.eliminarId = '';
        this.listarTodos(e);
      },
      error: () => {}
    });
  }
}
