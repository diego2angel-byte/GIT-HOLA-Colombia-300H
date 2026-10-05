import { Component, OnInit } from '@angular/core';
import { ContactoService, Contacto } from '../../services/contacto.service';
import { ReservasService, Reserva }  from '../../services/reservas.service';
import { OpcionTour, ToursService } from '../../services/tours.service';
import { Notify, Confirm } from 'notiflix';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  contactos: Contacto[] = [];
  reservas:  Reserva[]  = [];
  cargando = true;
  error = false;

  // ---------- estado del formulario de CONTACTOS ----------
  formContacto: Contacto = this.contactoVacio();
  editandoContacto = false; // false = crear nuevo, true = actualizar existente

  // ---------- estado del formulario de RESERVAS ----------
  formReserva: Reserva = this.reservaVacia();
  editandoReserva = false;

  // Toures que se pueden asignar a una reserva (basicos + especiales)
  opcionesTour: OpcionTour[] = [];

  constructor(
    private contactoSvc: ContactoService,
    private reservasSvc: ReservasService,
    private toursSvc: ToursService
  ) {}

  ngOnInit(): void {
    this.cargarContactos();
    this.cargarReservas();
    this.toursSvc.opcionesParaReservar().subscribe((o) => (this.opcionesTour = o));
  }

  opcionesTourDe(grupo: OpcionTour['grupo']): OpcionTour[] {
    return this.opcionesTour.filter((o) => o.grupo === grupo);
  }

  /** Si la reserva tiene un tour que ya no esta en el catalogo (ej. un especial eliminado), se conserva como opcion. */
  get tourActualHuerfano(): string {
    const t = this.formReserva.tour || '';
    return t && !this.opcionesTour.some((o) => o.nombre === t) ? t : '';
  }

  // =========================================================
  // CONTACTOS
  // =========================================================

  contactoVacio(): Contacto {
    return { nombre: '', apellido: '', edad: '', email: '', tour: '' };
  }

  cargarContactos(): void {
    this.contactoSvc.listarTodos().subscribe({
      next: (res) => {
        if (res.state && res.contactos) {
          this.contactos = res.contactos;
        }
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  editarContacto(c: Contacto): void {
    this.formContacto = { ...c };
    this.editandoContacto = true;
  }

  cancelarEdicionContacto(): void {
    this.formContacto = this.contactoVacio();
    this.editandoContacto = false;
  }

  guardarContacto(): void {
    const accion = this.editandoContacto
      ? this.contactoSvc.actualizar(this.formContacto)
      : this.contactoSvc.guardar(this.formContacto);

    accion.subscribe({
      next: (res) => {
        if (res.state) {
          Notify.success(res.mensaje);
          this.cancelarEdicionContacto();
          this.cargarContactos();
        } else {
          Notify.failure(res.mensaje);
        }
      },
      error: () => Notify.failure('No se pudo conectar con el servidor')
    });
  }

  eliminarContacto(c: Contacto): void {
    Confirm.show(
      'Eliminar contacto',
      `¿Seguro que deseas eliminar a ${c.nombre} ${c.apellido}?`,
      'Sí, eliminar',
      'Cancelar',
      () => {
        this.contactoSvc.eliminar(c.email).subscribe({
          next: (res) => {
            if (res.state) {
              Notify.success(res.mensaje);
              this.cargarContactos();
            } else {
              Notify.failure(res.mensaje);
            }
          },
          error: () => Notify.failure('No se pudo conectar con el servidor')
        });
      }
    );
  }

  // =========================================================
  // RESERVAS
  // =========================================================

  reservaVacia(): Reserva {
    return { nombre: '', apellido: '', email: '', fecha: '', hora: '', tour: '' };
  }

  cargarReservas(): void {
    this.reservasSvc.listarTodas().subscribe({
      next: (res) => {
        if (res.state && res.reservas) {
          this.reservas = res.reservas;
        }
      },
      error: () => {
        this.error = true;
      }
    });
  }

  editarReserva(r: Reserva): void {
    this.formReserva = { ...r };
    this.editandoReserva = true;
  }

  cancelarEdicionReserva(): void {
    this.formReserva = this.reservaVacia();
    this.editandoReserva = false;
  }

  guardarReserva(): void {
    const accion = this.editandoReserva
      ? this.reservasSvc.actualizar(this.formReserva)
      : this.reservasSvc.guardar(this.formReserva);

    const eraNueva = !this.editandoReserva;
    accion.subscribe({
      next: (res) => {
        if (res.state) {
          Notify.success(res.mensaje);
          // Al crear una reserva se envia el correo de confirmacion al email registrado
          if (eraNueva && res.correo) {
            if (res.correo.enviado) {
              Notify.info(res.correo.mensaje);
            } else {
              Notify.warning('La reserva se guardo, pero el correo no salio: ' + res.correo.mensaje, { timeout: 8000 });
            }
          }
          this.cancelarEdicionReserva();
          this.cargarReservas();
        } else {
          Notify.failure(res.mensaje);
        }
      },
      error: () => Notify.failure('No se pudo conectar con el servidor')
    });
  }

  eliminarReserva(r: Reserva): void {
    Confirm.show(
      'Eliminar reserva',
      `¿Seguro que deseas eliminar la reserva de ${r.nombre} ${r.apellido}?`,
      'Sí, eliminar',
      'Cancelar',
      () => {
        this.reservasSvc.eliminar(r.email).subscribe({
          next: (res) => {
            if (res.state) {
              Notify.success(res.mensaje);
              this.cargarReservas();
            } else {
              Notify.failure(res.mensaje);
            }
          },
          error: () => Notify.failure('No se pudo conectar con el servidor')
        });
      }
    );
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  formatearFecha(iso: string | undefined): string {
    if (!iso) return '';
    const f = new Date(iso);
    if (isNaN(f.getTime())) return iso;
    const d = String(f.getDate()).padStart(2,'0');
    const m = String(f.getMonth()+1).padStart(2,'0');
    const h = String(f.getHours()).padStart(2,'0');
    const mn = String(f.getMinutes()).padStart(2,'0');
    return `${d}/${m}/${f.getFullYear()} ${h}:${mn}`;
  }
}
