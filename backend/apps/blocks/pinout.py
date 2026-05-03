from wagtail import blocks

from .image import ImageChooserBlock


class PinBlock(blocks.StructBlock):
    x = blocks.FloatBlock(min_value=0.0, max_value=1.0)
    y = blocks.FloatBlock(min_value=0.0, max_value=1.0)
    label = blocks.CharBlock(max_length=120)
    role = blocks.CharBlock(max_length=120)

    def get_api_representation(self, value, context=None):
        return {
            "x": float(value["x"]),
            "y": float(value["y"]),
            "label": value["label"],
            "role": value.get("role") or "",
        }


class PinoutBlock(blocks.StructBlock):
    image = ImageChooserBlock()
    alt = blocks.CharBlock(max_length=300)
    pins = blocks.ListBlock(PinBlock(), default=[])

    def get_api_representation(self, value, context=None):
        img = ImageChooserBlock().get_api_representation(value["image"])
        return {
            "src": img["src"] if img else None,
            "alt": value["alt"],
            "width": img["width"] if img else None,
            "height": img["height"] if img else None,
            "pins": [PinBlock().get_api_representation(p) for p in value.get("pins", [])],
        }
