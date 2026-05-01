/**
 * The canonical Ukrainian verification string. D-17 in 01-CONTEXT.md.
 *
 * Exercises:
 *   - ґ Ґ ї Ї є і
 *   - typographic apostrophe ʼ (U+02BC) — the modifier letter, NOT U+0027
 *   - em-dash —, «…» Ukrainian quotes, „…" inner quotes
 *   - Latin (Arduino model names) interleaved with Cyrillic, no break
 */
export const VERIFICATION_STRING =
  'Ґаздиня їсть її їжу — є ґедзь, ґніт, ґанок. Цей рядок має бути ідеально набраним. ATmega328P, INPUT_PULLUP. «Лапки» „вкладені" — апостроф ʼ.';

export const CRITICAL_GLYPHS = 'і ї є ґ Ї Є Ґ ʼ';
