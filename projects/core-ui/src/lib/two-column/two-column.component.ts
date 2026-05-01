import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { computeSidenoteStack, type SidenoteInput, type SidenotePlacement } from './measure';

type Mode = 'desktop' | 'tablet' | 'mobile';

@Component({
  selector: 'ui-two-column',
  standalone: true,
  imports: [],
  template: `
    <div class="two-column__grid" [attr.data-mode]="mode()">
      <div class="two-column__body" #bodySlot>
        <ng-content select="[body]" />
      </div>
      <div class="two-column__margin" #marginSlot>
        <ng-content select="[margin]" />
      </div>
    </div>
  `,
  styleUrl: './two-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoColumnComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly bodySlot = viewChild.required<ElementRef<HTMLElement>>('bodySlot');
  readonly marginSlot = viewChild.required<ElementRef<HTMLElement>>('marginSlot');
  readonly mode = signal<Mode>('mobile');

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const update = () => {
        const w = window.innerWidth;
        const next: Mode = w >= 1200 ? 'desktop' : w >= 768 ? 'tablet' : 'mobile';
        this.mode.set(next);
        if (next === 'desktop') {
          this.unwrapMobileDisclosures();
          this.unrelocateTabletInline();
          this.placeDesktopSidenotes();
        } else {
          this.clearDesktopPlacements();
          if (next === 'tablet') {
            this.unwrapMobileDisclosures();
            this.relocateTabletInline();
          } else {
            this.unrelocateTabletInline();
            this.wrapMobileDisclosures();
          }
        }
      };

      update();

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

  private placeDesktopSidenotes(): void {
    const body = this.bodySlot().nativeElement;
    const margin = this.marginSlot().nativeElement;
    const grid = body.parentElement;
    if (!grid) return;
    const gridTop = grid.getBoundingClientRect().top;

    const anchors = Array.from(body.querySelectorAll<HTMLElement>('[data-sidenote-anchor]')).sort(
      (a, b) => Number(a.dataset['sidenoteAnchor']) - Number(b.dataset['sidenoteAnchor']),
    );

    const sidenotes = Array.from(margin.querySelectorAll<HTMLElement>('aside.sidenote'));

    if (anchors.length === 0 || sidenotes.length === 0) return;

    const inputs: SidenoteInput[] = anchors.slice(0, sidenotes.length).map((anchor, i) => ({
      anchorTop: anchor.getBoundingClientRect().top - gridTop,
      height: sidenotes[i].getBoundingClientRect().height,
    }));

    const placements: SidenotePlacement[] = computeSidenoteStack(inputs, this.readStackGap(grid));

    sidenotes.forEach((el, i) => {
      el.style.position = 'absolute';
      el.style.top = `${placements[i].top}px`;
    });
  }

  private clearDesktopPlacements(): void {
    const margin = this.marginSlot().nativeElement;
    margin.querySelectorAll<HTMLElement>('aside.sidenote').forEach((el) => {
      el.style.position = '';
      el.style.top = '';
    });
  }

  private wrapMobileDisclosures(): void {
    const body = this.bodySlot().nativeElement;
    const margin = this.marginSlot().nativeElement;
    const sidenotes = Array.from(margin.querySelectorAll<HTMLElement>('aside.sidenote'));
    const anchors = Array.from(body.querySelectorAll<HTMLElement>('[data-sidenote-anchor]')).sort(
      (a, b) => Number(a.dataset['sidenoteAnchor']) - Number(b.dataset['sidenoteAnchor']),
    );

    sidenotes.forEach((sn, i) => {
      const anchor = anchors[i];
      if (!anchor) return;
      const num = sn.id.startsWith('sn-') ? sn.id.slice(3) : String(i + 1);
      const det = document.createElement('details');
      det.dataset['mobileDisclosure'] = 'true';
      const sum = document.createElement('summary');
      sum.textContent = `Примітка ${num}`;
      det.appendChild(sum);
      sn.dataset['movedFromMargin'] = 'true';
      det.appendChild(sn);
      anchor.insertAdjacentElement('afterend', det);
    });
  }

  private unwrapMobileDisclosures(): void {
    const body = this.bodySlot().nativeElement;
    const margin = this.marginSlot().nativeElement;
    const dets = Array.from(
      body.querySelectorAll<HTMLDetailsElement>('details[data-mobile-disclosure="true"]'),
    );
    dets.forEach((det) => {
      const sn = det.querySelector<HTMLElement>('aside.sidenote[data-moved-from-margin="true"]');
      if (sn) {
        delete sn.dataset['movedFromMargin'];
        const stack = margin.querySelector<HTMLElement>('.margin-rail__stack');
        if (stack) {
          stack.appendChild(sn);
        } else {
          margin.appendChild(sn);
        }
      }
      det.remove();
    });
  }

  private relocateTabletInline(): void {
    const body = this.bodySlot().nativeElement;
    const margin = this.marginSlot().nativeElement;
    const sidenotes = Array.from(margin.querySelectorAll<HTMLElement>('aside.sidenote'));
    const anchors = Array.from(body.querySelectorAll<HTMLElement>('[data-sidenote-anchor]')).sort(
      (a, b) => Number(a.dataset['sidenoteAnchor']) - Number(b.dataset['sidenoteAnchor']),
    );

    sidenotes.forEach((sn, i) => {
      const anchor = anchors[i];
      if (!anchor) return;
      sn.dataset['movedFromMargin'] = 'true';
      sn.dataset['sidenoteTarget'] = anchor.dataset['sidenoteAnchor'] ?? String(i + 1);
      anchor.insertAdjacentElement('afterend', sn);
    });
  }

  private unrelocateTabletInline(): void {
    const body = this.bodySlot().nativeElement;
    const margin = this.marginSlot().nativeElement;
    const moved = Array.from(
      body.querySelectorAll<HTMLElement>('aside.sidenote[data-moved-from-margin="true"]'),
    ).filter((sn) => !sn.closest('details[data-mobile-disclosure="true"]'));
    if (moved.length === 0) return;
    const stack = margin.querySelector<HTMLElement>('.margin-rail__stack') ?? margin;
    moved
      .sort(
        (a, b) =>
          Number(a.dataset['sidenoteTarget'] ?? 0) - Number(b.dataset['sidenoteTarget'] ?? 0),
      )
      .forEach((sn) => {
        delete sn.dataset['movedFromMargin'];
        delete sn.dataset['sidenoteTarget'];
        stack.appendChild(sn);
      });
  }

  private readStackGap(grid: HTMLElement): number {
    const raw = getComputedStyle(grid).getPropertyValue('--sidenote-stack-gap').trim();
    const px = parseFloat(raw);
    return Number.isFinite(px) && px > 0 ? px : 24;
  }
}
