# Chrome Extension Plan: LinkedIn Location & Keyword Filter

This document outlines the design, architecture, and implementation steps for building the "Safe Feed LinkedIn" Chrome Extension.

## 1. Goal & Objectives
The goal is to develop a Chrome extension that automatically filters and hides LinkedIn posts (including feed posts, job listings, and articles) containing specified keywords, locations, states, cities, or demonyms associated with specific countries (e.g., India, Pakistan). The extension will support:
- Easy toggling (On/Off).
- Customizable keyword and location list.
- Dynamic filtering using a DOM MutationObserver to handle LinkedIn's infinite scroll.
- Tracking of filtered posts count.
- A modern, premium user interface for settings.

---

## 2. Technical Stack
- **Manifest Version**: Chrome Extension Manifest V3.
- **Core Languages**: HTML5, CSS3 (Vanilla CSS for styling), Vanilla JavaScript (ES6+).
- **Storage API**: `chrome.storage.local` to store extension state, blocked count, custom keywords, and default lists.
- **Content Script**: Injects DOM manipulation logic, runs in the context of the LinkedIn tab.
- **Popup/Options**: Modern UI with dark/light themes, smooth transitions, and glassmorphic aesthetics.

---

## 3. Architecture & Components

```
safe-feed-linkedin/
├── manifest.json          # Extension manifest (MV3)
├── background.js         # Service worker for background messaging and updates
├── content.js            # Content script to scan and hide posts on LinkedIn
├── popup/
│   ├── popup.html        # Interactive extension popup
│   ├── popup.css         # Styling for popup (Modern UI)
│   └── popup.js          # Logic for popup UI and state management
├── options/
│   ├── options.html      # Detail settings page for keywords & logs
│   ├── options.css       # Styling for options page
│   └── options.js        # Logic for options page
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### A. Manifest V3 (`manifest.json`)
Declares permissions (`storage`, `activeTab`), host permissions (`*://*.linkedin.com/*`), content scripts, and default popup/options pages.

### B. Content Script (`content.js`)
- Runs on LinkedIn pages.
- Listens for changes to the DOM via `MutationObserver`.
- Scans feed items, comments, and job posts.
- Matches text content, author headings, and location tags against a blacklist.
- Hides matching posts completely using a CSS class (e.g., `display: none !important`).
- Increments the filtered count and reports it to the background/storage.

### C. Popup Page (`popup/popup.html`)
- Displays the active status toggle (On/Off).
- Shows live counter of filtered posts.
- Contains links to the advanced Settings (Options) page.
- Beautiful, clean dark/light card layout.

### D. Options Page (`options/options.html`)
- Allows the user to view and edit the default keyword lists (India-related, Pakistan-related).
- Allows adding/removing custom keywords and locations.
- Provides import/export settings.

---

## 4. Implementation Steps

### Phase 1: Planning & Keyword List Assembly
1. Research LinkedIn feed DOM structure:
   - Identify feed post containers (e.g., `.feed-shared-update-v2`, `[data-urn]`, `.artdeco-card`).
   - Identify author metadata containers (names, headlines, locations).
2. Define a comprehensive list of default keywords:
   - Demonyms: `Indian`, `Pakistani`, etc.
   - Major states: `Gujarat`, `Punjab`, `Sindh`, `Maharashtra`, `Tamil Nadu`, `Karnataka`, `Delhi`, etc.
   - Major cities: `Mumbai`, `Karachi`, `Delhi`, `Lahore`, `Bangalore`, `Hyderabad`, `Chennai`, `Kolkata`, `Pune`, `Ahmedabad`, `Islamabad`, `Rawalpindi`, `Faisalabad`, etc.
   - Country names: `India`, `Pakistan`.

### Phase 2: Core Extension Setup (Skeleton)
1. Create `manifest.json`.
2. Generate extension icons.
3. Set up the basic `content.js` and `background.js`.

### Phase 3: Content Script Logic (Filtering & MutationObserver)
1. Write logic to select and check elements.
2. Implement efficient keyword checking (regex boundaries, lowercase normalization).
3. Implement `MutationObserver` to throttle checks and process new feed posts as the user scrolls.
4. Implement a hiding mechanism that doesn't break LinkedIn's scroll layout.

### Phase 4: Popup & Options UI Development
1. Design a premium glassmorphic UI for `popup.html` using modern CSS variables, transitions, and hover effects.
2. Set up `chrome.storage.local` to sync active state and blocked count.
3. Build the settings page (`options.html`) for managing lists.

### Phase 5: Verification & Testing
1. Install the extension in Developer Mode.
2. Test on LinkedIn feed, search pages, and job boards.
3. Monitor performance (CPU/Memory usage) to ensure the observer doesn't slow down the page.

---

## 5. Potential Issues & Mitigations
- **LinkedIn DOM Changes**: LinkedIn frequently changes CSS classes.
  *Mitigation*: Target broader semantic structures or attributes (like `div[data-urn]`, `[data-view-name="feed-feed-detail"]`, or common feed container selectors) and write a robust traversal logic to find the root card element.
- **False Positives**: Filtering common words might hide valid content.
  *Mitigation*: Use word boundary regex boundaries (`\bkeyword\b`) and allow users to fine-tune lists or add whitelisted keywords.
- **Scroll/Layout Glitches**: Hiding items with `display: none` can sometimes cause infinite scroll loading to stop or glitch.
  *Mitigation*: Retain the container but clear its height or hide only the visible content within the post card, or set height to 0 with overflow hidden to keep the node in place.
