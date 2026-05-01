import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// LOCALE_ID + registerLocaleData added in PLAN 04 (UKR-01)
// provideClientHydration intentionally NOT registered — SSG only, no hydration (D-26).
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes)],
};
