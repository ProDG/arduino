import { InjectionToken, type Provider } from '@angular/core';
import { environment } from '../../environments/environment';
import { ContentApi } from './content-api';
import { MockContentApi } from './mock-content-api';
import { WagtailContentApi } from './wagtail-content-api';

export const CONTENT_API = new InjectionToken<ContentApi>('ContentApi');

export function provideContentApi(): Provider {
  return {
    provide: CONTENT_API,
    useFactory: (): ContentApi =>
      environment.useWagtailContentApi ? new WagtailContentApi() : new MockContentApi(),
  };
}
