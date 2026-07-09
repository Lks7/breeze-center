# Breeze Bookmark Capture

Minimal Manifest V3 extension for saving browser tabs into Breeze Center.

## Load Locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Choose "Load unpacked".
4. Select `extension/bookmark-capture`.

## Usage

- Keep Breeze Center backend running at `http://localhost:8080`.
- Open the extension popup.
- Set group and tags.
- Click "保存当前页" or "保存当前窗口".

The extension collects title, URL, favicon, meta description, and OpenGraph/Twitter image when available.
