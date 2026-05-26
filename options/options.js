// Safe Feed LinkedIn - Options Logic

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const totalBlockedBadge = document.getElementById('total-blocked-badge');
  const statsList = document.getElementById('stats-list');
  const addKeywordForm = document.getElementById('add-keyword-form');
  const keywordInput = document.getElementById('keyword-input');
  const customTagsList = document.getElementById('custom-tags-list');
  
  const indiaDbToggle = document.getElementById('india-db-toggle');
  const indiaCountBadge = document.getElementById('india-count-badge');
  const indiaSearch = document.getElementById('india-search');
  const indiaKeywordsList = document.getElementById('india-keywords-list');

  const pakistanDbToggle = document.getElementById('pakistan-db-toggle');
  const pakistanCountBadge = document.getElementById('pakistan-count-badge');
  const pakistanSearch = document.getElementById('pakistan-search');
  const pakistanKeywordsList = document.getElementById('pakistan-keywords-list');

  const resetAllBtn = document.getElementById('reset-all-btn');

  // Databases cached local state
  let indiaDb = [];
  let pakistanDb = [];
  let customKws = [];

  // Initialize and load settings
  function init() {
    chrome.storage.local.get([
      'blockedCount',
      'blockedStats',
      'customKeywords',
      'indiaKeywords',
      'pakistanKeywords',
      'filterIndiaEnabled',
      'filterPakistanEnabled'
    ], (res) => {
      // 1. Stats Setup
      totalBlockedBadge.textContent = res.blockedCount || 0;
      renderStats(res.blockedStats || {});

      // 2. Custom Keywords Setup
      customKws = res.customKeywords || [];
      renderCustomTags();

      // 3. India Database Setup
      indiaDb = res.indiaKeywords || [];
      indiaDbToggle.checked = res.filterIndiaEnabled !== false;
      indiaCountBadge.textContent = `${indiaDb.length} keywords`;
      renderViewer(indiaKeywordsList, indiaDb, '');

      // 4. Pakistan Database Setup
      pakistanDb = res.pakistanKeywords || [];
      pakistanDbToggle.checked = res.filterPakistanEnabled !== false;
      pakistanCountBadge.textContent = `${pakistanDb.length} keywords`;
      renderViewer(pakistanKeywordsList, pakistanDb, '');

      // Enable/disable viewer visibility based on database toggle
      togglePanelState(indiaKeywordsList, indiaSearch, indiaDbToggle.checked);
      togglePanelState(pakistanKeywordsList, pakistanSearch, pakistanDbToggle.checked);
    });
  }

  // Render Stats Breakdown list
  function renderStats(stats) {
    statsList.innerHTML = '';
    
    // Convert stats object to array and sort by count descending
    const sortedStats = Object.entries(stats)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    if (sortedStats.length === 0) {
      statsList.innerHTML = '<div class="empty-stats">No blocks logged yet. Keep browsing!</div>';
      return;
    }

    const maxCount = sortedStats[0].count; // Used to calculate bar width %

    sortedStats.forEach(item => {
      const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
      
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <div class="stat-row-info">
          <span class="stat-row-name">${escapeHtml(item.word)}</span>
          <span class="stat-row-count">${item.count}</span>
        </div>
        <div class="stat-row-bar-bg">
          <div class="stat-row-bar-fill" style="width: ${percentage}%"></div>
        </div>
      `;
      statsList.appendChild(row);
    });
  }

  // Render custom keyword tag chips
  function renderCustomTags() {
    customTagsList.innerHTML = '';
    
    if (customKws.length === 0) {
      customTagsList.innerHTML = '<span class="no-tags">No custom keywords added yet. Add one above!</span>';
      return;
    }

    customKws.forEach((kw, index) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.innerHTML = `
        <span>${escapeHtml(kw)}</span>
        <button class="btn-tag-remove" data-index="${index}" title="Remove word">&times;</button>
      `;
      customTagsList.appendChild(tag);
    });
  }

  // Render keyword database viewers with highlights
  function renderViewer(container, list, searchTerm) {
    container.innerHTML = '';
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = term ? list.filter(w => w.toLowerCase().includes(term)) : list;

    if (filtered.length === 0) {
      container.innerHTML = '<span class="no-view-chips">No matches found.</span>';
      return;
    }

    filtered.forEach(kw => {
      const chip = document.createElement('span');
      chip.className = 'view-chip';
      if (term && kw.toLowerCase().includes(term)) {
        chip.className += ' match-highlight';
      }
      chip.textContent = kw;
      container.appendChild(chip);
    });
  }

  // Helper to toggle input and list viewer opacity based on active status
  function togglePanelState(listEl, searchEl, enabled) {
    if (enabled) {
      listEl.style.opacity = '1';
      listEl.style.pointerEvents = 'auto';
      searchEl.disabled = false;
      searchEl.style.opacity = '1';
    } else {
      listEl.style.opacity = '0.4';
      listEl.style.pointerEvents = 'none';
      searchEl.disabled = true;
      searchEl.style.opacity = '0.5';
    }
  }

  // Add Custom Keyword form listener
  addKeywordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newKw = keywordInput.value.trim();
    if (!newKw) return;

    if (!customKws.some(kw => kw.toLowerCase() === newKw.toLowerCase())) {
      customKws.push(newKw);
      chrome.storage.local.set({ customKeywords: customKws }, () => {
        keywordInput.value = '';
        renderCustomTags();
      });
    } else {
      alert(`"${newKw}" is already in your custom block list.`);
    }
  });

  // Remove Custom Keyword click listener (event delegation)
  customTagsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-tag-remove')) {
      const index = parseInt(e.target.getAttribute('data-index'), 10);
      customKws.splice(index, 1);
      chrome.storage.local.set({ customKeywords: customKws }, () => {
        renderCustomTags();
      });
    }
  });

  // India database search input
  indiaSearch.addEventListener('input', () => {
    renderViewer(indiaKeywordsList, indiaDb, indiaSearch.value);
  });

  // Pakistan database search input
  pakistanSearch.addEventListener('input', () => {
    renderViewer(pakistanKeywordsList, pakistanDb, pakistanSearch.value);
  });

  // India Database Toggle listener
  indiaDbToggle.addEventListener('change', () => {
    const checked = indiaDbToggle.checked;
    chrome.storage.local.set({ filterIndiaEnabled: checked }, () => {
      togglePanelState(indiaKeywordsList, indiaSearch, checked);
    });
  });

  // Pakistan Database Toggle listener
  pakistanDbToggle.addEventListener('change', () => {
    const checked = pakistanDbToggle.checked;
    chrome.storage.local.set({ filterPakistanEnabled: checked }, () => {
      togglePanelState(pakistanKeywordsList, pakistanSearch, checked);
    });
  });

  // Reset all listener
  resetAllBtn.addEventListener('click', () => {
    if (confirm('WARNING: This will reset all your settings, custom keywords, and blocked statistics. Are you sure?')) {
      chrome.runtime.sendMessage({ action: "resetToDefaults" }, (response) => {
        if (response && response.success) {
          window.location.reload();
        }
      });
    }
  });

  // Listen for changes from storage (e.g. if updated from popup or feed blocks)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.blockedCount) {
        totalBlockedBadge.textContent = changes.blockedCount.newValue;
      }
      if (changes.blockedStats) {
        renderStats(changes.blockedStats.newValue || {});
      }
      if (changes.customKeywords) {
        customKws = changes.customKeywords.newValue || [];
        renderCustomTags();
      }
      if (changes.filterIndiaEnabled) {
        indiaDbToggle.checked = changes.filterIndiaEnabled.newValue;
        togglePanelState(indiaKeywordsList, indiaSearch, changes.filterIndiaEnabled.newValue);
      }
      if (changes.filterPakistanEnabled) {
        pakistanDbToggle.checked = changes.filterPakistanEnabled.newValue;
        togglePanelState(pakistanKeywordsList, pakistanSearch, changes.filterPakistanEnabled.newValue);
      }
    }
  });

  // Helper to escape HTML tags to prevent XSS
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Load initially
  init();
});
