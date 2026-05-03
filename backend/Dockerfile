# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM python:3.13-slim AS builder

# Pin uv to a specific version for reproducibility
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /app

# Cache deps layer: copy lock + project metadata first, sync without project,
# then copy source and sync again to install the project itself.
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ---------- dev (separate target, includes dev group) ----------
FROM builder AS dev

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ---------- prod runtime ----------
FROM python:3.13-slim AS prod

# system deps for psycopg + pillow runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpq5 libjpeg62-turbo libpng16-16 \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled venv only — no uv binary in runtime
COPY --from=builder /opt/venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=wagtail_arduino.settings.prod

WORKDIR /app
COPY . .

EXPOSE 8000
CMD ["gunicorn", "wagtail_arduino.wsgi:application", \
     "--bind=0.0.0.0:8000", "--workers=3", "--timeout=60", "--access-logfile=-"]
