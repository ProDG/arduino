"""Idempotent contract-test seed command.

Reads JSON fixtures from src/assets/mock-data/{lessons,articles,datasheets,schematics}/*.json
(the same files MockContentApi reads) and creates Wagtail page instances with matching
slugs and StreamField bodies. Seeded pages are PUBLISHED so /api/v2/pages/ surfaces them
for the contract diff in Plan 06.

References:
  - D-CONTRACT-03 (the seven fixture slugs)
  - D-CONTRACT-05 (this command's shape — Django management command in apps/contract/)
  - D-MODEL-01..05 (StreamField wire shapes the FE adapter un-wraps)
"""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any

from django.core.files.images import ImageFile
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime
from PIL import Image as PIL
from wagtail.images.models import Image
from wagtail.models import Page, Site

from apps.articles.models import ArticlePage
from apps.datasheets.models import DatasheetPage
from apps.lessons.models import LessonPage
from apps.schematics.models import SchematicPage


# Path resolution: this file is at backend/apps/contract/management/commands/seed_fixtures.py
# parents[0]=commands, [1]=management, [2]=contract, [3]=apps, [4]=backend, [4].parent=repo root.
# Container path takes precedence (compose.dev.yml mounts ./src/assets:/repo/src/assets:ro).
_CANDIDATES = [
    Path("/repo/src/assets/mock-data"),
    Path(__file__).resolve().parents[4].parent / "src" / "assets" / "mock-data",
]
MOCK_DATA_ROOT = next((p for p in _CANDIDATES if p.exists()), _CANDIDATES[0])

# D-CONTRACT-03 — exact seven slugs the contract diff exercises.
LESSON_SLUGS = {
    "pershyi-blymayuchyi-svitlodiod",
    "knopka-ta-pidtyahuvalnyi-rezystor",
    "analogovyi-vhid-ta-potentsiometr",
}
ARTICLE_SLUGS = {"chomu-arduino"}
DATASHEET_SLUGS = {"atmega328p", "arduino-uno-r3"}
SCHEMATIC_SLUGS = {"blymayuchyi-svitlodiod-shema"}


def _placeholder_image(title: str, w: int = 800, h: int = 600) -> Image:
    """Idempotent by title — returns existing Image if present, else uploads a PNG."""
    existing = Image.objects.filter(title=title).first()
    if existing:
        return existing
    buf = io.BytesIO()
    PIL.new("RGB", (int(w), int(h)), color=(220, 220, 220)).save(buf, format="PNG")
    buf.seek(0)
    return Image.objects.create(title=title, file=ImageFile(buf, name=f"{title}.png"))


def _wrap(block_type: str, value: Any) -> dict:
    """Wagtail StreamField on-disk wire shape: {type, value}."""
    return {"type": block_type, "value": value}


def _stamp_publish_dates(page, fixture: dict) -> None:
    """Force first_published_at + last_published_at to match fixture timestamps.

    Wagtail assigns these on publish() to ``timezone.now()``; the contract diff
    requires byte-equal timestamps with mock fixtures (publishedAt / updatedAt
    baked into JSON). We update the saved page row in place after publish.
    """
    pub = parse_datetime(fixture["publishedAt"]) if fixture.get("publishedAt") else None
    upd = parse_datetime(fixture["updatedAt"]) if fixture.get("updatedAt") else pub
    if pub is None and upd is None:
        return
    fields = {}
    if pub is not None:
        fields["first_published_at"] = pub
    if upd is not None:
        fields["last_published_at"] = upd
    type(page).objects.filter(pk=page.pk).update(**fields)


def _norm_coord(v: Any) -> int:
    """Pin coords in fixtures are integers in pixel-space; pass through unchanged."""
    return int(v)


def _highlight_lines_to_csv(lines: Any) -> str:
    if not lines:
        return ""
    if isinstance(lines, str):
        return lines
    return ",".join(str(int(n)) for n in lines)


def _annotations_listblock(annotations: list[dict]) -> list[dict]:
    """StructBlock items inside a ListBlock are stored as plain dicts (no envelope)."""
    return [{"line": int(a["line"]), "html": a["html"]} for a in annotations or []]


def _figure_value(fe: dict) -> dict:
    """FE flat figure {src, alt, width, height, captionHtml?, number?, fullBleed?}
    → BE FigureBlock value using src_override/alt_override fields so the
    on-disk fixture URL ('/assets/mock-data/figures/...svg') round-trips
    byte-equal through the API. Avoids creating real Wagtail Images for
    contract-test fixtures (the SVG paths don't correspond to uploaded files)."""
    out: dict[str, Any] = {
        "src_override": fe.get("src") or "",
        "alt_override": fe.get("alt") or "",
        "width_override": int(fe["width"]) if fe.get("width") is not None else None,
        "height_override": int(fe["height"]) if fe.get("height") is not None else None,
        "fullBleed": bool(fe.get("fullBleed", False)),
    }
    if fe.get("captionHtml"):
        out["captionHtml"] = fe["captionHtml"]
    if fe.get("number") is not None:
        out["number"] = int(fe["number"])
    return out


def _pinout_value(fe: dict) -> dict:
    """FE flat pinout {src, alt, pins, width, height}
    → BE PinoutBlock value using src_override field (see _figure_value)."""
    return {
        "src_override": fe.get("src") or "",
        "width_override": int(fe["width"]) if fe.get("width") is not None else None,
        "height_override": int(fe["height"]) if fe.get("height") is not None else None,
        "alt": fe.get("alt") or "pinout",
        "pins": [
            {
                "x": _norm_coord(p["x"]),
                "y": _norm_coord(p["y"]),
                "label": p["label"],
                "role": p.get("role") or "",
            }
            for p in fe.get("pins", [])
        ],
    }


def _block_from_fe(fe: dict) -> dict:
    """Convert one flat FE block ({type, ...fields}) into the {type, value: {...}}
    envelope Wagtail StreamField stores."""
    t = fe["type"]
    rest = {k: v for k, v in fe.items() if k != "type"}

    if t == "figure":
        return _wrap("figure", _figure_value(rest))

    if t == "code":
        rest.pop("tokens", None)
        value = {
            "language": rest.get("language", "cpp"),
            "code": rest.get("code", ""),
            "showLineNumbers": bool(rest.get("showLineNumbers", False)),
            "highlightLines": _highlight_lines_to_csv(rest.get("highlightLines", "")),
            "diffMode": bool(rest.get("diffMode", False)),
            "annotations": _annotations_listblock(rest.get("annotations", [])),
        }
        if rest.get("filename"):
            value["filename"] = rest["filename"]
        return _wrap("code", value)

    if t == "sidenote":
        return _wrap(
            "sidenote",
            {"number": int(rest["number"]), "html": rest["html"]},
        )

    if t == "heading":
        return _wrap(
            "heading",
            {"level": int(rest.get("level", 2)), "text": rest["text"]},
        )

    if t == "paragraph":
        return _wrap("paragraph", {"html": rest["html"]})

    if t == "lede":
        return _wrap("lede", {"html": rest["html"]})

    if t == "aside":
        return _wrap(
            "aside",
            {"variant": rest.get("variant", "note"), "html": rest["html"]},
        )

    if t == "diff":
        return _wrap(
            "diff",
            {"before": rest.get("before", ""), "after": rest.get("after", "")},
        )

    raise ValueError(f"Unknown FE block type: {t!r}")


def _split_lede_from_body(body: list[dict]) -> tuple[list[dict] | None, list[dict]]:
    """LessonPage.body StreamField does NOT allow `lede` blocks (only the separate
    LessonPage.lede StreamField does). Lesson fixtures have lede as body[0] —
    extract it so the body assignment validates. Returns (lede_blocks, rest_body).
    """
    if not body:
        return None, []
    if body[0].get("type") == "lede":
        return [body[0]], body[1:]
    return None, body


class Command(BaseCommand):
    help = (
        "Idempotently seed contract-test fixtures from src/assets/mock-data into "
        "Wagtail as PUBLISHED pages. Safe to re-run."
    )

    def handle(self, *args, **options):  # noqa: ARG002
        if not MOCK_DATA_ROOT.exists():
            raise SystemExit(
                f"MOCK_DATA_ROOT does not exist: {MOCK_DATA_ROOT}. "
                "Did you bind-mount the host repo into the Wagtail container? "
                "compose.dev.yml should mount ./src/assets:/repo/src/assets:ro"
            )

        self.stdout.write(f"MOCK_DATA_ROOT = {MOCK_DATA_ROOT}")

        site = Site.objects.get(is_default_site=True)
        root: Page = site.root_page

        all_slugs = LESSON_SLUGS | ARTICLE_SLUGS | DATASHEET_SLUGS | SCHEMATIC_SLUGS
        for model in (LessonPage, ArticlePage, DatasheetPage, SchematicPage):
            qs = model.objects.filter(slug__in=all_slugs)
            count = qs.count()
            if count:
                qs.delete()
                self.stdout.write(f"  cleared {count} prior {model.__name__} fixture pages")

        # qs.delete() bypasses treebeard's per-node cleanup, leaving the parent's
        # numchild stale. fix_tree() reconciles numchild/depth/path metadata so
        # subsequent root.add_child() calls don't hit "_inc_path on NoneType".
        Page.fix_tree(destructive=False)
        root = Page.objects.get(pk=root.pk)

        self._seed_lessons(root)
        self._seed_articles(root)
        self._seed_datasheets(root)
        self._seed_schematics(root)

        self.stdout.write(self.style.SUCCESS("Seed complete."))

    def _seed_lessons(self, root: Page) -> None:
        for path in sorted((MOCK_DATA_ROOT / "lessons").glob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            if data["slug"] not in LESSON_SLUGS:
                continue
            lede_blocks, body_rest = _split_lede_from_body(data.get("body", []))
            lesson = LessonPage(
                title=data["title"],
                slug=data["slug"],
                deck=data.get("deck", ""),
                difficulty=data.get("difficulty", "beginner"),
                estimated_minutes=data.get("estimatedMinutes", 10),
                body=json.dumps([_block_from_fe(b) for b in body_rest]),
                parts_list=json.dumps(
                    [
                        _wrap(
                            "parts_list",
                            {
                                "items": [
                                    {
                                        "name": it["name"],
                                        "quantity": int(it["quantity"]),
                                        **({"note": it["note"]} if it.get("note") else {}),
                                    }
                                    for it in data["partsList"]["items"]
                                ]
                            },
                        )
                    ]
                ),
            )
            if lede_blocks:
                lesson.lede = json.dumps([_block_from_fe(b) for b in lede_blocks])
            root.add_child(instance=lesson)
            lesson.save_revision().publish()
            _stamp_publish_dates(lesson, data)
            self.stdout.write(f"  seeded LessonPage: {lesson.slug}")

    def _seed_articles(self, root: Page) -> None:
        for path in sorted((MOCK_DATA_ROOT / "articles").glob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            if data["slug"] not in ARTICLE_SLUGS:
                continue
            article = ArticlePage(
                title=data["title"],
                slug=data["slug"],
                deck=data.get("deck", ""),
                body=json.dumps([_block_from_fe(b) for b in data.get("body", [])]),
            )
            root.add_child(instance=article)
            article.save_revision().publish()
            _stamp_publish_dates(article, data)
            self.stdout.write(f"  seeded ArticlePage: {article.slug}")

    def _seed_datasheets(self, root: Page) -> None:
        for path in sorted((MOCK_DATA_ROOT / "datasheets").glob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            if data["slug"] not in DATASHEET_SLUGS:
                continue
            ds = DatasheetPage(
                title=data["title"],
                slug=data["slug"],
                manufacturer=data.get("manufacturer", ""),
                pinout=json.dumps([_wrap("pinout", _pinout_value(data["pinout"]))]),
                specifications=json.dumps(
                    [
                        _wrap("spec", {"label": s["label"], "value": s["value"]})
                        for s in data.get("specifications", [])
                    ]
                ),
                peripheral_notes=json.dumps(
                    [_block_from_fe(b) for b in data.get("peripheralNotes", [])]
                ),
            )
            root.add_child(instance=ds)
            ds.save_revision().publish()
            _stamp_publish_dates(ds, data)
            self.stdout.write(f"  seeded DatasheetPage: {ds.slug}")

    def _seed_schematics(self, root: Page) -> None:
        for path in sorted((MOCK_DATA_ROOT / "schematics").glob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            if data["slug"] not in SCHEMATIC_SLUGS:
                continue
            schematic_image_fe = data["schematicImage"]
            sch = SchematicPage(
                title=data["title"],
                slug=data["slug"],
                schematic_image=json.dumps([_wrap("figure", _figure_value(schematic_image_fe))]),
                download_url=data.get("downloadUrl", ""),
                explanation=json.dumps([_block_from_fe(b) for b in data.get("explanation", [])]),
            )
            root.add_child(instance=sch)
            sch.save_revision().publish()
            _stamp_publish_dates(sch, data)
            self.stdout.write(f"  seeded SchematicPage: {sch.slug}")
