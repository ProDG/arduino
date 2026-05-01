import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Arduino UA',
  },
  {
    path: 'dev/glyph-audit',
    loadComponent: () =>
      import('./pages/glyph-audit/glyph-audit.component').then((m) => m.GlyphAuditComponent),
    title: 'Гліф-аудит — Arduino UA',
  },
];
