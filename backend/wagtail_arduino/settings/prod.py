from .base import *  # noqa: F401,F403

DEBUG = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# --- Storage prod overrides: AWS_S3_ENDPOINT_URL becomes http://minio:9000 (Docker DNS).
# Driven by env var DJANGO_AWS_S3_ENDPOINT_URL in compose.prod.yml — no setting change here.
