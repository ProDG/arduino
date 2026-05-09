from django.contrib.contenttypes.models import ContentType
from rest_framework.response import Response
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.serializers import PageSerializer
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.documents.api.v2.views import DocumentsAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet
from wagtail_headless_preview.models import PagePreview


class ContractPageSerializer(PageSerializer):
    """PageSerializer that omits the ``meta`` envelope from its output.

    Wagtail's default ``BaseSerializer.to_representation`` emits a ``meta``
    sub-object containing ``detail_url``, ``html_url``, ``locale``, etc. The
    on-disk mock fixtures have no ``meta`` key at all (every meta field is
    stripped from both sides by the contract-diff allowlist, but the empty
    parent ``meta: {}`` would still leak as a JSON shape difference). This
    serializer drops every meta-allowlisted field by emptying the
    ``meta_fields`` list before rendering.

    Top-level fields from ``api_fields`` (slug, type, publishedAt, etc.) are
    unaffected — those go through the core-fields branch.
    """

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop("meta", None)
        return data


class ContractPagesAPIViewSet(PagesAPIViewSet):
    """PagesAPIViewSet with `slug` and `type` hoisted out of the `meta` envelope
    AND the (now-empty-after-strip) `meta` envelope omitted entirely.

    Per D-DTO-02 and the on-disk mock fixtures, the FE TS contract expects
    `slug` and `type` at the top level of the page response, NOT inside `meta`.
    """

    meta_fields = [f for f in PagesAPIViewSet.meta_fields if f not in ("slug", "type")]
    base_serializer_class = ContractPageSerializer


class PagePreviewAPIViewSet(ContractPagesAPIViewSet):
    known_query_parameters = ContractPagesAPIViewSet.known_query_parameters.union(
        ["content_type", "token"]
    )

    def listing_view(self, request):
        self.action = "detail_view"
        return self.detail_view(request, 0)

    def detail_view(self, request, pk):
        page = self.get_object()
        serializer = self.get_serializer(page)
        return Response(serializer.data)

    def get_object(self):
        app_label, model = self.request.GET["content_type"].split(".")
        content_type = ContentType.objects.get(app_label=app_label, model=model.lower())
        page_preview = PagePreview.objects.get(
            content_type=content_type, token=self.request.GET["token"]
        )
        page = page_preview.as_page()
        if not page.pk:
            page.pk = 0
        return page


api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", ContractPagesAPIViewSet)
api_router.register_endpoint("images", ImagesAPIViewSet)
api_router.register_endpoint("documents", DocumentsAPIViewSet)
api_router.register_endpoint("page_preview", PagePreviewAPIViewSet)
