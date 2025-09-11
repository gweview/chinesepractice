from __future__ import annotations

import json
import os
import re
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request


BASE_DIR = Path(__file__).resolve().parent


def create_app() -> Flask:
    # Serve existing assets under public/ at root URLs like /css/... and /js/...
    app = Flask(
        __name__,
        static_folder=str(BASE_DIR / "public"),
        static_url_path="/static",  # avoid clobbering app routes like /api/chars
        template_folder=str(BASE_DIR / "templates"),
    )

    # App version (kept in sync with package.json if present)
    app.config["APP_VERSION"] = _read_package_version(default="1.1.0")

    # Cache of common chars after first load
    app.common_chars = None  # type: ignore[attr-defined]

    @app.get("/")
    def index():
        return render_template(
            "index.html",
            commonChars=[],  # kept for compatibility, currently unused in template
            version=app.config["APP_VERSION"],
        )

    @app.get("/api/chars")
    def api_chars():
        # Load once from JS data file and cache
        if app.common_chars is None:  # type: ignore[attr-defined]
            app.common_chars = _load_common_chars()
        return jsonify(app.common_chars)  # type: ignore[attr-defined]

    @app.post("/print")
    def print_page():
        data = request.get_json(silent=True) or {}
        selected = data.get("selectedChars")
        grid_size = data.get("gridSize", "medium")
        use_animals = bool(data.get("useAnimals", True))

        if not isinstance(selected, list) or len(selected) == 0:
            return ("缺少需要打印的汉字", 400)

        # Basic normalization: ensure items have expected keys
        normalized = []
        for item in selected:
            if not isinstance(item, dict):
                continue
            ch = item.get("char")
            lines = item.get("lines", 1)
            if isinstance(ch, str) and ch:
                normalized.append({"char": ch, "lines": int(lines) if isinstance(lines, int) else 1})

        if not normalized:
            return ("缺少需要打印的汉字", 400)

        return render_template(
            "print.html",
            selectedChars=normalized,
            gridSize=grid_size,
            useAnimals=use_animals,
            currentDate=datetime.now().strftime("%Y-%m-%d"),
        )

    @app.errorhandler(404)
    def not_found(_e):  # noqa: ANN001
        return ("Not Found", 404)

    @app.errorhandler(500)
    def server_error(_e):  # noqa: ANN001
        return ("Server Error", 500)

    return app


def _read_package_version(default: str = "0.0.0") -> str:
    pkg_path = BASE_DIR / "package.json"
    try:
        with pkg_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
            val = str(data.get("version", default))
            return val
    except Exception:
        return default


def _load_common_chars() -> list[str]:
    """
    Parse the existing JS array in data/common-chars.js into a Python list.
    We strip line comments, extract the top-level array, convert quotes, and json-load it.
    """
    js_file = BASE_DIR / "data" / "common-chars.js"
    if not js_file.exists():
        return []

    text = js_file.read_text(encoding="utf-8")

    # Remove line comments starting with //
    no_comments = re.sub(r"(^|\s)//.*$", "", text, flags=re.MULTILINE)

    # Find the first [...] array literal
    m = re.search(r"\[(.|\n|\r)*\]", no_comments)
    if not m:
        return []

    arr_literal = m.group(0)

    # Convert single quotes to double quotes safely for simple string items
    # This dataset contains only plain string literals; no nested quotes
    json_like = arr_literal.replace("'", '"')

    # Remove trailing commas (if any) before closing brackets
    json_like = re.sub(r",\s*\]", "]", json_like)

    try:
        return json.loads(json_like)
    except json.JSONDecodeError:
        # Fallback: be stricter — remove any remaining whitespace and try again
        try:
            compact = re.sub(r"\s+", " ", json_like)
            return json.loads(compact)
        except Exception:
            return []


app = create_app()


if __name__ == "__main__":
    # Keep dev parity with the Node server port
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)
