# MEMORY — Development Status

## Completed (all SPEC phases implemented)

### Phase 1 — Core Viewer ✓
- Text panel with inline color-coded highlights per event type
- Character-level segmentation for proper overlapping-span rendering
- Event type badges shown via CSS `::before` on hover (keeps DOM text clean for offset accuracy)
- Graph panel powered by Cytoscape.js (vendored locally)
- Two layouts: dagre (hierarchical) and cose-bilkent (force-directed), toggle button in graph header
- Nodes colored by event type, edges styled per relation type (solid/dashed/dotted)
- Layout toggle button in graph panel header
- Legend overlay in graph panel (event type colors + relation arrow styles)
- File browser: root shows `samples/` and `data/` directories
- 4 sample articles: storm_japan, bank_robbery, earthquake_italy, empty_template

### Phase 2 — Annotation ✓
- **View/Annotate mode toggle** in header
- Text selection → new event dialog (tree-walker based offset calculation)
- Click source + click target → new relation dialog (works from text highlights or graph nodes)
- Bottom panel: edit trigger text, event type, relation type inline; delete with confirm
- Sidebar (☰ button in header): Events, Relations, JSON tabs
  - Events: sorted by numeric ID, click to select, inline delete
  - Relations: resolves event IDs to trigger text with type badges, sort by numeric ID
  - JSON: raw formatted JSON view

### Phase 3 — Validation ✓
- Backend `POST /api/validate` with `text`, `events`, `relations` body
- **Errors**: overlapping spans, duplicate relations, bidirectional SuperSub contradiction, SuperSub+SubSuper on same pair, coref self-loop, coref+hierarchy conflict, cycle detection (SuperSub/SubSuper only via union-find DFS), trigger-spans match validation, out-of-bounds span check
- **Warnings**: missing transitive SuperSub edges, multiple super-events per event
- Removed: identical trigger text check (valid when spans differ)
- Frontend: Validate button, debounced auto-validation (800ms) in annotate mode
- Results: collapsible floating panel bottom-right with toggle button (`✓` / `⚠ N` / `⚡ N`), max 220px, scrollable

### Phase 4 — Polish ✓
- i18n: English / Chinese (button in header), all UI strings in i18n.js
- Download button (saves as JSON to local machine)
- Export PNG button (Cytoscape render)
- File operations: Load Sample, Open JSON (browse), Upload JSON, Upload Folder all go through `POST /api/upload` → files persisted to `data/` directory
- Drag-and-drop uploads to server
- File name display in header (blue monospace label)
- Responsive: vertical stack below 900px
- Debounced auto-validation in annotate mode

## Key Architectural Decisions

- **No build step**: All static files served directly, Cypher.js/dagre/cose-bilkent vendored locally (no CDN dependency)
- **Server**: Python FastAPI with `uv run server.py`, port 8765
- **File persistence**: Uploaded JSONs stored in `data/`, samples in `samples/`
- **Text rendering**: Character-level segmentation wraps each char position with correct event spans via data attributes, CSS-only badges
- **Selection offset**: TreeWalker-based text node traversal for accurate char offsets independent of DOM structure
- **Cycle detection**: Only SuperSub/SubSuper edges (not Coref), union-find for coref equivalence, DFS with 3-color marking on canonical graph
- **Coref contradiction**: Union-find computes transitive closure of Coref relations, then checks no SuperSub/SubSuper connects events in same equivalence class

## Project Structure

```
event-graph-playground/
├── SPEC.md
├── MEMORY.md                 # This file
├── README.md
├── server.py                 # FastAPI: serve + /api/{validate,samples,browse,read-file,upload}
├── validator.py              # Validation: span-match, duplicates, contradictions, cycles, transitivity
├── requirements.txt          # fastapi, uvicorn, python-multipart
├── samples/                  # Sample annotated articles
│   ├── storm_japan.json
│   ├── bank_robbery.json
│   ├── earthquake_italy.json
│   └── empty_template.json
├── data/                     # Uploaded files (gitignored)
├── static/
│   ├── index.html            # Single-page app
│   ├── app.js                # Main application logic (~1200 lines)
│   ├── i18n.js               # EN/ZH strings
│   ├── style.css             # Styling
│   ├── cytoscape.min.js      # Graph library (vendored)
│   ├── dagre.min.js          # Hierarchical layout (vendored)
│   ├── cytoscape-dagre.min.js # Cytoscape dagre extension (vendored)
│   └── cytoscape-cose-bilkent.min.js # Force layout (vendored)
└── .venv/                    # uv-managed virtualenv
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/validate` | POST | `{text, events, relations}` → validation results |
| `/api/samples` | GET | List sample JSON files |
| `/api/browse?directory=` | GET | Browse directory for JSON files (root: samples/, data/) |
| `/api/read-file?path=` | GET | Read a JSON file from disk |
| `/api/upload` | POST | Upload JSON file(s) → saved to data/ |

## Running

```bash
cd event-graph-playground && uv run server.py
# → http://localhost:8765
```

## Known Notes

- Server runs on `0.0.0.0:8765` — accessible on LAN
- `cose-bilkent` layout was missing from vendored cytoscape.min.js; added separately
- `onReady()` wrapper checks `document.readyState` because scripts load at end of body
- Sidebar uses event delegation on `.sidebar-tabs` (not inline onclick re-binding)
- Validation panel toggle: click `✓`/`⚠` button to expand, × to close
