const DEFAULTS = {
  endpoint: "http://localhost:8080",
  group: "later",
  tags: "稍后再读",
};

const endpointInput = document.querySelector("#endpoint");
const groupInput = document.querySelector("#group");
const tagsInput = document.querySelector("#tags");
const groupOptions = document.querySelector("#groupOptions");
const tagOptions = document.querySelector("#tagOptions");
const groupChips = document.querySelector("#groupChips");
const tagChips = document.querySelector("#tagChips");
const countEl = document.querySelector("#count");
const statusEl = document.querySelector("#status");
const saveCurrentBtn = document.querySelector("#saveCurrent");
const saveWindowBtn = document.querySelector("#saveWindow");

init();

async function init() {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  endpointInput.value = settings.endpoint;
  groupInput.value = settings.group;
  tagsInput.value = settings.tags;

  const tabs = await chrome.tabs.query({ currentWindow: true });
  countEl.textContent = `${tabs.length} 个标签页`;

  for (const input of [endpointInput, groupInput, tagsInput]) {
    input.addEventListener("change", saveSettings);
  }
  endpointInput.addEventListener("change", loadExistingOptions);

  saveCurrentBtn.addEventListener("click", saveCurrentTab);
  saveWindowBtn.addEventListener("click", saveCurrentWindow);

  await loadExistingOptions();
}

async function saveSettings() {
  await chrome.storage.sync.set({
    endpoint: endpointInput.value.trim() || DEFAULTS.endpoint,
    group: groupInput.value.trim() || DEFAULTS.group,
    tags: tagsInput.value.trim(),
  });
}

async function loadExistingOptions() {
  try {
    const endpoint = (endpointInput.value.trim() || DEFAULTS.endpoint).replace(/\/+$/, "");
    const response = await fetch(`${endpoint}/api/v1/admin/bookmarks`);
    const json = await response.json();
    if (!response.ok || json?.success === false) return;
    const bookmarks = Array.isArray(json?.data) ? json.data : [];
    const groups = unique(bookmarks.map((item) => item.category || "general")).sort();
    const tags = unique(bookmarks.flatMap((item) => parseTags(item.tags || ""))).sort();
    renderOptions(groupOptions, groups);
    renderOptions(tagOptions, tags);
    renderChips(groupChips, groups, (value) => {
      groupInput.value = value;
      saveSettings();
    });
    renderChips(tagChips, tags, toggleTag);
  } catch {
    renderOptions(groupOptions, []);
    renderOptions(tagOptions, []);
    renderChips(groupChips, [], () => {});
    renderChips(tagChips, [], () => {});
  }
}

async function saveCurrentTab() {
  await withBusy(saveCurrentBtn, async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) throw new Error("没有可保存的当前标签页");
    const payload = await buildBookmark(tab);
    await postBookmark(payload);
    setStatus("已保存当前页", "ok");
  });
}

async function saveCurrentWindow() {
  await withBusy(saveWindowBtn, async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const httpTabs = tabs.filter((tab) => tab.url && /^https?:\/\//i.test(tab.url));
    if (httpTabs.length === 0) throw new Error("当前窗口没有可保存的网页标签");

    let saved = 0;
    for (const tab of httpTabs) {
      const payload = await buildBookmark(tab);
      await postBookmark(payload);
      saved += 1;
      setStatus(`已保存 ${saved}/${httpTabs.length}`);
    }
    setStatus(`已保存 ${saved} 个标签页`, "ok");
  });
}

async function buildBookmark(tab) {
  const metadata = await readPageMetadata(tab.id).catch(() => ({}));
  const title = metadata.title || tab.title || hostTitle(tab.url);
  const summary = firstNonEmpty(metadata.description, metadata.ogDescription, "");
  const thumbnail = absolutizeUrl(
    firstNonEmpty(metadata.ogImage, metadata.twitterImage, ""),
    tab.url
  );

  return {
    title,
    url: tab.url,
    description: summary,
    summary,
    category: groupInput.value.trim() || DEFAULTS.group,
    tags: tagsInput.value.trim(),
    thumbnail_url: thumbnail,
    icon: tab.favIconUrl || "",
    sort_order: 0,
  };
}

async function readPageMetadata(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const meta = (selector) =>
        document.querySelector(selector)?.getAttribute("content")?.trim() || "";
      return {
        title: document.title || "",
        description: meta('meta[name="description"]'),
        ogDescription: meta('meta[property="og:description"]'),
        ogImage: meta('meta[property="og:image"]'),
        twitterImage: meta('meta[name="twitter:image"]'),
      };
    },
  });
  return result?.result || {};
}

async function postBookmark(payload) {
  const endpoint = (endpointInput.value.trim() || DEFAULTS.endpoint).replace(/\/+$/, "");
  const response = await fetch(`${endpoint}/api/v1/admin/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || json?.success === false) {
    throw new Error(json?.error?.message || `保存失败：HTTP ${response.status}`);
  }
}

async function withBusy(button, fn) {
  saveCurrentBtn.disabled = true;
  saveWindowBtn.disabled = true;
  setStatus("正在保存...");
  try {
    await saveSettings();
    await fn();
  } catch (error) {
    setStatus(error?.message || String(error), "error");
  } finally {
    saveCurrentBtn.disabled = false;
    saveWindowBtn.disabled = false;
  }
}

function setStatus(text, type = "") {
  statusEl.textContent = text;
  statusEl.className = type;
}

function renderOptions(target, values) {
  target.replaceChildren(
    ...values.map((value) => {
      const option = document.createElement("option");
      option.value = value;
      return option;
    })
  );
}

function renderChips(target, values, onClick) {
  target.replaceChildren(
    ...values.slice(0, 12).map((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.textContent = value;
      button.addEventListener("click", () => onClick(value));
      return button;
    })
  );
}

function toggleTag(value) {
  const current = parseTags(tagsInput.value);
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  tagsInput.value = next.join(", ");
  saveSettings();
}

function parseTags(value) {
  return unique(
    value
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function firstNonEmpty(...values) {
  return values.find((value) => value && value.trim())?.trim() || "";
}

function absolutizeUrl(value, baseUrl) {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function hostTitle(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "未命名书签";
  }
}
