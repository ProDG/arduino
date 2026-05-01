import { InjectionToken, type Provider } from '@angular/core';
import { ContentApi } from './content-api';
import { MockContentApi } from './mock-content-api';

export const CONTENT_API = new InjectionToken<ContentApi>('ContentApi');

export function provideContentApi(): Provider {
  return { provide: CONTENT_API, useClass: MockContentApi };
}
