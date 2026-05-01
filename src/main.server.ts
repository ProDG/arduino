// Build-time-only entry for Angular 21 SSG (outputMode: "static").
// The Angular CLI evaluates this during `ng build` to discover routes and
// prerender them to static HTML. NO runtime artifact ships from this file —
// `outputMode: "static"` causes the builder to drop the server bundle from
// the dist output. See `node_modules/@angular/build/src/builders/application/options.js`
// (`ignoreServer: ... outputMode === OutputMode.Static`).
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
