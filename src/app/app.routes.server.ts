import { RenderMode, ServerRoute } from '@angular/ssr';
import {
  listArticleSlugs,
  listDatasheetSlugs,
  listLessonSlugs,
  listSchematicSlugs,
} from '../content/api/fixture-loader';

// Every public route is prerendered to static HTML at build time. There is no
// Node SSR runtime — `outputMode: "static"` strips the server bundle from dist.
//
// RenderMode.Client opts a route out of prerender and ships a CSR shell. It
// does NOT introduce a Node runtime. /preview/* (P3) and /dev/primitives (P2)
// both use this mode.
export const serverRoutes: ServerRoute[] = [
  { path: 'preview/:contentType/:token', renderMode: RenderMode.Client },
  { path: 'dev/primitives', renderMode: RenderMode.Client },

  {
    path: 'lessons/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listLessonSlugs()).map((slug: string) => ({ slug }));
    },
  },
  {
    path: 'articles/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listArticleSlugs()).map((slug: string) => ({ slug }));
    },
  },
  {
    path: 'datasheets/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listDatasheetSlugs()).map((slug: string) => ({ slug }));
    },
  },
  {
    path: 'schematics/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listSchematicSlugs()).map((slug: string) => ({ slug }));
    },
  },

  { path: '**', renderMode: RenderMode.Prerender },
];
