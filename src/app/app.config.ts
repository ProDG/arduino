import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideContentApi } from '../content/api/content-api.token';
import { routes } from './app.routes';

// provideClientHydration intentionally NOT registered — SSG only, no hydration (D-26).
// withComponentInputBinding() enables route param → component input binding so
// :slug, :contentType, :token bind via input.required<string>() without ActivatedRoute.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'uk-UA' },
    provideContentApi(),
  ],
};
