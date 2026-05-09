from django.db import models
from rest_framework import serializers as drf_serializers
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page

from wagtail_headless_preview.models import HeadlessPreviewMixin

from apps.blocks.code import CodeBlock, DiffBlock
from apps.blocks.flat_stream_serializer import (
    ConstantField,
    FlatStreamField,
    SingleBlockField,
)
from apps.blocks.image import FigureBlock
from apps.blocks.text import (
    AsideBlock,
    HeadingBlock,
    LedeBlock,
    ParagraphBlock,
    SidenoteBlock,
)

from .serializers import IsoDateTimeField


SCHEMATIC_IMAGE_BLOCKS = [("figure", FigureBlock())]
EXPLANATION_BLOCKS = [
    ("paragraph", ParagraphBlock()),
    ("heading", HeadingBlock()),
    ("sidenote", SidenoteBlock()),
    ("figure", FigureBlock()),
    ("code", CodeBlock()),
    ("diff", DiffBlock()),
    ("aside", AsideBlock()),
    ("lede", LedeBlock()),
]


class SchematicPage(HeadlessPreviewMixin, Page):
    schematic_image = StreamField(SCHEMATIC_IMAGE_BLOCKS, min_num=1, max_num=1, use_json_field=True)
    download_url = models.CharField(max_length=500, blank=True)
    explanation = StreamField(EXPLANATION_BLOCKS, use_json_field=True, blank=True)

    api_fields = [
        APIField("type", serializer=ConstantField("schematic")),
        APIField("slug"),
        APIField("title"),
        APIField(
            "schematicImage",
            serializer=SingleBlockField(source="schematic_image"),
        ),
        APIField("explanation", serializer=FlatStreamField()),
        APIField(
            "downloadUrl",
            serializer=drf_serializers.CharField(source="download_url"),
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
        FieldPanel("schematic_image"),
        FieldPanel("download_url"),
        FieldPanel("explanation"),
    ]

    def get_preview_url(self, request, token):
        return f"{self.get_client_root_url(request).rstrip('/')}/preview/schematic/{token}/"
