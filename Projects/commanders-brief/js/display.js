// Display/Briefing page controller
(function() {
  'use strict';

  var data = null;
  var mapEngine = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    data = loadFromStorage() || deepClone(DEFAULT_DATA);
    renderAll();
    initFullscreen();
    initTableHover();

    // Auto-update when admin saves (cross-tab)
    window.addEventListener('storage', function(e) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          data = migrateData(JSON.parse(e.newValue));
          renderAll();
        } catch (err) {
          console.warn('Auto-refresh failed:', err);
        }
      }
    });

    // Auto-refresh when returning to this tab (same-tab navigation from editor)
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        var fresh = loadFromStorage();
        if (fresh) {
          data = fresh;
          renderAll();
        }
      }
    });
  }

  function renderAll() {
    renderHeader();
    renderKPIs();
    renderMap();
    renderCurrentMissions();
    renderPlannedMissions();
    renderPersonnel();
  }

  function renderHeader() {
    document.getElementById('header-title').textContent = data.overview.title || '';
    document.getElementById('header-date').textContent  = data.overview.updated || '';
  }

  function renderKPIs() {
    setText('kpi-assets',    data.overview.total_assets_deployed);
    setText('kpi-missions',  data.overview.current_missions);
    setText('kpi-personnel', data.overview.personnel_mobilized_rc);
  }

  function renderMap() {
    if (!mapEngine) {
      var container = document.getElementById('map-pane');
      mapEngine = new MapEngine(container, { showCalibration: false });
    }
    mapEngine.render(data);
  }

  function missionRoute(m) {
    var dep = (m.dep_icao || '').trim();
    var arr = (m.arr_icao || m.map_icao || '').trim();
    if (dep && arr) return esc(dep) + ' &rarr; ' + esc(arr);
    return esc(arr || dep);
  }

  function renderCurrentMissions() {
    var tbody = document.getElementById('tbody-current');
    tbody.innerHTML = '';
    if (!data.currentMissions.length) {
      tbody.appendChild(emptyRow(4, 'No current missions'));
      return;
    }
    data.currentMissions.forEach(function(m, i) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-route-key', 'current-' + i);
      tr.innerHTML =
        '<td class="col-mission">' + esc(m.mission_name) + '</td>' +
        '<td class="col-assets">'  + esc(m.assigned_assets) + '</td>' +
        '<td class="col-status">'  + statusBadge(m.status, m.status_style) + '</td>' +
        '<td class="col-route">'   + missionRoute(m) + '</td>';
      tbody.appendChild(tr);
    });
  }

  function renderPlannedMissions() {
    var tbody = document.getElementById('tbody-planned');
    tbody.innerHTML = '';
    if (!data.plannedMissions.length) {
      tbody.appendChild(emptyRow(5, 'No planned missions'));
      return;
    }
    data.plannedMissions.forEach(function(m, i) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-route-key', 'planned-' + i);
      tr.innerHTML =
        '<td class="col-mission">' + esc(m.mission_name) + '</td>' +
        '<td class="col-assets">'  + esc(m.assigned_assets) + '</td>' +
        '<td class="col-date">'    + formatDate(m.planned_date) + '</td>' +
        '<td class="col-status">'  + statusBadge(m.status, m.status_style) + '</td>' +
        '<td class="col-route">'   + missionRoute(m) + '</td>';
      tbody.appendChild(tr);
    });
  }

  function renderPersonnel() {
    var tbody = document.getElementById('tbody-personnel');
    tbody.innerHTML = '';
    if (!data.personnel.length) {
      tbody.appendChild(emptyRow(3, 'No personnel data'));
      return;
    }
    data.personnel.forEach(function(p) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(p.order_type) + '</td>' +
        '<td class="col-number">' + (p.total_personnel || 0) + '</td>' +
        '<td class="col-assets">' + esc(p.key_units) + '</td>';
      tbody.appendChild(tr);
    });
  }

  // ── Fullscreen toggle ──
  function initFullscreen() {
    var btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    btn.addEventListener('click', function() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.body.requestFullscreen().catch(function() {
          document.body.classList.toggle('is-fullscreen');
        });
      }
    });
    document.addEventListener('fullscreenchange', function() {
      document.body.classList.toggle('is-fullscreen', !!document.fullscreenElement);
      if (mapEngine) setTimeout(function() { mapEngine.render(data); }, 100);
    });
  }

  // ── Table ↔ Map hover interaction ──
  function initTableHover() {
    var pane = document.getElementById('tables-pane');
    if (!pane) return;
    var activeKey = null;

    pane.addEventListener('mouseover', function(e) {
      var row = e.target.closest('tr[data-route-key]');
      var key = row ? row.getAttribute('data-route-key') : null;
      if (key === activeKey) return;
      if (activeKey) {
        var prev = pane.querySelector('tr[data-route-key="' + activeKey + '"]');
        if (prev) prev.classList.remove('row-highlight');
        if (mapEngine) mapEngine.clearHighlight();
      }
      activeKey = key;
      if (key) {
        row.classList.add('row-highlight');
        if (mapEngine) mapEngine.highlightMission(key);
      }
    });

    pane.addEventListener('mouseleave', function() {
      if (activeKey) {
        var prev = pane.querySelector('tr[data-route-key="' + activeKey + '"]');
        if (prev) prev.classList.remove('row-highlight');
        if (mapEngine) mapEngine.clearHighlight();
        activeKey = null;
      }
    });
  }

  // ── Helpers ──
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val != null ? val : '--';
  }

  function esc(str) {
    if (str == null) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function statusBadge(text, style) {
    style = style || 'info';
    return '<span class="status-badge status-' + esc(style) + '">' + esc(text) + '</span>';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr + 'T00:00:00');
      var months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
      return d.getDate() + ' ' + months[d.getMonth()];
    } catch (e) {
      return esc(dateStr);
    }
  }

  function emptyRow(colspan, msg) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = colspan;
    td.style.cssText = 'text-align:center;color:var(--text-muted);padding:12px;font-style:italic;';
    td.textContent = msg;
    tr.appendChild(td);
    return tr;
  }

})();
