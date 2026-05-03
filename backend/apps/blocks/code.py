from wagtail import blocks
from wagtail.rich_text import expand_db_html


LANGUAGE_CHOICES = [
    ("cpp", "C++"),
    ("arduino", "Arduino"),
    ("plaintext", "Plain text"),
    ("diff", "Diff"),
]


class CodeAnnotationBlock(blocks.StructBlock):
    line = blocks.IntegerBlock(min_value=1)
    # SPIKE RENAME (CONTRACT-02 sign-off): FE field name is `html`, NOT `note`.
    html = blocks.RichTextBlock()

    def get_api_representation(self, value, context=None):
        return {
            "line": int(value["line"]),
            "html": expand_db_html(value["html"].source),
        }


class CodeBlock(blocks.StructBlock):
    language = blocks.ChoiceBlock(choices=LANGUAGE_CHOICES, default="cpp")
    code = blocks.TextBlock()
    filename = blocks.CharBlock(max_length=200, required=False)
    showLineNumbers = blocks.BooleanBlock(required=False, default=False)
    highlightLines = blocks.CharBlock(
        required=False,
        default="",
        help_text="Comma-separated line numbers, e.g. '1,3,7'.",
    )
    diffMode = blocks.BooleanBlock(required=False, default=False)
    annotations = blocks.ListBlock(CodeAnnotationBlock(), default=[])

    # NOTE: `tokens` is intentionally NOT defined as a field. D-CONTRACT-04
    # defers the pre_save Shiki sidecar; tokens are stripped from both sides
    # of the contract diff allowlist.

    @staticmethod
    def _parse_highlight_lines(raw):
        if not raw:
            return []
        out = []
        for chunk in str(raw).split(","):
            s = chunk.strip()
            if not s:
                continue
            try:
                out.append(int(s))
            except ValueError:
                continue
        return out

    def get_api_representation(self, value, context=None):
        out = {
            "language": value["language"],
            "code": value["code"],
            "showLineNumbers": bool(value.get("showLineNumbers", False)),
            "highlightLines": self._parse_highlight_lines(value.get("highlightLines")),
            "diffMode": bool(value.get("diffMode", False)),
            "annotations": [
                CodeAnnotationBlock().get_api_representation(a)
                for a in value.get("annotations", [])
            ],
        }
        if value.get("filename"):
            out["filename"] = value["filename"]
        return out


class DiffBlock(blocks.StructBlock):
    before = blocks.TextBlock()
    after = blocks.TextBlock()

    def get_api_representation(self, value, context=None):
        return {
            "before": value["before"],
            "after": value["after"],
        }
