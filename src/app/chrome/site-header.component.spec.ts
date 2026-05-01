// @vitest-environment jsdom
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SiteHeaderComponent } from './site-header.component';
import { SiteNavComponent } from './site-nav.component';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fsResourceResolver(url: string): Promise<string> {
  const abs = resolve(__dirname, url);
  return Promise.resolve(readFileSync(abs, 'utf-8'));
}

describe('SiteHeaderComponent', () => {
  beforeAll(async () => {
    await resolveComponentResources(fsResourceResolver);
    try {
      TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeaderComponent, SiteNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders a home link with text "Arduino UA"', () => {
    const fixture = TestBed.createComponent(SiteHeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link: HTMLAnchorElement | null = el.querySelector('a[rel="home"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('Arduino UA');
  });
});
