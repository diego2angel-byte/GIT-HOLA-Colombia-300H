import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface Contacto {
  _id?: string;
  nombre: string; apellido: string; edad: string | number;
  email: string; tour: string; fechaRegistro?: string;
}

interface RespuestaBackend {
  state: boolean;
  mensaje: string;
  total?: number;
  contactos?: Contacto[];
}

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private readonly URL_BASE = `${API_BASE_URL}/contactos`;

  constructor(private http: HttpClient) {}

  // POST http://localhost:3000/contactos/Guardar (registro nuevo)
  guardar(c: Omit<Contacto, 'fechaRegistro' | '_id'>): Observable<RespuestaBackend> {
    return this.http.post<RespuestaBackend>(`${this.URL_BASE}/Guardar`, c);
  }

  // PUT http://localhost:3000/contactos/Actualizar (registro ya existente, llave: email)
  actualizar(c: Omit<Contacto, 'fechaRegistro' | '_id'>): Observable<RespuestaBackend> {
    return this.http.put<RespuestaBackend>(`${this.URL_BASE}/Actualizar`, c);
  }

  // DELETE http://localhost:3000/contactos/Eliminar (llave: email)
  eliminar(email: string): Observable<RespuestaBackend> {
    return this.http.delete<RespuestaBackend>(`${this.URL_BASE}/Eliminar`, { body: { email } });
  }

  // GET http://localhost:3000/contactos/ListarTodos
  listarTodos(): Observable<RespuestaBackend> {
    return this.http.get<RespuestaBackend>(`${this.URL_BASE}/ListarTodos`);
  }
}
