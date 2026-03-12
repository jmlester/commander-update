// SVG Map Engine — pan/zoom, calibrated coordinate projection, route arcs
function MapEngine(container, options) {
  options = options || {};
  this.container = container;
  this.showCalibration = !!options.showCalibration;

  this.W = 1000;
  this.H = 600;
  this.vb = { x: 0, y: 0, w: this.W, h: this.H };

  this._isPanning = false;
  this._panStart = null;
  this._vbStart = null;

  this._createSVG();
  this._attachEvents();
}

MapEngine.prototype._svgNS = 'http://www.w3.org/2000/svg';

MapEngine.prototype._el = function(tag, attrs) {
  var el = document.createElementNS(this._svgNS, tag);
  if (attrs) {
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
    }
  }
  return el;
};

MapEngine.prototype._g = function(id) {
  var g = this._el('g', { id: id });
  this.svg.appendChild(g);
  return g;
};

MapEngine.prototype._createSVG = function() {
  this.svg = this._el('svg', {
    viewBox: '0 0 ' + this.W + ' ' + this.H,
    preserveAspectRatio: 'xMidYMid meet'
  });
  this.svg.style.cssText = 'width:100%;height:100%;display:block;cursor:grab;user-select:none;';

  // Layer order matters — back to front
  this.layerBg          = this._g('layer-bg');
  this.layerImage       = this._g('layer-image');     // uploaded basemap
  this.layerBuiltin     = this._g('layer-builtin');   // built-in outlines (when no image)
  this.layerGraticule   = this._g('layer-graticule');
  this.layerCalibration = this._g('layer-cal');
  this.layerRoutes      = this._g('layer-routes');    // route arcs
  this.layerRings       = this._g('layer-rings');     // mission rings
  this.layerMarkers     = this._g('layer-markers');
  this.layerLabels      = this._g('layer-labels');
  this.layerLegend      = this._g('layer-legend');    // always-visible legend

  this.container.innerHTML = '';
  this.container.style.position = 'relative';
  this.container.appendChild(this.svg);

  var self = this;
  var btn = document.createElement('button');
  btn.className = 'map-reset-btn';
  btn.textContent = 'Reset View';
  btn.addEventListener('click', function() { self.resetView(); });
  this.container.appendChild(btn);
};

MapEngine.prototype._attachEvents = function() {
  var self = this;

  this.svg.addEventListener('wheel', function(e) {
    e.preventDefault();
    var rect = self.svg.getBoundingClientRect();
    var mx = (e.clientX - rect.left) / rect.width;
    var my = (e.clientY - rect.top) / rect.height;
    var cx = self.vb.x + mx * self.vb.w;
    var cy = self.vb.y + my * self.vb.h;
    var factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    var nw = self.vb.w * factor;
    var nh = self.vb.h * factor;
    if (nw < 30 || nw > self.W * 8) return;
    self.vb.x = cx - mx * nw;
    self.vb.y = cy - my * nh;
    self.vb.w = nw;
    self.vb.h = nh;
    self._applyVB();
  }, { passive: false });

  this.svg.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    self._isPanning = true;
    self._panStart = { x: e.clientX, y: e.clientY };
    self._vbStart = { x: self.vb.x, y: self.vb.y, w: self.vb.w, h: self.vb.h };
    self.svg.style.cursor = 'grabbing';
  });

  this._onMouseMove = function(e) {
    if (!self._isPanning) return;
    var rect = self.svg.getBoundingClientRect();
    var dx = (e.clientX - self._panStart.x) / rect.width * self._vbStart.w;
    var dy = (e.clientY - self._panStart.y) / rect.height * self._vbStart.h;
    self.vb.x = self._vbStart.x - dx;
    self.vb.y = self._vbStart.y - dy;
    self._applyVB();
  };
  this._onMouseUp = function() {
    if (self._isPanning) {
      self._isPanning = false;
      self.svg.style.cursor = 'grab';
    }
  };

  window.addEventListener('mousemove', this._onMouseMove);
  window.addEventListener('mouseup', this._onMouseUp);
};

MapEngine.prototype._applyVB = function() {
  this.svg.setAttribute('viewBox',
    this.vb.x + ' ' + this.vb.y + ' ' + this.vb.w + ' ' + this.vb.h);
  this._updateScaledGroups();
};

MapEngine.prototype._updateScaledGroups = function() {
  if (!this._scaledGroups || !this._scaledGroups.length) return;
  var s = this.vb.w / this.W;
  for (var i = 0; i < this._scaledGroups.length; i++) {
    var g = this._scaledGroups[i];
    if (g._isLegend) {
      this._updateLegendTransform(g);
    } else {
      g.setAttribute('transform',
        'translate(' + g._ax.toFixed(2) + ',' + g._ay.toFixed(2) + ') scale(' + s + ')');
    }
  }
};

MapEngine.prototype.resetView = function() {
  this.vb = { x: 0, y: 0, w: this.W, h: this.H };
  this._applyVB();
};

// lat/lon → SVG coordinate using calibration
MapEngine.prototype.project = function(lat, lon, cal) {
  var lonSpan = cal.lon_right - cal.lon_left;
  var latSpan = cal.lat_top - cal.lat_bottom;
  if (lonSpan === 0 || latSpan === 0) return null;
  var fracX = (lon - cal.lon_left) / lonSpan;
  var fracY = (cal.lat_top - lat) / latSpan;
  var calX = (cal.geo_left_pct / 100) * this.W;
  var calY = (cal.geo_top_pct / 100) * this.H;
  var calW = (cal.geo_width_pct / 100) * this.W;
  var calH = (cal.geo_height_pct / 100) * this.H;
  return { x: calX + fracX * calW, y: calY + fracY * calH };
};

// Resolve ICAO string → {lat, lon}, checking locations array then ICAO_DB
MapEngine.prototype._resolveICAO = function(icao, locations) {
  if (!icao) return null;
  var code = icao.toUpperCase().trim();
  if (!code) return null;
  for (var i = 0; i < locations.length; i++) {
    var loc = locations[i];
    if (loc.icao && loc.icao.toUpperCase() === code &&
        !(loc.lat === 0 && loc.lon === 0)) {
      return { lat: loc.lat, lon: loc.lon };
    }
  }
  var db = lookupICAO(code);
  return db ? { lat: db.lat, lon: db.lon } : null;
};

MapEngine.prototype._statusColor = function(style) {
  switch (style) {
    case 'routine': return '#5dba7d';
    case 'warn':    return '#DDC26F';
    case 'danger':  return '#e85d5d';
    default:        return '#5db8e8'; // info
  }
};

MapEngine.prototype._color = function(name) {
  var p = {
    navy: '#05294B', gold: '#DDC26F', black: '#141414',
    lightgray: '#F0F0F0', highlight: '#F8FF8F',
    white: '#ffffff', red: '#e85d5d', blue: '#5db8e8', green: '#5dba7d'
  };
  return p[name] || name || '#DDC26F';
};

// Remove all children from SVG group (innerHTML not safe in all Safari versions)
MapEngine.prototype._clearGroup = function(g) {
  while (g.firstChild) g.removeChild(g.firstChild);
};

MapEngine.prototype._clear = function() {
  var layers = [this.layerBg, this.layerImage, this.layerBuiltin,
    this.layerGraticule, this.layerCalibration, this.layerRoutes,
    this.layerRings, this.layerMarkers, this.layerLabels, this.layerLegend];
  for (var i = 0; i < layers.length; i++) this._clearGroup(layers[i]);
};

// ── Main render ─────────────────────────────────────────────────────────────
// Calibration for the default basemap.jpg (4096×2048, 2:1 equirectangular)
// Rendered with preserveAspectRatio 'xMidYMid meet' in a 1000×600 SVG viewport:
// scale = 1000/4096, rendered height = 500, vertical offset = (600-500)/2 = 50
MapEngine.BASEMAP_CAL = (function() {
  var W = 1000, H = 600;
  var imgW = 4096, imgH = 2048;
  var scale = Math.min(W / imgW, H / imgH);
  var rw = imgW * scale, rh = imgH * scale;
  var ox = (W - rw) / 2, oy = (H - rh) / 2;
  return {
    geo_left_pct:   ox / W * 100,
    geo_top_pct:    oy / H * 100,
    geo_width_pct:  rw / W * 100,
    geo_height_pct: rh / H * 100,
    lon_left: -180, lon_right: 180, lat_top: 90, lat_bottom: -90
  };
}());

MapEngine.prototype.render = function(data) {
  this._clear();
  this._scaledGroups = [];
  this._missionElements = {};
  var map = data.map;
  var hasImage = !!map.image;
  // When using the default basemap.jpg, always use its fixed calibration
  // so stale localStorage values don't misalign markers
  var cal = hasImage ? map.calibration : MapEngine.BASEMAP_CAL;

  // Background ocean
  this.layerBg.appendChild(this._el('rect', {
    x: 0, y: 0, width: this.W, height: this.H, fill: '#0d1b2a'
  }));

  if (hasImage) {
    var img = this._el('image', {
      x: 0, y: 0, width: this.W, height: this.H, preserveAspectRatio: 'none'
    });
    img.setAttribute('href', map.image);
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', map.image);
    this.layerImage.appendChild(img);
  } else {
    // Default Natural Earth basemap (4096×2048, 2:1).
    // Explicitly letterboxed: 1000×500 centred in 1000×600 viewport (y offset = 50).
    var _cal = MapEngine.BASEMAP_CAL;
    var _imgX = (_cal.geo_left_pct / 100) * this.W;
    var _imgY = (_cal.geo_top_pct  / 100) * this.H;
    var _imgW = (_cal.geo_width_pct  / 100) * this.W;
    var _imgH = (_cal.geo_height_pct / 100) * this.H;
    var bmImg = this._el('image', {
      x: _imgX, y: _imgY, width: _imgW, height: _imgH, preserveAspectRatio: 'none'
    });
    bmImg.setAttribute('href', 'basemap.jpg');
    bmImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'basemap.jpg');
    // onerror: show procedural basemap as fallback
    var self = this;
    bmImg.addEventListener('error', function() {
      self._renderBuiltinBasemap(MapEngine.BASEMAP_CAL);
    });
    this.layerImage.appendChild(bmImg);
  }

  this._renderGraticule(cal, hasImage);

  if (this.showCalibration) this._renderCalRect(cal);

  this._renderRoutes(data, cal);
  this._renderRings(data, cal);
  this._renderMarkers(map.locations, cal);
  this._renderLegend();
};

// ── Built-in basemap ─────────────────────────────────────────────────────────
MapEngine.prototype._renderBuiltinBasemap = function(cal) {
  var self = this;
  if (typeof BASEMAP_FEATURES === 'undefined') return;

  BASEMAP_FEATURES.forEach(function(feature) {
    var pts = feature.points;
    if (!pts || pts.length < 3) return;

    // Build SVG polygon point string
    var svgPts = [];
    for (var i = 0; i < pts.length; i++) {
      var p = self.project(pts[i][1], pts[i][0], cal);
      if (!p) return;
      svgPts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1));
    }
    var polygon = self._el('polygon', {
      points: svgPts.join(' '),
      fill: '#182a3c',
      stroke: '#2a4560',
      'stroke-width': 0.6,
      'stroke-linejoin': 'round'
    });
    self.layerBuiltin.appendChild(polygon);
  });
};

// ── Graticule ────────────────────────────────────────────────────────────────
MapEngine.prototype._renderGraticule = function(cal, hasImage) {
  var lineColor = hasImage ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.08)';
  var textColor = hasImage ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.20)';
  // Use wider step for large geographic spans to avoid label crowding
  var lonSpan = cal.lon_right - cal.lon_left;
  var step = lonSpan > 200 ? 30 : lonSpan > 100 ? 20 : 10;
  var calX = (cal.geo_left_pct / 100) * this.W;
  var calY = (cal.geo_top_pct / 100) * this.H;
  var calW = (cal.geo_width_pct / 100) * this.W;
  var calH = (cal.geo_height_pct / 100) * this.H;

  for (var lon = Math.ceil(cal.lon_left / step) * step; lon <= cal.lon_right; lon += step) {
    var fx = (lon - cal.lon_left) / (cal.lon_right - cal.lon_left);
    var x = calX + fx * calW;
    this.layerGraticule.appendChild(this._el('line', {
      x1: x, y1: calY, x2: x, y2: calY + calH,
      stroke: lineColor, 'stroke-width': 0.5
    }));
    var lt = this._el('text', {
      x: x, y: calY + calH + 11, fill: textColor,
      'font-size': 7, 'text-anchor': 'middle', 'font-family': 'Arial, sans-serif'
    });
    lt.textContent = lon + '\u00B0';
    this.layerGraticule.appendChild(lt);
  }

  for (var lat = Math.ceil(cal.lat_bottom / step) * step; lat <= cal.lat_top; lat += step) {
    var fy = (cal.lat_top - lat) / (cal.lat_top - cal.lat_bottom);
    var y = calY + fy * calH;
    this.layerGraticule.appendChild(this._el('line', {
      x1: calX, y1: y, x2: calX + calW, y2: y,
      stroke: lineColor, 'stroke-width': 0.5
    }));
    var lt2 = this._el('text', {
      x: calX - 4, y: y + 3, fill: textColor,
      'font-size': 7, 'text-anchor': 'end', 'font-family': 'Arial, sans-serif'
    });
    lt2.textContent = lat + '\u00B0';
    this.layerGraticule.appendChild(lt2);
  }
};

MapEngine.prototype._renderCalRect = function(cal) {
  var x = (cal.geo_left_pct / 100) * this.W;
  var y = (cal.geo_top_pct / 100) * this.H;
  var w = (cal.geo_width_pct / 100) * this.W;
  var h = (cal.geo_height_pct / 100) * this.H;
  this.layerCalibration.appendChild(this._el('rect', {
    x: x, y: y, width: w, height: h,
    fill: 'none', stroke: '#F8FF8F', 'stroke-width': 1.5,
    'stroke-dasharray': '8,4', opacity: 0.6
  }));
  var lbl = this._el('text', {
    x: x + 4, y: y + 11, fill: '#F8FF8F', 'font-size': 8, opacity: 0.6,
    'font-family': 'Arial, sans-serif'
  });
  lbl.textContent = 'CALIBRATION AREA';
  this.layerCalibration.appendChild(lbl);
};

// ── Route lines (great-circle approximation via quadratic bezier) ─────────────
MapEngine.prototype._routePath = function(p1, p2) {
  var mx = (p1.x + p2.x) / 2;
  var my = (p1.y + p2.y) / 2;
  var dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  // Arc northward (upward in SVG = smaller y)
  var cpy = my - dist * 0.18;
  return 'M ' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) +
         ' Q ' + mx.toFixed(1) + ' ' + cpy.toFixed(1) +
         ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
};

MapEngine.prototype._renderRoutes = function(data, cal) {
  var locs = data.map.locations;
  var self = this;
  var initScale = this.vb.w / this.W;

  // ICAOs already rendered as location markers — skip endpoint dots for these
  var locICAOs = {};
  locs.forEach(function(loc) {
    if (loc.icao && !(loc.lat === 0 && loc.lon === 0)) {
      locICAOs[loc.icao.toUpperCase()] = true;
    }
  });
  var drawnEndpoints = {};

  function addEndpointDot(pt, icaoCode, color, parent) {
    var code = (icaoCode || '').toUpperCase();
    if (code && (locICAOs[code] || drawnEndpoints[code])) return;
    if (code) drawnEndpoints[code] = true;

    var g = self._el('g', {
      transform: 'translate(' + pt.x.toFixed(2) + ',' + pt.y.toFixed(2) + ') scale(' + initScale + ')'
    });
    g._ax = pt.x;
    g._ay = pt.y;
    self._scaledGroups.push(g);

    g.appendChild(self._el('circle', { cx: 0, cy: 0, r: 6, fill: 'rgba(0,0,0,0.5)' }));
    g.appendChild(self._el('circle', {
      cx: 0, cy: 0, r: 4, fill: color, stroke: '#000', 'stroke-width': 1
    }));

    if (code) {
      var shadow = self._el('text', {
        x: 7, y: 4, 'font-size': 9, 'font-weight': 'bold',
        'font-family': 'Arial, sans-serif',
        fill: 'none', stroke: '#000', 'stroke-width': 3, 'stroke-linejoin': 'round'
      });
      shadow.textContent = code;
      g.appendChild(shadow);
      var label = self._el('text', {
        x: 7, y: 4, 'font-size': 9, 'font-weight': 'bold',
        'font-family': 'Arial, sans-serif', fill: '#FFE566'
      });
      label.textContent = code;
      g.appendChild(label);
    }

    parent.appendChild(g);
  }

  function drawRoute(m, isCurrent, idx) {
    var dep = self._resolveICAO(m.dep_icao, locs);
    var arr = self._resolveICAO(m.arr_icao, locs);
    var single = self._resolveICAO(m.map_icao, locs);
    var key = (isCurrent ? 'current-' : 'planned-') + idx;

    if (dep && arr) {
      var p1 = self.project(dep.lat, dep.lon, cal);
      var p2 = self.project(arr.lat, arr.lon, cal);
      if (!p1 || !p2) return;

      var mGroup = self._el('g');
      mGroup.setAttribute('data-route-key', key);

      var pathD = self._routePath(p1, p2);
      var color = self._statusColor(m.status_style);
      var dashArr = isCurrent ? 'none' : '8,4';

      mGroup.appendChild(self._el('path', {
        d: pathD, fill: 'none',
        stroke: 'rgba(0,0,0,0.5)', 'stroke-width': 3.5,
        'stroke-dasharray': dashArr, 'stroke-linecap': 'round',
        'vector-effect': 'non-scaling-stroke'
      }));
      mGroup.appendChild(self._el('path', {
        d: pathD, fill: 'none',
        stroke: color, 'stroke-width': 2,
        'stroke-dasharray': dashArr, 'stroke-linecap': 'round',
        'vector-effect': 'non-scaling-stroke'
      }));

      addEndpointDot(p1, m.dep_icao, color, mGroup);
      addEndpointDot(p2, m.arr_icao, color, mGroup);

      self.layerRoutes.appendChild(mGroup);
      if (!self._missionElements[key]) self._missionElements[key] = [];
      self._missionElements[key].push(mGroup);
    } else if (dep || arr || single) {
      // Single location — ring only (rendered in _renderRings)
    }
  }

  if (data.currentMissions) data.currentMissions.forEach(function(m, i) { drawRoute(m, true, i); });
  if (data.plannedMissions) data.plannedMissions.forEach(function(m, i) { drawRoute(m, false, i); });
};

// ── Mission rings (single-location fallback or accent ring on arrival) ─────────
MapEngine.prototype._renderRings = function(data, cal) {
  var locs = data.map.locations;
  var self = this;
  var initScale = this.vb.w / this.W;

  function drawRing(m, isCurrent, idx) {
    var dep = self._resolveICAO(m.dep_icao, locs);
    var arr = self._resolveICAO(m.arr_icao, locs);
    var single = self._resolveICAO(m.map_icao, locs);

    var coord = arr || dep || single;
    if (!coord) return;
    var pt = self.project(coord.lat, coord.lon, cal);
    if (!pt) return;

    var key = (isCurrent ? 'current-' : 'planned-') + idx;
    var color = self._statusColor(m.status_style);

    var g = self._el('g', {
      transform: 'translate(' + pt.x.toFixed(2) + ',' + pt.y.toFixed(2) + ') scale(' + initScale + ')'
    });
    g._ax = pt.x;
    g._ay = pt.y;
    self._scaledGroups.push(g);

    if (isCurrent) {
      g.appendChild(self._el('circle', {
        cx: 0, cy: 0, r: 16,
        fill: 'none', stroke: 'rgba(0,0,0,0.4)', 'stroke-width': 3.5
      }));
      g.appendChild(self._el('circle', {
        cx: 0, cy: 0, r: 16,
        fill: 'none', stroke: color, 'stroke-width': 2
      }));
    } else {
      g.appendChild(self._el('circle', {
        cx: 0, cy: 0, r: 20,
        fill: 'none', stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 3,
        'stroke-dasharray': '6,3'
      }));
      g.appendChild(self._el('circle', {
        cx: 0, cy: 0, r: 20,
        fill: 'none', stroke: color, 'stroke-width': 1.5,
        'stroke-dasharray': '6,3'
      }));
    }

    self.layerRings.appendChild(g);
    if (!self._missionElements[key]) self._missionElements[key] = [];
    self._missionElements[key].push(g);
  }

  if (data.currentMissions) data.currentMissions.forEach(function(m, i) { drawRing(m, true, i); });
  if (data.plannedMissions) data.plannedMissions.forEach(function(m, i) { drawRing(m, false, i); });
};

// ── Location markers (constant screen size via counter-zoom group transform) ──
MapEngine.prototype._renderMarkers = function(locations, cal) {
  var self = this;
  var initScale = this.vb.w / this.W;

  locations.forEach(function(loc) {
    // Skip unresolved locations (default 0,0 means ICAO not yet looked up)
    if (loc.lat == null || loc.lon == null) return;
    if (loc.lat === 0 && loc.lon === 0) return;
    var pt = self.project(loc.lat, loc.lon, cal);
    if (!pt) return;

    // Group anchored at geo position; scale inverts the current zoom
    var g = self._el('g', {
      transform: 'translate(' + pt.x.toFixed(2) + ',' + pt.y.toFixed(2) + ') scale(' + initScale + ')'
    });
    g._ax = pt.x;
    g._ay = pt.y;
    self._scaledGroups.push(g);

    // Dark halo
    g.appendChild(self._el('circle', { cx: 0, cy: 0, r: 6, fill: 'rgba(0,0,0,0.5)' }));
    // Coloured dot
    g.appendChild(self._el('circle', {
      cx: 0, cy: 0, r: 4,
      fill: self._color(loc.color), stroke: '#000', 'stroke-width': 1
    }));

    // Label with dark outline for readability on terrain
    var txt = loc.label || loc.icao || '';
    var shadowTxt = self._el('text', {
      x: 7, y: 4, 'font-size': 9, 'font-weight': 'bold',
      'font-family': 'Arial, sans-serif',
      fill: 'none', stroke: '#000', 'stroke-width': 3, 'stroke-linejoin': 'round'
    });
    shadowTxt.textContent = txt;
    g.appendChild(shadowTxt);

    var labelTxt = self._el('text', {
      x: 7, y: 4, 'font-size': 9, 'font-weight': 'bold',
      'font-family': 'Arial, sans-serif', fill: '#FFE566'
    });
    labelTxt.textContent = txt;
    g.appendChild(labelTxt);

    self.layerMarkers.appendChild(g);
  });
};

// ── Legend (fixed bottom-left, constant screen size) ─────────────────────────
MapEngine.prototype._renderLegend = function() {
  var self = this;

  var g = this._el('g');
  g._isLegend = true;
  g._vpOffX = 14;
  g._vpOffY = -14;

  var lx = 0, ly = 0, lw = 152, lh = 130;
  var pad = 8, row = 13;
  g._legendH = lh;

  this._updateLegendTransform(g);
  this._scaledGroups.push(g);

  // Background panel
  g.appendChild(this._el('rect', {
    x: lx, y: ly, width: lw, height: lh,
    rx: 3, ry: 3,
    fill: 'rgba(5,41,75,0.85)', stroke: 'rgba(221,194,111,0.5)', 'stroke-width': 1
  }));

  // Title
  var title = this._el('text', {
    x: lx + pad, y: ly + pad + 8,
    fill: '#DDC26F', 'font-size': 8, 'font-weight': 'bold',
    'font-family': 'Arial, sans-serif', 'letter-spacing': '1'
  });
  title.textContent = 'LEGEND';
  g.appendChild(title);

  // Symbol types
  var typeRows = [
    { label: 'Location / Airfield', type: 'dot',  color: '#DDC26F' },
    { label: 'Current Mission',     type: 'line', color: '#c8d8e8', dash: false },
    { label: 'Planned Mission',     type: 'line', color: '#c8d8e8', dash: true },
    { label: 'Ops Area',            type: 'ring', color: '#c8d8e8', dash: false }
  ];

  typeRows.forEach(function(r, i) {
    var ry = ly + pad + 18 + i * row;
    var cx = lx + pad + 7;

    if (r.type === 'dot') {
      g.appendChild(self._el('circle', { cx: cx, cy: ry + 3, r: 5, fill: 'rgba(0,0,0,0.4)' }));
      g.appendChild(self._el('circle', { cx: cx, cy: ry + 3, r: 3.5, fill: r.color, stroke: '#000', 'stroke-width': 0.8 }));
    } else if (r.type === 'line') {
      var lineEl = self._el('line', {
        x1: cx - 6, y1: ry + 3, x2: cx + 6, y2: ry + 3,
        stroke: '#000', 'stroke-width': 3, 'stroke-linecap': 'round'
      });
      if (r.dash) lineEl.setAttribute('stroke-dasharray', '4,2');
      g.appendChild(lineEl);
      var lineEl2 = self._el('line', {
        x1: cx - 6, y1: ry + 3, x2: cx + 6, y2: ry + 3,
        stroke: r.color, 'stroke-width': 2, 'stroke-linecap': 'round'
      });
      if (r.dash) lineEl2.setAttribute('stroke-dasharray', '4,2');
      g.appendChild(lineEl2);
    } else if (r.type === 'ring') {
      g.appendChild(self._el('circle', {
        cx: cx, cy: ry + 3, r: 5.5,
        fill: 'none', stroke: '#000', 'stroke-width': 2.5
      }));
      g.appendChild(self._el('circle', {
        cx: cx, cy: ry + 3, r: 5.5,
        fill: 'none', stroke: r.color, 'stroke-width': 1.5
      }));
    }

    var lbl = self._el('text', {
      x: cx + 12, y: ry + 7,
      fill: '#c8d8e8', 'font-size': 8, 'font-family': 'Arial, sans-serif'
    });
    lbl.textContent = r.label;
    g.appendChild(lbl);
  });

  // Divider
  var divY = ly + pad + 18 + typeRows.length * row + 2;
  g.appendChild(this._el('line', {
    x1: lx + pad, y1: divY, x2: lx + lw - pad, y2: divY,
    stroke: 'rgba(221,194,111,0.3)', 'stroke-width': 0.5
  }));

  // Status colors sub-header
  var subY = divY + 10;
  var sub = this._el('text', {
    x: lx + pad, y: subY,
    fill: '#DDC26F', 'font-size': 7, 'font-weight': 'bold',
    'font-family': 'Arial, sans-serif', 'letter-spacing': '0.5'
  });
  sub.textContent = 'STATUS';
  g.appendChild(sub);

  // Status colors in 2×2 grid
  var statuses = [
    { label: 'Routine', color: '#5dba7d' },
    { label: 'Info',    color: '#5db8e8' },
    { label: 'Warning', color: '#DDC26F' },
    { label: 'Danger',  color: '#e85d5d' }
  ];
  var gridY = subY + 6;
  var colW = 68;
  statuses.forEach(function(st, i) {
    var col = i % 2;
    var ri = Math.floor(i / 2);
    var sx = lx + pad + 5 + col * colW;
    var sy = gridY + ri * row;
    g.appendChild(self._el('circle', {
      cx: sx, cy: sy + 3, r: 3.5, fill: st.color, stroke: '#000', 'stroke-width': 0.8
    }));
    var lbl = self._el('text', {
      x: sx + 7, y: sy + 6,
      fill: '#c8d8e8', 'font-size': 7, 'font-family': 'Arial, sans-serif'
    });
    lbl.textContent = st.label;
    g.appendChild(lbl);
  });

  this.layerLegend.appendChild(g);
};

MapEngine.prototype._updateLegendTransform = function(g) {
  var s = this.vb.w / this.W;
  var lh = g._legendH || 130;
  var svgX = this.vb.x + g._vpOffX * s;
  var svgY = this.vb.y + this.vb.h + g._vpOffY * s - lh * s;
  g._ax = svgX;
  g._ay = svgY;
  g.setAttribute('transform',
    'translate(' + svgX.toFixed(2) + ',' + svgY.toFixed(2) + ') scale(' + s + ')');
};

// ── Highlight a mission (dim all others) ─────────────────────────────────────
MapEngine.prototype.highlightMission = function(key) {
  var allKeys = Object.keys(this._missionElements || {});
  for (var i = 0; i < allKeys.length; i++) {
    var k = allKeys[i];
    var opacity = (k === key) ? 1 : 0.15;
    var elems = this._missionElements[k];
    for (var j = 0; j < elems.length; j++) {
      elems[j].setAttribute('opacity', opacity);
    }
  }
};

MapEngine.prototype.clearHighlight = function() {
  var allKeys = Object.keys(this._missionElements || {});
  for (var i = 0; i < allKeys.length; i++) {
    var elems = this._missionElements[allKeys[i]];
    for (var j = 0; j < elems.length; j++) {
      elems[j].setAttribute('opacity', 1);
    }
  }
};

MapEngine.prototype.destroy = function() {
  if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
  if (this._onMouseUp) window.removeEventListener('mouseup', this._onMouseUp);
  this.container.innerHTML = '';
};
