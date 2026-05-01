import { RenderMode, ServerRoute } from '@angular/ssr';

// Every route is prerendered to static HTML at build time. There is no Node
// SSR runtime — `outputMode: "static"` strips the server bundle from dist.
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
