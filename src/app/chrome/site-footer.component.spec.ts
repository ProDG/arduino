// @vitest-environment jsdom
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SiteFooterComponent } from './site-footer.component';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fsResourceResolver(url: string): Promise<string> {
  const abs = resolve(__dirname, url);
  return Promise.resolve(readFileSync(abs, 'utf-8'));
}

describe('SiteFooterComponent', () => {
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
      imports: [SiteFooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the colophon paragraph', () => {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('повільний, ретельний переклад');
  });

  it('renders the RSS link to /feed.xml with tooltip', () => {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const rssLink: HTMLAnchorElement | null = el.querySelector('a[href="/feed.xml"]');
    expect(rssLink).toBeTruthy();
    expect(rssLink?.getAttribute('title')).toBe('У наступних фазах');
  });

  it('renders the license line', () => {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('© 2026 · CC BY-SA 4.0');
  });
});
