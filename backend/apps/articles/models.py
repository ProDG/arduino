from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page

from apps.blocks.code import CodeBlock, DiffBlock
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


class ArticlePage(Page):
    deck = models.CharField(max_length=600, blank=True)
    body = StreamField(ARTICLE_BODY_BLOCKS, use_json_field=True)

    api_fields = [
        APIField("slug"),
        APIField(
            "publishedAt",
            serializer=IsoDateTimeField(source="first_published_at"),
        ),
        APIField(
            "updatedAt",
            serializer=IsoDateTimeField(source="last_published_at"),
        ),
        APIField("title"),
        APIField("deck"),
        APIField("body"),
    ]

    content_panels = Page.content_panels + [
        FieldPanel("deck"),
        FieldPanel("body"),
    ]
