import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReservasService } from '../../services/reservas.service';
import { OpcionTour, ToursService } from '../../services/tours.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent implements OnInit {
  form: FormGroup;
  exito = false;
  avisoCorreo = ''; // se llena solo si el correo de confirmacion no pudo enviarse
  error = false;
  mensajeError = '';
  enviando = false;

  opciones: OpcionTour[] = [];

  constructor(
    private fb: FormBuilder,
    private svc: ReservasService,
    private toursSvc: ToursService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      apellido: ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      tour:     ['', Validators.required],
      fecha:    ['', Validators.required],
      hora:     ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Toures basicos + especiales publicados. Si se llega desde "Reservar Tour" (?tour=NOMBRE) queda preseleccionado.
    this.toursSvc.opcionesParaReservar().subscribe((opciones) => {
      this.opciones = opciones;
      const elegido = this.route.snapshot.queryParamMap.get('tour');
      if (elegido && opciones.some((o) => o.nombre === elegido)) {
        this.form.patchValue({ tour: elegido });
      }
    });
  }

  opcionesDe(grupo: OpcionTour['grupo']): OpcionTour[] {
    return this.opciones.filter((o) => o.grupo === grupo);
  }

  invalid(campo: string): boolean {
    const ctrl = this.form.get(campo)!;
    return ctrl.invalid && ctrl.touched;
  }

  confirmar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.enviando) return;

    this.error = false;
    this.enviando = true;
    this.svc.guardar(this.form.value).subscribe({
      next: (res) => {
        this.enviando = false;
        if (res.state) {
          this.exito = true;
          this.avisoCorreo = res.correo && !res.correo.enviado
            ? 'La reserva quedó guardada, pero no pudimos enviar el correo de confirmación.'
            : '';
          this.form.reset({ tour: '' });
          setTimeout(() => { this.exito = false; this.avisoCorreo = ''; }, 8000);
        } else {
          this.error = true;
          this.mensajeError = res.mensaje;
        }
      },
      error: () => {
        this.enviando = false;
        this.error = true;
        this.mensajeError = 'No se pudo conectar con el servidor. Intenta de nuevo.';
      }
    });
  }
}
