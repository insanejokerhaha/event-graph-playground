"""
Event Graph Playground — FastAPI server.

Serves static frontend files and provides API endpoints:
- /api/validate   — consistency checks
- /api/samples    — list sample files
- /api/browse     — list JSON files in a directory path
- /api/read-file  — read a JSON file from disk
- /api/upload     — upload JSON file(s) to data/ directory
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI, Query, UploadFile, File
from starlette.requests import Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional, List

from validator import validate

app = FastAPI(title="Event Graph Playground")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_no_cache(request: Request, call_next):
    response = await call_next(request)
    # ponytail: kill caching globally so static files always serve fresh
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

BASE_DIR = Path(__file__).parent
SAMPLES_DIR = BASE_DIR / "samples"
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"

# Ensure directories exist
SAMPLES_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)


class ValidateRequest(BaseModel):
    text: str = ""
    events: dict[str, list]
    relations: dict[str, list]


class SaveRequest(BaseModel):
    path: str
    data: dict[str, Any]


@app.post("/api/validate")
def validate_endpoint(body: ValidateRequest) -> dict[str, Any]:
    return validate(body.text, body.events, body.relations)


@app.get("/api/samples")
def list_samples() -> list[dict[str, Any]]:
    """List all sample JSON files in the samples/ directory."""
    samples = []
    if SAMPLES_DIR.exists():
        for f in sorted(SAMPLES_DIR.iterdir()):
            if f.suffix.lower() == ".json":
                samples.append({
                    "name": f.name,
                    "path": str(f.relative_to(BASE_DIR)),
                    "size": f.stat().st_size,
                })
    return samples


@app.get("/api/browse")
def browse_directory(directory: str = Query(default="")) -> list[dict[str, Any]]:
    """
    Browse a directory for JSON files. Returns subdirectories + JSON files.
    If directory is empty, returns list of root-level accessible dirs.
    """
    import os as _os

    target = BASE_DIR
    dir_path = directory.strip()

    # Security: prevent path traversal
    if dir_path:
        safe = _os.path.normpath(dir_path)
        if safe.startswith("..") or safe.startswith("/"):
            return []
        resolved = (BASE_DIR / safe).resolve()
        if not str(resolved).startswith(str(BASE_DIR.resolve())):
            return []
        target = resolved

    if not target.exists() or not target.is_dir():
        return []

    results = []
    try:
        items = sorted(target.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
        for item in items:
            if item.name.startswith("."):
                continue
            if item.name == "__pycache__":
                continue
            if item.is_dir():
                # At root, only show samples/ and data/
                if not dir_path and item.name not in ("samples", "data"):
                    continue
                results.append({
                    "name": item.name,
                    "type": "directory",
                    "path": str(item.relative_to(BASE_DIR)),
                })
            elif item.suffix.lower() == ".json":
                results.append({
                    "name": item.name,
                    "type": "file",
                    "path": str(item.relative_to(BASE_DIR)),
                    "size": item.stat().st_size,
                })
    except (PermissionError, OSError):
        pass

    return results


@app.get("/api/read-file")
def read_file(path: str = Query(...)) -> dict[str, Any]:
    """Read a JSON file from disk and return its contents."""
    import os as _os

    safe = _os.path.normpath(path)
    if safe.startswith("..") or safe.startswith("/"):
        return {"error": "Invalid path"}

    resolved = (BASE_DIR / safe).resolve()
    if not str(resolved).startswith(str(BASE_DIR.resolve())):
        return {"error": "Path traversal detected"}

    if not resolved.exists():
        return {"error": "File not found"}

    try:
        with open(resolved, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {"path": str(resolved.relative_to(BASE_DIR)), "data": data}
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON: {e.msg}"}
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/upload")
async def upload_files(files: list[UploadFile] = File(...)) -> dict[str, Any]:
    """Upload one or more JSON files to the data/ directory."""
    saved = []
    errors = []
    for file in files:
        safe_name = os.path.normpath(file.filename or "untitled.json")
        if safe_name.startswith("..") or safe_name.startswith("/"):
            errors.append({"filename": file.filename, "error": "Invalid filename"})
            continue

        filepath = DATA_DIR / safe_name
        if not str(filepath.resolve()).startswith(str(DATA_DIR.resolve())):
            errors.append({"filename": file.filename, "error": "Path traversal detected"})
            continue

        try:
            content = await file.read()
            json.loads(content)  # validate JSON
            filepath.parent.mkdir(parents=True, exist_ok=True)
            with open(filepath, "wb") as f:
                f.write(content)
            saved.append({"name": safe_name, "path": str(filepath.relative_to(BASE_DIR))})
        except json.JSONDecodeError:
            errors.append({"filename": file.filename, "error": "Invalid JSON"})
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})

    return {"ok": len(errors) == 0, "saved": saved, "errors": errors}


@app.post("/api/save")
def save_file(body: SaveRequest) -> dict[str, Any]:
    """Save annotations back to a file on disk."""
    import os as _os

    safe = _os.path.normpath(body.path)
    if safe.startswith("..") or safe.startswith("/"):
        return {"ok": False, "error": "Invalid path"}

    resolved = (BASE_DIR / safe).resolve()
    if not str(resolved).startswith(str(BASE_DIR.resolve())):
        return {"ok": False, "error": "Path traversal detected"}

    try:
        resolved.parent.mkdir(parents=True, exist_ok=True)
        with open(resolved, "w", encoding="utf-8") as f:
            json.dump(body.data, f, ensure_ascii=False, indent=2)
        return {"ok": True, "path": str(resolved.relative_to(BASE_DIR))}
    except Exception as e:
        return {"ok": False, "error": str(e)}


class MkdirRequest(BaseModel):
    path: str


@app.post("/api/mkdir")
def mkdir_endpoint(body: MkdirRequest) -> dict[str, Any]:
    """Create a new directory (relative to BASE_DIR)."""
    import os as _os

    safe = _os.path.normpath(body.path)
    if safe.startswith("..") or safe.startswith("/"):
        return {"ok": False, "error": "Invalid path"}
    resolved = (BASE_DIR / safe).resolve()
    if not str(resolved).startswith(str(BASE_DIR.resolve())):
        return {"ok": False, "error": "Path traversal detected"}
    try:
        resolved.mkdir(parents=True, exist_ok=True)
        return {"ok": True, "path": str(resolved.relative_to(BASE_DIR))}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _safe_path(path: str) -> Path | None:
    """Resolve a relative path under BASE_DIR with traversal protection."""
    safe = os.path.normpath(path)
    if safe.startswith("..") or safe.startswith("/"):
        return None
    resolved = (BASE_DIR / safe).resolve()
    if not str(resolved).startswith(str(BASE_DIR.resolve())):
        return None
    return resolved


def _compute_file_stats(data: dict) -> dict:
    """Compute stats for a single event graph file."""
    events = data.get("events", {}) or {}
    relations = data.get("relations", {}) or {}
    n_events = len(events)
    n_relations = len(relations)

    type_counts: dict[str, int] = {}
    for ev in events.values():
        typ = ev[2] if len(ev) > 2 else "Unknown"
        type_counts[typ] = type_counts.get(typ, 0) + 1

    rel_type_counts: dict[str, int] = {}
    for rel in relations.values():
        rtype = rel[1] if len(rel) > 1 else "Unknown"
        rel_type_counts[rtype] = rel_type_counts.get(rtype, 0) + 1

    adj: dict[str, set[str]] = {}
    for eid in events:
        adj.setdefault(eid, set())
    for rel in relations.values():
        pair = rel[0] if len(rel) > 0 else []
        if len(pair) == 2:
            s, t = str(pair[0]), str(pair[1])
            adj.setdefault(s, set()).add(t)
            adj.setdefault(t, set()).add(s)

    visited: set[str] = set()
    components: list[set[str]] = []
    for eid in adj:
        if eid in visited:
            continue
        stack = [eid]
        comp: set[str] = set()
        while stack:
            v = stack.pop()
            if v in visited:
                continue
            visited.add(v)
            comp.add(v)
            stack.extend(adj.get(v, set()) - visited)
        components.append(comp)

    standalone = sum(1 for c in components if len(c) == 1)
    big_graphs = sum(1 for c in components if len(c) >= 5)
    coref_count = sum(1 for rel in relations.values() if len(rel) > 1 and rel[1] == "Coref")

    return {
        "events": n_events,
        "relations": n_relations,
        "type_counts": type_counts,
        "rel_type_counts": rel_type_counts,
        "standalone_events": standalone,
        "coref_relations": coref_count,
        "graphs_ge5": big_graphs,
        "components": len(components),
    }


@app.get("/api/stats")
def directory_stats(directory: str = Query(default="samples")) -> dict[str, Any]:
    """Compute aggregate stats over all JSON files in a directory."""
    resolved = _safe_path(directory)
    if not resolved or not resolved.is_dir():
        return {"ok": False, "error": "Invalid directory"}

    files = sorted(resolved.glob("*.json"))
    totals: dict = {
        "events": 0, "relations": 0, "standalone_events": 0, "coref_relations": 0,
        "graphs_ge5": 0, "components": 0, "files": 0,
    }
    type_counts: dict[str, int] = {}
    rel_type_counts: dict[str, int] = {}
    failures: list[dict] = []

    for f in files:
        try:
            data = json.loads(f.read_text("utf-8"))
            s = _compute_file_stats(data)
            totals["events"] += s["events"]
            totals["relations"] += s["relations"]
            totals["standalone_events"] += s["standalone_events"]
            totals["coref_relations"] += s["coref_relations"]
            totals["graphs_ge5"] += s["graphs_ge5"]
            totals["components"] += s["components"]
            totals["files"] += 1
            for k, v in s["type_counts"].items():
                type_counts[k] = type_counts.get(k, 0) + v
            for k, v in s["rel_type_counts"].items():
                rel_type_counts[k] = rel_type_counts.get(k, 0) + v
        except Exception as e:
            failures.append({"file": f.name, "error": str(e)})

    totals["type_counts"] = type_counts
    totals["rel_type_counts"] = rel_type_counts

    return {"ok": True, "totals": totals, "failures": failures, "directory": directory}


if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
