import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

// Coleccion hola-toures (base hola-colombia): exactamente 5 campos (mas el _id de Mongo)
export interface Tour {
  _id: string;
  nombre: string;
  ciudad: string;
  descripcion: string;
  precio: number;
  foto: string; // path en el backend, ej: foto/tour_123.jpg
}

// Toures Basicos (pagina /toures). Es la unica fuente: la usan /toures y el selector de /reservas.
export interface TourBasico { titulo: string; descripcion: string; imagen: string; }

export const TOURES_BASICOS: TourBasico[] = [
  {
    titulo: 'BOGOTA TOUR',
    imagen: 'assets/SLIDE 1.jpg',
    descripcion: 'En nuestros tours, te guiaremos para que aproveches al máximo tu viaje a Bogotá: los mejores cafés, comidas exquisitas y una reseña histórica de Colombia. Disponible en inglés y español.'
  },
  {
    titulo: 'BOLIVAR TOUR',
    imagen: 'assets/SLIDE 2.jpg',
    descripcion: 'Recorrido dedicado a explorar la huella histórica de Simón Bolívar en Bogotá, visitando las antiguas residencias asociadas con el Libertador.'
  },
  {
    titulo: 'ESMERALDAS TOUR',
    imagen: 'assets/SLIDE 3.jpg',
    descripcion: 'Inmersión completa en el fascinante mundo de las esmeraldas colombianas: desde su extracción minera hasta las técnicas de talla y corte que resaltan su brillo único.'
  },
  {
    titulo: 'HISTORY & ART',
    imagen: 'assets/SLIDE 4.jpg',
    descripcion: 'Viaje dinámico por la oferta cultural y urbana del centro de Bogotá: museos, Plaza de Bolívar y los coloridos murales de grafiti que adornan la ciudad.'
  }
];

// Opcion del selector de tour al reservar
export interface OpcionTour { grupo: 'Toures Básicos' | 'Toures Especiales'; nombre: string; }

interface RespuestaTours {
  state: boolean;
  mensaje?: string;
  total?: number;
  toures?: Tour[];
  tour?: Tour;
}

@Injectable({ providedIn: 'root' })
export class ToursService {
  private readonly URL_BASE = `${API_BASE_URL}/toures`;

  constructor(private http: HttpClient) {}

  // GET http://localhost:3000/toures/ListarTodos (publico)
  listarTodos(): Observable<RespuestaTours> {
    return this.http.get<RespuestaTours>(`${this.URL_BASE}/ListarTodos`);
  }

  // POST http://localhost:3000/toures/Guardar (admin, multipart: nombre, ciudad, descripcion, precio, foto)
  guardar(datos: FormData): Observable<RespuestaTours> {
    return this.http.post<RespuestaTours>(`${this.URL_BASE}/Guardar`, datos, { withCredentials: true });
  }

  // PUT http://localhost:3000/toures/Actualizar (admin, multipart: _id, nombre, ciudad, descripcion, precio, foto opcional)
  actualizar(datos: FormData): Observable<RespuestaTours> {
    return this.http.put<RespuestaTours>(`${this.URL_BASE}/Actualizar`, datos, { withCredentials: true });
  }

  // DELETE http://localhost:3000/toures/Eliminar (admin)
  eliminar(_id: string): Observable<RespuestaTours> {
    return this.http.delete<RespuestaTours>(`${this.URL_BASE}/Eliminar`, { body: { _id }, withCredentials: true });
  }

  /**
   * Toures que se pueden reservar: los basicos (fijos) + los especiales publicados en hola-toures.
   * Si el backend no responde, devuelve solo los basicos.
   */
  opcionesParaReservar(): Observable<OpcionTour[]> {
    const basicos: OpcionTour[] = TOURES_BASICOS.map((t) => ({ grupo: 'Toures Básicos', nombre: t.titulo }));
    return this.listarTodos().pipe(
      map((res) => [
        ...basicos,
        ...(res.toures || []).map((t): OpcionTour => ({ grupo: 'Toures Especiales', nombre: t.nombre }))
      ]),
      catchError(() => of(basicos))
    );
  }

  fotoUrl(t: Pick<Tour, 'foto'>): string {
    return t.foto ? `${API_BASE_URL}/${t.foto}` : '';
  }

  /** 150000 -> "$ 150.000" */
  formatearPrecio(valor: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  }
}
