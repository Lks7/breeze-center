# 浏览器扩展书签收集 MVP

## Goal

Build a minimal Chrome/Edge-compatible browser extension that captures the current tab or all tabs in the current window into the existing bookmark wall.

## Requirements

- The extension must support saving the current active tab.
- The extension must support saving all tabs in the current browser window.
- The extension popup must let the user set group and tags for captured bookmarks.
- The extension popup should offer existing groups and tags as selectable shortcuts while still allowing new values.
- The extension should collect title, URL, favicon, OpenGraph image, and meta description from pages when available.
- Backend bookmarks must persist thumbnail URL and one-line summary.
- The bookmark wall must display thumbnail and summary when available.
- The MVP must not depend on an LLM API.
- The extension should target local development backend `http://localhost:8080` by default.

## Acceptance Criteria

- [ ] A loadable Manifest V3 extension exists in the repository.
- [ ] The popup saves the active tab into `/api/v1/admin/bookmarks`.
- [ ] The popup saves all tabs in the current window into `/api/v1/admin/bookmarks`.
- [ ] Captured bookmarks include group, tags, favicon/icon URL, thumbnail URL, and summary when available.
- [ ] Existing groups and tags can be selected in the extension popup without manually retyping them.
- [ ] Backend bookmark responses include `thumbnail_url` and `summary`.
- [ ] Existing SQLite databases migrate automatically with the new columns.
- [ ] The bookmark wall renders thumbnails and summaries.
- [ ] Backend tests/build and frontend typecheck/build pass.

## Notes

- Browser tab capture is implemented by extension APIs, not by the web page itself.
