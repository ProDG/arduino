import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  AsideComponent,
  BodyComponent,
  CodeBlockComponent,
  DiffComponent,
  FigureCaptionComponent,
  FigureComponent,
  HeadingComponent,
  LedeComponent,
  MarginRailComponent,
  PageShellComponent,
  PinoutComponent,
  SidenoteComponent,
  SidenoteRefComponent,
  TwoColumnComponent,
} from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import type { Lesson } from '../../../content/models';

@Component({
  selector: 'app-dev-primitives',
  standalone: true,
  imports: [
    HeadingComponent,
    BodyComponent,
    LedeComponent,
    AsideComponent,
    SidenoteComponent,
    SidenoteRefComponent,
    FigureComponent,
    FigureCaptionComponent,
    CodeBlockComponent,
    DiffComponent,
    PinoutComponent,
    PageShellComponent,
    TwoColumnComponent,
    MarginRailComponent,
  ],
  templateUrl: './dev-primitives.component.html',
  styleUrl: './dev-primitives.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevPrimitivesComponent implements OnInit {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly contentApi = inject(CONTENT_API);

  readonly lesson = signal<Lesson | null>(null);

  readonly basicCode = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // блимаємо світлодіодом
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
`;

  readonly diffCode = `  void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
-   Serial.begin(9600);
+   Serial.begin(115200);
+   pinMode(BUTTON_PIN, INPUT_PULLUP);
  }

  void loop() {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(1000);
-   digitalWrite(LED_BUILTIN, LOW);
+   digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    delay(1000);
  }
`;

  readonly annotatedCode = `/* annotated.ino */

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
  // повторюємо
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
}
`;

  readonly annotations = [
    {
      line: 3,
      html: 'Налаштовуємо <code>pin 13</code> як вихід — це робиться один раз при старті.',
    },
    { line: 8, html: 'Затримка <code>1000 мс</code> — пауза в одну секунду.' },
    {
      line: 13,
      html: 'Друга затримка симетрична першій — світлодіод горить і не горить однаковий час.',
    },
    {
      line: 18,
      html: 'Цикл <code>loop()</code> повторюється безкінечно — це фундамент архітектури Arduino.',
    },
  ];

  readonly pins = [
    { x: 10, y: 10, label: 'D0', role: 'RX' },
    { x: 10, y: 20, label: 'D1', role: 'TX' },
    { x: 10, y: 30, label: 'D2', role: 'INT0' },
    { x: 10, y: 40, label: 'D3', role: 'PWM' },
    { x: 10, y: 50, label: 'D4', role: 'GPIO' },
    { x: 10, y: 60, label: 'D5', role: 'PWM' },
    { x: 10, y: 70, label: 'D6', role: 'PWM' },
    { x: 10, y: 80, label: 'D7', role: 'GPIO' },
    { x: 10, y: 90, label: 'D8', role: 'GPIO' },
    { x: 90, y: 10, label: 'D9', role: 'PWM' },
    { x: 90, y: 20, label: 'D10', role: 'PWM/SS' },
    { x: 90, y: 30, label: 'D11', role: 'PWM/MOSI' },
    { x: 90, y: 40, label: 'D12', role: 'MISO' },
    { x: 90, y: 50, label: 'D13', role: 'SCK/LED' },
  ];

  ngOnInit(): void {
    this.title.setTitle('Примітиви — Arduino UA');
    this.meta.addTag({ name: 'robots', content: 'noindex' });
    this.contentApi
      .getLesson('pershyi-blymayuchyi-svitlodiod')
      .then((l) => this.lesson.set(l))
      .catch(() => {
        // Mock fixture missing in dev — non-fatal; the showcase still renders the rest of the primitives.
      });
  }
}
