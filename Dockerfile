FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=3000

WORKDIR /app

# System deps (optional minimal fonts for rendering CJK nicely in some environments)
RUN apt-get update && apt-get install -y --no-install-recommends \
        fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install -r requirements.txt && pip install gunicorn

COPY . .

EXPOSE 3000
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]

