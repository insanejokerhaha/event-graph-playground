/**
 * Event Graph Playground — main application logic.
 * v2: Full file browser, sample selection, folder upload, all buttons functional.
 */

// ── State ──
const state = {
  mode: "view",
  data: null,
  dataPath: null,
  dirty: false,
  selectedEventId: null,
  selectedRelationId: null,
  relationSource: null,
  cytoscape: null,
  graphLayout: "dagre",
  sidebarActiveTab: "events",
  currentFileName: null,
  validateTimer: null,
  valCollapseTimer: null,
  lastValidation: null,
  pendingFocusEvents: null,
  hideStandalone: true,
  // File browser state
  fbCurrentDir: "",
  fbMode: "samples", // "samples" | "browse"
};

const TYPE_COLORS = {
  Occurrence: "#db6d28",
  I_Action: "#58a6ff",
  StateChange: "#3fb950",
  Reporting: "#bc8cff",
  HalfGeneric: "#8b949e",
};

// ── Sample Data (fallback / client-side sample) ──
const SAMPLE_DATA = {
  "text": "A typhoon-strength storm brought travel chaos to Japan on Tuesday, as violent winds and rain killed one man and left tens of thousands of people stranded. Gusts of up to 150 kilometers per hour have been recorded in western Japan, with coastal areas likely seeing even stronger winds, Japan's weather agency said. With the agency warning of possible tornadoes in the western half of Japan, airlines grounded over 550 flights and a number of train services were suspended. An 81-year-old man died in central Toyama Prefecture when the wind blew over a shed, trapping him underneath, police said. Forecasters said an expanding low pressure system in the Sea of Japan (East Sea) was forcing a cold front over the country, where it was bringing heavy rains and strong winds. \"This is like the core of a typhoon, but it is staying for a long time, whereas a typhoon usually moves rather quickly,\" a spokesman for the Japan Meteorological Agency said. \"Winds as strong as this are very rare,\" he said. The meteorological agency said on its website the strong winds would move northwards into Wednesday, producing waves up to 10 meters high. The agency also warned heavy rain could trigger landslides and flooding. Japan Airlines canceled 230 domestic and seven Asia-bound flights, affecting 31,600 passengers. All Nippon Airways grounded 320 domestic flights, affecting 37,700 people. East Japan Railways canceled some commuter lines and a number of long-distance services. The nation's main bullet train, linking Tokyo and Osaka, was experiencing delays after a brief suspension, but was running as of early evening. At least 97 people suffered injuries across the country, knocked over by sudden gusts or hit by flying debris, national broadcaster NHK said. A number of trucks were toppled by the winds, creating localised traffic jams. NHK also reported a recently-constructed 10,000-ton tanker had run aground. Many companies sent employees home early. Canon told about 14,000 workers mostly in Tokyo to leave before the storm worsened. \"Most of them use public transportation to commute,\" said company spokesman Hirotomo Fujimori, adding the early finish was to allow staff to get home.",
  "events": {
    "1": ["storm", [19, 24], "Occurrence"],
    "2": ["brought", [25, 32], "I_Action"],
    "3": ["chaos", [40, 45], "Occurrence"],
    "4": ["killed", [93, 99], "Occurrence"],
    "5": ["Gusts", [155, 160], "Occurrence"],
    "6": ["recorded", [204, 212], "Occurrence"],
    "7": ["said", [308, 312], "Reporting"],
    "8": ["warning", [330, 337], "Occurrence"],
    "9": ["grounded", [399, 407], "Occurrence"],
    "10": ["suspended", [461, 470], "Occurrence"],
    "11": ["died", [491, 495], "Occurrence"],
    "12": ["blew", [539, 543], "Occurrence"],
    "13": ["trapping", [557, 565], "Occurrence"],
    "16": ["expanding", [615, 624], "StateChange"],
    "17": ["forcing", [680, 687], "I_Action"],
    "18": ["bringing", [732, 740], "I_Action"],
    "22": ["warned", [1303, 1309], "Occurrence"],
    "23": ["canceled", [1375, 1383], "Occurrence"],
    "26": ["delays", [1785, 1791], "HalfGeneric"],
    "27": ["suspension", [1806, 1816], "Occurrence"],
    "28": ["suffered", [1874, 1882], "I_Action"],
    "29": ["knocked", [1912, 1919], "Occurrence"],
    "30": ["hit", [1944, 1947], "Occurrence"],
    "32": ["toppled", [2021, 2028], "Occurrence"],
    "33": ["creating", [2043, 2051], "I_Action"],
    "34": ["jams", [2070, 2074], "HalfGeneric"],
    "35": ["reported", [2106, 2114], "Reporting"],
    "36": ["run", [2200, 2203], "Occurrence"],
    "37": ["sent", [2228, 2232], "Occurrence"],
    "38": ["told", [2261, 2265], "I_Action"],
    "39": ["storm", [2359, 2364], "Occurrence"],
    "40": ["storm", [2475, 2480], "Occurrence"],
    "41": ["said", [2549, 2553], "Reporting"],
    "42": ["adding", [2591, 2597], "Reporting"],
    "43": ["finish", [2608, 2614], "I_Action"],
  },
  "relations": {
    "0": [["1", "3"], "SuperSub", "storm", "chaos"],
    "1": [["1", "4"], "SuperSub", "storm", "killed"],
    "2": [["1", "5"], "SuperSub", "storm", "Gusts"],
    "3": [["1", "6"], "SuperSub", "storm", "recorded"],
    "4": [["1", "8"], "SuperSub", "storm", "warning"],
    "5": [["1", "9"], "SuperSub", "storm", "grounded"],
    "6": [["1", "10"], "SuperSub", "storm", "suspended"],
    "7": [["1", "11"], "SuperSub", "storm", "died"],
    "8": [["1", "12"], "SuperSub", "storm", "blew"],
    "9": [["1", "13"], "SuperSub", "storm", "trapping"],
    "10": [["1", "16"], "SuperSub", "storm", "expanding"],
    "11": [["1", "22"], "SuperSub", "storm", "warned"],
    "12": [["1", "23"], "SuperSub", "storm", "canceled"],
    "15": [["1", "26"], "SuperSub", "storm", "delays"],
    "16": [["1", "27"], "SuperSub", "storm", "suspension"],
    "17": [["1", "29"], "SuperSub", "storm", "knocked"],
    "18": [["1", "30"], "SuperSub", "storm", "hit"],
    "19": [["1", "32"], "SuperSub", "storm", "toppled"],
    "20": [["1", "34"], "SuperSub", "storm", "jams"],
    "21": [["1", "36"], "SuperSub", "storm", "run"],
    "22": [["1", "37"], "SuperSub", "storm", "sent"],
    "23": [["1", "39"], "Coref", "storm", "storm"],
    "24": [["1", "40"], "Coref", "storm", "storm"],
    "36": [["4", "11"], "Coref", "killed", "died"],
    "50": [["8", "22"], "SuperSub", "warning", "warned"],
  },
};

// ── Initialization ──
function onReady(fn) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
  else fn();
}
onReady(() => {
  initGraph();
  bindUI();
  const restored = loadSessionState();
  if (!restored) handleNew();
  syncHideStandaloneButton();
});

function bindUI() {
  document.getElementById("btnView").addEventListener("click", () => setMode("view"));
  document.getElementById("btnAnnotate").addEventListener("click", () => setMode("annotate"));

  // Dropdown menu toggle
  const btnMenu = document.getElementById("btnMenu");
  const menuDropdown = document.getElementById("menuDropdown");
  btnMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle("open");
  });
  document.addEventListener("click", () => menuDropdown.classList.remove("open"));

  // Sidebar toggle
  document.getElementById("btnSidebar").addEventListener("click", toggleSidebar);

  // File upload
  document.getElementById("fileInput").addEventListener("change", handleFileOpen);
  document.getElementById("folderInput").addEventListener("change", handleFolderUpload);
  document.getElementById("fbUploadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
  document.getElementById("fbFolderBtn").addEventListener("click", () => document.getElementById("folderInput").click());

  // Layout toggle
  document.getElementById("btnLayout").addEventListener("click", toggleLayout);

  // Text selection for event creation (annotate mode)
  document.getElementById("textContent").addEventListener("mouseup", onTextSelect);

  // Click / dblclick on text content for selecting events
  document.getElementById("textContent").addEventListener("click", onTextClick);
  document.getElementById("textContent").addEventListener("dblclick", onTextDblClick);

  // Click outside to deselect
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".event-highlight") && !e.target.closest("#textContent") && !e.target.closest("#cy") && !e.target.closest(".bottom-panel") && !e.target.closest(".dialog-overlay")) {
      selectEvent(null);
      selectRelation(null);
    }
  });

  // Close file browser on overlay click
  document.getElementById("fileBrowser").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFileBrowser();
  });

  initValResize();

  window.updateUI = () => {
    if (state.data) updateAll();
  };
}

// ── Mode Switching ──
function setMode(mode) {
  if (mode === "view" && !checkDirty()) return;
  state.mode = mode;
  document.getElementById("btnView").classList.toggle("active", mode === "view");
  document.getElementById("btnAnnotate").classList.toggle("active", mode === "annotate");
  document.body.classList.toggle("annotating", mode === "annotate");
  document.getElementById("annotateTools").style.display = mode === "annotate" ? "flex" : "none";
  const btn = document.getElementById("btnHideStandalone");
  if (btn) btn.style.display = mode === "view" ? "" : "none";
  if (mode === "view") syncHideStandaloneButton();
  if (mode === "view") {
    state.showSidebar = false;
    document.getElementById("sidebar").style.display = "none";
  }
  updateSaveButton();
  renderGraph();
}

function clearAllRelations() {
  const count = Object.keys(state.data.relations || {}).length;
  if (count === 0) { toast("No relations to clear"); return; }
  if (!confirm(`Delete all ${count} relations?`)) return;
  state.data.relations = {};
  markDirty();
  selectRelation(null);
  updateAll();
  toast(`Cleared ${count} relation(s)`);
}

function clearAllEvents() {
  const count = Object.keys(state.data.events || {}).length;
  if (count === 0) { toast("No events to clear"); return; }
  if (!confirm(`Delete all ${count} events AND their relations?`)) return;
  state.data.events = {};
  state.data.relations = {};
  markDirty();
  selectEvent(null);
  updateAll();
  toast(`Cleared ${count} event(s)`);
}

function toggleStandalone() {
  state.hideStandalone = !state.hideStandalone;
  syncHideStandaloneButton();
  renderGraph();
}

function syncHideStandaloneButton() {
  const btn = document.getElementById("btnHideStandalone");
  if (btn) btn.textContent = state.hideStandalone ? "Show Standalone" : "Hide Standalone";
}

// ── Data Loading ──
function loadData(data, fileName) {
  state.data = data;
  state.currentFileName = fileName || null;
  state.dataPath = fileName || null;
  state.dirty = false;
  state.lastValidation = null;
  state.selectedEventId = null;
  state.selectedRelationId = null;
  const header = document.getElementById("currentFileLabel");
  if (header) header.textContent = fileName || t("file.untitled");
  updateNavButtons();
  updateAll();
  handleValidate();
  saveSessionState();
}

function updateNavButtons() {
  const list = state.fileList || [];
  const idx = state.fileListIndex;
  document.getElementById("btnPrevFile").disabled = !list.length || idx <= 0;
  document.getElementById("btnNextFile").disabled = !list.length || idx < 0 || idx >= list.length - 1;
}

async function navigateFile(dir) {
  const list = state.fileList || [];
  const idx = (state.fileListIndex || 0) + dir;
  if (idx < 0 || idx >= list.length) return;
  const entry = list[idx];
  if (!entry || entry.type !== "file") return;
  if (!checkDirty()) return;
  state.fileListIndex = idx;
  await fbOpenFile(entry.path || entry.name, entry.name);
  updateNavButtons();
}

function markDirty() {
  state.dirty = true;
  saveSessionState();
}

const SESSION_KEY = "eventgraph_session";

function saveSessionState() {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      data: state.data,
      dataPath: state.dataPath,
      currentFileName: state.currentFileName,
      timestamp: Date.now(),
    }));
  } catch (_) {}
}

function loadSessionState() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved.data || !saved.data.text) return false;
    state.data = saved.data;
    state.dataPath = saved.dataPath || null;
    state.currentFileName = saved.currentFileName || null;
    state.dirty = false;
    const header = document.getElementById("currentFileLabel");
    if (header) header.textContent = state.currentFileName || t("file.untitled");
    updateAll();
    handleValidate();
    return true;
  } catch (_) { return false; }
}

function updateAll() {
  renderText();
  renderGraph();
  updateBottomPanel();
  updateSaveButton();
}

function updateSaveButton() {
  const btn = document.getElementById("btnSaveFile");
  if (!btn) return;
  btn.style.display = state.mode === "annotate" ? "" : "none";
  btn.textContent = state.dirty ? "💾 Save *" : "💾 Save";
  const btnClear = document.getElementById("btnClearRels");
  if (btnClear) btnClear.style.display = state.mode === "annotate" ? "" : "none";
  const btnClearEv = document.getElementById("btnClearEvents");
  if (btnClearEv) btnClearEv.style.display = state.mode === "annotate" ? "" : "none";
}

function checkDirty() {
  if (state.dirty) {
    return confirm("Unsaved changes will be lost. Continue?");
  }
  return true;
}

// ── Text Rendering ──
function renderText() {
  const container = document.getElementById("textContent");
  if (!state.data || !state.data.text) {
    container.innerHTML = `<div class="drop-zone" onclick="openFileBrowser('browse')">${t("empty")}</div>`;
    return;
  }

  const text = state.data.text;
  const events = state.data.events || {};

  // For each character position, find which events cover it
  const eventList = Object.entries(events).map(([eid, info]) => ({
    id: eid, trigger: info[0], start: info[1][0], end: info[1][1], type: info[2]
  }));

  if (eventList.length === 0) {
    container.innerHTML = escapeHtml(text);
    return;
  }

  // Character-level segmentation: for each position i, which events are active
  const activeAt = new Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const active = [];
    for (const ev of eventList) {
      if (ev.start <= i && i < ev.end) active.push(ev);
    }
    activeAt[i] = active;
  }

  // Build HTML by grouping consecutive characters with the same active event set
  let html = "";
  let i = 0;
  while (i < text.length) {
    const active = activeAt[i];

    if (active.length === 0) {
      // Plain text segment
      let j = i;
      while (j < text.length && activeAt[j].length === 0) j++;
      html += `<span data-start="${i}" data-end="${j}">${escapeHtml(text.substring(i, j))}</span>`;
      i = j;
    } else {
      // Find end of this segment (where active set changes)
      let j = i;
      while (j < text.length && activeSetsEqual(activeAt[j], active)) j++;

      const segmentText = escapeHtml(text.substring(i, j));
      // Nest spans: innermost first (shorter spans), outermost last (longer spans)
      const sorted = [...active].sort((a, b) => (b.end - b.start) - (a.end - a.start));
      let wrapped = `<span data-start="${i}" data-end="${j}">${segmentText}</span>`;
      for (const ev of sorted) {
        const isSelected = ev.id === state.selectedEventId;
        const cls = `event-highlight event-type-${ev.type}${isSelected ? " selected" : ""}`;

        const rels = getRelationsForEvent(ev.id);
        let tooltip = `${ev.type}: ${ev.trigger} [${ev.start}-${ev.end}]`;
        if (rels.length > 0) {
          tooltip += "\\nRelations: " + rels.map(r => `${r.type}(${r.other})`).join(", ");
        }

        wrapped = `<span class="${cls}" data-event-id="${ev.id}" data-type="${ev.type}" data-start="${ev.start}" data-end="${ev.end}" title="${escapeAttr(tooltip)}">${wrapped}</span>`;
      }
      html += wrapped;
      i = j;
    }
  }

  container.innerHTML = html;
}

function activeSetsEqual(a, b) {
  if (a.length !== b.length) return false;
  const idsA = a.map(e => e.id).sort().join(",");
  const idsB = b.map(e => e.id).sort().join(",");
  return idsA === idsB;
}

function getRelationsForEvent(eid) {
  const rels = [];
  if (!state.data.relations) return rels;
  for (const [rid, data] of Object.entries(state.data.relations)) {
    const [src, tgt] = data[0];
    const rtype = data[1];
    if (src === eid) rels.push({ type: rtype, other: tgt, rid });
    if (tgt === eid) rels.push({ type: rtype, other: src, rid });
  }
  return rels;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Text Click Handler ──
function onTextClick(e) {
  const highlight = e.target.closest(".event-highlight");
  if (!highlight) return;
  const eid = highlight.getAttribute("data-event-id");
  if (state.mode === "annotate" && state.relationSource && state.relationSource !== eid) {
    showRelationDialog(state.relationSource, eid);
    state.relationSource = null;
    clearRelationMarkers();
  } else {
    selectEvent(eid);
    state.relationSource = state.mode === "annotate" ? eid : null;
    if (state.mode === "annotate" && state.relationSource) {
      highlightRelationMarkers();
    }
  }
}

function onTextDblClick(e) {
  const highlight = e.target.closest(".event-highlight");
  if (!highlight) return;
  const eid = highlight.getAttribute("data-event-id");
  if (state.mode !== "annotate") return;
  const rels = getRelationsForEvent(eid);
  if (rels.length === 0) return;
  if (confirm(`Delete all ${rels.length} relation(s) involving event ${eid}?`)) {
    const newRels = {};
    for (const [rid, data] of Object.entries(state.data.relations)) {
      if (data[0][0] !== eid && data[0][1] !== eid) newRels[rid] = data;
    }
    state.data.relations = newRels;
    markDirty();
    updateAll();
    toast(`Deleted ${rels.length} relation(s)`);
  }
}

function highlightRelationMarkers() {
  clearRelationMarkers();
  if (state.relationSource) {
    const el = document.querySelector(`.event-highlight[data-event-id="${state.relationSource}"]`);
    if (el) el.classList.add("source-marked");
  }
}

function clearRelationMarkers() {
  document.querySelectorAll(".source-marked, .target-marked").forEach(el => {
    el.classList.remove("source-marked", "target-marked");
  });
}

// ── Text Selection (for new event) ──
function onTextSelect(e) {
  if (state.mode !== "annotate") return;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  const rawText = selection.toString();
  if (!rawText.trim()) { selection.removeAllRanges(); return; }

  const container = document.getElementById("textContent");
  const range = selection.getRangeAt(0);

  const rawStart = textNodeOffset(container, range.startContainer, range.startOffset);
  const rawEnd = textNodeOffset(container, range.endContainer, range.endOffset);

  const events = state.data.events || {};
  for (const [eid, info] of Object.entries(events)) {
    const [_, [es, ee]] = info;
    if (rawStart >= es && rawStart < ee) { selection.removeAllRanges(); return; }
    if (rawEnd > es && rawEnd <= ee) { selection.removeAllRanges(); return; }
    if (rawStart <= es && rawEnd >= ee) { selection.removeAllRanges(); return; }
  }

  // Compute smart-trimmed trigger and adjusted span
  let trimmed = rawText;
  let leadTrim = 0;
  let trailTrim = 0;
  const trimRe = /[\s.,;:!?'"()\uFF0C\u3002\uFF1B\uFF1A\uFF01\uFF1F\u2018\u2019\u201C\u201D\u300C\u300D\u300E\u300F\u3001\u3008\u3009\u3010\u3011]/;
  while (leadTrim < trimmed.length && trimRe.test(trimmed[leadTrim])) leadTrim++;
  while (trailTrim < trimmed.length - leadTrim && trimRe.test(trimmed[trimmed.length - 1 - trailTrim])) trailTrim++;
  trimmed = trimmed.substring(leadTrim, trimmed.length - trailTrim);

  const adjustedStart = rawStart + leadTrim;
  const adjustedEnd = rawEnd - trailTrim;

  // If trimmed to empty, reject
  if (!trimmed || trimmed.length === 0) { selection.removeAllRanges(); return; }

  const needsTrimHint = trimmed !== rawText;
  showEventDialog(rawText, rawStart, rawEnd, trimmed, adjustedStart, adjustedEnd, needsTrimHint);
  selection.removeAllRanges();
}

// Walk all text nodes under container, summing lengths until we hit targetNode
function textNodeOffset(container, targetNode, offsetInNode) {
  let pos = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node === targetNode) return pos + offsetInNode;
    pos += node.textContent.length;
  }
  return pos + offsetInNode;
}

// ── Graph Rendering ──
function initGraph() {
  state.cytoscape = cytoscape({
    container: document.getElementById("cy"),
    style: [
      { selector: "node", style: {
        "background-color": "#21262d",
        "label": "data(label)",
        "color": "#c9d1d9",
        "font-size": "10px",
        "text-valign": "center",
        "text-halign": "center",
        "width": "label",
        "height": "label",
        "padding": "6px",
        "shape": "round-rectangle",
        "border-width": 2,
        "border-color": "#30363d",
        "text-wrap": "ellipsis",
        "text-max-width": "80px",
        "min-zoomed-font-size": "8px",
      }},
      { selector: "node[type='Occurrence']", style: { "background-color": "#db6d28", "border-color": "#db6d28" }},
      { selector: "node[type='I_Action']", style: { "background-color": "#58a6ff", "border-color": "#58a6ff" }},
      { selector: "node[type='StateChange']", style: { "background-color": "#3fb950", "border-color": "#3fb950" }},
      { selector: "node[type='Reporting']", style: { "background-color": "#bc8cff", "border-color": "#bc8cff" }},
      { selector: "node[type='HalfGeneric']", style: { "background-color": "#8b949e", "border-color": "#8b949e" }},
      { selector: "node:selected", style: {
        "border-color": "#f0f6fc",
        "border-width": 3,
      }},
      { selector: "edge", style: {
        "width": 3,
        "line-color": "#58a6ff",
        "target-arrow-color": "#58a6ff",
        "target-arrow-shape": "triangle",
        "target-arrow-width": 8,
        "curve-style": "unbundled-bezier",
        "control-point-distances": [0],
        "label": "data(label)",
        "font-size": "9px",
        "color": "#8b949e",
        "text-background-color": "#0d1117",
        "text-background-opacity": 0.9,
        "text-background-padding": "2px",
        "overlay-padding": "8px",
        "overlay-color": "transparent",
        "overlay-opacity": 0,
      }},
      { selector: "edge[type='SuperSub']", style: {
        "line-style": "solid",
        "line-color": "#58a6ff",
        "target-arrow-color": "#58a6ff",
        "width": 2,
      }},
      { selector: "edge[type='SubSuper']", style: {
        "line-style": "dashed",
        "line-color": "#bc8cff",
        "target-arrow-color": "#bc8cff",
      }},
      { selector: "edge[type='Coref']", style: {
        "line-style": "dotted",
        "line-color": "#3fb950",
        "target-arrow-color": "#3fb950",
        "source-arrow-color": "#3fb950",
        "source-arrow-shape": "triangle",
        "width": 1,
      }},
      { selector: "edge:selected", style: {
        "width": 3,
      }},
    ],
    layout: { name: "dagre", animate: false, fit: true, padding: 30, rankDir: "TB", spacingFactor: 1.2 },
    minZoom: 0.1,
    maxZoom: 4,
  });

  state.cytoscape.on("tap", "node", (evt) => {
    const node = evt.target;
    const eid = node.data("id");
    if (state.mode === "annotate" && state.relationSource && state.relationSource !== eid) {
      showRelationDialog(state.relationSource, eid);
      state.relationSource = null;
      clearRelationMarkers();
    } else {
      selectEvent(eid);
      if (state.mode === "annotate") state.relationSource = eid;
      highlightRelationMarkers();
    }
  });

  state.cytoscape.on("dbltap", "node", (evt) => {
    if (state.mode !== "annotate") return;
    const eid = evt.target.data("id");
    const rels = getRelationsForEvent(eid);
    if (rels.length === 0) return;
    if (confirm(`Delete all ${rels.length} relation(s) involving event ${eid}?`)) {
      const newRels = {};
      for (const [rid, data] of Object.entries(state.data.relations)) {
        if (data[0][0] !== eid && data[0][1] !== eid) newRels[rid] = data;
      }
      state.data.relations = newRels;
      markDirty();
      updateAll();
      toast(`Deleted ${rels.length} relation(s)`);
    }
  });

  state.cytoscape.on("tap", "edge", (evt) => {
    const edge = evt.target;
    const eid = edge.data("id");
    selectRelation(eid.startsWith("e") ? eid.slice(1) : eid);
  });

  state.cytoscape.on("tap", (evt) => {
    if (evt.target === state.cytoscape) {
      selectEvent(null);
      selectRelation(null);
      state.relationSource = null;
      clearRelationMarkers();
    }
  });
}

function renderGraph() {
  const cy = state.cytoscape;
  if (!cy || !state.data) return;

  const events = state.data.events || {};
  const relations = state.data.relations || {};

  const connectedEvents = new Set();
  for (const relData of Object.values(relations)) {
    connectedEvents.add(String(relData[0][0]));
    connectedEvents.add(String(relData[0][1]));
  }

  const nodes = [];
  const nodeSet = new Set();
  for (const [eid, info] of Object.entries(events)) {
    if (state.mode === "view" && state.hideStandalone && !connectedEvents.has(eid)) continue;
    const [trigger, , type] = info;
    const label = trigger.length > 25 ? trigger.substring(0, 25) + "…" : trigger;
    nodes.push({
      group: "nodes",
      data: { id: eid, label: `${eid}: ${label}`, type, fullTrigger: trigger },
      classes: `event-${type}`,
    });
    nodeSet.add(eid);
  }

  const edges = [];
  for (const [rid, relData] of Object.entries(relations)) {
    const [[src, tgt], rtype, srcText, tgtText] = relData;
    if (nodeSet.has(src) && nodeSet.has(tgt)) {
      edges.push({
        group: "edges",
        data: {
          id: "e" + rid, source: src, target: tgt,
          type: rtype,
          label: rtype === "Coref" ? "=" : rtype === "SuperSub" ? "⊃" : "⊂",
          srcText, tgtText,
        },
      });
    }
  }

  cy.batch(() => {
    cy.elements().remove();
    cy.add([...nodes, ...edges]);
    const layoutOpts = state.graphLayout === "dagre"
      ? { name: "dagre", animate: true, fit: true, padding: 40, rankDir: "TB", spacingFactor: 1.2 }
      : { name: "cose-bilkent", animate: true, fit: true, padding: 50, spacingFactor: 1.5 };
    cy.layout({ ...layoutOpts, animationDuration: 300 }).run();
  });
}

// ── Selection ──
function selectEvent(eid) {
  state.selectedEventId = eid;
  state.selectedRelationId = null;

  document.querySelectorAll(".event-highlight.selected").forEach(el => el.classList.remove("selected"));
  if (eid) {
    const el = document.querySelector(`.event-highlight[data-event-id="${eid}"]`);
    if (el) el.classList.add("selected");
  }

  const cy = state.cytoscape;
  if (cy) {
    cy.elements().unselect();
    if (eid) cy.getElementById(eid).select();
  }
  updateBottomPanel();
  if (state.showSidebar) renderSidebarBody();
}

function selectRelation(rid) {
  state.selectedRelationId = rid;
  state.selectedEventId = null;

  document.querySelectorAll(".event-highlight.selected").forEach(el => el.classList.remove("selected"));

  const cy = state.cytoscape;
  if (cy) {
    cy.elements().unselect();
    if (rid) cy.getElementById("e" + rid).select();
  }
  updateBottomPanel();
  if (state.showSidebar) renderSidebarBody();
}

// ── Bottom Panel ──
function updateBottomPanel() {
  const panel = document.getElementById("detailsPanel");
  const eid = state.selectedEventId;
  const rid = state.selectedRelationId;

  if (eid && state.data.events[eid]) {
    const [trigger, [s, e], type] = state.data.events[eid];
    panel.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">${t("details.eventId")}:</span>
        <span class="detail-value">${eid}</span>
        <span class="type-badge ${type}">${type}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t("events.trigger")}:</span>
        <input type="text" value="${escapeAttr(trigger)}" id="editTrigger" style="width:200px">
      </div>
      <div class="detail-row">
        <span class="detail-label">${t("events.type")}:</span>
        <select id="editType">
          ${["Occurrence","I_Action","StateChange","Reporting","HalfGeneric"].map(t => `<option value="${t}" ${t===type?'selected':''}>${t}</option>`).join("")}
        </select>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t("events.span")}:</span>
        <span class="detail-value">[${s}, ${e}]</span>
      </div>
      <div class="detail-row">
        <button class="btn primary small" onclick="saveEventEdit('${eid}')">${t("details.save")}</button>
        <button class="btn danger small" onclick="deleteEvent('${eid}')">${t("details.delete")}</button>
      </div>
    `;
  } else if (rid && state.data.relations[rid]) {
    const [[src, tgt], rtype, srcText, tgtText] = state.data.relations[rid];
    panel.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">${t("details.relId")}:</span>
        <span class="detail-value">${rid}</span>
        <span class="rel-badge ${rtype}">${rtype}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t("relations.source")}:</span>
        <span class="detail-value">${src}: ${srcText || "—"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t("relations.target")}:</span>
        <span class="detail-value">${tgt}: ${tgtText || "—"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${t("relations.type")}:</span>
        <select id="editRelType">
          ${["SuperSub","SubSuper","Coref"].map(t => `<option value="${t}" ${t===rtype?'selected':''}>${t}</option>`).join("")}
        </select>
      </div>
      <div class="detail-row">
        <button class="btn primary small" onclick="saveRelationEdit('${rid}')">${t("details.save")}</button>
        <button class="btn danger small" onclick="deleteRelation('${rid}')">${t("details.delete")}</button>
      </div>
    `;
  } else {
    panel.innerHTML = `<span class="hint">${t("details.selectHint")}</span>`;
  }
}

function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;");
}

function saveEventEdit(eid) {
  const trigger = document.getElementById("editTrigger").value.trim();
  const type = document.getElementById("editType").value;
  if (!trigger) return;
  const ev = state.data.events[eid];
  ev[0] = trigger;
  ev[2] = type;
  markDirty();
  updateAll();
  toast("Event updated");
}

function saveRelationEdit(rid) {
  const type = document.getElementById("editRelType").value;
  const rel = state.data.relations[rid];
  state.data.relations[rid][1] = type;
  markDirty();
  updateAll();
  toast("Relation updated");
}

function deleteEvent(eid) {
  if (!confirm(t("dialog.deleteConfirm"))) return;
  delete state.data.events[eid];
  const newRels = {};
  for (const [rid, data] of Object.entries(state.data.relations)) {
    if (data[0][0] !== eid && data[0][1] !== eid) newRels[rid] = data;
  }
  state.data.relations = newRels;
  markDirty();
  selectEvent(null);
  updateAll();
}

function deleteRelation(rid) {
  if (!confirm(t("dialog.deleteConfirm"))) return;
  delete state.data.relations[rid];
  markDirty();
  selectRelation(null);
  updateAll();
}

// ── Dialogs ──
function showEventDialog(rawTrigger, rawStart, rawEnd, trimmedTrigger, adjustedStart, adjustedEnd, showHint) {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";
  overlay._adjustedStart = adjustedStart;
  overlay._adjustedEnd = adjustedEnd;
  overlay._trimmedTrigger = trimmedTrigger;

  let hintHtml = "";
  if (showHint) {
    hintHtml = `<div class="word-hint" id="wordHint">💡 &quot;${escapeHtml(rawTrigger)}&quot; → Trim to &quot;${escapeHtml(trimmedTrigger)}&quot; (click to apply)</div>`;
  }
  overlay.innerHTML = `
    <div class="dialog">
      <h3>${t("dialog.newEvent")}</h3>
      <div class="form-group">
        <label>${t("dialog.triggerLabel")}</label>
        <input type="text" value="${escapeAttr(rawTrigger)}" id="dlgTrigger" readonly>
      </div>
      ${hintHtml}
      <div class="form-group">
        <label id="dlgSpanLabel">${t("events.span")}: [${rawStart}, ${rawEnd}]</label>
      </div>
      <div class="form-group">
        <label>${t("dialog.selectType")}</label>
        <select id="dlgType">
          ${["Occurrence","I_Action","StateChange","Reporting","HalfGeneric"].map(t => `<option value="${t}">${t}</option>`).join("")}
        </select>
      </div>
      <div class="dialog-actions">
        <button class="btn" onclick="this.closest('.dialog-overlay').remove()">${t("dialog.cancel")}</button>
        <button class="btn primary" id="dlgCreate">${t("dialog.createEvent")}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Word hint click handler
  if (showHint) {
    overlay.querySelector("#wordHint").addEventListener("click", () => {
      const triggerInput = overlay.querySelector("#dlgTrigger");
      triggerInput.value = trimmedTrigger;
      overlay._appliedTrim = true;
      const spanLabel = overlay.querySelector("#dlgSpanLabel");
      if (spanLabel) spanLabel.textContent = `${t("events.span")}: [${overlay._adjustedStart}, ${overlay._adjustedEnd}]`;
      const hintEl = overlay.querySelector("#wordHint");
      hintEl.textContent = "✓ Trimmed";
      hintEl.style.opacity = "0.6";
      hintEl.style.cursor = "default";
    });
  }

  overlay.querySelector("#dlgCreate").addEventListener("click", () => {
    const type = document.getElementById("dlgType").value;
    const trigger = overlay._appliedTrim ? trimmedTrigger : rawTrigger;
    const start = overlay._appliedTrim ? adjustedStart : rawStart;
    const end = overlay._appliedTrim ? adjustedEnd : rawEnd;
    createEvent(trigger, start, end, type);
    overlay.remove();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function showRelationDialog(srcId, tgtId) {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";
  const srcEv = state.data.events[srcId];
  const tgtEv = state.data.events[tgtId];

  // Find existing relations between these two events
  const existing = [];
  for (const [rid, data] of Object.entries(state.data.relations || {})) {
    const [[s, t], rtype] = data;
    if ((s === srcId && t === tgtId) || (s === tgtId && t === srcId)) {
      existing.push({ rid, src: s, tgt: t, rtype });
    }
  }

  let existingHtml = "";
  if (existing.length > 0) {
    existingHtml = `<div style="margin-bottom:12px"><label>${t("relations.existing") || "Existing relations"}:</label>`;
    for (const rel of existing) {
      const dir = rel.src === srcId ? "→" : "←";
      existingHtml += `<div class="fb-item" style="justify-content:space-between;margin:4px 0">
        <span>#${rel.rid} ${dir} <span class="rel-badge ${rel.rtype}">${rel.rtype}</span></span>
        <button class="btn danger small" data-rid="${rel.rid}">Delete</button>
      </div>`;
    }
    existingHtml += `</div>`;
  }

  overlay.innerHTML = `
    <div class="dialog">
      <h3>${t("dialog.newRelation")}</h3>
      <div class="form-group">
        <label>${srcId}: ${srcEv ? srcEv[0] : "?"}  —  ${tgtId}: ${tgtEv ? tgtEv[0] : "?"}</label>
      </div>
      <div id="existingRels" style="margin-bottom:12px">
        ${existingHtml}
      </div>
      <div class="form-group">
        <label>${t("dialog.selectRelationType")}</label>
        <select id="dlgRelType">
          ${["SuperSub","SubSuper","Coref"].map(t => `<option value="${t}">${t}</option>`).join("")}
        </select>
      </div>
      <div class="dialog-actions">
        <button class="btn" onclick="this.closest('.dialog-overlay').remove()">${t("dialog.cancel")}</button>
        <button class="btn primary" id="dlgCreateRel">${t("dialog.createRelation")}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#dlgCreateRel").addEventListener("click", () => {
    const rtype = document.getElementById("dlgRelType").value;
    createRelation(srcId, tgtId, rtype);
    overlay.remove();
  });

  // Event delegation for delete buttons
  overlay.querySelector("#existingRels").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || !btn.dataset.rid) return;
    e.stopPropagation();
    delete state.data.relations[btn.dataset.rid];
    markDirty();
    updateAll();
    overlay.remove();
    toast(`Relation ${btn.dataset.rid} deleted`);
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function createEvent(trigger, start, end, type) {
  const maxId = Math.max(0, ...Object.keys(state.data.events).map(Number));
  const newId = String(maxId + 1);
  state.data.events[newId] = [trigger, [start, end], type];
  markDirty();
  selectEvent(newId);
  updateAll();
  toast(`Event ${newId} created`);
  showDeltaValidation();
}

function createRelation(src, tgt, rtype) {
  const maxId = Math.max(0, ...Object.keys(state.data.relations).map(Number));
  const newId = String(maxId + 1);
  const srcEv = state.data.events[src];
  const tgtEv = state.data.events[tgt];
  state.data.relations[newId] = [[src, tgt], rtype, srcEv ? srcEv[0] : "", tgtEv ? tgtEv[0] : ""];
  markDirty();
  selectRelation(newId);
  updateAll();
  showDeltaValidation();
}

// ════════════════════════════════════════════════════════════
//  FILE BROWSER — the new stuff
// ════════════════════════════════════════════════════════════

function openFileBrowser(mode) {
  state.fbMode = mode;
  state.fbCurrentDir = "";
  const fb = document.getElementById("fileBrowser");
  const fbSaveRow = document.getElementById("fbSaveRow");
  if (mode === "save") {
    document.getElementById("fbTitle").textContent = "💾 " + (currentLang === "zh" ? "保存" : "Save");
    fbSaveRow.style.display = "flex";
    const defaultName = state.currentFileName || "event-graph.json";
    document.getElementById("fbSaveFilename").value = defaultName;
  } else {
    fbSaveRow.style.display = "none";
    document.getElementById("fbTitle").textContent = mode === "samples" ? t("file.loadSample") : t("file.open");
  }
  document.getElementById("fbPath").textContent = mode === "samples" ? "samples/" : "/";
  document.getElementById("fbUp").disabled = true;
  document.getElementById("fbBody").innerHTML = `<div class="fb-loading">${t("file.loading")}</div>`;
  fb.style.display = "flex";
  fetchFileList();
}

function closeFileBrowser() {
  document.getElementById("fileBrowser").style.display = "none";
}

async function fetchFileList(dir) {
  if (dir === undefined) dir = state.fbCurrentDir;
  if (dir === undefined) dir = "";

  let url;
  if (state.fbMode === "samples") {
    url = "/api/samples";
  } else {
    url = `/api/browse?directory=${encodeURIComponent(dir)}`;
  }

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const items = await resp.json();
    renderFileList(items, dir);
    state.fbCurrentDir = dir;
    document.getElementById("fbPath").textContent = dir || "/";
    document.getElementById("fbUp").disabled = (state.fbMode === "samples") || !dir || dir === "";
    // Store file list for prev/next nav (browse mode only)
    if (state.fbMode === "browse") {
      state.fileList = items.filter(i => i.type === "file");
      state.fileListIndex = -1;
    }
  } catch (err) {
    document.getElementById("fbBody").innerHTML = `<div class="fb-empty">Failed to load: ${err.message}</div>`;
  }
}

function renderFileList(items, currentDir) {
  const body = document.getElementById("fbBody");
  if (!items || items.length === 0) {
    body.innerHTML = `<div class="fb-empty">${t("file.noFiles")}</div>`;
    return;
  }

  let html = "";
  const isSave = state.fbMode === "save";
  for (const item of items) {
    if (item.type === "directory") {
      html += `
        <div class="fb-item fb-dir" onclick="fbOpenDir('${escapeAttr(item.path)}')">
          <span class="fb-icon">📁</span>
          <span class="fb-name">${escapeHtml(item.name)}</span>
          <span class="fb-meta">directory</span>
        </div>`;
    } else {
      const sizeStr = item.size ? formatSize(item.size) : "";
      const click = isSave
        ? `fbPickFile('${escapeAttr(item.name)}')`
        : `fbOpenFile('${escapeAttr(item.path || item.name)}', '${escapeAttr(item.name)}')`;
      html += `
        <div class="fb-item fb-file" onclick="${click}">
          <span class="fb-icon">📄</span>
          <span class="fb-name">${escapeHtml(item.name)}</span>
          <span class="fb-meta">${sizeStr}</span>
        </div>`;
    }
  }
  body.innerHTML = html;
}

function fbOpenDir(dirPath) {
  fetchFileList(dirPath);
}

function fbPickFile(name) {
  document.getElementById("fbSaveFilename").value = name;
}

async function fbOpenFile(filePath, fileName) {
  if (!checkDirty()) return;
  const fetchPath = filePath || fileName;
  // Update nav index
  const list = state.fileList || [];
  state.fileListIndex = list.findIndex(f => f.name === fileName || f.path === filePath);
  try {
    const resp = await fetch(`/api/read-file?path=${encodeURIComponent(fetchPath)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const result = await resp.json();
    if (result.error) { toast(result.error, true); return; }
    loadData(result.data, fileName || filePath);
    toast(`Loaded: ${fileName || filePath}`);
    closeFileBrowser();
  } catch (err) {
    toast(`Failed to load: ${err.message}`, true);
  }
}

function fbGoUp() {
  if (state.fbMode === "samples") return;
  const parts = state.fbCurrentDir.split("/").filter(Boolean);
  parts.pop();
  const parent = parts.join("/");
  fetchFileList(parent);
}

async function showDirStats() {
  const dir = state.fbCurrentDir || "";
  document.getElementById("statsDirLabel").textContent = dir || "/";
  document.getElementById("statsBody").innerHTML = `<div class="fb-loading">Loading…</div>`;
  document.getElementById("statsDialog").style.display = "flex";
  try {
    const resp = await fetch(`/api/stats?directory=${encodeURIComponent(dir)}`);
    const result = await resp.json();
    if (!result.ok) { document.getElementById("statsBody").innerHTML = `<div class="fb-empty">${result.error || "Failed"}</div>`; return; }
    const t = result.totals;
    let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`;
    html += statRow("Files", t.files);
    html += statRow("Total Events", t.events);
    html += statRow("Total Relations", t.relations);
    html += statRow("Standalone Events", t.standalone_events);
    html += statRow("Connected Graphs", t.components);
    html += statRow("Graphs ≥5 Events", t.graphs_ge5);
    html += statRow("Coref Relations", t.coref_relations);
    html += `</div>`;
    const types = t.type_counts || {};
    if (Object.keys(types).length) {
      html += `<div style="margin-top:12px;font-weight:600;color:#8b949e;font-size:11px;text-transform:uppercase">Event Types</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px">`;
      for (const [k, v] of Object.entries(types).sort()) html += statRow(k, v);
      html += `</div>`;
    }
    const rels = t.rel_type_counts || {};
    if (Object.keys(rels).length) {
      html += `<div style="margin-top:12px;font-weight:600;color:#8b949e;font-size:11px;text-transform:uppercase">Relation Types</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px">`;
      for (const [k, v] of Object.entries(rels).sort()) html += statRow(k, v);
      html += `</div>`;
    }
    if (result.failures && result.failures.length) {
      html += `<div style="margin-top:12px;padding:8px;background:rgba(248,81,73,0.12);border-radius:4px;font-size:12px"><span style="color:#f85149">⚠ ${result.failures.length} parse failure(s):</span>`;
      for (const f of result.failures) html += `<div style="margin-top:4px;color:#e6edf3">${escapeHtml(f.file)}: ${escapeHtml(f.error)}</div>`;
      html += `</div>`;
    }
    document.getElementById("statsBody").innerHTML = html;
  } catch (err) {
    document.getElementById("statsBody").innerHTML = `<div class="fb-empty">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function statRow(label, value) {
  return `<div style="color:#8b949e;font-size:12px">${label}</div><div style="text-align:right;font-weight:600;font-size:13px">${value}</div>`;
}

// ── File Operations ──
async function uploadFilesToServer(fileList) {
  const formData = new FormData();
  for (const file of fileList) formData.append("files", file);
  try {
    const resp = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await resp.json();
    if (!result.ok && result.errors.length > 0) {
      toast(`Upload errors: ${result.errors.map(e => e.error).join(", ")}`, true);
    }
    if (result.saved && result.saved.length > 0) {
      toast(`Uploaded ${result.saved.length} file(s)`);
    }
    return result;
  } catch (err) {
    toast(`Upload failed: ${err.message}`, true);
    return { saved: [], errors: [] };
  }
}

function handleFileOpen(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  uploadFilesToServer(Array.from(files)).then(() => {
    if (state.fbMode === "browse" && document.getElementById("fileBrowser").style.display !== "none") {
      fetchFileList(state.fbCurrentDir);
    }
  });
  e.target.value = "";
}

function handleFolderUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  const jsonFiles = Array.from(files).filter(f => f.name.endsWith(".json"));
  if (jsonFiles.length === 0) { toast("No JSON files found in folder", true); e.target.value = ""; return; }
  uploadFilesToServer(jsonFiles).then(() => {
    if (document.getElementById("fileBrowser").style.display !== "none") fetchFileList(state.fbCurrentDir);
  });
  e.target.value = "";
}

function handleSave() {
  const name = state.currentFileName || "event-graph.json";
  const json = JSON.stringify(state.data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function saveToFile() {
  openFileBrowser("save");
}

function fbSaveNewDir() {
  const dir = prompt(currentLang === "zh" ? "输入新文件夹名称:" : "New directory name:");
  if (!dir || !dir.trim()) return;
  const target = state.fbCurrentDir ? state.fbCurrentDir + "/" + dir.trim() : dir.trim();
  fetch("/api/mkdir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: target }),
  }).then(r => r.json()).then(result => {
    if (result.ok) { fetchFileList(state.fbCurrentDir); toast("Created: " + target); }
    else { toast("Failed: " + (result.error || "unknown"), true); }
  }).catch(err => toast("Failed: " + err.message, true));
}

async function fbConfirmSave() {
  const filename = document.getElementById("fbSaveFilename").value.trim();
  if (!filename) { toast("Filename required", true); return; }
  const savePath = state.fbCurrentDir ? state.fbCurrentDir + "/" + filename : filename;

  try {
    const vResp = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: state.data.text || "", events: state.data.events, relations: state.data.relations }),
    });
    const vResult = await vResp.json();
    state.lastValidation = { errors: vResult.errors, warnings: vResult.warnings };
    if (vResult.errors.length > 0) {
      if (!confirm(`${vResult.errors.length} validation error(s). ` + (currentLang === "zh" ? "仍然保存？" : "Save anyway?"))) return;
    }
  } catch (_) {}

  try {
    const resp = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: savePath, data: state.data }),
    });
    const result = await resp.json();
    if (result.ok) {
      state.dirty = false;
      state.dataPath = savePath;
      updateSaveButton();
      closeFileBrowser();
      toast("Saved: " + savePath);
    } else {
      toast("Save failed: " + (result.error || "unknown"), true);
    }
  } catch (err) {
    toast("Save failed: " + err.message, true);
  }
}

function handleNew() {
  if (!checkDirty()) return;
  try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
  loadData({ text: "", events: {}, relations: {} });
}

function guardedOpenFileBrowser(mode) {
  if (!checkDirty()) return;
  openFileBrowser(mode);
}

function guardedDownload() {
  handleSave();
}

function handleExport() {
  const cy = state.cytoscape;
  if (!cy) return;
  const png = cy.png({ full: true, bg: "#0d1117" });
  const a = document.createElement("a");
  a.href = png;
  a.download = "event-graph.png";
  a.click();
}

function toggleLayout() {
  state.graphLayout = state.graphLayout === "cose-bilkent" ? "dagre" : "cose-bilkent";
  document.getElementById("btnLayout").textContent = state.graphLayout === "dagre" ? "Layout: Hierarchical" : "Layout: Force-Directed";
  if (state.cytoscape && state.data) {
    state.cytoscape.layout({
      name: state.graphLayout,
      animate: true,
      fit: true,
      padding: 40,
      rankDir: state.graphLayout === "dagre" ? "TB" : undefined,
      spacingFactor: state.graphLayout === "dagre" ? 1.2 : undefined,
    }).run();
  }
}

// ════════════════════════════════════════════════════════════
//  SIDEBAR — Event & Relation list management
// ════════════════════════════════════════════════════════════

function toggleSidebar() {
  state.showSidebar = !state.showSidebar;
  const sb = document.getElementById("sidebar");
  if (state.showSidebar) {
    sb.style.display = "flex";
    renderSidebarBody();
  } else {
    sb.style.display = "none";
  }
}

// Wire sidebar tabs via event delegation on the parent
const sidebarTabs = document.querySelector(".sidebar-tabs");
if (sidebarTabs) {
  sidebarTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".sidebar-tab");
    if (!tab) return;
    state.sidebarActiveTab = tab.getAttribute("data-tab");
    document.querySelectorAll(".sidebar-tab").forEach(t => t.classList.toggle("active", t === tab));
    renderSidebarBody();
  });
}

function renderSidebarBody() {
  switch (state.sidebarActiveTab) {
    case "events": renderSidebarEvents(); break;
    case "relations": renderSidebarRelations(); break;
    case "json": renderSidebarJson(); break;
  }
}

function renderSidebarEvents() {
  const container = document.getElementById("sidebarBody");
  const events = state.data.events || {};
  const entries = Object.entries(events);
  if (entries.length === 0) {
    container.innerHTML = `<div style="color:#8b949e;text-align:center;padding:20px;font-size:12px">${t("sidebar.noEvents")}</div>`;
    return;
  }
  entries.sort(([a], [b]) => Number(a) - Number(b));

  let html = "";
  for (const [eid, [trigger, , type]] of entries) {
    const sel = eid === state.selectedEventId ? " selected" : "";
    html += `
      <div class="sidebar-item${sel}" data-eid="${eid}" onclick="selectEvent('${eid}');renderSidebarBody();">
        <span class="si-id">#${eid}</span>
        <span class="si-trigger">${escapeHtml(trigger)}</span>
        <span class="si-type type-badge ${type}">${type}</span>
        <span class="si-actions">
          <button class="si-del" title="${t("details.delete")}" onclick="event.stopPropagation();deleteEventSidebar('${eid}')">×</button>
        </span>
      </div>`;
  }
  container.innerHTML = html;
}

function deleteEventSidebar(eid) {
  if (!confirm(t("dialog.deleteConfirm"))) return;
  delete state.data.events[eid];
  const newRels = {};
  for (const [rid, data] of Object.entries(state.data.relations)) {
    if (data[0][0] !== eid && data[0][1] !== eid) newRels[rid] = data;
  }
  state.data.relations = newRels;
  markDirty();
  if (state.selectedEventId === eid) selectEvent(null);
  updateAll();
  renderSidebarBody();
}

function renderSidebarRelations() {
  const container = document.getElementById("sidebarBody");
  const relations = state.data.relations || {};
  const entries = Object.entries(relations);
  if (entries.length === 0) {
    container.innerHTML = `<div style="color:#8b949e;text-align:center;padding:20px;font-size:12px">${t("sidebar.noRelations")}</div>`;
    return;
  }
  entries.sort(([a], [b]) => Number(a) - Number(b));

  const events = state.data.events || {};
  let html = "";
  for (const [rid, [[src, tgt], rtype]] of entries) {
    const sel = rid === state.selectedRelationId ? " selected" : "";
    const srcName = events[src] ? events[src][0] : src;
    const tgtName = events[tgt] ? events[tgt][0] : tgt;
    const srcType = events[src] ? events[src][2] : "";
    const tgtType = events[tgt] ? events[tgt][2] : "";
    const arrow = rtype === "SuperSub" ? " → " : rtype === "SubSuper" ? " ⇢ " : " ↔ ";
    html += `
      <div class="sidebar-item${sel}" data-rid="${rid}" onclick="selectRelation('${rid}');renderSidebarBody();">
        <span class="si-id">#${rid}</span>
        <span class="si-trigger"><span class="type-badge ${srcType}" style="font-size:8px;margin-right:3px">${srcType}</span>${escapeHtml(srcName)}</span>
        <span class="si-arrow">${arrow}</span>
        <span class="si-trigger"><span class="type-badge ${tgtType}" style="font-size:8px;margin-right:3px">${tgtType}</span>${escapeHtml(tgtName)}</span>
        <span class="si-type rel-badge ${rtype}">${rtype}</span>
        <span class="si-actions">
          <button class="si-del" title="${t("details.delete")}" onclick="event.stopPropagation();deleteRelationSidebar('${rid}')">×</button>
        </span>
      </div>`;
  }
  container.innerHTML = html;
}

function deleteRelationSidebar(rid) {
  if (!confirm(t("dialog.deleteConfirm"))) return;
  const rel = state.data.relations[rid];
  const focusEvents = rel ? [rel[0][0], rel[0][1]] : null;
  delete state.data.relations[rid];
  markDirty();
  if (state.selectedRelationId === rid) selectRelation(null);
  updateAll();
  renderSidebarBody();
}

function renderSidebarJson() {
  const container = document.getElementById("sidebarBody");
  const json = JSON.stringify(state.data, null, 2);
  container.innerHTML = `<pre>${escapeHtml(json)}</pre>`;
}
function debouncedValidate() {
  if (state.mode !== "annotate") return;
  if (state.validateTimer) clearTimeout(state.validateTimer);
  state.validateTimer = setTimeout(() => handleValidate(), 800);
}

function errorInvolvesFocus(error, focusEvents) {
  if (!focusEvents || focusEvents.length === 0) return false;
  const d = error.details || {};
  const allIds = []
    .concat(d.event_id || [], d.event_ids || [], d.events || [], d.cycle || [], d.source || [], d.target || [])
    .map(String);
  return focusEvents.some(id => allIds.includes(String(id)));
}

function errorKey(err) { return `${err.type}:${err.message}`; }

function newItems(current, prev) {
  const prevKeys = new Set((prev || []).map(errorKey));
  return (current || []).filter(e => !prevKeys.has(errorKey(e)));
}

function showValBanner(msg) {
  // Remove any existing banner
  document.querySelectorAll(".val-banner").forEach(el => el.remove());
  const banner = document.createElement("div");
  banner.className = "val-banner";
  banner.textContent = msg;
  banner.addEventListener("click", () => banner.remove());
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 6000);
}

async function showDeltaValidation() {
  try {
    const resp = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: state.data.text || "", events: state.data.events, relations: state.data.relations }),
    });
    const result = await resp.json();
    const newErrs = newItems(result.errors, state.lastValidation ? state.lastValidation.errors : []);
    const newWarns = newItems(result.warnings, state.lastValidation ? state.lastValidation.warnings : []);
    if (newErrs.length > 0 || newWarns.length > 0) {
      const msgs = [...newErrs.map(e => e.message), ...newWarns.map(w => w.message)];
      showValBanner(msgs.join(" · "));
    }
    state.lastValidation = { errors: result.errors, warnings: result.warnings };
  } catch (_) {}
}

async function handleValidate() {
  const resultsEl = document.getElementById("valBody");
  const panel = document.getElementById("valPanel");
  const collapsedSummary = document.getElementById("valCollapsedSummary");
  const focusEvents = state.pendingFocusEvents;
  state.pendingFocusEvents = null;
  resultsEl.textContent = "…";

  try {
    const resp = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: state.data.text || "", events: state.data.events, relations: state.data.relations }),
    });
    const result = await resp.json();

    state.lastValidation = { errors: result.errors, warnings: result.warnings };

    const errCount = result.errors.length;
    const warnCount = result.warnings.length;

    if (result.valid && warnCount === 0) {
      resultsEl.innerHTML = `<div class="valid-msg">✓ ${t("validate.valid")}</div>`;
      collapsedSummary.textContent = "✓ Valid";
      panel.classList.remove("has-errors", "has-warnings");
    } else {
      let html = "";
      if (errCount > 0) {
        html += `<div class="val-summary errors">${errCount} ${t("validate.errors")}</div>`;
        for (const err of result.errors) {
          const isFocused = errorInvolvesFocus(err, focusEvents);
          html += `<div class="error-item${isFocused ? " focused" : ""}">⚠ ${err.message}</div>`;
        }
      }
      if (warnCount > 0) {
        html += `<div class="val-summary warnings">${warnCount} ${t("validate.warnings")}</div>`;
        for (const w of result.warnings) html += `<div class="warning-item">⚡ ${w.message}</div>`;
      }
      resultsEl.innerHTML = html;

      const parts = [];
      if (errCount > 0) parts.push(`${errCount} ${t("validate.errors")}`);
      if (warnCount > 0) parts.push(`${warnCount} ${t("validate.warnings")}`);
      const summaryText = parts.join(', ');
      collapsedSummary.textContent = summaryText;

      if (errCount > 0) {
        panel.classList.add("has-errors");
        panel.classList.remove("has-warnings");
      } else {
        panel.classList.remove("has-errors");
        panel.classList.add("has-warnings");
      }
    }

    panel.style.display = "flex";
    panel.classList.remove("val-collapsed");

    if (state.valCollapseTimer) clearTimeout(state.valCollapseTimer);
    state.valCollapseTimer = setTimeout(() => {
      panel.classList.add("val-collapsed");
    }, 10000);
    return result;
  } catch (err) {
    resultsEl.innerHTML = `<div style="color:#f85149">${t("validate.unavailable") || "Validation unavailable"}</div>`;
    collapsedSummary.textContent = "⚠ Error";
    panel.style.display = "flex";
    panel.classList.add("has-errors");
    panel.classList.remove("has-warnings");
    panel.classList.remove("val-collapsed");

    if (state.valCollapseTimer) clearTimeout(state.valCollapseTimer);
    state.valCollapseTimer = setTimeout(() => {
      panel.classList.add("val-collapsed");
    }, 10000);
  }
}

function expandValPanel() {
  const panel = document.getElementById("valPanel");
  panel.classList.remove("val-collapsed");
  if (state.valCollapseTimer) clearTimeout(state.valCollapseTimer);
}

function closeValPanel() {
  const panel = document.getElementById("valPanel");
  panel.style.display = "none";
  if (state.valCollapseTimer) clearTimeout(state.valCollapseTimer);
}

function initValResize() {
  const handle = document.getElementById("valResizeHandle");
  const panel = document.getElementById("valPanel");
  if (!handle || !panel) return;

  let dragging = false;
  let startX, startY, startW, startH;

  handle.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = panel.offsetWidth;
    startH = panel.offsetHeight;
    // ponytail: lock height so drag controls actual size, not max-height cap
    panel.style.height = startH + "px";
    panel.style.maxHeight = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = startX - e.clientX;
    const dy = startY - e.clientY;
    panel.style.width = Math.max(200, startW + dx) + "px";
    panel.style.height = Math.max(100, startH + dy) + "px";
  });

  document.addEventListener("mouseup", () => { dragging = false; });
}

// ── Toast ──
function toast(msg, isError = false) {
  const el = document.createElement("div");
  el.className = `toast${isError ? " error" : ""}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── Utilities ──
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ── Drag-and-drop file support ──
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();

  // Handle multiple files / folder drops
  const dt = e.dataTransfer;
  if (!dt) return;

  const files = dt.files;
  if (!files || files.length === 0) return;

  // If multiple files, filter to JSON
  const jsonFiles = Array.from(files).filter(f => f.name.endsWith(".json"));
  if (jsonFiles.length === 0) { toast("No JSON files dropped", true); return; }

  uploadFilesToServer(jsonFiles).then(() => {
    if (document.getElementById("fileBrowser").style.display !== "none") fetchFileList(state.fbCurrentDir);
  });
});

// ── Dirty check on navigate away ──
window.addEventListener("beforeunload", (e) => {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
