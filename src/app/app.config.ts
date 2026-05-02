import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideContentApi } from '../content/api/content-api.token';
import { routes } from './app.routes';

// Global error handler: logs and swallows. Without this, an unhandled rejection
// from any component (e.g., a missing fixture during ngOnInit) takes down the
// dev SSR Node process — `pnpm start` exits, browser stops responding. In
// production prerender it would also abort the build for that route.
// Components are expected to handle their own data-load errors (try/catch +
// loadError signal); this is just the safety net.
class SilentErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('[unhandled]', error);
  }
}

// provideClientHydration intentionally NOT registered — SSG only, no hydration (D-26).
// withComponentInputBinding() enables route param → component input binding so
// :slug, :contentType, :token bind via input.required<string>() without ActivatedRoute.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'uk-UA' },
    { provide: ErrorHandler, useClass: SilentErrorHandler },
    provideContentApi(),
  ],
};
