from wagtail import blocks

from .image import ImageChooserBlock


class PinBlock(blocks.StructBlock):
    # Pin coords are integers in the FE TS contract and on-disk fixtures
    # (pixel-space, not normalized). Mock fixtures emit `{"x": 8, "y": 7}`.
    x = blocks.IntegerBlock()
    y = blocks.IntegerBlock()
    label = blocks.CharBlock(max_length=120)
    role = blocks.CharBlock(max_length=120)

    def get_api_representation(self, value, context=None):
        return {
            "x": int(value["x"]),
            "y": int(value["y"]),
            "label": value["label"],
            "role": value.get("role") or "",
        }


class PinoutBlock(blocks.StructBlock):
    image = ImageChooserBlock(required=False)
    # Override fields for contract seed_fixtures (see FigureBlock for rationale).
    src_override = blocks.CharBlock(required=False, max_length=500)
    width_override = blocks.IntegerBlock(required=False)
    height_override = blocks.IntegerBlock(required=False)
    alt = blocks.CharBlock(max_length=300)
    pins = blocks.ListBlock(PinBlock(), default=[])

    def get_api_representation(self, value, context=None):
        src_override = value.get("src_override") or ""
        if src_override:
            return {
                "src": src_override,
                "alt": value["alt"],
                "pins": [PinBlock().get_api_representation(p) for p in value.get("pins", [])],
                "width": int(value["width_override"]) if value.get("width_override") else None,
                "height": int(value["height_override"]) if value.get("height_override") else None,
            }
        img = ImageChooserBlock().get_api_representation(value.get("image"))
        return {
            "src": img["src"] if img else None,
            "alt": value["alt"],
            "pins": [PinBlock().get_api_representation(p) for p in value.get("pins", [])],
            "width": img["width"] if img else None,
            "height": img["height"] if img else None,
        }
