// Admin/Editor page controller
(function() {
  'use strict';

  var data = loadFromStorage() || deepClone(DEFAULT_DATA);
  var mapEngine = null;
  var mapTimer = null;
  var autoSaveTimer = null;
  var overviewInputs = {};

  // Status style options
  var STATUS_OPTIONS = [
    { value: 'routine', label: 'Routine' },
    { value: 'info',    label: 'Info' },
    { value: 'warn',    label: 'Warning' },
    { value: 'danger',  label: 'Danger' }
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    renderOverview();
    renderCurrentMissions();
    renderPlannedMissions();
    renderPersonnel();
    renderCalibration();
    renderLocations();
    initMapPreview();
    initToolbar();
    initBasemapUpload();
    scheduleMapUpdate();
  }

  // ── Toast shorthand ──
  function toast(msg, type) { showToast(msg, type); }

  // ── Overview Section ──
  function renderOverview() {
    var fields = [
      { key: 'title',                  label: 'Title',                   type: 'text' },
      { key: 'updated',                label: 'Date/Time Updated',       type: 'text' },
      { key: 'total_assets_deployed',  label: 'Total Assets Deployed',   type: 'number' },
      { key: 'current_missions',       label: 'Current Missions',        type: 'number' },
      { key: 'personnel_mobilized_rc', label: 'Personnel Mobilized (RC)',type: 'number' }
    ];
    var container = document.getElementById('overview-fields');
    fields.forEach(function(f) {
      var group = document.createElement('div');
      group.className = 'field-group';

      var lbl = document.createElement('label');
      lbl.textContent = f.label;
      group.appendChild(lbl);

      var inp = document.createElement('input');
      inp.type = f.type;
      inp.value = data.overview[f.key] != null ? data.overview[f.key] : '';
      inp.addEventListener('input', function() {
        data.overview[f.key] = f.type === 'number' ? Number(inp.value) : inp.value;
      });
      group.appendChild(inp);
      container.appendChild(group);
      overviewInputs[f.key] = inp;
    });
  }

  // ── Current Missions ──
  var CM_FIELDS = [
    { key: 'mission_name',    label: 'Mission',  type: 'text',   w: '155px' },
    { key: 'assigned_assets', label: 'Assets',   type: 'text',   w: '140px' },
    { key: 'status',          label: 'Status',   type: 'text',   w: '160px' },
    { key: 'status_style',    label: 'Style',    type: 'select', w: '95px'  },
    { key: 'dep_icao',        label: 'Dep',      type: 'text',   w: '68px', icao: true },
    { key: 'arr_icao',        label: 'Arr',      type: 'text',   w: '68px', icao: true }
  ];

  function renderCurrentMissions() {
    renderArraySection('list-current-missions', data.currentMissions, CM_FIELDS, function() {
      renderCurrentMissions();
    });
  }

  // ── Planned Missions ──
  var PM_FIELDS = [
    { key: 'mission_name',    label: 'Mission',  type: 'text',   w: '140px' },
    { key: 'assigned_assets', label: 'Assets',   type: 'text',   w: '130px' },
    { key: 'planned_date',    label: 'Date',     type: 'date',   w: '125px' },
    { key: 'status',          label: 'Status',   type: 'text',   w: '150px' },
    { key: 'status_style',    label: 'Style',    type: 'select', w: '95px'  },
    { key: 'dep_icao',        label: 'Dep',      type: 'text',   w: '68px', icao: true },
    { key: 'arr_icao',        label: 'Arr',      type: 'text',   w: '68px', icao: true }
  ];

  function renderPlannedMissions() {
    renderArraySection('list-planned-missions', data.plannedMissions, PM_FIELDS, function() {
      renderPlannedMissions();
    });
  }

  // ── Personnel ──
  var P_FIELDS = [
    { key: 'order_type',       label: 'Order Type',  type: 'text',   w: '160px' },
    { key: 'total_personnel',  label: 'Personnel',   type: 'number', w: '100px' },
    { key: 'key_units',        label: 'Key Units',   type: 'text',   w: '300px' }
  ];

  function renderPersonnel() {
    renderArraySection('list-personnel', data.personnel, P_FIELDS, function() {
      renderPersonnel();
    });
  }

  // ── Generic array section renderer ──
  function renderArraySection(containerId, arr, fields, rerender) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';

    // Header row
    var header = document.createElement('div');
    header.className = 'editor-row-header';
    fields.forEach(function(f) {
      var sp = document.createElement('span');
      sp.textContent = f.label;
      sp.style.width = f.w;
      header.appendChild(sp);
    });
    var spacer = document.createElement('span');
    spacer.style.width = '80px';
    header.appendChild(spacer);
    container.appendChild(header);

    // Data rows
    arr.forEach(function(item, idx) {
      container.appendChild(createRow(arr, idx, item, fields, rerender));
    });
  }

  function createRow(arr, idx, item, fields, rerender) {
    var row = document.createElement('div');
    row.className = 'editor-row';

    fields.forEach(function(f) {
      var el;
      if (f.type === 'select') {
        el = document.createElement('select');
        STATUS_OPTIONS.forEach(function(opt) {
          var o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          el.appendChild(o);
        });
        el.value = item[f.key] || 'routine';
        el.addEventListener('change', function() {
          item[f.key] = el.value;
          scheduleMapUpdate();
        });
      } else {
        el = document.createElement('input');
        el.type = f.type;
        el.placeholder = f.label;
        el.value = item[f.key] != null ? item[f.key] : '';
        if (f.icao) {
          el.className = 'icao-input';
          el.maxLength = 4;
        }
        el.addEventListener('input', function() {
          var val = f.type === 'number' ? Number(el.value) : el.value;
          if (f.icao) val = val.toUpperCase();
          item[f.key] = val;
          if (f.icao) {
            el.value = val;
            el.classList.toggle('icao-match', !!lookupICAO(val));
          }
          scheduleMapUpdate();
        });
      }
      el.style.width = f.w;
      row.appendChild(el);
    });

    appendRowActions(row, arr, idx, rerender);

    return row;
  }

  // ── Reorder + remove buttons (shared by createRow and createLocationRow) ──
  function appendRowActions(row, arr, idx, rerender) {
    var upBtn = document.createElement('button');
    upBtn.className = 'btn-reorder';
    upBtn.textContent = '\u25B2';
    upBtn.title = 'Move up';
    upBtn.disabled = (idx === 0);
    upBtn.addEventListener('click', function() {
      if (idx === 0) return;
      var temp = arr[idx - 1];
      arr[idx - 1] = arr[idx];
      arr[idx] = temp;
      rerender();
      scheduleMapUpdate();
    });
    row.appendChild(upBtn);

    var downBtn = document.createElement('button');
    downBtn.className = 'btn-reorder';
    downBtn.textContent = '\u25BC';
    downBtn.title = 'Move down';
    downBtn.disabled = (idx === arr.length - 1);
    downBtn.addEventListener('click', function() {
      if (idx === arr.length - 1) return;
      var temp = arr[idx + 1];
      arr[idx + 1] = arr[idx];
      arr[idx] = temp;
      rerender();
      scheduleMapUpdate();
    });
    row.appendChild(downBtn);

    var rmBtn = document.createElement('button');
    rmBtn.className = 'btn-danger';
    rmBtn.textContent = '\u00D7';
    rmBtn.title = 'Remove';
    rmBtn.addEventListener('click', function() {
      arr.splice(idx, 1);
      rerender();
      scheduleMapUpdate();
    });
    row.appendChild(rmBtn);
  }

  // ── Add-row buttons ──
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    var key = btn.getAttribute('data-add');

    if (key === 'currentMissions') {
      data.currentMissions.push({
        mission_name: '', assigned_assets: '', status: '',
        status_style: 'routine', dep_icao: '', arr_icao: ''
      });
      renderCurrentMissions();
    } else if (key === 'plannedMissions') {
      data.plannedMissions.push({
        mission_name: '', assigned_assets: '', planned_date: '',
        status: '', status_style: 'routine', dep_icao: '', arr_icao: ''
      });
      renderPlannedMissions();
    } else if (key === 'personnel') {
      data.personnel.push({ order_type: '', total_personnel: 0, key_units: '' });
      renderPersonnel();
    } else if (key === 'locations') {
      data.map.locations.push({ label: '', icao: '', lat: 0, lon: 0, color: 'gold' });
      renderLocations();
    }
    scheduleMapUpdate();
  });

  // ── Calibration ──
  function renderCalibration() {
    var calFields = [
      { key: 'geo_left_pct',  label: 'Left %',  group: 'rect' },
      { key: 'geo_top_pct',   label: 'Top %',   group: 'rect' },
      { key: 'geo_width_pct', label: 'Width %',  group: 'rect' },
      { key: 'geo_height_pct',label: 'Height %', group: 'rect' },
      { key: 'lon_left',      label: 'Lon Left',  group: 'geo' },
      { key: 'lon_right',     label: 'Lon Right', group: 'geo' },
      { key: 'lat_top',       label: 'Lat Top',   group: 'geo' },
      { key: 'lat_bottom',    label: 'Lat Bottom', group: 'geo' }
    ];

    var rectContainer = document.getElementById('cal-rect-fields');
    var geoContainer  = document.getElementById('cal-geo-fields');

    calFields.forEach(function(f) {
      var cont = f.group === 'rect' ? rectContainer : geoContainer;
      var group = document.createElement('div');
      group.className = 'field-group';

      var lbl = document.createElement('label');
      lbl.textContent = f.label;
      group.appendChild(lbl);

      var inp = document.createElement('input');
      inp.type = 'number';
      inp.step = '0.1';
      inp.value = data.map.calibration[f.key];
      inp.addEventListener('input', function() {
        data.map.calibration[f.key] = Number(inp.value);
        scheduleMapUpdate();
      });
      group.appendChild(inp);
      cont.appendChild(group);
    });
  }

  // ── Locations ──
  var LOC_FIELDS = [
    { key: 'icao',  label: 'ICAO',  w: '80px',  icao: true },
    { key: 'label', label: 'Label', w: '150px' },
    { key: 'lat',   label: 'Lat',   w: '100px', num: true },
    { key: 'lon',   label: 'Lon',   w: '100px', num: true },
    { key: 'color', label: 'Color', w: '80px' }
  ];

  function renderLocations() {
    var container = document.getElementById('list-locations');
    container.innerHTML = '';

    // Header
    var header = document.createElement('div');
    header.className = 'editor-row-header';
    LOC_FIELDS.forEach(function(f) {
      var sp = document.createElement('span');
      sp.textContent = f.label;
      sp.style.width = f.w;
      header.appendChild(sp);
    });
    var spacer = document.createElement('span');
    spacer.style.width = '80px';
    header.appendChild(spacer);
    container.appendChild(header);

    data.map.locations.forEach(function(loc, idx) {
      container.appendChild(createLocationRow(idx, loc));
    });
  }

  function createLocationRow(idx, loc) {
    var row = document.createElement('div');
    row.className = 'editor-row';
    var inputEls = {};

    LOC_FIELDS.forEach(function(f) {
      var inp = document.createElement('input');
      inp.type = f.num ? 'number' : 'text';
      if (f.num) inp.step = '0.0001';
      inp.placeholder = f.label;
      inp.style.width = f.w;
      inp.value = loc[f.key] != null ? loc[f.key] : '';
      if (f.icao) inp.className = 'icao-input';

      inputEls[f.key] = inp;

      inp.addEventListener('input', function() {
        var val = f.num ? Number(inp.value) : inp.value;
        if (f.icao) {
          val = val.toUpperCase();
          inp.value = val;
          loc.icao = val;
          // Auto-fill from ICAO DB
          var db = val.length === 4 ? lookupICAO(val) : null;
          if (db) {
            loc.lat = db.lat;
            loc.lon = db.lon;
            if (!loc.label) loc.label = db.name;
            inputEls.lat.value = db.lat;
            inputEls.lon.value = db.lon;
            if (!inputEls.label.value) inputEls.label.value = db.name;
            inp.classList.add('icao-match');
            inp.title = db.name;
          } else {
            inp.classList.remove('icao-match');
            inp.title = val.length === 4 ? 'ICAO not in database — enter Lat/Lon manually' : '';
          }
        } else {
          loc[f.key] = val;
        }
        scheduleMapUpdate();
      });

      row.appendChild(inp);
    });

    // Check initial ICAO match
    if (loc.icao && lookupICAO(loc.icao)) {
      inputEls.icao.classList.add('icao-match');
    }

    appendRowActions(row, data.map.locations, idx, renderLocations);

    return row;
  }

  // ── Map Preview ──
  function initMapPreview() {
    var container = document.getElementById('map-preview');
    mapEngine = new MapEngine(container, { showCalibration: true });
  }

  function scheduleMapUpdate() {
    clearTimeout(mapTimer);
    mapTimer = setTimeout(updateMapPreview, 250);
    scheduleAutoSave();
  }

  function updateMapPreview() {
    if (mapEngine) mapEngine.render(data);
  }

  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(function() {
      if (saveToStorage(data)) showSaveIndicator();
    }, 2000);
  }

  function showSaveIndicator() {
    var el = document.getElementById('save-indicator');
    if (!el) return;
    el.textContent = 'Auto-saved';
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function() { el.classList.remove('show'); }, 1500);
  }

  // ── Basemap Upload ──
  function initBasemapUpload() {
    var fileInput = document.getElementById('basemap-file');
    var nameSpan  = document.getElementById('basemap-name');
    var clearBtn  = document.getElementById('basemap-clear');

    updateBasemapUI();

    fileInput.addEventListener('change', function() {
      var file = fileInput.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function() {
        data.map.image = reader.result;
        data.map.image_name = file.name;
        updateBasemapUI();
        scheduleMapUpdate();
        toast('Basemap loaded: ' + file.name, 'success');
      };
      reader.onerror = function() { toast('Failed to read image', 'error'); };
      reader.readAsDataURL(file);
    });

    clearBtn.addEventListener('click', function() {
      data.map.image = '';
      data.map.image_name = '';
      fileInput.value = '';
      updateBasemapUI();
      scheduleMapUpdate();
      toast('Basemap removed', 'info');
    });

    function updateBasemapUI() {
      if (data.map.image_name) {
        nameSpan.textContent = data.map.image_name;
        nameSpan.className = 'file-name';
        clearBtn.style.display = '';
      } else {
        nameSpan.textContent = 'No basemap loaded';
        nameSpan.className = 'file-info';
        clearBtn.style.display = 'none';
      }
    }
  }

  // ── Auto-timestamp ──
  function stampUpdated() {
    var d = new Date();
    var months = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    var h = d.getUTCHours(), m = d.getUTCMinutes();
    var ts = d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' +
      d.getUTCFullYear() + ' ' +
      (h < 10 ? '0' : '') + h + (m < 10 ? '0' : '') + m + 'Z';
    data.overview.updated = ts;
    if (overviewInputs.updated) overviewInputs.updated.value = ts;
  }

  // ── Toolbar ──
  function initToolbar() {
    document.getElementById('btn-save').addEventListener('click', function() {
      stampUpdated();
      if (saveToStorage(data)) {
        toast('Saved to browser', 'success');
      } else {
        toast('Save failed — data may be too large for localStorage', 'error');
      }
    });

    document.getElementById('btn-load').addEventListener('click', function() {
      var loaded = loadFromStorage();
      if (loaded) {
        data = loaded;
        rebuildAll();
        toast('Loaded from browser', 'success');
      } else {
        toast('No saved data found', 'error');
      }
    });

    document.getElementById('btn-export').addEventListener('click', function() {
      exportJSON(data);
      toast('JSON exported', 'success');
    });

    var importInput = document.getElementById('import-file');
    document.getElementById('btn-import').addEventListener('click', function() {
      importInput.click();
    });
    importInput.addEventListener('change', function() {
      var file = importInput.files[0];
      if (!file) return;
      importJSON(file).then(function(imported) {
        data = imported;
        rebuildAll();
        toast('Imported: ' + file.name, 'success');
      }).catch(function(err) {
        toast('Import failed: ' + err.message, 'error');
      });
      importInput.value = '';
    });
  }

  // ── Rebuild all sections after load/import ──
  function rebuildAll() {
    document.getElementById('overview-fields').innerHTML = '';
    renderOverview();
    renderCurrentMissions();
    renderPlannedMissions();
    renderPersonnel();

    document.getElementById('cal-rect-fields').innerHTML = '';
    document.getElementById('cal-geo-fields').innerHTML = '';
    renderCalibration();

    renderLocations();
    scheduleMapUpdate();
  }

})();
