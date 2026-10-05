import { Component, OnInit } from '@angular/core';
import { Tour, ToursService } from '../../services/tours.service';

@Component({
  selector: 'app-toures2',
  templateUrl: './toures2.component.html',
  styleUrls: ['./toures2.component.css']
})
export class Toures2Component implements OnInit {
  toures: Tour[] = [];
  cargando = true;
  error = false;

  constructor(private toursSvc: ToursService) {}

  ngOnInit(): void {
    // Publica lo que haya en la coleccion hola-toures; a medida que se llena, aparece aqui.
    this.toursSvc.listarTodos().subscribe({
      next: (res) => {
        this.toures = res.toures || [];
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  fotoUrl(t: Tour): string {
    return this.toursSvc.fotoUrl(t);
  }

  precio(t: Tour): string {
    return this.toursSvc.formatearPrecio(t.precio);
  }
}
