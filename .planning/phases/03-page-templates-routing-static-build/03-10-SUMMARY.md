---
phase: 03-page-templates-routing-static-build
plan: 10
subsystem: contract-validation
tags: [wagtail, streamfield, rest-api, contract, spike]
dependency_graph:
  requires: [03-01]
  provides: [wagtail-spike-report, CONTRACT-02-closed]
  affects: [04-wagtail-backend]
tech_stack:
  added: []
  patterns:
    - Wagtail 7.3 REST API v2 StreamField serialization (empirically verified)
    - ListBlock + StructBlock with RichTextBlock emits expanded HTML under the field name
    - P4 adapt-on-BE principle: FE contract immutable, Wagtail Python model conforms
key_files:
  created:
    - .planning/phases/03-page-templates-routing-static-build/wagtail-spike-report.md
  modified:
    - docs/typography-checklist.md
decisions:
  - "annotations[].html: FE field name kept; P4 Wagtail renames Python field from note to html (conform-to-FE)"
  - "figure.src: FE field name kept; P4 Wagtail renames Python field from image_src to src (conform-to-FE)"
  - "Wagtail {type,value,id} envelope: P4 adds normalizeBlock() adapter in Angular data-access layer (5-line transform)"
  - "CONTRACT-02 signed off: FE block.ts immutable across P3→P4"
metrics:
  duration: "314s (~5 minutes)"
  completed: "2026-05-02"
  tasks_completed: 2
  files_changed: 2
---

# Phase 03 Plan 10: Wagtail 7.3 StreamField Spike Summary

**One-liner:** Empirical Wagtail 7.3.1 REST API v2 spike confirms StreamField JSON shape; two field-name deltas (`note`→`html`, `image_src`→`src`) resolved as P4 conform-to-FE rules; CONTRACT-02 signed off.

## What Was Built

Throwaway Wagtail 7.3.1 + Django 5.2 project spun up in `/tmp/wagtail-spike` using `uv`. A `CodeBlock` (language, code, annotations[{line, note}]) and `FigureBlock` (image_src, alt, width, height) were defined as `StructBlock` + `ListBlock` on a `HomePage`. Data was seeded via the Django shell, the REST API v2 response was captured, and the JSON was diffed field-by-field against `src/content/models/block.ts`. The throwaway folder was deleted after the report was written.

## Tasks

| # | Name | Commit | Key files |
|---|------|--------|-----------|
| 1 | Spin up spike, define StructBlocks, capture API JSON | 3ee24cd | /tmp/wagtail-spike (deleted) |
| 2 | Diff JSON vs FE model, write report, delete spike | 3ee24cd | wagtail-spike-report.md, docs/typography-checklist.md |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Re-seeding required `to_python()` not raw JSON**

- **Found during:** Task 1 (verification)
- **Issue:** First seed attempt passed raw JSON dicts with `{"type": "item", "value": {...}}` nesting for `ListBlock` items. Wagtail deserialized `line: null, note: ""` because the raw format didn't match the internal `ListBlock` storage format.
- **Fix:** Used `stream_block.to_python([...])` to let Wagtail's own deserialization build the `StreamValue`, then assigned that directly. Re-captured API response correctly shows `line: 1, note: "<p>Some <em>rich</em> text</p>"`.
- **Files modified:** none (throwaway spike only)
- **Commit:** N/A (throwaway)

None in production files — plan executed within spec.

## Empirical Findings

### Confirmed assumptions

- **A2 (envelope):** Confirmed — Wagtail v2 API wraps each block in `{type, value, id}`.
- **A3 (RichTextBlock HTML):** Confirmed — `RichTextBlock` serializes to expanded HTML (`<p>Some <em>rich</em> text</p>`) by default in REST API v2 with no custom serializer needed.

### Field-name deltas

| Block | FE field | Wagtail field | Resolution |
|-------|----------|---------------|------------|
| code.annotations[] | `html` | `note` | P4 rename Python field `note` → `html` |
| figure | `src` | `image_src` | P4 rename Python field `image_src` → `src`; use ImageChooserBlock with custom `get_api_representation` |
| all blocks | flat `{type, ...fields}` | `{type, value, id}` | P4 normalizeBlock() adapter strips envelope |

## Known Stubs

None — this plan produces a report only; no FE code was written.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced in the main repo. Spike credentials (SQLite + Django SECRET_KEY + superuser password) were all ephemeral and deleted with the throwaway folder. T-03-10-01 and T-03-10-02 mitigations applied as planned.

## Self-Check

### Files exist

- `.planning/phases/03-page-templates-routing-static-build/wagtail-spike-report.md` — will verify below
- `docs/typography-checklist.md` updated with Phase 3 Wagtail Spike row
