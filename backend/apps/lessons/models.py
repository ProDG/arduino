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
    LessonBodyField,
    SingleBlockField,
)
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


class _NeighborSlugField(drf_serializers.Field):
    """Emit prev/next lesson slug computed from first_published_at order.

    The FE TS contract (``Lesson.prevSlug?``, ``Lesson.nextSlug?``) and on-disk
    mock fixtures both bake the chain into each lesson page. Mocks omit the
    key entirely when the neighbor doesn't exist (no leading ``null``); we
    surface that by raising ``SkipField`` from ``get_attribute``.
    """

    def __init__(self, *, direction: str, **kwargs):
        assert direction in ("prev", "next")
        self._direction = direction
        kwargs.setdefault("source", "*")
        kwargs.setdefault("read_only", True)
        super().__init__(**kwargs)

    def get_attribute(self, instance):
        ordered = list(
            LessonPage.objects.live().order_by("first_published_at").values_list("slug", flat=True)
        )
        if instance.slug not in ordered:
            raise drf_serializers.SkipField()
        idx = ordered.index(instance.slug)
        if self._direction == "prev":
            if idx <= 0:
                raise drf_serializers.SkipField()
            return ordered[idx - 1]
        if idx >= len(ordered) - 1:
            raise drf_serializers.SkipField()
        return ordered[idx + 1]

    def to_representation(self, value):
        return value


class LessonPage(HeadlessPreviewMixin, Page):
    deck = models.CharField(max_length=600, blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default="beginner")
    estimated_minutes = models.PositiveSmallIntegerField(default=10)

    lede = StreamField(LEDE_BLOCKS, min_num=0, max_num=1, use_json_field=True, blank=True)
    parts_list = StreamField(PARTS_LIST_BLOCKS, min_num=1, max_num=1, use_json_field=True)
    body = StreamField(LESSON_BODY_BLOCKS, use_json_field=True)

    api_fields = [
        APIField("type", serializer=ConstantField("lesson")),
        APIField("slug"),
        APIField("title"),
        APIField("deck"),
        APIField(
            "estimatedMinutes",
            serializer=drf_serializers.IntegerField(source="estimated_minutes"),
        ),
        APIField("difficulty"),
        APIField(
            "partsList",
            serializer=SingleBlockField(type_override="parts-list", source="parts_list"),
        ),
        APIField("body", serializer=LessonBodyField()),
        APIField("prevSlug", serializer=_NeighborSlugField(direction="prev")),
        APIField("nextSlug", serializer=_NeighborSlugField(direction="next")),
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
        FieldPanel("difficulty"),
        FieldPanel("estimated_minutes"),
        FieldPanel("lede"),
        FieldPanel("parts_list"),
        FieldPanel("body"),
    ]

    def get_preview_url(self, request, token):
        return f"{self.get_client_root_url(request).rstrip('/')}/preview/lesson/{token}/"
