// Safe Feed LinkedIn - Popup Logic

document.addEventListener('DOMContentLoaded', () => {
  const mainToggle = document.getElementById('main-toggle');
  const indiaToggle = document.getElementById('india-toggle');
  const pakistanToggle = document.getElementById('pakistan-toggle');
  const statsCount = document.getElementById('stats-count');
  const quickAddForm = document.getElementById('quick-add-form');
  const quickKeywordInput = document.getElementById('quick-keyword-input');
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const resetCounterBtn = document.getElementById('reset-counter-btn');

  // Load and apply settings
  function loadSettings() {
    chrome.storage.local.get([
      'extensionEnabled',
      'filterIndiaEnabled',
      'filterPakistanEnabled',
      'blockedCount'
    ], (res) => {
      mainToggle.checked = res.extensionEnabled !== false;
      indiaToggle.checked = res.filterIndiaEnabled !== false;
      pakistanToggle.checked = res.filterPakistanEnabled !== false;
      
      // Animate/set stats count
      animateCounter(statsCount, res.blockedCount || 0);

      // Disable/grey out small toggles if main extension is off
      toggleSubControls(mainToggle.checked);
    });
  }

  // Soft animation for counter
  function animateCounter(element, targetValue) {
    const duration = 800; // ms
    const startTime = performance.now();
    const startValue = parseInt(element.textContent, 10) || 0;

    if (startValue === targetValue) {
      element.textContent = targetValue;
      return;
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
      
      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = targetValue;
      }
    }

    requestAnimationFrame(update);
  }

  // Toggle sub-control responsiveness
  function toggleSubControls(enabled) {
    indiaToggle.disabled = !enabled;
    pakistanToggle.disabled = !enabled;
    quickKeywordInput.disabled = !enabled;
    quickAddForm.querySelector('button').disabled = !enabled;

    // Visual feedback
    document.querySelectorAll('.filter-item, .quick-add-form').forEach(el => {
      if (enabled) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0.5';
        el.style.pointerEvents = 'none';
      }
    });
  }

  // Main Toggle listener
  mainToggle.addEventListener('change', () => {
    const enabled = mainToggle.checked;
    chrome.storage.local.set({ extensionEnabled: enabled });
    toggleSubControls(enabled);
  });

  // India Toggle listener
  indiaToggle.addEventListener('change', () => {
    chrome.storage.local.set({ filterIndiaEnabled: indiaToggle.checked });
  });

  // Pakistan Toggle listener
  pakistanToggle.addEventListener('change', () => {
    chrome.storage.local.set({ filterPakistanEnabled: pakistanToggle.checked });
  });

  // Quick Add Keyword listener
  quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newKw = quickKeywordInput.value.trim();
    if (!newKw) return;

    chrome.storage.local.get(['customKeywords'], (res) => {
      const customKeywords = res.customKeywords || [];
      // Avoid duplicate entry
      if (!customKeywords.some(kw => kw.toLowerCase() === newKw.toLowerCase())) {
        customKeywords.push(newKw);
        chrome.storage.local.set({ customKeywords }, () => {
          quickKeywordInput.value = '';
          
          // Flash input border green for success feedback
          quickKeywordInput.style.borderColor = 'var(--success-color)';
          setTimeout(() => {
            quickKeywordInput.style.borderColor = '';
          }, 1000);
        });
      } else {
        // Flash input red for duplicate
        quickKeywordInput.style.borderColor = 'var(--danger-color)';
        setTimeout(() => {
          quickKeywordInput.style.borderColor = '';
        }, 1000);
      }
    });
  });

  // Reset Counter listener
  resetCounterBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the blocked posts counter?')) {
      chrome.storage.local.set({
        blockedCount: 0,
        blockedStats: {}
      }, () => {
        animateCounter(statsCount, 0);
      });
    }
  });

  // Open Options page
  openSettingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

  // Load initially
  loadSettings();
});
