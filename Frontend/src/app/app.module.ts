import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth.service';

// Sitio publico (hola-colombia)
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { RedesComponent } from './pages/redes/redes.component';
import { TouresComponent } from './pages/toures/toures.component';
import { Toures2Component } from './pages/toures2/toures2.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { ReservasComponent } from './pages/reservas/reservas.component';

// Login y panel de administracion (hola-admin-sesiones)
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RolesComponent } from './pages/roles/roles.component';
import { ApisComponent } from './pages/apis/apis.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { UsuariosCrudComponent } from './pages/usuarios-crud/usuarios-crud.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminToures2Component } from './pages/admin-toures2/admin-toures2.component';

// Al abrir el sitio, restaura (en silencio) la sesion si la cookie sigue vigente
export function restaurarSesion(auth: AuthService) {
  return () => auth.restaurarSesionSilenciosa();
}

@NgModule({
  declarations: [
    AppComponent,
    PublicLayoutComponent, HeaderComponent, FooterComponent,
    InicioComponent, RedesComponent, TouresComponent, Toures2Component, ContactoComponent, ReservasComponent,
    LoginComponent, LayoutComponent, DashboardComponent, RolesComponent, ApisComponent,
    UsuariosComponent, UsuariosCrudComponent, AdminComponent, AdminToures2Component
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  providers: [{ provide: APP_INITIALIZER, useFactory: restaurarSesion, deps: [AuthService], multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
