import { Component } from '@angular/core';
import { TOURES_BASICOS, TourBasico } from '../../services/tours.service';

@Component({
  selector: 'app-toures',
  templateUrl: './toures.component.html',
  styleUrls: ['./toures.component.css']
})
export class TouresComponent {
  toures: TourBasico[] = TOURES_BASICOS;
}
