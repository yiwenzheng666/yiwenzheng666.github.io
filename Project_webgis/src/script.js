mapboxgl.accessToken = 'pk.eyJ1IjoieWl3ZW56NjY2IiwiYSI6ImNtNXk1czB5bDA5bGkybHIzcWM3NzN2N3QifQ._vIiwie_QUQcaRvTYHEf_w';

// Load POI GeoJSON data (restaurants and supermarkets)
let poiGeo = {
  supermarkets: null,
  restaurants: null,
  parks: null // to be loaded later
};

Promise.all([
  fetch('https://raw.githubusercontent.com/yiwenzheng666/campus-poi-data/refs/heads/main/university_10000_supermarket.geojson').then(res => res.json()),
  fetch('https://raw.githubusercontent.com/yiwenzheng666/campus-poi-data/refs/heads/main/university_10000_restaurant.geojson').then(res => res.json()),
  fetch('https://raw.githubusercontent.com/yiwenzheng666/campus-poi-data/main/university_10000_park3.geojson').then(res => res.json())
]).then(([supermarkets, restaurants, parks]) => {
  poiGeo.supermarkets = supermarkets;
  poiGeo.restaurants = restaurants;
  poiGeo.parks = parks;
  console.log("✅ POI data fully loaded.");
});

let selectedResidenceMarker = null; // Currently selected dormitory mark

// Clear Module 3 (Commuting Path and Time)
function clearModule3() {
  // Clear your commute
  if (map.getLayer('walk-route')) map.removeLayer('walk-route');
  if (map.getSource('walk-route')) map.removeSource('walk-route');

  // Hide commute information box
  const box = document.getElementById('commute-info');
  if (box) box.style.display = 'none';

  // Clear the dormitory red marker (shares the same variable as module 4)
  if (selectedResidenceMarker) {
    selectedResidenceMarker.remove();
    selectedResidenceMarker = null;
  }
}


function clearModule4() {
  // Isochrone 
  ['iso-healthy', 'iso-wheelchair'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

  // POI layer (within the living circle)
  const users = ['healthy', 'wheelchair'];
  const types = ['Supermarkets', 'Restaurants', 'Parks'];
  users.forEach(user => {
    types.forEach(type => {
      const id = `${type}-${user}`;
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
  });

  // Clear Statistics Box
  const box = document.getElementById('life-statistics');
  if (box) box.innerHTML = '';

  // Remove the red marker of the dormitory
  if (selectedResidenceMarker) {
    selectedResidenceMarker.remove();
    selectedResidenceMarker = null;
  }
}

function clearModule5() {
  if (map.getLayer('score-rank-wheelchair')) map.removeLayer('score-rank-wheelchair');
  if (map.getSource('score-rank-wheelchair')) map.removeSource('score-rank-wheelchair');

  if (map.getLayer('score-rank-healthy')) map.removeLayer('score-rank-healthy');
  if (map.getSource('score-rank-healthy')) map.removeSource('score-rank-healthy');
}



const sectionLayers = {
  facilities: ['Supermarkets', 'Restaurants', 'Parks'],
  slope: ['Roads', 'Steps']
};

const legendItems = {
  Supermarkets: [{ label: " Supermarkets", color: "blue" }],
  Restaurants: [{ label: " Restaurants", color: "orange" }],
  Parks: [{ label: " Parks", color: "green" }],
  Roads: [
    { label: "0–5°", color: "#006400" },
    { label: "5–8°", color: "#F08C00" },
    { label: "8–12°", color: "#FF4500" },
    { label: ">12°", color: "#800080" }
  ],
  Steps: [{ label: " Steps", color: "red" }]
};

const mapCenter = [-4.289, 55.872]; // Glasgow Main Campus

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/outdoors-v11',
  center: mapCenter,
  zoom: 14
});

// Control module click (layer + zoom + legend)
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const isVisible = section.style.display === "block";
  section.style.display = isVisible ? "none" : "block";
  
  // Clear mutex module contents
if (sectionId === 'commute') {
  clearModule4(); // When opening module three, clear module four
}
if (sectionId === 'lifeCircle') {
  clearModule3(); // When opening module 4, clear module 3
}

  // Clear the scoring layer (unless module5)
if (sectionId !== 'scoreModel') {
  clearModule5();
}
if (sectionId === 'scoreModel') {
  showModule5Scores();
}



  Object.keys(sectionLayers).forEach(id => {
    const isCurrent = id === sectionId;
    sectionLayers[id].forEach(item => {
      const layerId = item.toLowerCase() + '-layer';
      const checkbox = document.getElementById(`toggle${item}`);
      if (checkbox) checkbox.checked = isCurrent;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', isCurrent ? 'visible' : 'none');
      }
    });
  });

  if (map.getLayer('buildings-layer')) {
    map.setLayoutProperty('buildings-layer', 'visibility', 'visible');
  }

  if (sectionId === 'slope') {
    map.flyTo({ center: mapCenter, zoom: 16, essential: true });
  }

  updateLegend();
}

// Clear the scoring layer
function clearModule5() {
  if (map.getLayer('residence-scores')) map.removeLayer('residence-scores');
  if (map.getSource('residence-scores')) map.removeSource('residence-scores');
  scoreLayerLoaded = false;
}
function updateLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = "<h4>Legend</h4>";

  // ✅ Buildings layer is always displayed
  const buildingDiv = document.createElement("div");
  buildingDiv.innerHTML = `
    <span style="
      display:inline-block;
      width:20px;
      height:12px;
      background:#000000;
      opacity:0.4;
      margin-right:6px;
      vertical-align:middle;
    "></span> Campus Buildings`;
  legend.appendChild(buildingDiv);

   // ✅ Roads category display (if checked)
  const roadsCheckbox = document.getElementById("toggleRoads");
  if (roadsCheckbox && roadsCheckbox.checked) {
    const slopeColors = [
      { label: "0–3°", color: "#006400" },
      { label: "3–5°", color: "#F08C00" },
      { label: "5–10°", color: "#FF4500" },
      { label: ">10°", color: "#800080" }
    ];

    const roadSlopeBlock = document.createElement("div");
    roadSlopeBlock.style.border = "1px solid #aaa";
    roadSlopeBlock.style.padding = "6px";
    roadSlopeBlock.style.margin = "6px 0";

    const title = document.createElement("div");
    title.innerHTML = "<strong>Road Slope</strong>";
    title.style.marginBottom = "4px";
    roadSlopeBlock.appendChild(title);

    slopeColors.forEach(slope => {
      const lineDiv = document.createElement("div");
      lineDiv.style.display = "flex";
      lineDiv.style.alignItems = "center";
      lineDiv.style.marginBottom = "3px";
      lineDiv.innerHTML = `
        <span style="
          display:inline-block;
          width:20px;
          height:4px;
          background:${slope.color};
          margin-right:6px;
          vertical-align:middle;
        "></span> ${slope.label}`;
      roadSlopeBlock.appendChild(lineDiv);
    });

    legend.appendChild(roadSlopeBlock);
  }

  // ✅ Steps (displayed if checked)
  const stepsCheckbox = document.getElementById("toggleSteps");
  if (stepsCheckbox && stepsCheckbox.checked) {
    const stepDiv = document.createElement("div");
    stepDiv.innerHTML = `
      <span style="
        display:inline-block;
        width:20px;
        height:4px;
        background:red;
        margin-right:6px;
        vertical-align:middle;
      "></span> Steps`;
    legend.appendChild(stepDiv);
  }

    // ✅ Other POI layers (with dot style)
  const otherLayers = {
    Supermarkets: { label: "Supermarkets", color: "blue", shape: "circle" },
    Restaurants: { label: "Restaurants", color: "orange", shape: "circle" },
    Parks: { label: "Parks", color: "green", shape: "square" }
  };

  Object.keys(otherLayers).forEach(item => {
    const checkbox = document.getElementById(`toggle${item}`);
    if (checkbox && checkbox.checked) {
      const { label, color, shape } = otherLayers[item];
      const shapeStyle = shape === "circle"
        ? `border-radius: 50%; width: 12px; height: 12px;`
        : `width: 12px; height: 12px;`;

      const div = document.createElement("div");
      div.innerHTML = `
        <span style="
          display:inline-block;
          ${shapeStyle}
          background:${color};
          margin-right:6px;
          vertical-align:middle;
        "></span> ${label}`;
      legend.appendChild(div);
    }
  });
  // ✅ If module 4 is turned on, also show the POI legend (regardless of whether the checkbox is checked)
  const lifeSection = document.getElementById("lifeCircle");
  if (lifeSection && lifeSection.style.display === 'block') {
    const lifePOILayers = {
      Supermarkets: { label: "Supermarkets", color: "blue", shape: "circle" },
      Restaurants: { label: "Restaurants", color: "orange", shape: "circle" },
      Parks: { label: "Green Spaces", color: "green", shape: "square" }
    };

    Object.values(lifePOILayers).forEach(({ label, color, shape }) => {
      const shapeStyle = shape === "circle"
        ? `border-radius: 50%; width: 12px; height: 12px;`
        : `width: 12px; height: 12px;`;

      const div = document.createElement("div");
      div.innerHTML = `
        <span style="
          display:inline-block;
          ${shapeStyle}
          background:${color};
          margin-right:6px;
          vertical-align:middle;
        "></span> ${label}`;
      legend.appendChild(div);
    });
  }
}

map.on('load', () => {
let residenceOptionsLoaded = false;

map.on('idle', () => {
  if (residenceOptionsLoaded) return; // ✅ If it has already been loaded, do not execute it again

  const features = map.querySourceFeatures('residences', {
    sourceLayer: 'uog_residences-2iag00'
  });

  const select = document.getElementById('residenceSelect');
  features.forEach(f => {
    const name = f.properties.name;
    const coord = f.geometry.coordinates;

    const option = document.createElement('option');
    option.value = coord.join(',');
    option.textContent = name;
    select.appendChild(option);
  });

  residenceOptionsLoaded = true; // ✅ Set as loaded
});


  // supermarket
  map.addSource('supermarkets', {
    type: 'vector',
    url: 'mapbox://yiwenz666.cxqvk1q2'
  });
  map.addLayer({
    id: 'supermarkets-layer',
    type: 'circle',
    source: 'supermarkets',
    'source-layer': 'university_10000_supermarket-0v7he5',
    paint: {
      'circle-radius': 6,
      'circle-color': 'blue'
    }
  });

  // restaurant
  map.addSource('restaurants', {
    type: 'vector',
    url: 'mapbox://yiwenz666.7wt1ivt3'
  });
  map.addLayer({
    id: 'restaurants-layer',
    type: 'circle',
    source: 'restaurants',
    'source-layer': 'university_10000_restaurant-aeh2ne',
    paint: {
      'circle-radius': 6,
      'circle-color': 'orange'
    }
  });

  // park
  map.addSource('parks', {
    type: 'vector',
    url: 'mapbox://yiwenz666.4e7keobq'
  });
  map.addLayer({
    id: 'parks-layer',
    type: 'fill',
    source: 'parks',
    'source-layer': 'university_10000_green2-agr5as',
    paint: {
      'fill-color': '#27ae60',
      'fill-opacity': 0.6
    }
  });

  // building
  map.addSource('buildings', {
    type: 'vector',
    url: 'mapbox://yiwenz666.8p8m55c6'
  });
  map.addLayer({
    id: 'buildings-layer',
    type: 'fill',
    source: 'buildings',
    'source-layer': 'uog_Building-4ofu6u',
    paint: {
      'fill-color': '#000000',
      'fill-opacity': 0.4
    }
  });
  
 

  // slope
  map.addSource('roads', {
    type: 'vector',
    url: 'mapbox://yiwenz666.94i925zg'
  });
  map.addLayer({
    id: 'roads-layer',
    type: 'line',
    source: 'roads',
    'source-layer': 'segment_line-b1vpgq',
    paint: {
      'line-width': 2,
      'line-color': [
        'step', ['get', 'slope_abs'],
        '#006400', 5,
        '#F08C00', 8,
        '#FF4500', 17,
        '#800080'
      ]
    }
  });

  // step
  map.addSource('steps', {
    type: 'vector',
    url: 'mapbox://yiwenz666.4f952opm'
  });
  map.addLayer({
    id: 'steps-layer',
    type: 'line',
    source: 'steps',
    'source-layer': 'road_500_step-8mpwqi',
    paint: {
      'line-color': 'red',
      'line-width': 4
    }
  });
  
  // ===== Module 3: Healthy Walking Commute =====
map.addSource('residences', {
  type: 'vector',
  url: 'mapbox://yiwenz666.ck8lf4n2'
});

map.addLayer({
  id: 'residences-layer',
  type: 'circle',
  source: 'residences',
  'source-layer': 'uog_residences-2iag00',
  paint: {
    'circle-radius': 6,
    'circle-color': '#2c7bb6'
  }
});
  
  

// Monitor dormitory data loading and fill in the drop-down box
map.once('sourcedata', (e) => {
  if (e.sourceId === 'residences' && e.isSourceLoaded) {
    const features = map.querySourceFeatures('residences', {
      sourceLayer: 'uog_residences-2iag00'
    });

    const select = document.getElementById('residenceSelect');
    features.forEach(f => {
      const name = f.properties.name;
      const coord = f.geometry.coordinates;
      const option = document.createElement('option');
      option.value = coord.join(',');
      option.textContent = name;
      select.appendChild(option);
    });
  }
});

// When selecting a dorm, request walking directions
document.getElementById('residenceSelect').addEventListener('change', e => {
  const selectedValue = e.target.value;
  if (!selectedValue) return;

  const startCoords = selectedValue.split(',').map(Number);
  
    // Add red marks to indicate current dormitories
  if (selectedResidenceMarker) selectedResidenceMarker.remove();
  selectedResidenceMarker = new mapboxgl.Marker({ color: 'red' })
    .setLngLat(startCoords)
    .addTo(map);

  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${startCoords.join(',')};-4.289058,55.873543?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;

  fetch(url)
    .then(resp => resp.json())
    .then(data => {
  const route = data.routes[0].geometry;
  const duration = data.routes[0].duration;

  const healthyMinutes = (duration / 60).toFixed(1);           // Healthy people
  const wheelchairMinutes = (duration * 1.3 / 60).toFixed(1);   // Wheelchair users ×1.3

  if (map.getSource('walk-route')) map.removeSource('walk-route');
  if (map.getLayer('walk-route')) map.removeLayer('walk-route');

  map.addSource('walk-route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: route
    }
  });

  map.addLayer({
    id: 'walk-route',
    type: 'line',
    source: 'walk-route',
    paint: {
      'line-color': '#0074D9',
      'line-width': 4
    }
  });

  const infoBox = document.getElementById('commute-info');
  infoBox.style.display = 'block';
  infoBox.innerHTML = `
    <strong>Walking commute:</strong> ${healthyMinutes} minutes<br>
    <strong>Wheelchair commute:</strong> ${wheelchairMinutes} minutes`;

  map.fitBounds([startCoords, [-4.289058, 55.873543]], { padding: 80 });
});
});
  

  // popup
  let hoverPopup;
['supermarkets-layer', 'restaurants-layer', 'parks-layer'].forEach(layer => {
  // Hover 
  map.on('mousemove', layer, e => {
    const name = e.features[0].properties.name || 'Unnamed';
    const coords = e.features[0].geometry.coordinates;
    if (hoverPopup) hoverPopup.remove();
    hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    })
      .setLngLat(coords)
      .setHTML(`<strong>${name}</strong>`)
      .addTo(map);
  });

  map.on('mouseleave', layer, () => {
    if (hoverPopup) hoverPopup.remove();
    hoverPopup = null;
  });

  // Click 
  map.on('click', layer, e => {
    const coord = e.features[0].geometry.coordinates;
    const props = e.features[0].properties;
    const name = props.name || 'Unnamed';

    let html = `<strong>${name}</strong><br/><hr style="margin: 4px 0;">`;

    if (layer === 'supermarkets-layer') {
      const fields = ['opening_hours', 'wheelchair'];
      fields.forEach(f => {
        html += `<div><strong>${f}</strong>: ${props[f] || 'None'}</div>`;
      });
    } else if (layer === 'restaurants-layer') {
      const fields = ['cuisine', 'opening_hours', 'phone', 'email'];
      fields.forEach(f => {
        html += `<div><strong>${f}</strong>: ${props[f] || 'None'}</div>`;
      });
    } else {
      // Other layers, such as parks, display all attributes
      Object.keys(props).forEach(key => {
        html += `<div><strong>${key}</strong>: ${props[key]}</div>`;
      });
    }

    new mapboxgl.Popup()
      .setLngLat(coord)
      .setHTML(html)
      .addTo(map);
  });
});


  // Checkbox control layer
  ['Supermarkets', 'Restaurants', 'Parks', 'Roads', 'Steps'].forEach(item => {
    const checkbox = document.getElementById(`toggle${item}`);
    const layerId = item.toLowerCase() + '-layer';
    if (!checkbox) return;
    checkbox.addEventListener('change', () => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', checkbox.checked ? 'visible' : 'none');
      }
      updateLegend();
    });
  });
  
  

  // All layers (except buildings) are hidden by default
  const layersToHide = ['supermarkets-layer', 'restaurants-layer', 'parks-layer', 'roads-layer', 'steps-layer'];
  layersToHide.forEach(id => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', 'none');
    }
  });

  if (map.getLayer('buildings-layer')) {
    map.setLayoutProperty('buildings-layer', 'visibility', 'visible');
  }

  document.getElementById("facilities").style.display = "none";
  document.getElementById("slope").style.display = "none";

  updateLegend();
  
 



});



// ================== Module 4: 15-Minute Life Circle Analysis ===================

// Setting Isochrone Request Parameters
const isoToken = mapboxgl.accessToken;
const wheelchairFactor = 0.7; // wheelchair user factor

// POI layer color style (same as module 1)
const poiStyles = {
  Supermarkets: { color: 'blue', icon: '🛒' },
  Restaurants: { color: 'orange', icon: '🍴' },
  Parks: { color: 'green', icon: '🌳' }
};

// Global variables record statistical results and POI display layer
let statsRecord = {
  healthy: { Supermarkets: 0, Restaurants: 0, Parks: 0, ParkArea: 0 },
  wheelchair: { Supermarkets: 0, Restaurants: 0, Parks: 0, ParkArea: 0 }
};

// Dormitory drop-down menu loading (module one is loaded and not repeated)
map.on('idle', () => {
  const select = document.getElementById('lifeResidenceSelect');
  if (!select || select.options.length > 1) return;

  const features = map.querySourceFeatures('residences', {
    sourceLayer: 'uog_residences-2iag00'
  });

  features.forEach(f => {
    const name = f.properties.name;
    const coord = f.geometry.coordinates;
    const option = document.createElement('option');
    option.value = coord.join(',');
    option.textContent = name;
    select.appendChild(option);
  });
});

// Pull down trigger: load two life circles + display POIs in the circle
document.getElementById('lifeResidenceSelect').addEventListener('change', e => {
  const val = e.target.value;
  if (!val) return;
  clearModule3(); // ✅ Clear module 3 content

  const [lng, lat] = val.split(',').map(Number);
    // Add red marks to indicate current dormitories
  if (selectedResidenceMarker) selectedResidenceMarker.remove();
  selectedResidenceMarker = new mapboxgl.Marker({ color: 'red' })
    .setLngLat([lng, lat])
    .addTo(map);

  requestIsochrone([lng, lat], 15, 'healthy');
  requestIsochrone([lng, lat], Math.round(15 * wheelchairFactor), 'wheelchair');
  map.flyTo({ center: [lng, lat], zoom: 14 });
});

// Request Isochrone + Presentation Layer
function requestIsochrone(center, minutes, type) {
  const url = `https://api.mapbox.com/isochrone/v1/mapbox/walking/${center[0]},${center[1]}?contours_minutes=${minutes}&polygons=true&access_token=${isoToken}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const layerId = `iso-${type}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(layerId)) map.removeSource(layerId);

      map.addSource(layerId, { type: 'geojson', data: data });
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: layerId,
        paint: {
          'fill-color': type === 'healthy' ? '#d4ac0d'  :'#f39c12', 
          'fill-opacity': 0.35
        }
      });

      // Update POI quantity statistics & display POIs in the circle
      updatePOIStats(data, type);
    });
}

// Filter POIs in the living circle, update statistics & load display layers
function updatePOIStats(bufferGeojson, userType) {
  const polygon = bufferGeojson.features[0];
  const stats = { Supermarkets: 0, Restaurants: 0, Parks: 0, ParkArea: 0 };

  // Remove the old POI layer
  ['Supermarkets', 'Restaurants', 'Parks'].forEach(key => {
    const id = `${key}-${userType}`;
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

 // Load the POI layer
  ['supermarkets', 'restaurants', 'parks'].forEach(key => {
    const poiType = key.charAt(0).toUpperCase() + key.slice(1); // "supermarkets" -> "Supermarkets"
    const color = poiStyles[poiType].color;
    const icon = poiStyles[poiType].icon;
    const id = `${poiType}-${userType}`;

    let filtered = [];

    if (poiGeo[key]) {
      poiGeo[key].features.forEach(f => {
        let geom = f.geometry;
        if (key === 'parks') {
          const intersection = turf.intersect(f, polygon);
          if (intersection) {
            stats.Parks++;
            stats.ParkArea += turf.area(intersection);
            filtered.push(turf.centroid(f)); // Display with center point
          }
        } else {
          if (turf.booleanPointInPolygon(f, polygon)) {
            stats[poiType]++;
            filtered.push(f);
          }
        }
      });
      
      // ✅ Insert the parks polygon layer
  if (key === 'parks') {
    const parkPolyId = `ParksPolygon-${userType}`;
    if (map.getLayer(parkPolyId)) map.removeLayer(parkPolyId);
    if (map.getSource(parkPolyId)) map.removeSource(parkPolyId);

    const parkPolygons = poiGeo.parks.features.filter(f =>
      turf.intersect(f, polygon)
    );

    map.addSource(parkPolyId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: parkPolygons
      }
    });

    map.addLayer({
      id: parkPolyId,
      type: 'fill',
      source: parkPolyId,
      paint: {
        'fill-color': '#27ae60',
        'fill-opacity': 0.3
      }
    });
  }
    }

    // Add display layer
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: filtered
      }
    });

    map.addLayer({
      id: id,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': 6,
        'circle-color': color,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });
    
   // Hover + Popup for POI layer in the life circle (same as module 1)
    let hoverPopup; // Popup showing floating name

['Supermarkets', 'Restaurants'].forEach(poiType => {
  const layerId = `${poiType}-${userType}`;
  map.on('mousemove', layerId, e => {
    const name = e.features[0].properties.name || 'Unnamed';
    const coords = e.features[0].geometry.coordinates;
    if (hoverPopup) hoverPopup.remove();
    hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    })
      .setLngLat(coords)
      .setHTML(`<strong>${name}</strong>`)
      .addTo(map);
  });
  map.on('mouseleave', layerId, () => {
    if (hoverPopup) hoverPopup.remove();
    hoverPopup = null;
  });
  map.on('click', layerId, e => {
    const coord = e.features[0].geometry.coordinates;
    const props = e.features[0].properties;
    const name = props.name || 'Unnamed';
    let html = `<strong>${name}</strong><br/><hr style="margin: 4px 0;">`;

    const fields = poiType === 'Supermarkets'
      ? ['opening_hours', 'wheelchair']
      : ['cuisine', 'opening_hours', 'phone', 'email'];

    fields.forEach(f => {
      html += `<div><strong>${f}</strong>: ${props[f] || 'None'}</div>`;
    });

    new mapboxgl.Popup()
      .setLngLat(coord)
      .setHTML(html)
      .addTo(map);
  });
});

  });

  statsRecord[userType] = stats;

 // Update the floating window after both groups are loaded
  if (statsRecord.healthy && statsRecord.wheelchair) {
    const box = document.getElementById('life-statistics');
    box.innerHTML = `
      <strong>Walking 15-minute life circle:</strong><br>
      🛒 Supermarkets: ${statsRecord.healthy.Supermarkets}<br>
      🍴 Restaurants: ${statsRecord.healthy.Restaurants}<br>
      🌳 Parks: ${statsRecord.healthy.Parks} (${(statsRecord.healthy.ParkArea / 10000).toFixed(2)} ha)<br><br>
      <strong>Wheelchair 15-minute life circle:</strong><br>
      🛒 Supermarkets: ${statsRecord.wheelchair.Supermarkets}<br>
      🍴 Restaurants: ${statsRecord.wheelchair.Restaurants}<br>
      🌳 Parks: ${statsRecord.wheelchair.Parks} (${(statsRecord.wheelchair.ParkArea / 10000).toFixed(2)} ha)
    `;
  }
}

 // ===== Module 5: Accessibility Score Display =====
let scoreLayerLoaded = false;

// Load the scoring layer when clicking module 5
function showModule5Scores() {
  if (map.getLayer('residence-scores')) map.removeLayer('residence-scores');
  if (map.getSource('residence-scores')) map.removeSource('residence-scores');

  map.addSource('residence-scores', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/yiwenzheng666/campus-poi-data/refs/heads/main/uog_residences_scores.geojson'
  });

  map.addLayer({
    id: 'residence-scores',
    type: 'symbol',
    source: 'residence-scores',
   layout: {
  'text-field': [
    'concat',
    ['get', 'name'], '\n',
    'Walking Rank: ', ['get', 'healthy_rank'], ' (', ['get', 'healthy_score'], ')\n',
    'Wheelchair Rank: ', ['get', 'wheel_rank'], ' (', ['get', 'wheel_score'], ')'
  ],
  'text-font': ['Open Sans Bold'],
  'text-offset': [0, 1.5],
  'text-anchor': 'top',
  'text-size': 13
},
    paint: {
      'text-color': '#2c3e50',
      'text-halo-width': 1.2,
      'text-halo-color': '#ffffff'
    }
  });

  scoreLayerLoaded = true;
}

