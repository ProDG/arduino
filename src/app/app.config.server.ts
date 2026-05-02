// Build-time-only server config for SSG. See main.server.ts header.
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { CONTENT_API } from '../content/api/content-api.token';
import { FixtureContentApi } from '../content/api/fixture-content-api';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

// During prerender, override CONTENT_API with the node:fs-backed FixtureContentApi.
// MockContentApi (browser default) calls fetch('/assets/...') which fails in Node.
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: CONTENT_API, useClass: FixtureContentApi },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
