// Real Ukrainian Arduino prose specimen for the harness page (D-18).
// Locked from 01-UI-SPEC.md §"Section 2 — Real-prose specimen".
// HTML inside body strings is intentional — the component renders it
// via [innerHTML]. No user input touches these constants.

export const SPECIMEN_H1 = 'Перший крок: світлодіод, що блимає';

export const SPECIMEN_LEDE =
  'Це найпростіша і водночас найважливіша вправа в роботі з Arduino — ваш «Hello, World!» у світі електроніки.';

export const SPECIMEN_BODY_PARAS = [
  'Плата Arduino Uno побудована на мікроконтролері <strong>ATmega328P</strong>. Вбудований світлодіод підʼєднано до цифрового виходу <code>pin 13</code> через резистор — саме тому ми можемо керувати ним <em>без жодних додаткових компонентів</em>. Достатньо завантажити скетч і спостерігати, як ґніт цифрового життя загорається й гасне з інтервалом 5–7 разів на секунду.',
];

export const SPECIMEN_H2 = 'Налаштування виходу';

export const SPECIMEN_AFTER_H2 =
  'У функції <code>setup()</code> ми один раз повідомляємо мікроконтролеру, що <code>pin 13</code> має працювати у режимі виходу. Ґаздиня цифрового світу — функція <code>pinMode()</code> — приймає номер ніжки та режим: <code>OUTPUT</code> або <code>INPUT_PULLUP</code>.';

export const SPECIMEN_CODE = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // блимаємо світлодіодом
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}`;

export const SPECIMEN_FIGURE_CAPTION =
  'Електрична схема ілюструє, як струм проходить через вбудований резистор плати до світлодіода й назад до спільної землі.';

export const SPECIMEN_H3 = 'Що далі';

export const SPECIMEN_AFTER_H3 =
  'У наступному розділі ми навчимося читати стан кнопки через цифровий вхід і керувати світлодіодом за допомогою функції <code>digitalRead()</code>.';

export const SPECIMEN_ASIDE =
  'У режимі <code>INPUT_PULLUP</code> мікроконтролер активує внутрішній резистор підтяжки до живлення — це позбавляє схему від зайвої деталі та робить кнопку логічно інверсною.';
