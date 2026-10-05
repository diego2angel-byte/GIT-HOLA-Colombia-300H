import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/auth.guard';
import { AdminGuard } from './core/admin.guard';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { RedesComponent } from './pages/redes/redes.component';
import { TouresComponent } from './pages/toures/toures.component';
import { Toures2Component } from './pages/toures2/toures2.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { ReservasComponent } from './pages/reservas/reservas.component';

import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RolesComponent } from './pages/roles/roles.component';
import { ApisComponent } from './pages/apis/apis.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { UsuariosCrudComponent } from './pages/usuarios-crud/usuarios-crud.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminToures2Component } from './pages/admin-toures2/admin-toures2.component';

const routes: Routes = [
  // Login unico: administrador de sesiones (usuarios de MongoDB)
  { path: 'login', component: LoginComponent },

  // Sitio publico (header + footer)
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: InicioComponent, pathMatch: 'full' },
      { path: 'redes', component: RedesComponent },
      { path: 'toures', component: TouresComponent },   // Toures Basicos
      { path: 'toures2', component: Toures2Component }, // Toures Especiales (datos de hola-toures)
      { path: 'contacto', component: ContactoComponent },
      { path: 'reservas', component: ReservasComponent }
    ]
  },

  // Panel de administracion (barra lateral): requiere sesion
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'apis', component: ApisComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'usuarios-crud', component: UsuariosCrudComponent },
      { path: 'admin', component: AdminComponent }, // CRUD de reservas y contactos
      { path: 'admin_toures2', component: AdminToures2Component, canActivate: [AdminGuard] } // solo rol admin
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
