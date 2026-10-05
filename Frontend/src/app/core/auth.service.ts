import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval, timeout, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { EstadoResponse, LoginResponse, PathPermitido, RenovarResponse, UsuarioSesion } from './models';

declare var Notiflix: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  usuario$ = new BehaviorSubject<UsuarioSesion | null>(null);
  paths$ = new BehaviorSubject<PathPermitido[]>([]);
  segundosRestantes$ = new BehaviorSubject<number>(0);
  duracionSegundos$ = new BehaviorSubject<number>(0);

  private cuentaRegresivaSub?: Subscription;
  private sincronizacionSub?: Subscription;

  // --- Sesion deslizante: cualquier actividad del usuario reinicia el tiempo de sesion ---
  private readonly EVENTOS_ACTIVIDAD = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll', 'wheel'];
  private readonly RENOVAR_MIN_MS = 3000; // como maximo una renovacion cada 3 s
  private ultimaRenovacion = 0;
  private renovando = false;
  private renovacionPendiente?: ReturnType<typeof setTimeout>;
  private manejadorActividad = () => this.registrarActividad();

  constructor(private http: HttpClient, private zone: NgZone) {}

  get usuarioActual(): UsuarioSesion | null {
    return this.usuario$.value;
  }

  get estaLogueado(): boolean {
    return !!this.usuario$.value;
  }

  login(user_name: string, passwordHashSha256: string): Observable<LoginResponse> {
    return new Observable((observer) => {
      this.http
        .post<LoginResponse>(`${this.apiUrl}/auth/login`, { user_name, password: passwordHashSha256 }, { withCredentials: true })
        .subscribe({
          next: (resp) => {
            this.iniciarSesionLocal(resp.usuario, resp.paths, resp.duracion_segundos);
            observer.next(resp);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
    });
  }

  logout(mostrarAviso = true): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.finalizarSesionLocal(mostrarAviso, 'Sesion cerrada.'),
      error: () => this.finalizarSesionLocal(mostrarAviso, 'Sesion cerrada.')
    });
  }

  /** Consulta el estado real de la sesion en el backend (fuente de verdad del tiempo). */
  refrescarEstado(): Observable<EstadoResponse> {
    return this.http.get<EstadoResponse>(`${this.apiUrl}/auth/estado`, { withCredentials: true });
  }

  /**
   * Al abrir (o recargar) el sitio: si hay una cookie de sesion valida se restaura el estado
   * en silencio (sin avisos) para que el header sepa que hay un usuario logueado.
   * Nunca falla: si no hay sesion o el backend no responde, simplemente no hace nada.
   */
  restaurarSesionSilenciosa(): Promise<void> {
    return new Promise((resolve) => {
      this.refrescarEstado()
        .pipe(timeout(4000))
        .subscribe({
          next: (resp) => {
            if (resp.ok) {
              this.restaurarSesion(resp.usuario, resp.paths, resp.segundos_restantes, resp.duracion_segundos);
            }
            resolve();
          },
          error: () => resolve()
        });
    });
  }

  /** Reconstruye el estado local a partir de /auth/estado (por ejemplo tras recargar la pagina). */
  restaurarSesion(usuario: UsuarioSesion, paths: PathPermitido[], segundosRestantes: number, duracionSegundos: number): void {
    this.iniciarSesionLocal(usuario, paths, duracionSegundos);
    this.segundosRestantes$.next(segundosRestantes);
  }

  private iniciarSesionLocal(usuario: UsuarioSesion, paths: PathPermitido[], duracionSegundos: number): void {
    this.usuario$.next(usuario);
    this.paths$.next(paths);
    this.duracionSegundos$.next(duracionSegundos);
    this.segundosRestantes$.next(duracionSegundos);

    this.detenerTemporizadores();
    this.iniciarMonitorActividad();

    // Cuenta regresiva visual local (cada segundo)
    this.cuentaRegresivaSub = interval(1000).subscribe(() => {
      const restante = this.segundosRestantes$.value - 1;
      this.segundosRestantes$.next(Math.max(0, restante));
      if (restante <= 0) {
        this.finalizarSesionLocal(true, 'Su sesion ha expirado por inactividad.');
      }
    });

    // Sincronizacion periodica contra el backend (fuente real del tiempo restante)
    this.sincronizacionSub = timer(5000, 15000).subscribe(() => {
      this.refrescarEstado().subscribe({
        next: (resp) => {
          this.segundosRestantes$.next(resp.segundos_restantes);
          this.paths$.next(resp.paths);
          if (resp.segundos_restantes <= 0) {
            this.finalizarSesionLocal(true, 'Su sesion ha expirado.');
          }
        },
        error: () => this.finalizarSesionLocal(true, 'Su sesion ha expirado.')
      });
    });
  }

  private finalizarSesionLocal(mostrarAviso: boolean, mensaje: string): void {
    this.detenerTemporizadores();
    this.usuario$.next(null);
    this.paths$.next([]);
    this.segundosRestantes$.next(0);
    if (mostrarAviso && typeof Notiflix !== 'undefined') {
      Notiflix.Notify.info(mensaje);
    }
  }

  private detenerTemporizadores(): void {
    this.cuentaRegresivaSub?.unsubscribe();
    this.sincronizacionSub?.unsubscribe();
    this.detenerMonitorActividad();
  }

  // =========================================================
  // SESION DESLIZANTE
  // =========================================================

  /** Escucha clic, teclado, mouse, toque y scroll FUERA de la zona de Angular (no dispara deteccion de cambios). */
  private iniciarMonitorActividad(): void {
    this.detenerMonitorActividad();
    this.ultimaRenovacion = 0;
    this.zone.runOutsideAngular(() => {
      this.EVENTOS_ACTIVIDAD.forEach((ev) =>
        document.addEventListener(ev, this.manejadorActividad, { passive: true, capture: true })
      );
    });
  }

  private detenerMonitorActividad(): void {
    this.EVENTOS_ACTIVIDAD.forEach((ev) => document.removeEventListener(ev, this.manejadorActividad, true));
    if (this.renovacionPendiente) {
      clearTimeout(this.renovacionPendiente);
      this.renovacionPendiente = undefined;
    }
    this.renovando = false;
  }

  private registrarActividad(): void {
    if (!this.estaLogueado || this.renovando) return;

    const transcurrido = Date.now() - this.ultimaRenovacion;
    if (transcurrido >= this.RENOVAR_MIN_MS) {
      this.zone.run(() => this.renovarSesion());
    } else if (!this.renovacionPendiente) {
      // Actividad dentro de la ventana de espera: se renueva al terminar para no perder el ultimo movimiento.
      this.renovacionPendiente = setTimeout(() => {
        this.renovacionPendiente = undefined;
        if (this.estaLogueado && !this.renovando) {
          this.zone.run(() => this.renovarSesion());
        }
      }, this.RENOVAR_MIN_MS - transcurrido);
    }
  }

  /** POST /auth/renovar: el backend reinicia expira + cookie con SESSION_MINUTES y el reloj toma ese valor. */
  private renovarSesion(): void {
    this.renovando = true;
    this.ultimaRenovacion = Date.now();
    this.http.post<RenovarResponse>(`${this.apiUrl}/auth/renovar`, {}, { withCredentials: true }).subscribe({
      next: (resp) => {
        this.renovando = false;
        this.duracionSegundos$.next(resp.duracion_segundos);
        this.segundosRestantes$.next(resp.segundos_restantes);
      },
      error: () => {
        this.renovando = false;
        this.finalizarSesionLocal(true, 'Su sesion ha expirado.');
      }
    });
  }
}
