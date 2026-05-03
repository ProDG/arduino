from wagtail import blocks


class PartItemBlock(blocks.StructBlock):
    name = blocks.CharBlock(max_length=300)
    quantity = blocks.IntegerBlock(min_value=1)
    note = blocks.CharBlock(max_length=400, required=False)

    def get_api_representation(self, value, context=None):
        out = {"name": value["name"], "quantity": int(value["quantity"])}
        if value.get("note"):
            out["note"] = value["note"]
        return out


class PartsListBlock(blocks.StructBlock):
    items = blocks.ListBlock(PartItemBlock(), default=[])

    def get_api_representation(self, value, context=None):
        return {
            "items": [
                PartItemBlock().get_api_representation(it)
                for it in value.get("items", [])
            ],
        }


class SpecBlock(blocks.StructBlock):
    label = blocks.CharBlock(max_length=200)
    value = blocks.CharBlock(max_length=400)

    def get_api_representation(self, value, context=None):
        return {"label": value["label"], "value": value["value"]}
