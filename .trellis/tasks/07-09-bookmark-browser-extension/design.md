# Technical Design

## Extension

- Add a plain Manifest V3 extension under `extension/bookmark-capture/`.
- Use a popup UI with:
  - Backend endpoint input, default `http://localhost:8080`.
  - Group input, default `later`.
  - Tags input, default `稍后再读`.
  - Buttons for "保存当前页" and "保存当前窗口".
- Use permissions:
  - `tabs` to read tab metadata and enumerate current window tabs.
  - `scripting` to read page metadata from the active tab.
  - `storage` to persist endpoint/group/tags.
  - host permissions for `http://localhost:8080/*`, `http://127.0.0.1:8080/*`, `http://*/*`, and `https://*/*`.
- Metadata extraction:
  - title and URL from `chrome.tabs`.
  - favicon from `tab.favIconUrl`.
  - summary from `meta[name=description]` or `og:description`.
  - thumbnail from `og:image` or `twitter:image`.
  - For background tabs where scripting cannot run, fall back to tab title/url/favicon.

## Backend

- Extend bookmarks with:
  - `Summary string` / JSON `summary`.
  - `ThumbnailURL string` / JSON `thumbnail_url`.
- Add SQLite columns with empty string defaults.
- Include the new fields in create, update, list, and get SQL.

## Frontend

- Extend `Bookmark` type with `summary` and `thumbnail_url`.
- Update bookmark cards:
  - Show image thumbnail when `thumbnail_url` exists.
  - Fall back to existing letter badge otherwise.
  - Prefer `summary`, then `description`, as card text.

## Compatibility

- Existing bookmarks render normally with empty thumbnail/summary.
- Admin CRUD remains generic and gains optional fields so captured data can be edited.
