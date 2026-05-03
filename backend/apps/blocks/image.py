from wagtail import blocks
from wagtail.images.blocks import ImageChooserBlock as BaseImageChooserBlock
from wagtail.rich_text import expand_db_html


class ImageChooserBlock(BaseImageChooserBlock):
    """ImageChooserBlock that emits {src, alt, width, height}.

    SPIKE RENAME (CONTRACT-02 sign-off): the FE Block contract names the URL
    field `src` (renamed from the prior placeholder name during the P3 spike).
    This subclass replaces Wagtail's default integer-id representation with a
    flat {src, alt, width, height} payload
    matching figure / pinout / schematicImage block shapes. Default rendition
    is width-1600 per D-MINIO-02.
    """

    def get_api_representation(self, value, context=None):
        if value is None:
            return None
        rendition = value.get_rendition("width-1600")
        return {
            "src": rendition.url,
            "alt": value.default_alt_text or "",
            "width": rendition.width,
            "height": rendition.height,
        }


class FigureBlock(blocks.StructBlock):
    image = ImageChooserBlock()
    captionHtml = blocks.RichTextBlock(required=False)
    number = blocks.IntegerBlock(required=False)
    fullBleed = blocks.BooleanBlock(required=False, default=False)

    def get_api_representation(self, value, context=None):
        img = ImageChooserBlock().get_api_representation(value["image"])
        out = {
            "src": img["src"] if img else None,
            "alt": img["alt"] if img else "",
            "width": img["width"] if img else None,
            "height": img["height"] if img else None,
            "fullBleed": bool(value.get("fullBleed", False)),
        }
        if value.get("captionHtml"):
            out["captionHtml"] = expand_db_html(value["captionHtml"].source)
        if value.get("number") is not None:
            out["number"] = int(value["number"])
        return out
