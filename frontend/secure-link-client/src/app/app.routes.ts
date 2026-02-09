import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { StatsComponent } from './features/stats/stats.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'stats', component: StatsComponent },
  { path: '**', redirectTo: '' },
];
