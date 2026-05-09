import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = False  # overridden in dev.py
ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()
]
CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
]

INSTALLED_APPS = [
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail",
    "modelcluster",
    "taggit",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "wagtail_headless_preview",
    "apps.blocks",
    "apps.lessons",
    "apps.articles",
    "apps.datasheets",
    "apps.schematics",
    "apps.contract",
]

MIDDLEWARE = [
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

ROOT_URLCONF = "wagtail_arduino.urls"
WSGI_APPLICATION = "wagtail_arduino.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["POSTGRES_DB"],
        "USER": os.environ["POSTGRES_USER"],
        "PASSWORD": os.environ["POSTGRES_PASSWORD"],
        "HOST": os.environ.get("POSTGRES_HOST", "postgres"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

# --- Locale lock (D-SEC-04, UKR-01/04/05) ---
LANGUAGE_CODE = "uk"
TIME_ZONE = "Europe/Kyiv"
USE_I18N = True
USE_TZ = True
WAGTAIL_CONTENT_LANGUAGES = [("uk", "Українська")]
WAGTAIL_I18N_ENABLED = False

STATIC_URL = "/django-static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

WAGTAIL_SITE_NAME = "Arduino UA"
WAGTAILADMIN_BASE_URL = os.environ.get("WAGTAIL_BASE_URL", "http://arduino.localhost")
WAGTAIL_BASE_URL = os.environ.get("WAGTAIL_BASE_URL", "http://arduino.localhost")
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Storage: django-storages[s3] against MinIO (D-MINIO-01..05, WAGTAIL-09) ---
STORAGES = {
    "default": {
        "BACKEND": "wagtail_arduino.storage.MediaS3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

AWS_S3_ENDPOINT_URL = os.environ["DJANGO_AWS_S3_ENDPOINT_URL"]
AWS_STORAGE_BUCKET_NAME = os.environ["DJANGO_AWS_STORAGE_BUCKET_NAME"]
AWS_ACCESS_KEY_ID = os.environ["DJANGO_AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["DJANGO_AWS_SECRET_ACCESS_KEY"]
AWS_S3_REGION_NAME = "us-east-1"  # MinIO placeholder
AWS_S3_ADDRESSING_STYLE = "path"  # MinIO requires path-style (Pitfall 2)
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None  # MinIO uses bucket policies, not ACLs
AWS_QUERYSTRING_AUTH = False  # unsigned URLs; bucket policy gates per-prefix

# Wagtail rendition specs (D-MINIO-02): width-800, width-1600, width-3200.
# Registered implicitly via Wagtail's image template tags / get_rendition('width-XXX');
# no explicit Django setting needed for the spec strings themselves. Default rendition
# for FE-emitted `src` is `width-1600` (set by ImageChooserBlock.get_api_representation
# in Plan 03).

# Wagtail Image storage uploads to <bucket>/originals/; renditions go to <bucket>/images/.
# These prefixes are conventional Wagtail behavior when using a single S3 backend; the
# default-storage-with-prefix-policy pattern (D-MINIO-01) handles the public/private split.

# --- Headless preview (D-PREVIEW-01..04, WAGTAIL-05) ---
# Pitfall 1: only the namespaced WAGTAIL_HEADLESS_PREVIEW dict is supported in 0.8.x.
WAGTAIL_HEADLESS_PREVIEW = {
    "CLIENT_URLS": {
        "default": os.environ.get("WAGTAIL_BASE_URL", "http://arduino.localhost"),
    },
    "SERVE_BASE_URL": None,
    "REDIRECT_ON_PREVIEW": True,
    "ENFORCE_TRAILING_SLASH": True,
}
