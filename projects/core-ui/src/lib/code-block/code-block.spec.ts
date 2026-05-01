import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeBlockComponent } from './code-block.component';

const SAMPLE_CODE = 'void setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n';

describe('CodeBlockComponent — copy-to-clipboard interaction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function mount() {
    const fixture = TestBed.createComponent(CodeBlockComponent);
    fixture.componentRef.setInput('language', 'arduino');
    fixture.componentRef.setInput('code', SAMPLE_CODE);
    fixture.detectChanges();
    return fixture;
  }

  function getCopyButton(fixture: ReturnType<typeof mount>): HTMLButtonElement {
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Копіювати код"]',
    );
    expect(btn, 'copy button must exist with the locked Cyrillic aria-label').not.toBeNull();
    return btn!;
  }

  it('renders the rest label `Копіювати` initially', () => {
    const fixture = mount();
    const btn = getCopyButton(fixture);
    expect(btn.textContent).toContain('Копіювати');
    expect(btn.textContent).not.toContain('Скопійовано');
  });

  it('on success: rest -> Скопійовано (2s) -> rest; clipboard called once with verbatim code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const fixture = mount();
    const btn = getCopyButton(fixture);
    btn.click();

    // Allow microtasks (resolved promise) to flush.
    await Promise.resolve();
    fixture.detectChanges();

    expect(btn.textContent).toContain('Скопійовано');
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(SAMPLE_CODE);

    vi.advanceTimersByTime(1999);
    fixture.detectChanges();
    expect(btn.textContent).toContain('Скопійовано');

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(btn.textContent).toContain('Копіювати');
  });

  it('on failure: rest -> Не вдалося скопіювати (4s) -> rest; no thrown error, no console.error', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const fixture = mount();
    const btn = getCopyButton(fixture);
    btn.click();

    await Promise.resolve();
    await Promise.resolve(); // allow rejection chain
    fixture.detectChanges();

    expect(btn.textContent).toContain('Не вдалося скопіювати');
    expect(consoleErr).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3999);
    fixture.detectChanges();
    expect(btn.textContent).toContain('Не вдалося скопіювати');

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(btn.textContent).toContain('Копіювати');
  });

  it('declares an aria-live="polite" region for screen-reader feedback', () => {
    const fixture = mount();
    const live = (fixture.nativeElement as HTMLElement).querySelector('[aria-live="polite"]');
    expect(live, 'an aria-live=polite element must exist for status announcements').not.toBeNull();
  });
});
