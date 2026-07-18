# Smart Download Router

Smart Download Router is a Manifest V3 Chrome/Edge extension that routes new downloads
into configured subfolders based on the website they come from.

Examples:

- `ilovepdf.com` -> `dump/chapter-1.pdf`
- `smallpdf.com` -> `dump/merged.pdf`
- `chaicode.com` -> `cohort/notes/week-1.pdf`

## Browser Download Path Limitation

Chrome extension download routing can reliably suggest filenames and relative paths inside
the browser's configured default download directory. It cannot directly write to arbitrary
absolute paths such as `C:/Users/you/Desktop/dump` using only the `chrome.downloads` API.

This MVP intentionally uses relative folder routing:

- `dump/filename.pdf`
- `cohort/notes/filename.pdf`

If your browser's default download directory is `Downloads`, then `dump/filename.pdf` lands
in `Downloads/dump/filename.pdf`.

For true Desktop path support later, use one of these approaches:

1. Manually set the browser default download directory to Desktop, then configure extension
   folders such as `dump` or `cohort/notes`.
2. Add a Native Messaging helper app that can move files to approved absolute locations
   after the browser download completes.

## Features

- Manifest V3 extension for Chrome and Edge.
- Uses `chrome.downloads.onDeterminingFilename` to suggest routed filenames.
- Matches enabled rules by exact domain, wildcard domain, or URL-contains pattern.
- Preserves the original filename while sanitizing unsafe path characters.
- Uses Chrome's `uniquify` conflict action for routed downloads.
- Stores rules in `chrome.storage.sync` with fallback to `chrome.storage.local`.
- Options page supports add, edit, delete, enable/disable, URL testing, JSON export, and JSON import.
- Popup shows enabled status, active rule count, options link, and recent routed downloads.
- No analytics, no remote code, no backend, and no unnecessary host permissions.

## Default Rules

The first run seeds these sample rules:

| Rule           | Match type   | Folder         |
| -------------- | ------------ | -------------- |
| `ilovepdf.com` | Exact domain | `dump`         |
| `smallpdf.com` | Exact domain | `dump`         |
| `chaicode.com` | Exact domain | `cohort/notes` |

## Rule Matching

Rule fields:

```ts
type DownloadRule = {
  id: string;
  name: string;
  enabled: boolean;
  domainPattern: string;
  folderPath: string;
  matchType: 'domain' | 'wildcard' | 'urlContains';
  createdAt: string;
  updatedAt: string;
};
```

Matching behavior:

- `domain`: normalized exact hostname match. `www.example.com` normalizes to `example.com`.
- `wildcard`: `*.example.com` matches `example.com`, `docs.example.com`, and deeper subdomains.
- `urlContains`: case-insensitive substring match against the source URL.

When multiple rules match, exact domain rules outrank wildcard rules, and wildcard rules
outrank URL-contains rules. Ties keep the earliest rule.

## Setup

Install dependencies:

```bash
npm install
```

Run all checks:

```bash
npm run check
```

Build the unpacked extension:

```bash
npm run build
```

The build output is written to `dist/`.

## Load Unpacked Extension

Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Select Load unpacked.
4. Choose this project's `dist` folder.

Edge:

1. Open `edge://extensions`.
2. Enable Developer mode.
3. Select Load unpacked.
4. Choose this project's `dist` folder.

## Configure Rules

Open the extension popup and select Open Options.

Add a rule with:

- Rule name: `iLovePDF dump`
- Match type: `Exact domain`
- Domain or pattern: `ilovepdf.com`
- Folder path: `dump`
- Enabled: checked

After saving, future downloads whose source URL or referrer matches `ilovepdf.com` are
suggested as `dump/<original-filename>` inside the browser's default download location.

## Import and Export

The options page exports JSON in this shape:

```json
{
  "exportedAt": "2026-06-30T00:00:00.000Z",
  "rules": []
}
```

Import accepts either the exported object shape or a raw array of rule objects. Imported
rules are validated before they replace the current set.

## Manual Testing Checklist

- Build with `npm run build`.
- Load `dist/` as an unpacked extension.
- Confirm the popup shows Enabled and the active rule count.
- Open Options and verify the three default sample rules appear.
- Add a wildcard rule such as `*.example.com` -> `example`.
- Use Test URL with `https://docs.example.com/file.pdf` and confirm it matches.
- Try an invalid folder such as `../dump` and confirm validation blocks it.
- Export rules, import the exported JSON, and confirm the table refreshes.
- Download a test file from a matching site and confirm it lands in the configured subfolder.
- Download from an unmatched site and confirm the browser default behavior is unchanged.

## Development

Useful scripts:

```bash
npm run dev          # watch build for unpacked-extension development
npm run typecheck    # TypeScript only
npm run test         # Vitest unit tests
npm run build        # production build
npm run check        # typecheck, tests, and build
npm run format       # Prettier
```

Project layout:

```text
src/background  # download interception and service worker wiring
src/options     # options page UI
src/popup       # extension popup UI
src/rules       # matching, validation, sanitization
src/shared      # shared types and utilities
src/storage     # chrome.storage wrappers
```

## Permissions

The extension requests:

- `downloads`: to receive download filename determination events and suggest routed filenames.
- `storage`: to persist routing rules and recent routed download metadata.

No host permissions are requested.

## GitHub

Source repository:

https://github.com/Ashutosh-1304/smart-download-router

## Roadmap

- Native Messaging helper for approved absolute destination folders.
- Optional rule priority controls.
- Per-rule conflict action selection.
- Additional import merge mode.
- Packaged browser-store release workflow.
