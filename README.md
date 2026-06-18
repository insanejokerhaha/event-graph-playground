# Event Graph Playground

Visualize & annotate event graphs in text. A single-page web app with FastAPI backend.

## Quick Start

```bash
pip install -r requirements.txt
python server.py
```

Open http://localhost:8765

## Features

- **Dual-mode UI:** View mode for exploring annotated events, Annotate mode for creating/editing
- **Text highlighting** — events highlighted inline with type-based color coding
- **Graph visualization** — Cytoscape.js with force-directed and hierarchical layouts
- **Annotation tools** — select text to create events, click two events to link with relations
- **Validation** — consistency checks (span matching, cycle detection, duplicates, contradictions)
- **File browser** — browse directories, open/save JSON files on server
- **Directory stats** — aggregate statistics over all JSON files in a directory
- **Session persistence** — work survives page refresh (localStorage)
- **i18n** — English / Chinese language toggle

## Event Types

| Type | Color | Meaning |
|------|-------|---------|
| Occurrence | Orange | Something that happened |
| I_Action | Blue | Intentional action |
| StateChange | Green | State transition |
| Reporting | Purple | Speech/report act |
| HalfGeneric | Gray | Generic reference |

## Relation Types

| Type | Style | Meaning |
|------|-------|---------|
| SuperSub | Solid → | Super-event / sub-event |
| SubSuper | Dashed ⇢ | Sub-event / super-event |
| Coref | Dotted ↔ | Coreference (same event) |

## JSON Format

```json
{
  "text": "Article text...",
  "events": {
    "1": ["trigger", [start_char, end_char], "EventType"]
  },
  "relations": {
    "1": [["source_id", "target_id"], "RelationType", "src_text", "tgt_text"]
  }
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/validate` | POST | Consistency checks |
| `/api/browse` | GET | List JSON files in directory |
| `/api/read-file` | GET | Read JSON file from disk |
| `/api/save` | POST | Save JSON to disk |
| `/api/upload` | POST | Upload JSON files |
| `/api/stats` | GET | Aggregate stats over directory |
| `/api/mkdir` | POST | Create directory |

## Project Structure

```
event-graph-playground/
├── server.py          FastAPI backend
├── validator.py       Validation logic
├── requirements.txt   Python deps
├── samples/           Sample annotated JSON files
├── data/              Uploaded/saved files
└── static/
    ├── index.html     Frontend
    ├── app.js         App logic
    ├── style.css      Styles
    ├── i18n.js        English/Chinese strings
    └── *.min.js       Cytoscape.js + layouts
```