from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page

from wagtail_headless_preview.models import HeadlessPreviewMixin

from apps.blocks.code import CodeBlock, DiffBlock
from apps.blocks.flat_stream_serializer import ConstantField, FlatStreamField
from apps.blocks.image import FigureBlock
from apps.blocks.text import (
    AsideBlock,
    HeadingBlock,
    LedeBlock,
    ParagraphBlock,
    SidenoteBlock,
)

from .serializers import IsoDateTimeField


ARTICLE_BODY_BLOCKS = [
    ("paragraph", ParagraphBlock()),
    ("heading", HeadingBlock()),
    ("sidenote", SidenoteBlock()),
    ("figure", FigureBlock()),
    ("code", CodeBlock()),
    ("diff", DiffBlock()),
    ("aside", AsideBlock()),
    ("lede", LedeBlock()),
]


class ArticlePage(HeadlessPreviewMixin, Page):
    deck = models.CharField(max_length=600, blank=True)
    body = StreamField(ARTICLE_BODY_BLOCKS, use_json_field=True)

    api_fields = [
        APIField("type", serializer=ConstantField("article")),
        APIField("slug"),
        APIField("title"),
        APIField("deck"),
        APIField("body", serializer=FlatStreamField()),
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
        FieldPanel("deck"),
        FieldPanel("body"),
    ]

    def get_preview_url(self, request, token):
        return f"{self.get_client_root_url(request).rstrip('/')}/preview/article/{token}/"
