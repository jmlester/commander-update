// Data model, storage, and import/export
var STORAGE_KEY = 'cnafr_commanders_update';

var DEFAULT_DATA = {
  overview: {
    title: "CNAFR Commander's Update",
    updated: '10 March 2026 0800Z',
    total_assets_deployed: 5,
    current_missions: 2,
    personnel_mobilized_rc: 275
  },
  currentMissions: [
    {
      mission_name: 'MSO Mediterranean',
      assigned_assets: 'CVN-79, VAQ-209',
      status: 'Routine presence ops',
      status_style: 'routine',
      dep_icao: 'KNGU',
      arr_icao: 'LICZ'
    },
    {
      mission_name: 'Gulf ISR Support',
      assigned_assets: 'VP-62 Det A',
      status: 'Operational \u2014 on station',
      status_style: 'info',
      dep_icao: '',
      arr_icao: 'OBBI'
    }
  ],
  plannedMissions: [
    {
      mission_name: 'Exercise BALTOPS',
      assigned_assets: 'CVN-79',
      planned_date: '2026-03-14',
      status: 'Pre-deployment workups',
      status_style: 'warn',
      dep_icao: 'LICZ',
      arr_icao: 'EKYT'
    },
    {
      mission_name: 'Cyprus Patrol Rotation',
      assigned_assets: 'VP-90',
      planned_date: '2026-03-16',
      status: 'Crew swap in progress',
      status_style: 'info',
      dep_icao: '',
      arr_icao: 'LCLK'
    }
  ],
  personnel: [
    {
      order_type: 'RC 12304b',
      total_personnel: 200,
      key_units: 'VP-90, VAQ-209'
    },
    {
      order_type: 'ADOS',
      total_personnel: 75,
      key_units: 'VFC-12, VR-62'
    }
  ],
  map: {
    image: '',
    image_name: '',
    calibration: {
      geo_left_pct: 0,
      geo_top_pct: 0,
      geo_width_pct: 100,
      geo_height_pct: 100,
      lon_left: -180,
      lon_right: 180,
      lat_top: 90,
      lat_bottom: -90
    },
    locations: [
      { label: 'Sigonella',  icao: 'LICZ', lat: 37.4017, lon: 14.9224, color: 'gold' },
      { label: 'Bahrain',    icao: 'OBBI', lat: 26.2708, lon: 50.6336, color: 'gold' },
      { label: 'Larnaca',    icao: 'LCLK', lat: 34.8751, lon: 33.6249, color: 'gold' },
      { label: 'Aalborg',    icao: 'EKYT', lat: 57.0928, lon: 9.8492,  color: 'gold' }
    ]
  }
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadFromStorage() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateData(JSON.parse(raw));
  } catch (e) {
    console.warn('localStorage load failed:', e);
  }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('localStorage save failed:', e);
    return false;
  }
}

function exportJSON(data) {
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'commanders-update-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() {
      try {
        var parsed = JSON.parse(reader.result);
        resolve(migrateData(parsed));
      } catch (e) {
        reject(new Error('Invalid JSON: ' + e.message));
      }
    };
    reader.onerror = function() { reject(new Error('Failed to read file')); };
    reader.readAsText(file);
  });
}

// Ensure imported/loaded data has all required fields
function migrateData(d) {
  var def = deepClone(DEFAULT_DATA);
  if (!d || typeof d !== 'object') return def;

  d.overview = Object.assign({}, def.overview, d.overview || {});
  if (!Array.isArray(d.currentMissions)) d.currentMissions = def.currentMissions;
  if (!Array.isArray(d.plannedMissions)) d.plannedMissions = def.plannedMissions;
  if (!Array.isArray(d.personnel))       d.personnel = def.personnel;

  // Migrate old map_icao → arr_icao on missions
  function migrateMissions(arr) {
    arr.forEach(function(m) {
      if (m.map_icao && !m.arr_icao) { m.arr_icao = m.map_icao; }
      if (m.dep_icao === undefined) m.dep_icao = '';
      if (m.arr_icao === undefined) m.arr_icao = '';
    });
  }
  migrateMissions(d.currentMissions);
  migrateMissions(d.plannedMissions);

  if (!d.map || typeof d.map !== 'object') d.map = def.map;
  // Auto-upgrade old default calibration (procedural basemap margins) to full-world image calibration
  var c = d.map.calibration || {};
  var isOldDefault = (c.geo_left_pct === 4 && c.geo_top_pct === 2 &&
                      c.geo_width_pct === 92 && c.geo_height_pct === 93 &&
                      c.lat_top === 85 && c.lat_bottom === -85);
  d.map.calibration = Object.assign({}, def.map.calibration, isOldDefault ? {} : c);
  if (!Array.isArray(d.map.locations)) d.map.locations = def.map.locations;
  if (d.map.image === undefined) d.map.image = '';
  if (d.map.image_name === undefined) d.map.image_name = '';

  return d;
}

function showToast(message, type) {
  type = type || 'info';
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  // Force reflow then show
  toast.offsetHeight;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}
