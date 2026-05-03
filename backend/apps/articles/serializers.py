from rest_framework import serializers


class IsoDateTimeField(serializers.Field):
    """Emit ISO-8601 with timezone, matching FE Date.toISOString() output."""

    def to_representation(self, value):
        return value.isoformat() if value else None
