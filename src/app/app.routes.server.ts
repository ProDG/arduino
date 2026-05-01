import { RenderMode, ServerRoute } from '@angular/ssr';

// Every route is prerendered to static HTML at build time. There is no Node
// SSR runtime — `outputMode: "static"` strips the server bundle from dist.
//
// `/dev/primitives` is the developer showcase surface. It is excluded from
// the public prerender (D-WIRE-02) so the static bundle does NOT emit a
// crawlable HTML file with showcase content; the route ships as RenderMode.Client
// (a thin CSR shell) and renders only when reached in a dev/preview build.
// RenderMode.Client does NOT introduce a Node SSR runtime — it just opts the
// route out of build-time prerendering.
export const serverRoutes: ServerRoute[] = [
  { path: 'dev/primitives', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
