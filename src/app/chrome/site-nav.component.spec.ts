import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteNavComponent } from './site-nav.component';

describe('SiteNavComponent', () => {
  let fixture: ComponentFixture<SiteNavComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteNavComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('renders a /lessons link with text "Уроки"', () => {
    const link: HTMLAnchorElement | null = el.querySelector('a[href="/lessons"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('Уроки');
  });

  it('renders a /about link with text "Про проєкт"', () => {
    const link: HTMLAnchorElement | null = el.querySelector('a[href="/about"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('Про проєкт');
  });

  it('applies routerLinkActive class to nav links', () => {
    const links = el.querySelectorAll('a.site-nav__link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});
