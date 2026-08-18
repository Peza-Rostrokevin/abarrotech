import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalogo/catalogo.component').then((m) => m.CatalogoComponent)
  },
  {
    path: 'producto/:id',
    loadComponent: () =>
      import('./pages/producto-detalle/producto-detalle.component').then(
        (m) => m.ProductoDetalleComponent
      )
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'mis-productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/mis-productos/mis-productos.component').then(
        (m) => m.MisProductosComponent
      )
  },
  {
    path: 'mis-ventas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/mis-ventas/mis-ventas.component').then((m) => m.MisVentasComponent)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent)
  },
  { path: '**', redirectTo: '' }
];
