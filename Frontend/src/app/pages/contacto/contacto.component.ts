import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactoService } from '../../services/contacto.service';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent {
  form: FormGroup;
  enviado = false;
  error = false;
  mensajeError = '';

  constructor(private fb: FormBuilder, private svc: ContactoService) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      apellido: ['', Validators.required],
      edad:     ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      email:    ['', [Validators.required, Validators.email]],
      tour:     ['', Validators.required]
    });
  }

  invalid(campo: string): boolean {
    const ctrl = this.form.get(campo)!;
    return ctrl.invalid && ctrl.touched;
  }

  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.error = false;
    this.svc.guardar(this.form.value).subscribe({
      next: (res) => {
        if (res.state) {
          this.enviado = true;
          this.form.reset();
          setTimeout(() => this.enviado = false, 4000);
        } else {
          this.error = true;
          this.mensajeError = res.mensaje;
        }
      },
      error: () => {
        this.error = true;
        this.mensajeError = 'No se pudo conectar con el servidor. Intenta de nuevo.';
      }
    });
  }
}
