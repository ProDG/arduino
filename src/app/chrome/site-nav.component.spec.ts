// @vitest-environment jsdom
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SiteNavComponent } from './site-nav.component';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fsResourceResolver(url: string): Promise<string> {
  const abs = resolve(__dirname, url);
  return Promise.resolve(readFileSync(abs, 'utf-8'));
}

describe('SiteNavComponent', () => {
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
      imports: [SiteNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders a /lessons link with text "Уроки"', () => {
    const fixture = TestBed.createComponent(SiteNavComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link: HTMLAnchorElement | null = el.querySelector('a[href="/lessons"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('Уроки');
  });

  it('renders a /about link with text "Про проєкт"', () => {
    const fixture = TestBed.createComponent(SiteNavComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link: HTMLAnchorElement | null = el.querySelector('a[href="/about"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('Про проєкт');
  });

  it('renders nav links with site-nav__link class', () => {
    const fixture = TestBed.createComponent(SiteNavComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll('a.site-nav__link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});
