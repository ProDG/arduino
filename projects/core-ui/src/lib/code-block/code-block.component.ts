import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { computeSidenoteStack } from '../two-column/measure';

type CopyState = 'rest' | 'copied' | 'failed';
type Mode = 'desktop' | 'tablet' | 'mobile';

interface Line {
  num: number;
  content: string;
  kind: 'added' | 'removed' | 'unchanged';
}

@Component({
  selector: 'ui-code-block',
  standalone: true,
  imports: [],
  template: `
    <figure class="code-block">
      @if (filename(); as fn) {
        <figcaption class="code-block__filename">{{ fn }}</figcaption>
      }
      <div class="code-block__frame" [attr.data-mode]="mode()">
        <pre
          class="code-block__pre"
          [class.code-block__pre--no-gutter]="!showLineNumbers()"
        ><code>@for (line of lines(); track line.num) {<span
              class="code-line"
              [class.code-line--added]="line.kind === 'added'"
              [class.code-line--removed]="line.kind === 'removed'"
              [class.code-line--highlighted]="isHighlighted(line.num)"
            >@if (showLineNumbers()) {<span class="code-line__num">{{ line.num }}</span>}@if (line.kind === 'added') {<span class="code-line__diff-glyph code-line__diff-glyph--add">+</span>} @else if (line.kind === 'removed') {<span class="code-line__diff-glyph code-line__diff-glyph--remove">−</span>}<span class="code-line__content">{{ line.content }}
</span></span>}</code></pre>
        <button
          type="button"
          class="code-block__copy"
          aria-label="Копіювати код"
          (click)="onCopy()"
        >
          <span class="code-block__copy-icon" aria-hidden="true">
            @if (copyState() === 'copied') {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M2 7l3 3 7-7" />
              </svg>
            } @else {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="8" height="9" rx="1" />
                <path d="M5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
              </svg>
            }
          </span>
          <span class="code-block__copy-label">{{ copyLabel() }}</span>
        </button>
        <span class="visually-hidden" aria-live="polite">{{
          copyState() === 'rest' ? '' : copyLabel()
        }}</span>
      </div>
      @if (annotations().length > 0) {
        <aside class="code-block__annotations" [attr.data-mode]="mode()">
          @if (mode() === 'mobile') {
            <details>
              <summary>Примітки до коду ({{ annotations().length }})</summary>
              <dl>
                @for (a of annotations(); track a.line) {
                  <dt>Рядок {{ a.line }}</dt>
                  <dd [innerHTML]="a.html"></dd>
                }
              </dl>
            </details>
          } @else if (mode() === 'tablet') {
            <dl>
              @for (a of annotations(); track a.line) {
                <dt>Рядок {{ a.line }}</dt>
                <dd [innerHTML]="a.html"></dd>
              }
            </dl>
          } @else {
            @for (a of annotations(); track a.line) {
              <small class="code-block__annotation" [attr.data-line]="a.line">
                <span class="code-block__annotation-line">Рядок {{ a.line }}</span>
                <span [innerHTML]="a.html"></span>
              </small>
            }
          }
        </aside>
      }
    </figure>
  `,
  styleUrl: './code-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBlockComponent {
  readonly language = input.required<'cpp' | 'arduino' | 'plaintext' | 'diff'>();
  readonly code = input.required<string>();
  readonly tokens = input<string | undefined>(undefined);
  readonly annotations = input<{ line: number; html: string }[]>([]);
  readonly showLineNumbers = input<boolean>(true);
  readonly highlightLines = input<number[]>([]);
  readonly diffMode = input<boolean>(false);
  readonly filename = input<string | undefined>(undefined);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly copyState = signal<CopyState>('rest');
  readonly mode = signal<Mode>('mobile');

  readonly copyLabel = computed(() => {
    switch (this.copyState()) {
      case 'copied':
        return 'Скопійовано';
      case 'failed':
        return 'Не вдалося скопіювати';
      default:
        return 'Копіювати';
    }
  });

  readonly lines = computed<Line[]>(() => {
    const isDiff = this.diffMode() || this.language() === 'diff';
    const raw = this.code().replace(/\n$/, '').split('\n');
    return raw.map((src, i) => {
      if (isDiff && src.startsWith('+ ')) {
        return { num: i + 1, content: src.slice(2), kind: 'added' };
      }
      if (isDiff && src.startsWith('- ')) {
        return { num: i + 1, content: src.slice(2), kind: 'removed' };
      }
      return { num: i + 1, content: src, kind: 'unchanged' };
    });
  });

  isHighlighted(n: number): boolean {
    return this.highlightLines().includes(n);
  }

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const update = () => {
        const w = window.innerWidth;
        this.mode.set(w >= 1200 ? 'desktop' : w >= 768 ? 'tablet' : 'mobile');
        if (this.mode() === 'desktop') queueMicrotask(() => this.placeAnnotations());
      };
      update();

      if (typeof ResizeObserver === 'undefined') return;

      let timer: number | undefined;
      const ro = new ResizeObserver(() => {
        if (timer !== undefined) window.clearTimeout(timer);
        timer = window.setTimeout(update, 50);
      });
      ro.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => {
        if (timer !== undefined) window.clearTimeout(timer);
        ro.disconnect();
      });
    });
  }

  private placeAnnotations(): void {
    const fig = this.host.nativeElement.querySelector<HTMLElement>('.code-block');
    const annoSlot = this.host.nativeElement.querySelector<HTMLElement>(
      '.code-block__annotations[data-mode="desktop"]',
    );
    if (!fig || !annoSlot) return;
    const figTop = fig.getBoundingClientRect().top;

    const annoEls = Array.from(annoSlot.querySelectorAll<HTMLElement>('.code-block__annotation'));
    const inputs = annoEls.map((el) => {
      const lineNum = Number(el.dataset['line']);
      const lineEl = this.host.nativeElement.querySelector<HTMLElement>(
        `.code-line:nth-child(${lineNum})`,
      );
      const anchorTop = lineEl ? lineEl.getBoundingClientRect().top - figTop : 0;
      return { anchorTop, height: el.getBoundingClientRect().height };
    });

    const stackGap =
      parseFloat(getComputedStyle(fig).getPropertyValue('--sidenote-stack-gap')) || 24;
    const placements = computeSidenoteStack(inputs, stackGap);
    annoEls.forEach((el, i) => {
      el.style.position = 'absolute';
      el.style.top = `${placements[i].top}px`;
    });
  }

  async onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copyState.set('copied');
      window.setTimeout(() => this.copyState.set('rest'), 2000);
    } catch {
      this.copyState.set('failed');
      window.setTimeout(() => this.copyState.set('rest'), 4000);
    }
  }
}
