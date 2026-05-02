# Wagtail 7.3 StreamField Spike Report

**Date:** 2026-05-02
**Wagtail version installed:** 7.3.1
**Duration:** ~15 minutes
**Throwaway folder:** /tmp/wagtail-spike (deleted after this report)

---

## Captured API Response

Full response from `GET http://localhost:8000/api/v2/pages/3/?fields=body`:

```json
{
    "id": 3,
    "meta": {
        "type": "home.HomePage",
        "detail_url": "http://localhost/api/v2/pages/3/",
        "html_url": "http://localhost/",
        "slug": "home",
        "show_in_menus": false,
        "seo_title": "",
        "search_description": "",
        "first_published_at": "2026-05-02T12:14:30.640340+03:00",
        "alias_of": null,
        "parent": null
    },
    "title": "Home",
    "body": [
        {
            "type": "code",
            "value": {
                "language": "cpp",
                "code": "void setup() {}\nvoid loop() {}",
                "annotations": [
                    {
                        "line": 1,
                        "note": "<p>Some <em>rich</em> text</p>"
                    }
                ]
            },
            "id": "11111111-1111-1111-1111-111111111111"
        },
        {
            "type": "figure",
            "value": {
                "image_src": "https://example.invalid/test.png",
                "alt": "Тестова картинка",
                "width": 800,
                "height": 600
            },
            "id": "22222222-2222-2222-2222-222222222222"
        }
    ]
}
```

---

## Diff vs FE Block Model

### Structural delta: `{type, value, id}` envelope

Every StreamField block is wrapped in `{ type, value, id }`. The FE `Block` discriminated union is flat — `{ type, ...fields }`. This requires a thin P4 adapter to strip the `value` envelope before handing off to Angular.

**Decision (envelope):** Option A — P4 data-access layer provides a 5-line `normalizeBlock(raw)` transform that destructures `raw.value` into the flat FE shape. The FE `Block` type stays flat; Wagtail emits the envelope; the adapter bridges them. **No FE model change.**

---

### code block

| Field | FE (`block.ts`) | Wagtail (`api/v2`) | Match |
|---|---|---|---|
| `language` | `'cpp' \| 'arduino' \| 'plaintext' \| 'diff'` | `"cpp"` string from ChoiceBlock | PASS |
| `code` | `string` | `"void setup() {}\nvoid loop() {}"` from TextBlock | PASS |
| `annotations[].line` | `number` | `1` from IntegerBlock | PASS |
| `annotations[].html` | `string` (rich-text HTML) | field name is **`note`**, value `"<p>Some <em>rich</em> text</p>"` | **FAIL — field name mismatch** |

**Finding:** `RichTextBlock` serializes to expanded HTML by default in REST API v2 — assumption A3 is confirmed CORRECT. The value `"<p>Some <em>rich</em> text</p>"` is exactly what the FE expects. The only mismatch is the **field name**: Wagtail emits `note`; FE model declares `html`.

---

### figure block

| Field | FE (`block.ts`) | Wagtail (`api/v2`) | Match |
|---|---|---|---|
| `src` | `string` | field name is **`image_src`** | **FAIL — field name mismatch** |
| `alt` | `string` | `"Тестова картинка"` | PASS |
| `width` | `number` | `800` | PASS |
| `height` | `number` | `600` | PASS |
| `number?` | optional number | not emitted (spike skips it) | N/A — optional FE field |
| `captionHtml?` | optional string | not emitted (spike skips it) | N/A — optional FE field |
| `fullBleed` | boolean | not emitted (spike skips it) | N/A — spike minimal model |

**Finding:** The FE uses `src`; Wagtail uses `image_src`. One side must rename.

---

## Verdict

- **Structural envelope** (`{type, value, id}`): documented — resolved by P4 adapter, no FE change
- **code block:** **FAIL** — `annotations[].note` (Wagtail) vs `annotations[].html` (FE)
- **figure block:** **FAIL** — `image_src` (Wagtail) vs `src` (FE)

---

## Remediation

### Delta 1: `annotations[].note` vs `annotations[].html`

Two paths:

| Option | Change | Impact |
|--------|--------|--------|
| A: Rename FE `html` → `note` | Edit `src/content/models/block.ts` + all 7 fixtures + `CodeBlock` component input + every `annotations` reference | ~10 files, manageable |
| B: Rename Wagtail `note` → `html` | Edit one Python class in P4 | 1-line change; preserves existing FE contract |

**Decision: Option B — P4 Wagtail renames the StructBlock field from `note` to `html`.**

Rationale: The FE model is the source of truth per the design-freeze principle (CONTEXT D-SEQ-02). `html` is the semantically appropriate name from the FE perspective — it describes what the value IS (an HTML string), not what it's FOR. Renaming one Python field in P4 is cheaper and safer than refactoring 10+ FE files at phase exit. The contract stays immutable across P3→P4.

**P4 action:** In `home/models.py` (or the production equivalent), change:
```python
# Before (spike shape):
('note', blocks.RichTextBlock()),

# After (P4 shape — conforms to FE contract):
('html', blocks.RichTextBlock()),
```

### Delta 2: `image_src` vs `src`

| Option | Change | Impact |
|--------|--------|--------|
| A: Rename FE `src` → `image_src` | Edit `src/content/models/block.ts` + FigureBlock component + fixtures | ~8 files |
| B: Rename Wagtail `image_src` → `src` | Edit one Python class in P4 | 1-line change |

**Decision: Option B — P4 Wagtail renames the StructBlock field from `image_src` to `src`.**

Rationale: Same principle — FE contract is immutable. `src` is idiomatic in HTML/FE context. In P4, the field will use `wagtail.images.blocks.ImageChooserBlock` (not a raw CharBlock), so the field will be renamed and the serializer customized regardless. Conforming to the FE name at the same time costs nothing.

**Note:** In production P4, `image_src` (CharBlock spike shortcut) becomes an `ImageChooserBlock` with a custom `get_api_representation` that returns `{ src, width, height, alt }` matching the FE `Block.figure` shape exactly. The spike CharBlock was intentionally minimal.

### Delta 3: `{type, value, id}` envelope

**Decision:** P4 data-access layer provides a `normalizeBlock(raw)` transform (5–10 lines) that destructures `raw.value` into the flat FE shape before Angular consumes it. No FE `Block` type change. Documented in P4 plan as WAGTAIL-ADAPTER-01.

---

## Sign-off

Design freeze checkpoint: **SIGNED OFF** — with the three P4 conform-to-FE rules documented above.

The FE contract in `src/content/models/block.ts` is **locked** across P3→P4.

P4 must implement:
1. `annotations[].html` (rename from `note` in Python StructBlock)
2. `figure.src` (rename from `image_src` in Python StructBlock; use `ImageChooserBlock` with `get_api_representation`)
3. `normalizeBlock()` adapter in the Angular data-access layer to strip the `{type, value, id}` envelope

CONTRACT-02 closed.
