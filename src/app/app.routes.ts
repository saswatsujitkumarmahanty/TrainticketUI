import { Routes } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { authGuard } from './core/guard/auth.guard';
 
export const routes: Routes = [
  { path: '', redirectTo: 'train-search', pathMatch: 'full' },
  {
    path: 'train-search',
    loadComponent: () => import('./features/train-search/train-search').then((m) => m.TrainSearch)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register)
  },
  {
    path: 'book',
    canActivate: [authGuard],
    loadComponent: () => import('./features/booking/booking').then((m) => m.Booking)
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/my-booking/my-booking').then((m) => m.MyBooking)
  },
  {
    path: 'my-bookings/:pnr',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/my-booking/booking-detail/booking-detail').then((m) => m.BookingDetail)
  },
  { path: '**', redirectTo: 'train-search' }
];