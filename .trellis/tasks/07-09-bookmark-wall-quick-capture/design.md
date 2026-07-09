# Technical Design

## Backend

- Extend `store.Bookmark` with:
  - `Tags string` mapped to JSON `tags`.
  - `LastOpenedAt string` mapped to JSON `last_opened_at`.
- Extend `BookmarkInput` with `Tags`.
- Update `bookmarks` schema and startup migration with `tags` and `last_opened_at` text columns defaulting to empty strings.
- Update list/get/create/update SQL to read and persist tags.
- Add `BookmarkStore.MarkOpened(id)` to set `last_opened_at` and `updated_at` to `now()`.
- Add `BookmarkHandler.MarkOpened` and route `PATCH /api/v1/admin/bookmarks/{id}/open`.

## Frontend API and Types

- Extend `Bookmark` type with `tags` and `last_opened_at`.
- Extend `bookmarkAPI` with `markOpened(id)`.
- Keep all create/update payloads as partial bookmark objects to match the existing admin collection helper.

## Bookmark Wall UX

- Replace the read-only wall with a compact utility page:
  - Top bar remains home/admin navigation.
  - Add a quick-capture panel at the top.
  - Single URL field supports Enter to save immediately.
  - Multi-line textarea accepts one URL per line or "title url" lines.
  - Group and tags are shared defaults for the capture panel.
  - Query param `?url=...&title=...` can prefill the single add form for future bookmarklet/extension use.
- Below capture, show toolbar filters:
  - group chips from existing bookmark categories.
  - tag chips parsed from comma/space separated tags.
  - stale sort with stale links first.
- Cards display title, description, URL, tags, saved date, and unopened days.
- Opening a card calls `markOpened` optimistically before navigating in a new tab.

## Compatibility

- Existing bookmarks without `tags` or `last_opened_at` show empty tags and compute unopened days from `created_at`.
- Existing admin page remains generic and only gains a tags field.
