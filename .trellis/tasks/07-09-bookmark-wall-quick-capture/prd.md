# 书签墙快捷收集与清理信号

## Goal

Make the bookmark wall useful as a fast personal capture space for scattered links: quick add, batch collection, grouping, tags, and cleanup signals based on how long a link has not been opened.

## Requirements

- The main bookmark wall page must provide a fast add flow without requiring a trip to the admin backend.
- Users must be able to save one URL quickly and also paste multiple lines of URLs for later-reading style collection.
- Bookmarks must support both a group field and a tags field. Existing `category` remains the persisted group concept for compatibility, but the UI should call it "分组".
- Every bookmark must expose its saved time. Existing `created_at` is the saved time.
- The system must record when a bookmark is opened from the bookmark wall.
- The bookmark wall must show how many days each link has not been opened. For never-opened links, count from saved time.
- The bookmark wall must make stale links easy to notice for later cleanup.
- Admin editing must include tags so existing CRUD remains complete.

## Constraints

- A normal web page cannot read all currently open browser tabs. This task should support fast manual and batch capture; browser-extension tab collection is out of scope.
- Existing bookmark data must remain compatible after migration.
- Keep the implementation local to the current Go/React stack and existing admin API style.

## Acceptance Criteria

- [ ] Bookmark records include `tags` and `last_opened_at` in backend responses and frontend types.
- [ ] Existing SQLite databases migrate automatically with the new columns.
- [ ] The bookmark wall has a quick-capture panel for single URL and multi-line URL input.
- [ ] New bookmarks can be created with group and tags from the bookmark wall.
- [ ] Opening a bookmark from the wall updates `last_opened_at`.
- [ ] Cards display saved date and "未打开 N 天" based on `last_opened_at || created_at`.
- [ ] The wall supports group filtering and tag filtering.
- [ ] Admin bookmark form can edit tags.
- [ ] Frontend typecheck/build and backend Go tests/build checks pass.

## Notes

- Future enhancement: a browser extension or bookmarklet can call the same create API to collect tabs automatically.
