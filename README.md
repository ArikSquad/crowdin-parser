# Crowdin Parser

Chrome extension that intercepts Crowdin editor network requests and generates `.properties` files.

## How It Works

1. **Install** the extension in Chrome (see below)
2. **Navigate** to a Crowdin translation editor page
3. **Click** the extension icon and press **Start Listening**
4. **Browse** through pages in the Crowdin editor — the extension intercepts all API responses containing phrase data
5. Once all pages are collected, press **Generate .properties** to create and download the files

The extension generates **two `.properties` files per file group**:

- `en_<group>.properties` — English source text (the `text` field)
- `translated_<group>.properties` — Translation text (the `top_suggestion_text` field)

Keys follow the format `<group>.0`, `<group>.1`, etc., with the original Crowdin key preserved as a comment.

## Build

```bash
bun install
bun run build
```

## Install in Chrome

1. Run `bun run build`
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist/` folder

## Development

```bash
bun run dev
```

This starts Vite in watch mode with HMR for the extension.

## Tech Stack

- TypeScript
- Vite
- CRXJS Vite Plugin
- Chrome Extensions Manifest V3
