from django.db import migrations, models

import wagtail.fields

from apps.blocks.code import CodeBlock, DiffBlock
from apps.blocks.image import FigureBlock
from apps.blocks.parts import SpecBlock
from apps.blocks.pinout import PinoutBlock
from apps.blocks.text import (
    AsideBlock,
    HeadingBlock,
    LedeBlock,
    ParagraphBlock,
    SidenoteBlock,
)


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("wagtailcore", "0094_alter_page_locale"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatasheetPage",
            fields=[
                (
                    "page_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        serialize=False,
                        to="wagtailcore.page",
                    ),
                ),
                ("manufacturer", models.CharField(blank=True, max_length=200)),
                (
                    "pinout",
                    wagtail.fields.StreamField(
                        [("pinout", PinoutBlock())],
                        max_num=1,
                        min_num=1,
                        use_json_field=True,
                    ),
                ),
                (
                    "specifications",
                    wagtail.fields.StreamField(
                        [("spec", SpecBlock())],
                        use_json_field=True,
                    ),
                ),
                (
                    "peripheral_notes",
                    wagtail.fields.StreamField(
                        [
                            ("paragraph", ParagraphBlock()),
                            ("heading", HeadingBlock()),
                            ("sidenote", SidenoteBlock()),
                            ("figure", FigureBlock()),
                            ("code", CodeBlock()),
                            ("diff", DiffBlock()),
                            ("aside", AsideBlock()),
                            ("lede", LedeBlock()),
                        ],
                        blank=True,
                        use_json_field=True,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
            bases=("wagtailcore.page",),
        ),
    ]
