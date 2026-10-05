export interface PathPermitido {
  path: string;
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface UsuarioSesion {
  user_name: string;
  rol: string;
}

export interface LoginResponse {
  ok: boolean;
  usuario: UsuarioSesion;
  duracion_segundos: number;
  expira: string;
  paths: PathPermitido[];
  mensaje?: string;
}

export interface RenovarResponse {
  ok: boolean;
  segundos_restantes: number;
  duracion_segundos: number;
  expira: string;
}

export interface EstadoResponse {
  ok: boolean;
  usuario: UsuarioSesion;
  segundos_restantes: number;
  duracion_segundos: number;
  paths: PathPermitido[];
  mensaje?: string;
}

export interface Usuario {
  _id: string;
  user_name: string;
  rol: string;
  Activo: 'Si' | 'No';
  archivo_foto?: string; // path relativo en el backend, ej: foto/<archivo>.jpg
  createdAt?: string;
  updatedAt?: string;
}

export interface Permiso {
  _id?: string;
  rol: string;
  paths: PathPermitido[];
}
