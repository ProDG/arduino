from django.db import migrations, models

import wagtail.fields

from apps.blocks.code import CodeBlock, DiffBlock
from apps.blocks.image import FigureBlock
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
            name="SchematicPage",
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
                (
                    "schematic_image",
                    wagtail.fields.StreamField(
                        [("figure", FigureBlock())],
                        max_num=1,
                        min_num=1,
                        use_json_field=True,
                    ),
                ),
                ("download_url", models.URLField(blank=True, max_length=500)),
                (
                    "explanation",
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
