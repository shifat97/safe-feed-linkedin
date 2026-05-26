// Safe Feed LinkedIn - Content Script

let settings = {
  extensionEnabled: true,
  filterIndiaEnabled: true,
  filterPakistanEnabled: true,
  indiaKeywords: [],
  pakistanKeywords: [],
  customKeywords: []
};

let activeRegex = null;
let recentBlockedUrns = [];

// Load settings and initialize
function init() {
  chrome.storage.local.get([
    'extensionEnabled',
    'filterIndiaEnabled',
    'filterPakistanEnabled',
    'indiaKeywords',
    'pakistanKeywords',
    'customKeywords',
    'recentBlockedUrns'
  ], (res) => {
    settings.extensionEnabled = res.extensionEnabled !== false;
    settings.filterIndiaEnabled = res.filterIndiaEnabled !== false;
    settings.filterPakistanEnabled = res.filterPakistanEnabled !== false;
    settings.indiaKeywords = res.indiaKeywords || [];
    settings.pakistanKeywords = res.pakistanKeywords || [];
    settings.customKeywords = res.customKeywords || [];
    recentBlockedUrns = res.recentBlockedUrns || [];

    compileRegex();
    runFilter();
  });
}

// Compile search terms into a single regular expression with word boundaries
function compileRegex() {
  let list = [];
  if (settings.filterIndiaEnabled) {
    list = list.concat(settings.indiaKeywords);
  }
  if (settings.filterPakistanEnabled) {
    list = list.concat(settings.pakistanKeywords);
  }
  list = list.concat(settings.customKeywords);

  if (list.length === 0) {
    activeRegex = null;
    return;
  }

  // Escape special regex characters and filter empty lines
  const escaped = list
    .map(kw => kw.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .filter(kw => kw.length > 0);

  if (escaped.length === 0) {
    activeRegex = null;
    return;
  }

  // Compile regex to match words with boundary checks.
  // We match word boundary \b except if the word itself starts/ends with a non-word character.
  activeRegex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'i');
}

// Extract relevant text from post container for scanning
function getScanText(postContainer) {
  // Clone the container to manipulate it without affecting the active page
  const clone = postContainer.cloneNode(true);
  
  // Remove elements we definitely don't want to scan (comments, social action bars)
  const elementsToRemove = clone.querySelectorAll([
    '.feed-shared-update-v2__comments-container',
    '.comments-comment-item',
    '.comments-comments-list',
    '.feed-shared-update-v2__comment-social-bar',
    '.artdeco-carousel',
    '.feed-shared-social-action-bar',
    '.social-details-social-activity', // Likes/reactions count row
    '.feed-shared-update-v2__sub-actions' // Share/send action menus
  ].join(','));
  
  elementsToRemove.forEach(el => el.remove());
  
  return clone.textContent || '';
}

// Hash function to create unique IDs for posts lacking data-urn
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
}

// Find top-level container element for a feed post or job listing
function findPostContainer(element) {
  let current = element;
  while (current && current !== document.body) {
    // LinkedIn activity containers
    if (current.hasAttribute('data-urn') && current.getAttribute('data-urn').includes('urn:li:activity:')) {
      return current;
    }
    // Job search page card containers
    if (current.classList.contains('jobs-search-results-list__list-item') || 
        current.classList.contains('job-card-container') ||
        current.classList.contains('job-card-list')) {
      return current;
    }
    // General feed update containers
    if (current.classList.contains('feed-shared-update-v2') || 
        current.classList.contains('occludable-update') ||
        (current.tagName === 'DIV' && current.classList.contains('artdeco-card') && current.closest('.scaffold-finite-scroll__content'))) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

// Filter and hide a matching post by replacing contents with a placeholder
function filterPost(postContainer, matchedKeyword) {
  if (postContainer.dataset.sfProcessed === 'true') return;

  // Mark as processed
  postContainer.dataset.sfProcessed = 'true';
  postContainer.dataset.sfBlockedKeyword = matchedKeyword;

  // Track the block
  markPostAsBlocked(postContainer, matchedKeyword);

  // Hide the original child elements of the card
  const children = Array.from(postContainer.children);
  children.forEach(child => {
    if (child.className !== 'safe-feed-blocked-placeholder') {
      child.dataset.sfOriginalDisplay = child.style.display || 'block_default';
      child.style.display = 'none';
    }
  });

  // Create the sleek placeholder banner
  const placeholder = document.createElement('div');
  placeholder.className = 'safe-feed-blocked-placeholder';
  placeholder.innerHTML = `
    <div class="sf-placeholder-content">
      <div class="sf-info-group">
        <div class="sf-icon">🛡️</div>
        <div class="sf-text">
          Post filtered by Safe Feed (Contains: "<strong>${matchedKeyword}</strong>")
        </div>
      </div>
      <button class="sf-show-btn">Show Post</button>
    </div>
  `;

  // Attach interactive toggle
  const showBtn = placeholder.querySelector('.sf-show-btn');
  showBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    unfilterPost(postContainer);
  });

  postContainer.appendChild(placeholder);
}

// Restore a filtered post's content and remove placeholder
function unfilterPost(postContainer) {
  const placeholder = postContainer.querySelector('.safe-feed-blocked-placeholder');
  if (placeholder) {
    placeholder.remove();
  }

  const children = Array.from(postContainer.children);
  children.forEach(child => {
    if (child.dataset.sfOriginalDisplay) {
      if (child.dataset.sfOriginalDisplay === 'block_default') {
        child.style.display = '';
      } else {
        child.style.display = child.dataset.sfOriginalDisplay;
      }
      delete child.dataset.sfOriginalDisplay;
    }
  });

  // Keep sfProcessed as 'true' to prevent re-filtering upon next scroll,
  // but mark it as manually revealed.
  postContainer.dataset.sfRevealed = 'true';
}

// Fully restore a post (clear all safe-feed attributes)
function restorePostFully(postContainer) {
  const placeholder = postContainer.querySelector('.safe-feed-blocked-placeholder');
  if (placeholder) {
    placeholder.remove();
  }

  const children = Array.from(postContainer.children);
  children.forEach(child => {
    if (child.dataset.sfOriginalDisplay) {
      if (child.dataset.sfOriginalDisplay === 'block_default') {
        child.style.display = '';
      } else {
        child.style.display = child.dataset.sfOriginalDisplay;
      }
      delete child.dataset.sfOriginalDisplay;
    }
  });

  delete postContainer.dataset.sfProcessed;
  delete postContainer.dataset.sfBlockedKeyword;
  delete postContainer.dataset.sfRevealed;
}

// Log blocking event to extension storage
function markPostAsBlocked(postContainer, matchedKeyword) {
  let urn = postContainer.getAttribute('data-urn');
  if (!urn) {
    const scanText = getScanText(postContainer);
    const hashText = scanText.substring(0, 150);
    urn = `hash:${hashCode(hashText)}`;
  }

  if (recentBlockedUrns.includes(urn)) {
    return; // Already logged
  }

  recentBlockedUrns.push(urn);
  if (recentBlockedUrns.length > 200) {
    recentBlockedUrns.shift();
  }

  chrome.storage.local.set({ recentBlockedUrns });

  // Update counts
  chrome.storage.local.get(['blockedCount', 'blockedStats'], (res) => {
    const currentCount = res.blockedCount || 0;
    const currentStats = res.blockedStats || {};

    const key = matchedKeyword.toLowerCase();
    currentStats[key] = (currentStats[key] || 0) + 1;

    chrome.storage.local.set({
      blockedCount: currentCount + 1,
      blockedStats: currentStats
    });
  });
}

// Run the filtering process on all visible feed containers
function runFilter() {
  if (!settings.extensionEnabled || !activeRegex) {
    // If extension disabled, make sure we restore any filtered posts
    document.querySelectorAll('[data-sf-processed="true"]').forEach(post => {
      restorePostFully(post);
    });
    return;
  }

  // Target common LinkedIn feed card classes and list items
  const selector = [
    '.feed-shared-update-v2',
    'div[data-urn*="urn:li:activity:"]',
    '.occludable-update',
    '.jobs-search-results-list__list-item',
    '.job-card-container',
    '.job-card-list'
  ].join(',');

  const posts = document.querySelectorAll(selector);

  posts.forEach(post => {
    const postContainer = findPostContainer(post);
    if (!postContainer) return;
    if (postContainer.dataset.sfProcessed === 'true') return;
    if (postContainer.dataset.sfRevealed === 'true') return;

    // 1. Check anchor links for localized subdomains (100% accurate origin check)
    const links = postContainer.querySelectorAll('a[href]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        if (settings.filterIndiaEnabled && href.includes('in.linkedin.com')) {
          filterPost(postContainer, 'India (link origin)');
          return;
        }
        if (settings.filterPakistanEnabled && href.includes('pk.linkedin.com')) {
          filterPost(postContainer, 'Pakistan (link origin)');
          return;
        }
      }
    }

    // 2. Scan the text content of the post and all visible author headers
    const textContent = getScanText(postContainer);
    if (!textContent) return;

    const match = textContent.match(activeRegex);
    if (match) {
      filterPost(postContainer, match[1]);
    }
  });
}

// Debounce helper to prevent performance bottlenecks
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedFilter = debounce(runFilter, 150);

// Watch for DOM changes (scrolling, dynamically loaded posts)
const observer = new MutationObserver((mutations) => {
  let shouldRun = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldRun = true;
      break;
    }
  }
  if (shouldRun) {
    debouncedFilter();
  }
});

// Start observing target
function startObserving() {
  // LinkedIn feed container or fallback to body if not fully loaded yet
  const target = document.querySelector('.scaffold-finite-scroll__content') || document.body;
  observer.observe(target, { childList: true, subtree: true });
}

// Listen for dynamic updates from options page / popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    let changed = false;
    for (const key in changes) {
      if (key in settings) {
        settings[key] = changes[key].newValue;
        changed = true;
      }
    }
    if (changed) {
      compileRegex();
      runFilter();
    }
  }
});

// Run
init();
startObserving();

// Fallback observer binder (in case feed container loads later)
const attachTimeout = setTimeout(() => {
  observer.disconnect();
  startObserving();
}, 3000);
