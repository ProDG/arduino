// @vitest-environment jsdom
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DIFFICULTY_LABELS_UK } from '../../../lib/difficulty';
import { BlockRendererComponent } from './block-renderer.component';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fsResourceResolver(url: string): Promise<string> {
  const abs = resolve(__dirname, url);
  return Promise.resolve(readFileSync(abs, 'utf-8'));
}

describe('BlockRendererComponent', () => {
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
      imports: [BlockRendererComponent],
    }).compileComponents();
  });

  it('Test 1: renders ui-heading for heading block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', { type: 'heading', level: 2, text: 'Заголовок' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('ui-heading');
    expect(heading).toBeTruthy();
  });

  it('Test 2: renders ui-body with innerHTML for paragraph block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', { type: 'paragraph', html: '<em>текст</em>' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const body = el.querySelector('ui-body');
    expect(body).toBeTruthy();
  });

  it('Test 3a: renders ui-lede for lede block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', { type: 'lede', html: '<p>вступ</p>' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ui-lede')).toBeTruthy();
  });

  it('Test 3b: renders ui-aside for aside block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', {
      type: 'aside',
      variant: 'note',
      html: '<p>примітка</p>',
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ui-aside')).toBeTruthy();
  });

  it('Test 4: renders ui-figure with img ngSrc for figure block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', {
      type: 'figure',
      src: '/assets/mock-data/images/led.jpg',
      alt: 'Світлодіод',
      fullBleed: false,
      width: 800,
      height: 600,
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const fig = el.querySelector('ui-figure');
    expect(fig).toBeTruthy();
    const img =
      el.querySelector('img[ng-img]') ?? el.querySelector('img[ngsrc]') ?? el.querySelector('img');
    expect(img).toBeTruthy();
  });

  it('Test 5: renders ui-code-block for code block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', {
      type: 'code',
      language: 'cpp',
      code: 'void setup() {}',
      showLineNumbers: true,
      highlightLines: [],
      diffMode: false,
      annotations: [],
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ui-code-block')).toBeTruthy();
  });

  it('Test 6: renders ui-diff for diff block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', { type: 'diff', before: 'old', after: 'new' });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ui-diff')).toBeTruthy();
  });

  it('Test 7: renders ui-pinout for pinout block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', {
      type: 'pinout',
      src: '/assets/mock-data/images/pinout.svg',
      alt: 'Pinout Arduino Uno',
      pins: [{ x: 10, y: 10, label: 'D0', role: 'RX' }],
      width: 800,
      height: 600,
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ui-pinout')).toBeTruthy();
  });

  it('Test 8: emits nothing for sidenote block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', {
      type: 'sidenote',
      number: 1,
      html: 'note',
      anchorParagraphIndex: 0,
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent?.trim()).toBe('');
  });

  it('Test 9: emits nothing for parts-list block', () => {
    const fixture = TestBed.createComponent(BlockRendererComponent);
    fixture.componentRef.setInput('block', {
      type: 'parts-list',
      items: [{ name: 'Резистор', quantity: 1 }],
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent?.trim()).toBe('');
  });

  it('Test 10: DIFFICULTY_LABELS_UK contains correct Ukrainian labels', () => {
    expect(DIFFICULTY_LABELS_UK['beginner']).toBe('початківець');
    expect(DIFFICULTY_LABELS_UK['intermediate']).toBe('проміжний');
  });
});
