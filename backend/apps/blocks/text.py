from wagtail import blocks
from wagtail.rich_text import expand_db_html


ASIDE_VARIANT_CHOICES = [
    ("note", "Note"),
    ("warning", "Warning"),
    ("fact", "Fact"),
]


class ParagraphBlock(blocks.StructBlock):
    html = blocks.RichTextBlock()

    def get_api_representation(self, value, context=None):
        return {"html": expand_db_html(value["html"].source)}


class HeadingBlock(blocks.StructBlock):
    level = blocks.IntegerBlock(min_value=2, max_value=3)
    text = blocks.CharBlock(max_length=300)

    def get_api_representation(self, value, context=None):
        return {"level": int(value["level"]), "text": value["text"]}


class LedeBlock(blocks.StructBlock):
    html = blocks.RichTextBlock()

    def get_api_representation(self, value, context=None):
        return {"html": expand_db_html(value["html"].source)}


class AsideBlock(blocks.StructBlock):
    variant = blocks.ChoiceBlock(choices=ASIDE_VARIANT_CHOICES, default="note")
    html = blocks.RichTextBlock()

    def get_api_representation(self, value, context=None):
        return {
            "variant": value["variant"],
            "html": expand_db_html(value["html"].source),
        }


class SidenoteBlock(blocks.StructBlock):
    number = blocks.IntegerBlock(min_value=1)
    html = blocks.RichTextBlock()

    def get_api_representation(self, value, context=None):
        return {
            "number": int(value["number"]),
            "html": expand_db_html(value["html"].source),
        }
