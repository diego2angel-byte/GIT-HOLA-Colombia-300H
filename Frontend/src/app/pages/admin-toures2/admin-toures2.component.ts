import { Component, OnInit } from '@angular/core';
import { Tour, ToursService } from '../../services/tours.service';

declare var Notiflix: any;

@Component({
  selector: 'app-admin-toures2',
  templateUrl: './admin-toures2.component.html'
})
export class AdminToures2Component implements OnInit {
  private readonly MAX_FOTO_BYTES = 5 * 1024 * 1024; // 5 MB (igual que el backend)

  toures: Tour[] = [];
  cargando = false;
  guardando = false;

  // Formulario crear / editar
  editando: Tour | null = null;
  nombre = '';
  ciudad = '';
  descripcion = '';
  precioTexto = ''; // se muestra con separador de miles: 150.000
  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;

  ciudadesSugeridas = ['Bogotá', 'Medellín', 'Cartagena', 'Cali', 'Santa Marta', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Manizales', 'Armenia'];

  constructor(private toursSvc: ToursService) {}

  ngOnInit(): void {
    this.listarTodos();
  }

  // ================= READ =================
  listarTodos(): void {
    this.cargando = true;
    this.toursSvc.listarTodos().subscribe({
      next: (res) => {
        this.toures = res.toures || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Notiflix.Notify.failure('No se pudo cargar el listado de toures.');
      }
    });
  }

  // ================= Precio con separador de miles =================
  onPrecio(valor: string): void {
    const digitos = (valor || '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    this.precioTexto = digitos ? Number(digitos).toLocaleString('es-CO') : '';
  }

  private get precioNumero(): number {
    return parseInt(this.precioTexto.replace(/\D/g, '') || '0', 10);
  }

  formatearPrecio(valor: number): string {
    return this.toursSvc.formatearPrecio(valor);
  }

  fotoUrl(t: Tour): string {
    return this.toursSvc.fotoUrl(t);
  }

  // ================= FOTO (solo JPG) =================
  seleccionarFoto(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files && input.files[0];
    this.quitarFotoNueva(false);
    if (!archivo) return;

    const esJpg = archivo.type === 'image/jpeg' && /\.jpe?g$/i.test(archivo.name);
    if (!esJpg) {
      Notiflix.Notify.warning('Solo se permiten archivos JPG.');
      input.value = '';
      return;
    }
    if (archivo.size > this.MAX_FOTO_BYTES) {
      Notiflix.Notify.warning('La foto no puede superar 5 MB.');
      input.value = '';
      return;
    }
    this.fotoArchivo = archivo;
    this.fotoPreview = URL.createObjectURL(archivo);
  }

  quitarFotoNueva(limpiarInput = true, input?: HTMLInputElement): void {
    if (this.fotoPreview) URL.revokeObjectURL(this.fotoPreview);
    this.fotoArchivo = null;
    this.fotoPreview = null;
    if (limpiarInput && input) input.value = '';
  }

  get tieneFoto(): boolean {
    return !!this.fotoArchivo || !!this.editando?.foto;
  }

  get fotoMostrada(): string {
    if (this.fotoPreview) return this.fotoPreview;
    return this.editando ? this.fotoUrl(this.editando) : '';
  }

  // ================= CREATE / UPDATE =================
  guardar(): void {
    if (this.guardando) return;

    if (!this.nombre.trim() || !this.ciudad.trim() || !this.descripcion.trim()) {
      Notiflix.Notify.warning('Nombre, ciudad y descripcion son obligatorios.');
      return;
    }
    if (!this.precioTexto) {
      Notiflix.Notify.warning('Ingrese el precio.');
      return;
    }
    if (!this.editando && !this.fotoArchivo) {
      Notiflix.Notify.warning('Debe subir la foto del tour (JPG).');
      return;
    }

    const datos = new FormData();
    datos.append('nombre', this.nombre.trim());
    datos.append('ciudad', this.ciudad.trim());
    datos.append('descripcion', this.descripcion.trim());
    datos.append('precio', String(this.precioNumero));
    if (this.fotoArchivo) datos.append('foto', this.fotoArchivo, this.fotoArchivo.name);

    const esEdicion = !!this.editando;
    if (this.editando) datos.append('_id', this.editando._id);

    this.guardando = true;
    const peticion = esEdicion ? this.toursSvc.actualizar(datos) : this.toursSvc.guardar(datos);
    peticion.subscribe({
      next: (res) => {
        this.guardando = false;
        Notiflix.Notify.success(res.mensaje || (esEdicion ? 'Tour actualizado.' : 'Tour guardado.'));
        this.cancelar();
        this.listarTodos();
      },
      error: (err) => {
        this.guardando = false;
        Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo guardar el tour.');
      }
    });
  }

  editar(t: Tour): void {
    this.quitarFotoNueva(false);
    this.editando = t;
    this.nombre = t.nombre;
    this.ciudad = t.ciudad;
    this.descripcion = t.descripcion;
    this.onPrecio(String(t.precio));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editando = null;
    this.nombre = '';
    this.ciudad = '';
    this.descripcion = '';
    this.precioTexto = '';
    this.quitarFotoNueva(false);
  }

  // ================= DELETE =================
  eliminar(t: Tour): void {
    Notiflix.Confirm.show('Eliminar tour', `Eliminar "${t.nombre}"? Tambien se borra su foto.`, 'Si, eliminar', 'Cancelar', () => {
      this.toursSvc.eliminar(t._id).subscribe({
        next: (res) => {
          Notiflix.Notify.success(res.mensaje || 'Tour eliminado.');
          if (this.editando?._id === t._id) this.cancelar();
          this.listarTodos();
        },
        error: (err) => Notiflix.Notify.failure(err?.error?.mensaje || 'No se pudo eliminar el tour.')
      });
    });
  }
}
