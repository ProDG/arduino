from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page

from apps.blocks.code import CodeBlock, DiffBlock
from apps.blocks.image import FigureBlock
from apps.blocks.parts import PartsListBlock
from apps.blocks.text import (
    AsideBlock,
    HeadingBlock,
    LedeBlock,
    ParagraphBlock,
    SidenoteBlock,
)

from .serializers import IsoDateTimeField


LESSON_BODY_BLOCKS = [
    ("paragraph", ParagraphBlock()),
    ("heading", HeadingBlock()),
    ("sidenote", SidenoteBlock()),
    ("figure", FigureBlock()),
    ("code", CodeBlock()),
    ("diff", DiffBlock()),
    ("aside", AsideBlock()),
]

LEDE_BLOCKS = [("lede", LedeBlock())]
PARTS_LIST_BLOCKS = [("parts_list", PartsListBlock())]

DIFFICULTY_CHOICES = [
    ("beginner", "Beginner"),
    ("intermediate", "Intermediate"),
]


class LessonPage(Page):
    deck = models.CharField(max_length=600, blank=True)
    difficulty = models.CharField(
        max_length=20, choices=DIFFICULTY_CHOICES, default="beginner"
    )
    estimated_minutes = models.PositiveSmallIntegerField(default=10)

    lede = StreamField(
        LEDE_BLOCKS, min_num=0, max_num=1, use_json_field=True, blank=True
    )
    parts_list = StreamField(
        PARTS_LIST_BLOCKS, min_num=1, max_num=1, use_json_field=True
    )
    body = StreamField(LESSON_BODY_BLOCKS, use_json_field=True)

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
        APIField("difficulty"),
        APIField("estimatedMinutes", source="estimated_minutes"),
        APIField("lede"),
        APIField("partsList", source="parts_list"),
        APIField("body"),
    ]

    content_panels = Page.content_panels + [
        FieldPanel("deck"),
        FieldPanel("difficulty"),
        FieldPanel("estimated_minutes"),
        FieldPanel("lede"),
        FieldPanel("parts_list"),
        FieldPanel("body"),
    ]
