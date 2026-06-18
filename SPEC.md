# Event Graph Playground — Design Specification

## 1. Overview

A web-based tool for visualizing and manually annotating event graphs in text. Built for researchers working on event extraction, event coreference, subevent detection, and temporal ordering.

**Core dual-mode design:**
- **View Mode**: See annotated events highlighted in text + event relation graph
- **Annotate Mode**: Create/edit events and relations, with real-time validation

## 2. Input Format

```json
{
  "text": "string (raw article text)",
  "events": {
    "<event_id>": ["trigger_text", [start_char, end_char], "event_type"],
    ...
  },
  "relations": {
    "<rel_id>": [["source_event_id", "target_event_id"], "relation_type", "source_text", "target_text"],
    ...
  }
}
```

### Event Types
| Type | Color | Description |
|------|-------|-------------|
| Occurrence | 🟠 orange | Event that happens (storm, died, grounded...) |
| I_Action | 🔵 blue | Intentional action (brought, forcing, creating...) |
| StateChange | 🟢 green | State transition (expanding...) |
| Reporting | 🟣 purple | Speech/reporting act (said, reported, warned...) |
| HalfGeneric | ⚪ gray | Semi-generic event reference (delays, jams...) |

### Relation Types
| Type | Arrow | Description |
|------|-------|-------------|
| SuperSub | A → B (solid) | A is super-event of B (B is sub-event of A) |
| SubSuper | A → B (dashed) | A is sub-event of B (B is super-event of A) |
| Coref | A ↔ B (dotted) | A and B refer to the same event |

## 3. UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Title | Mode Toggle | Lang Toggle | File   │
├──────────────────────────┬──────────────────────────┤
│                          │                          │
│   Text Panel (60%)       │   Graph Panel (40%)      │
│                          │                          │
│   - Raw text with        │   - Cytoscape.js graph   │
│     inline highlights    │   - Nodes = events       │
│   - Click to select      │   - Edges = relations    │
│   - Color by event type  │   - Drag to rearrange    │
│   - Tooltip shows:       │   - Click node → select  │
│     id, type, relations  │   - Zoom/pan             │
│                          │                          │
├──────────────────────────┴──────────────────────────┤
│  Bottom Panel: Selected Event/Relation Details      │
│  - Edit fields | Delete button | Validation errors  │
└─────────────────────────────────────────────────────┘
```

### Annotation Mode additions:
- In text panel: select text range → create new event dialog
- Between events: Ctrl+click two events → create relation dialog
- Drag from one highlighted span to another to create relation arrow
- Event/relation list on sidebar for bulk management

## 4. Visual Design

### Text Highlighting
- Each event trigger is highlighted with its type color (background)
- Event type shown as a small label/badge on hover
- Multiple overlapping events use layered underlines
- Selected event gets a glowing border effect

### Graph Visualization (Cytoscape.js)
- **Node shape**: rounded rectangle
- **Node color**: by event type (matching highlight colors)
- **Node label**: trigger text (truncated to 30 chars)
- **Edge style**:
  - SuperSub: solid line, arrow at target, "super→sub" label
  - SubSuper: dashed line, arrow at target, "sub→super" label
  - Coref: dotted line, bidirectional arrows (or no arrows), "=" label
- **Edge color**: darker shade of relation type
- **Layout**: dagre (hierarchical) or cose-bilkent (force-directed)
- Zoom to fit on load

### Responsive
- Desktop-first but usable on tablet
- Graph panel collapses to bottom on narrow screens

## 5. Annotation Features

### Creating Events
1. Switch to Annotate Mode
2. Select text range in the text panel
3. Dialog pops up: choose event type from dropdown
4. Event ID auto-assigned, trigger textauto-filled
5. Click "Add" → appears as highlight + graph node

### Creating Relations
1. In Annotate Mode, click source event (highlight or graph node)
2. Click target event
3. Dialog pops up: choose relation type
4. Click "Add" → edge appears in graph

### Editing
- Click any event/relation → bottom panel shows details
- Edit fields inline, changes reflected immediately
- Delete button with confirmation

### File Operations
- **Open**: Load JSON file (drag-drop or file picker)
- **Save**: Download current state as JSON
- **New**: Clear all, start fresh
- **Export PNG**: Export graph visualization as image

## 6. Validation Algorithm

The backend (Python FastAPI) provides a validation endpoint that checks for logical consistency errors.

### 6.1 Duplicate Detection
- Events with overlapping character spans [start, end]
- Events with identical trigger text in same span
- Relations with same source, target, and type

### 6.2 Cycle Detection (SuperSub/SubSuper)
- Build directed graph of SuperSub + SubSuper relations
- DFS-based cycle detection
- If A →(super/sub)→ B and B →(super/sub)→ ... → A, it's a cycle
- This catches: A > B > C > A (hierarchy loop)
- Also catches: A > B and B > A (contradiction)

### 6.3 Contradiction Detection
- If relation(A, B, "SuperSub") exists AND relation(B, A, "SuperSub") exists → contradiction
- If relation(A, B, "SuperSub") exists AND relation(A, B, "SubSuper") exists → contradiction  
- If relation(A, B, "Coref") exists AND A=B (self-loop) → invalid coref
- If Coref(A, B) and Coref(A, C) but SuperSub(B, C) or SuperSub(C, B) → inconsistent coref chain

### 6.4 Transitive Consistency (Warning)
- If SuperSub(A, B) and SuperSub(B, C), but SuperSub(A, C) is NOT present → warning
- If SuperSub(A, B) and SubSuper(C, B) → possible duplicate super-event for B → warning

### 6.5 API Endpoint
```
POST /api/validate
Body: { "events": {...}, "relations": {...} }
Response: {
  "valid": bool,
  "errors": [{ "type": "cycle|duplicate|contradiction", "message": "...", "details": {...} }],
  "warnings": [{ "type": "transitive|missing", "message": "...", "details": {...} }],
  "stats": { "event_count": 43, "relation_count": 100, ... }
}
```

## 7. i18n (English / Chinese)

All UI strings in a JSON dictionary. Language toggle in header.

```json
{
  "en": { "title": "Event Graph Playground", "mode.view": "View", ... },
  "zh": { "title": "事件图谱工作台", "mode.view": "查看", ... }
}
```

## 8. Technical Stack

- **Frontend**: Single HTML file with vanilla JS modules (ES modules or inline)
  - Cytoscape.js (CDN) for graph visualization
  - dagre.js (CDN) for hierarchical layout
  - No build step, no npm, just open in browser
- **Backend**: Python FastAPI
  - Single file: `server.py`
  - Validation algorithm in `validator.py`
  - Run with `uv run` or `python server.py`
- **File serving**: FastAPI serves the frontend static files

## 9. Project Structure

```
event-graph-playground/
├── SPEC.md              # This file
├── server.py            # FastAPI server
├── validator.py         # Validation logic
├── requirements.txt     # Python deps (fastapi, uvicorn)
├── static/
│   ├── index.html       # Single-page app
│   ├── app.js           # Main application logic
│   ├── i18n.js           # Language strings
│   └── style.css         # Styling
└── README.md
```

## 10. Implementation Priority

1. **Phase 1 — Core Viewer**: Text highlighting + graph visualization + file loading
2. **Phase 2 — Annotation**: Event creation, relation creation, in-place editing
3. **Phase 3 — Validation**: Backend validation + frontend integration
4. **Phase 4 — Polish**: i18n, export, responsive design

## 11. Key Implementation Notes

- Events with the same trigger text appearing multiple times need distinct visual identifiers
- When a text span overlaps with another, use layered underlines or stacked highlights
- Graph should auto-update when events/relations are modified in the text panel
- The validation should run on-demand (button press) AND on every change in annotate mode (debounced)
- Empty state: show sample text prompt, friendly "load a file or start annotating" message
- The first load should work with the sample storm article data
