from django.utils import timezone
from rest_framework import serializers


class IsoDateTimeField(serializers.Field):
    """Emit ISO-8601 in the project's local timezone (Europe/Kyiv).

    The on-disk mock fixtures bake timestamps with the ``+03:00`` offset; we
    convert UTC database timestamps to the configured ``TIME_ZONE`` so the
    contract diff is byte-equal.
    """

    def to_representation(self, value):
        if not value:
            return None
        local = timezone.localtime(value)
        return local.isoformat()
