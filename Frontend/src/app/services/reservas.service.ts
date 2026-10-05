import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface Reserva {
  _id?: string;
  nombre: string; apellido: string;
  email: string; fecha: string; hora: string;
  tour?: string; // nombre del tour reservado
}

interface RespuestaBackend {
  state: boolean;
  mensaje: string;
  total?: number;
  reservas?: Reserva[];
  correo?: { enviado: boolean; mensaje: string }; // resultado del correo de confirmacion
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly URL_BASE = `${API_BASE_URL}/reservas`;

  constructor(private http: HttpClient) {}

  // POST http://localhost:3000/reservas/Guardar (registro nuevo)
  guardar(r: Reserva): Observable<RespuestaBackend> {
    return this.http.post<RespuestaBackend>(`${this.URL_BASE}/Guardar`, r);
  }

  // PUT http://localhost:3000/reservas/Actualizar (registro ya existente, llave: email)
  actualizar(r: Reserva): Observable<RespuestaBackend> {
    return this.http.put<RespuestaBackend>(`${this.URL_BASE}/Actualizar`, r);
  }

  // DELETE http://localhost:3000/reservas/Eliminar (llave: email)
  eliminar(email: string): Observable<RespuestaBackend> {
    return this.http.delete<RespuestaBackend>(`${this.URL_BASE}/Eliminar`, { body: { email } });
  }

  // GET http://localhost:3000/reservas/ListarTodos
  listarTodas(): Observable<RespuestaBackend> {
    return this.http.get<RespuestaBackend>(`${this.URL_BASE}/ListarTodos`);
  }
}
