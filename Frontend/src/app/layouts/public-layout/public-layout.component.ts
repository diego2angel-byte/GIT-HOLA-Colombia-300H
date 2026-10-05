import { Component } from '@angular/core';

/** Sitio publico: header + contenido + footer (las paginas del panel usan LayoutComponent). */
@Component({
  selector: 'app-public-layout',
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `
})
export class PublicLayoutComponent {}
