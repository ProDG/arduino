from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page

from apps.blocks.code import CodeBlock, DiffBlock
from apps.blocks.flat_stream_serializer import (
    ConstantField,
    FlatListField,
    FlatStreamField,
    SingleBlockField,
)
from apps.blocks.image import FigureBlock
from wagtail_headless_preview.models import HeadlessPreviewMixin

from apps.blocks.parts import SpecBlock
from apps.blocks.pinout import PinoutBlock
from apps.blocks.text import (
    AsideBlock,
    HeadingBlock,
    LedeBlock,
    ParagraphBlock,
    SidenoteBlock,
)

from .serializers import IsoDateTimeField


DATASHEET_NOTES_BLOCKS = [
    ("paragraph", ParagraphBlock()),
    ("heading", HeadingBlock()),
    ("sidenote", SidenoteBlock()),
    ("figure", FigureBlock()),
    ("code", CodeBlock()),
    ("diff", DiffBlock()),
    ("aside", AsideBlock()),
    ("lede", LedeBlock()),
]

SPECIFICATION_BLOCKS = [("spec", SpecBlock())]
PINOUT_BLOCKS = [("pinout", PinoutBlock())]


class DatasheetPage(HeadlessPreviewMixin, Page):
    manufacturer = models.CharField(max_length=200, blank=True)

    pinout = StreamField(PINOUT_BLOCKS, min_num=1, max_num=1, use_json_field=True)
    specifications = StreamField(SPECIFICATION_BLOCKS, use_json_field=True)
    peripheral_notes = StreamField(DATASHEET_NOTES_BLOCKS, use_json_field=True, blank=True)

    api_fields = [
        APIField("type", serializer=ConstantField("datasheet")),
        APIField("slug"),
        APIField("title"),
        APIField("manufacturer"),
        APIField("pinout", serializer=SingleBlockField()),
        APIField("specifications", serializer=FlatListField()),
        APIField(
            "peripheralNotes",
            serializer=FlatStreamField(source="peripheral_notes"),
        ),
        APIField(
            "publishedAt",
            serializer=IsoDateTimeField(source="first_published_at"),
        ),
        APIField(
            "updatedAt",
            serializer=IsoDateTimeField(source="last_published_at"),
        ),
    ]

    content_panels = Page.content_panels + [
        FieldPanel("manufacturer"),
        FieldPanel("pinout"),
        FieldPanel("specifications"),
        FieldPanel("peripheral_notes"),
    ]

    def get_preview_url(self, request, token):
        return f"{self.get_client_root_url(request).rstrip('/')}/preview/datasheet/{token}/"
