const I18N = {
  en: {
    title: "Event Graph Playground",
    subtitle: "Visualize & annotate event graphs in text",
    mode: { view: "View", annotate: "Annotate" },
    file: {
      open: "Open JSON",
      save: "Download",
      new: "New",
      export: "Export PNG",
      loadSample: "Load Sample",
      upload: "📤 Upload JSON",
      uploadFolder: "📁 Upload Folder",
      loading: "Loading…",
      noFiles: "No JSON files found",
      untitled: "Untitled",
      saveServer: "Save to Server",
      saveAsName: "Save as:",
    },
    events: { panel: "Events", add: "Add Event", type: "Type", trigger: "Trigger", span: "Span", count: "events" },
    relations: { panel: "Relations", add: "Add Relation", type: "Type", source: "Source", target: "Target", count: "relations" },
    validate: { button: "Validate", valid: "✓ Valid — no errors found", errors: "errors", warnings: "warnings", found: "found", unavailable: "Validation service unavailable" },
    details: { selectHint: "Click an event or relation to see details", eventId: "Event ID", relId: "Relation ID", edit: "Edit", delete: "Delete", save: "Save Changes", cancel: "Cancel" },
    dialog: {
      newEvent: "New Event",
      triggerLabel: "Trigger text",
      selectType: "Select type",
      createEvent: "Create Event",
      newRelation: "New Relation",
      selectRelationType: "Select relation type",
      createRelation: "Create Relation",
      deleteConfirm: "Delete this item? This cannot be undone.",
      confirm: "Confirm",
      cancel: "Cancel",
    },
    empty: "Open a JSON file or load the sample data to get started.",
    langLabel: "中文",
    graph: { layout: "Layout: Force" },
    sidebar: { toggle: "☰ List", title: "Events & Relations", noEvents: "No events", noRelations: "No relations", jsonTab: "JSON" },
  },
  zh: {
    title: "事件图谱工作台",
    subtitle: "文本事件图谱可视化与标注",
    mode: { view: "查看", annotate: "标注" },
    file: {
      open: "打开文件",
      save: "保存",
      new: "新建",
      export: "导出图片",
      loadSample: "加载示例",
      upload: "📤 上传文件",
      uploadFolder: "📁 上传文件夹",
      loading: "加载中…",
      noFiles: "未找到 JSON 文件",
      untitled: "未命名",
    },
    events: { panel: "事件", add: "添加事件", type: "类型", trigger: "触发词", span: "位置", count: "个事件" },
    relations: { panel: "关系", add: "添加关系", type: "类型", source: "来源", target: "目标", count: "个关系" },
    validate: { button: "验证", valid: "✓ 通过 — 未发现错误", errors: "个错误", warnings: "个警告", found: "发现", unavailable: "验证服务不可用" },
    details: { selectHint: "点击事件或关系查看详情", eventId: "事件ID", relId: "关系ID", edit: "编辑", delete: "删除", save: "保存修改", cancel: "取消" },
    dialog: {
      newEvent: "新建事件",
      triggerLabel: "触发词",
      selectType: "选择类型",
      createEvent: "创建事件",
      newRelation: "新建关系",
      selectRelationType: "选择关系类型",
      createRelation: "创建关系",
      deleteConfirm: "确定删除？此操作不可撤销。",
      confirm: "确定",
      cancel: "取消",
    },
    empty: "打开 JSON 文件或加载示例数据开始使用。",
    langLabel: "English",
    graph: { layout: "布局: 力导向" },
    sidebar: { toggle: "☰ 列表", title: "事件与关系", noEvents: "无事件", noRelations: "无关系", jsonTab: "源文件" },
  },
};

let currentLang = "en";

function t(path) {
  const keys = path.split(".");
  let val = I18N[currentLang];
  for (const k of keys) {
    if (val && val[k] !== undefined) val = val[k];
    else return path;
  }
  return val;
}

function toggleLang() {
  currentLang = currentLang === "en" ? "zh" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (el.tagName === "INPUT" && el.type === "text") {
      // skip input values
    } else if (el.children.length === 0 || el.getAttribute("data-i18n") !== null) {
      el.textContent = t(key);
    }
  });
  const langBtn = document.querySelector("[data-i18n='langLabel']");
  if (langBtn) langBtn.textContent = t("langLabel");
  if (window.updateUI) window.updateUI();
}
