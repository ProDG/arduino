from rest_framework import serializers


class ConstantField(serializers.Field):
    """Emit a fixed string constant regardless of model state.

    Used to surface the FE-contract ``type`` discriminator at the top level of
    each page (``"lesson"``, ``"article"``, ``"datasheet"``, ``"schematic"``)
    so Wagtail's emitted JSON matches the on-disk mock fixtures byte-equal.
    """

    def __init__(self, constant: str, **kwargs):
        self._constant = constant
        kwargs.setdefault("read_only", True)
        kwargs.setdefault("source", "*")
        super().__init__(**kwargs)

    def to_representation(self, value):  # noqa: ARG002
        return self._constant


class FlatStreamField(serializers.Field):
    """Serialize a Wagtail StreamField as a flat list of block dicts.

    Wagtail's default StreamField serializer emits ``[{type, value, id}, ...]``
    per child block; the FE TS contract (locked in P2/P3) and the on-disk mock
    fixtures (``src/assets/mock-data/**/*.json``) instead use the flat shape
    ``[{type, ...value}, ...]`` with no per-block ``id``. This serializer calls
    each child block's ``get_api_representation`` (which already returns a flat
    dict matching the FE shape) and merges the ``type`` key in.
    """

    def to_representation(self, value):
        if value is None:
            return []
        return [
            {
                "type": child.block.name,
                **(child.block.get_api_representation(child.value, self.context) or {}),
            }
            for child in value
        ]


class SingleBlockField(serializers.Field):
    """Serialize a single-element (min=1, max=1) StreamField as one flat dict.

    Used for ``Lesson.partsList``, ``Schematic.schematicImage``, and
    ``Datasheet.pinout`` where the FE TS contract types each as a single Block
    object (not an array). On-disk mock fixtures match.

    ``type_override`` translates Wagtail's snake_case block name to the
    FE-contract dashed form (e.g. ``parts_list`` → ``parts-list``); Wagtail
    rejects dashes in block names (wagtailcore.E001).
    """

    def __init__(self, type_override: str | None = None, **kwargs):
        self._type_override = type_override
        super().__init__(**kwargs)

    def to_representation(self, value):
        if value is None:
            return None
        children = list(value)
        if not children:
            return None
        child = children[0]
        rep = child.block.get_api_representation(child.value, self.context) or {}
        return {"type": self._type_override or child.block.name, **rep}


class LessonBodyField(serializers.Field):
    """Emit Lesson.lede + Lesson.body as a single flat block array.

    The FE TS contract (``Lesson.body: Block[]``) and on-disk mock fixtures
    treat ``lede`` as the first body block; the Wagtail backing model keeps
    ``lede`` in a separate ``min=0,max=1`` StreamField so the editor admin
    surfaces a dedicated lede slot. This serializer reconciles the wire shape
    by prepending the lede's children to the body's children.
    """

    def __init__(self, **kwargs):
        kwargs.setdefault("source", "*")
        super().__init__(**kwargs)

    def to_representation(self, instance):
        out: list[dict] = []
        for stream in (instance.lede, instance.body):
            if stream is None:
                continue
            for child in stream:
                rep = child.block.get_api_representation(child.value, self.context) or {}
                out.append({"type": child.block.name, **rep})
        return out


class FlatListField(serializers.Field):
    """Serialize a StreamField of one block kind as a flat list omitting the type tag.

    Used for ``Datasheet.specifications`` where the FE TS contract types it as
    ``{label, value}[]`` (no ``type`` key per element). The mocks emit this
    shape directly. The Wagtail ``("spec", SpecBlock())`` StreamField provides
    a single-block-type backing; this serializer emits each element's
    ``get_api_representation`` payload without the ``type`` envelope.
    """

    def to_representation(self, value):
        if value is None:
            return []
        return [
            child.block.get_api_representation(child.value, self.context) or {} for child in value
        ]
