// Theme toggle — persists to localStorage, respects OS preference on first visit
(function() {
  var THEME_KEY = 'cnafr_theme';

  function getPreferred() {
    var stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light' : 'dark';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = theme === 'dark' ? '\u2600 Light' : '\u263E Dark';
    }
  }

  // Apply immediately to prevent flash of wrong theme
  apply(getPreferred());

  document.addEventListener('DOMContentLoaded', function() {
    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        apply(current === 'dark' ? 'light' : 'dark');
      });
    }
    // Ensure button labels are correct
    apply(getPreferred());
  });
})();
