(() => {
  'use strict';

  // -----------------------------
  // Data model
  // -----------------------------

  const DATA = {
    categories: [
      {
        name: 'Fitness',
        ideas: [
          '10 Morning Habits for Better Health',
          '5 Workout Mistakes Beginners Make',
          'How to Stay Consistent With Exercise',
          'Best Exercises for Weight Loss',
          'Workout Plan for Busy People (30 Minutes)',
          'Mobility Routine to Improve Your Posture',
          'Strength Training vs. Cardio: What to Choose?',
          'Easy Meal Prep Ideas for Lean Gains',
          'Beginner-friendly HIIT: A Safe Starting Guide',
          'How to Track Progress Without Overthinking',
          'The Science of Sleep for Performance',
          'Train Smarter: Common Recovery Mistakes',
          'Cardio That Doesn’t Burn You Out',
          'Gym Etiquette for New Lifters',
          'Weekly Habits That Build Stamina'
        ]
      },
      {
        name: 'Web Development',
        ideas: [
          'Top HTML Tips Every Developer Should Know',
          'CSS Tricks You Didn\'t Know (Until Now)',
          'JavaScript Projects for Beginners',
          '10 Performance Improvements for Your Website',
          'How to Design Accessible UI in 30 Minutes',
          'The Ultimate Guide to Fetch API',
          'State Management Without Frameworks',
          'Service Workers Explained Simply',
          'Forms That Feel Fast: UX Patterns for Inputs',
          'Common CSS Bugs and How to Fix Them',
          'Build a Responsive Layout That\'s Actually Maintainable',
          'Debugging JavaScript: A Practical Checklist',
          'Promises, async/await, and Real Examples',
          'Web Storage vs Cookies: When to Use What',
          'Modern Dev Workflow: Lint, Format, and Test'
        ]
      },
      {
        name: 'AI',
        ideas: [
          'Best AI Tools in 2026 (For Creators & Developers)',
          'How AI is Changing Education',
          'Future of Artificial Intelligence (With Real Use Cases)',
          'Prompting Basics: Get Better Outputs Fast',
          'AI for Small Businesses: Where It Actually Helps',
          'How to Evaluate AI Quality (Not Just Hype)',
          'Building an AI Workflow Without Complex Setup',
          'What is RAG? Simple Explanation + Example Ideas',
          'AI Content Generation: The Ethics Checklist',
          'Detecting Hallucinations: Practical Techniques',
          'AI Automations for Daily Productivity',
          'How to Train Your Team to Use AI Safely',
          'AI in Healthcare: Opportunities & Challenges',
          'The Future of Code Assistants',
          'AI Trends to Watch This Year'
        ]
      },
      {
        name: 'Business',
        ideas: [
          'How to Start an Online Business (Step-by-Step)',
          'Marketing Strategies for Startups That Work',
          'Small Business Growth Tips for the Next 90 Days',
          'Customer Discovery Questions to Ask Weekly',
          'Pricing Strategy: How to Avoid Undercharging',
          'How to Build a Strong Brand in a Small Team',
          'Sales Funnel Basics (With Easy Examples)',
          'How to Write an Offer People Actually Want',
          'Top Mistakes New Entrepreneurs Make',
          'Effective Lead Generation Ideas for 2026',
          'How to Create a Content Calendar That Converts',
          'Partnerships: Grow Faster With Strategic Allies',
          'Operations That Save Time (Without Hiring More)',
          'Turn Feedback Into Product Improvements',
          'A Simple KPI System for Small Businesses'
        ]
      },
      {
        name: 'Travel',
        ideas: [
          'Best Budget Travel Tips for First-Timers',
          'How to Plan a 3-Day Weekend Trip',
          'Packing Checklist: The Only One You\'ll Need',
          'Hidden Gems to Explore in Any City',
          'Solo Travel Safety: Practical Habits',
          'Foodie Itinerary Ideas for 48 Hours',
          'Travel Photography Tips for Beginners',
          'What to Do When Your Plans Change',
          'How to Find Affordable Hotels (Without Stress)',
          'Best Apps for Smooth Trips',
          'How to Stay Healthy While Traveling',
          'Cultural Etiquette: Respect Without Overthinking',
          'Road Trip Planning: A Simple Template',
          'Train vs Flight: Which Is Better?',
          'A Beginner\'s Guide to Travel Journaling'
        ]
      }
    ],

    contentTypes: ['Blog', 'YouTube', 'Instagram', 'LinkedIn', 'Newsletter'],
    platforms: ['Website', 'Mobile App', 'YouTube', 'TikTok', 'X (Twitter)']
  };

  // -----------------------------
  // DOM
  // -----------------------------

  const $ = (sel) => document.querySelector(sel);

  const elements = {
    year: $('#year'),
    themeToggle: $('#themeToggle'),

    categorySearch: $('#categorySearch'),
    categorySelect: $('#categorySelect'),
    contentTypeSelect: $('#contentTypeSelect'),
    platformSelect: $('#platformSelect'),
    quantitySelect: $('#quantitySelect'),
    generateBtn: $('#generateBtn'),
    clearFavoritesBtn: $('#clearFavoritesBtn'),

    loading: $('#loading'),
    emptyState: $('#emptyState'),
    results: $('#results'),

    favoritesCount: $('#favoritesCount'),
    favoritesEmpty: $('#favoritesEmpty'),
    favoritesList: $('#favoritesList'),

    toastRegion: $('#toastRegion')
  };

  // -----------------------------
  // State
  // -----------------------------

  const STORAGE_KEYS = {
    theme: 'cig_theme',
    favorites: 'cig_favorites'
  };

  const state = {
    theme: 'dark',
    favorites: new Set(), // store idea IDs
    lastBatchIds: []
  };

  // -----------------------------
  // Utilities
  // -----------------------------

  const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

  function normalize(str) {
    return String(str || '').trim().toLowerCase();
  }

  function ideaId({ category, contentType, platform, baseIdea }) {
    return normalize([category, contentType, platform, baseIdea].join('|'));
  }

  function toast(title, body) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `\n      <p class="toast-title">${escapeHtml(title)}</p>\n      <p class="toast-body">${escapeHtml(body || '')}</p>\n    `;
    elements.toastRegion.appendChild(t);
    const remove = () => t.remove();
    setTimeout(remove, 2200);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#39;'
    }[c]));
  }

  function showLoading(show) {
    elements.loading.hidden = !show;
    elements.generateBtn.disabled = show;
  }

  function setEmptyVisibility() {
    const hasAny = elements.results.children.length > 0;
    elements.emptyState.hidden = hasAny;
  }

  function sampleWithoutReplacement(arr, count) {
    const copy = arr.slice();
    const out = [];
    while (out.length < count && copy.length) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  // -----------------------------
  // Rendering
  // -----------------------------

  function renderOptions(selectEl, options, { placeholder } = {}) {
    selectEl.innerHTML = '';
    if (placeholder) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = placeholder;
      selectEl.appendChild(opt);
    }
    for (const v of options) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    }
  }

  function getSelectedCategoryName() {
    return elements.categorySelect.value;
  }

  function getCategoryByName(name) {
    return DATA.categories.find((c) => c.name === name) || null;
  }

  function buildIdeaTitle({ baseIdea, category, contentType, platform }) {
    // Simple, portfolio-friendly formatter; avoids duplicate words.
    // Example: “10 Morning Habits…” + Blog + Website
    const base = baseIdea.replace(/^\s+|\s+$/g, '');
    if (normalize(base).includes(normalize(contentType)) || normalize(base).includes(normalize(platform))) {
      return base;
    }

    // Create a consistent, readable prefix/suffix.
    const ct = contentType ? ` ${contentType}` : '';
    const pf = platform ? ` for ${platform}` : '';

    // If base already starts with a number or strong title, just append.
    return `${base}${ct}${pf}`;
  }

  function createIconButton({ label, title, onClick, active = false, icon }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `icon-btn${active ? ' active' : ''}`;
    btn.setAttribute('aria-label', label);
    btn.title = title;
    btn.innerHTML = icon;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function renderIdeaCard({ baseIdea, category, contentType, platform }) {
    const id = ideaId({ category, contentType, platform, baseIdea });
    const isFav = state.favorites.has(id);
    const text = buildIdeaTitle({ baseIdea, category, contentType, platform });

    const row = document.createElement('div');
    row.className = 'idea';
    row.dataset.ideaId = id;

    const ideaText = document.createElement('div');
    ideaText.className = 'idea-text';
    ideaText.textContent = text;

    const actions = document.createElement('div');
    actions.className = 'idea-actions';

    const copyIcon = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 9h10v10H9V9Z" stroke="currentColor" stroke-width="2"/>
        <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    const favIcon = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21s-7-4.6-9.3-8.7C.6 8.4 2.6 5.5 5.6 5.1c1.8-.2 3.4.6 4.4 2 1-1.4 2.6-2.2 4.4-2 3 .4 5 3.3 2.9 7.2C19 16.4 12 21 12 21Z" stroke="currentColor" stroke-width="2" fill="${isFav ? 'rgba(255,77,109,.18)' : 'none'}"/>
      </svg>
    `;

    const copyBtn = createIconButton({
      label: 'Copy idea',
      title: 'Copy to clipboard',
      icon: copyIcon,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast('Copied', 'Idea copied to clipboard.');
        } catch {
          toast('Copy failed', 'Clipboard permission denied by the browser.');
        }
      }
    });

    const favBtn = createIconButton({
      label: isFav ? 'Remove from favorites' : 'Add to favorites',
      title: isFav ? 'Remove from favorites' : 'Add to favorites',
      icon: favIcon,
      active: isFav,
      onClick: () => {
        if (state.favorites.has(id)) {
          state.favorites.delete(id);
          toast('Removed', 'Removed from favorites.');
        } else {
          state.favorites.add(id);
          toast('Saved', 'Added to favorites.');
        }
        persistFavorites();
        renderFavorites();
        // Update active state quickly
        if (state.favorites.has(id)) {
          favBtn.classList.add('active');
        } else {
          favBtn.classList.remove('active');
        }
      }
    });

    actions.appendChild(copyBtn);
    actions.appendChild(favBtn);

    row.appendChild(ideaText);
    row.appendChild(actions);
    return row;
  }

  // -----------------------------
  // Favorites
  // -----------------------------

  function persistTheme() {
    localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  }

  function loadTheme() {
    const t = localStorage.getItem(STORAGE_KEYS.theme);
    state.theme = t === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeToggle.querySelector('.theme-toggle-icon').textContent = state.theme === 'light' ? '☀️' : '🌙';
  }

  function loadFavorites() {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        state.favorites = new Set(arr);
      }
    } catch {
      // ignore
    }
  }

  function persistFavorites() {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(state.favorites)));
  }

  function getIdeaById(favId) {
    // Since we only store ids, we need to regenerate by searching across the base dataset.
    // We parse the id back is not possible reliably from normalized string without storing payload.
    // So instead, store the payload in a stable map.
    // For scalability, we build a runtime map when rendering.
    return null;
  }

  function buildFavoritesPayloadMap() {
    // Create a full map of id -> rendered idea info.
    // For performance, keep small dataset here.
    const map = new Map();
    for (const cat of DATA.categories) {
      for (const contentType of DATA.contentTypes) {
        for (const platform of DATA.platforms) {
          for (const baseIdea of cat.ideas) {
            const id = ideaId({ category: cat.name, contentType, platform, baseIdea });
            const text = buildIdeaTitle({ baseIdea, category: cat.name, contentType, platform });
            map.set(id, { id, text, category: cat.name, contentType, platform, baseIdea });
          }
        }
      }
    }
    return map;
  }

  function renderFavorites() {
    const count = state.favorites.size;
    elements.favoritesCount.textContent = `${count} saved`;

    elements.favoritesList.innerHTML = '';

    if (count === 0) {
      elements.favoritesEmpty.hidden = false;
      return;
    }

    elements.favoritesEmpty.hidden = true;

    const map = buildFavoritesPayloadMap();
    const favIds = Array.from(state.favorites);

    // Keep it deterministic but still varied.
    favIds.sort((a, b) => a.localeCompare(b));

    for (const id of favIds) {
      const payload = map.get(id);
      if (!payload) continue;

      const card = document.createElement('div');
      card.className = 'idea';
      card.dataset.ideaId = id;

      const textEl = document.createElement('div');
      textEl.className = 'idea-text';
      textEl.textContent = payload.text;

      const actions = document.createElement('div');
      actions.className = 'idea-actions';

      const copyIcon = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 9h10v10H9V9Z" stroke="currentColor" stroke-width="2"/>
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;

      const favIcon = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21s-7-4.6-9.3-8.7C.6 8.4 2.6 5.5 5.6 5.1c1.8-.2 3.4.6 4.4 2 1-1.4 2.6-2.2 4.4-2 3 .4 5 3.3 2.9 7.2C19 16.4 12 21 12 21Z" stroke="currentColor" stroke-width="2" fill="rgba(255,77,109,.18)"/>
        </svg>
      `;

      const copyBtn = createIconButton({
        label: 'Copy favorite',
        title: 'Copy to clipboard',
        icon: copyIcon,
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(payload.text);
            toast('Copied', 'Favorite idea copied.');
          } catch {
            toast('Copy failed', 'Clipboard permission denied by the browser.');
          }
        }
      });

      const removeBtn = createIconButton({
        label: 'Remove favorite',
        title: 'Remove from favorites',
        icon: favIcon,
        active: true,
        onClick: () => {
          state.favorites.delete(id);
          persistFavorites();
          renderFavorites();
          toast('Removed', 'Removed from favorites.');
        }
      });

      actions.appendChild(copyBtn);
      actions.appendChild(removeBtn);

      card.appendChild(textEl);
      card.appendChild(actions);
      elements.favoritesList.appendChild(card);
    }
  }

  // -----------------------------
  // Category search + dropdown
  // -----------------------------

  function renderCategoryDropdown(filterText = '') {
    const q = normalize(filterText);
    const matches = DATA.categories
      .map((c) => c.name)
      .filter((name) => (q ? normalize(name).includes(q) : true));

    const prev = elements.categorySelect.value;

    elements.categorySelect.innerHTML = '';
    for (const name of matches) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      elements.categorySelect.appendChild(opt);
    }

    // If previous selection still exists, keep it; otherwise pick first.
    if (matches.includes(prev)) {
      elements.categorySelect.value = prev;
    } else if (matches.length) {
      elements.categorySelect.value = matches[0];
    }

    // If no results, keep empty but disable generate.
    const hasAny = matches.length > 0;
    elements.generateBtn.disabled = !hasAny;
  }

  // -----------------------------
  // Generator logic
  // -----------------------------

  async function handleGenerate(e) {
    e.preventDefault();

    const categoryName = getSelectedCategoryName();
    const category = getCategoryByName(categoryName);
    if (!category) {
      toast('No category', 'Pick a valid category.');
      return;
    }

    const contentType = elements.contentTypeSelect.value;
    const platform = elements.platformSelect.value;
    const quantity = Number(elements.quantitySelect.value) || 5;

    if (!contentType || !platform) {
      toast('Missing details', 'Select content type and platform.');
      return;
    }

    showLoading(true);
    elements.results.innerHTML = '';

    // Fake short loading for UX; real data is local.
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 250));

    const picks = sampleWithoutReplacement(category.ideas, Math.max(1, quantity));

    elements.lastBatchIds = [];

    for (const baseIdea of picks) {
      const card = renderIdeaCard({
        baseIdea,
        category: category.name,
        contentType,
        platform
      });
      elements.results.appendChild(card);
      const id = ideaId({ category: category.name, contentType, platform, baseIdea });
      elements.lastBatchIds.push(id);
    }

    setEmptyVisibility();
    showLoading(false);
  }

  // -----------------------------
  // Theme toggle
  // -----------------------------

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeToggle.querySelector('.theme-toggle-icon').textContent = state.theme === 'light' ? '☀️' : '🌙';
    persistTheme();
    toast('Theme updated', state.theme === 'light' ? 'Light mode enabled.' : 'Dark mode enabled.');
  }

  // -----------------------------
  // Events
  // -----------------------------

  function bindEvents() {
    elements.themeToggle.addEventListener('click', toggleTheme);

    elements.categorySearch.addEventListener('input', (ev) => {
      renderCategoryDropdown(ev.target.value);
    });

    $('#generatorForm').addEventListener('submit', handleGenerate);

    elements.clearFavoritesBtn.addEventListener('click', () => {
      if (state.favorites.size === 0) {
        toast('Nothing to clear', 'Favorites are already empty.');
        return;
      }
      state.favorites.clear();
      persistFavorites();
      renderFavorites();
      toast('Cleared', 'All favorites removed.');
    });
  }

  // -----------------------------
  // Init
  // -----------------------------

  function init() {
    elements.year.textContent = String(new Date().getFullYear());

    loadTheme();
    loadFavorites();

    renderOptions(elements.contentTypeSelect, DATA.contentTypes);
    renderOptions(elements.platformSelect, DATA.platforms);

    renderCategoryDropdown('');

    elements.emptyState.hidden = false;
    renderFavorites();
    setEmptyVisibility();

    bindEvents();

    // Keep generate button enabled when dropdown has options.
    elements.generateBtn.disabled = elements.categorySelect.options.length === 0;
  }

  init();
})();

