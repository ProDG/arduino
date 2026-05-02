import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Arduino UA — українська онлайн-книга',
  },
  {
    path: 'lessons',
    loadComponent: () =>
      import('./pages/lesson-library/lesson-library.page').then((m) => m.LessonLibraryPage),
    title: 'Уроки — Arduino UA',
  },
  {
    path: 'lessons/:slug',
    loadComponent: () => import('./pages/lesson/lesson.page').then((m) => m.LessonPage),
  },
  {
    path: 'articles/:slug',
    loadComponent: () => import('./pages/article/article.page').then((m) => m.ArticlePage),
  },
  {
    path: 'datasheets/:slug',
    loadComponent: () => import('./pages/datasheet/datasheet.page').then((m) => m.DatasheetPage),
  },
  {
    path: 'schematics/:slug',
    loadComponent: () => import('./pages/schematic/schematic.page').then((m) => m.SchematicPage),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
    title: 'Про проєкт — Arduino UA',
  },
  {
    path: 'preview/:contentType/:token',
    loadComponent: () =>
      import('./pages/preview-stub/preview-stub.page').then((m) => m.PreviewStubPage),
  },
  {
    path: 'dev/glyph-audit',
    loadComponent: () =>
      import('./pages/glyph-audit/glyph-audit.component').then((m) => m.GlyphAuditComponent),
    title: 'Гліф-аудит — Arduino UA',
  },
  {
    path: 'dev/primitives',
    loadComponent: () =>
      import('./pages/dev-primitives/dev-primitives.component').then(
        (m) => m.DevPrimitivesComponent,
      ),
    title: 'Примітиви — Arduino UA',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
    title: 'Сторінку не знайдено — Arduino UA',
  },
];
