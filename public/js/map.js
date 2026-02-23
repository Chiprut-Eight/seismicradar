/* ============================================================
   SeismicRadar – map.js
   Leaflet Map integration for recent earthquakes
   ============================================================ */

class SeismicMap {
  constructor() {
    this.mapId = 'quake-map';
    this.map = null;
    this.markersLayer = null;

    // Israel default center
    this.defaultCenter = [31.5, 35.0];
    this.defaultZoom = 6;
  }

  init() {
    const el = document.getElementById(this.mapId);
    if (!el) return;

    // Only load if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded');
      return;
    }

    this.map = L.map(this.mapId, {
      zoomControl: true,
      minZoom: 4,
      maxZoom: 12
    }).setView(this.defaultCenter, this.defaultZoom);

    // Add dark baseline map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    // Layer group for markers
    this.markersLayer = L.layerGroup().addTo(this.map);

    // Draw a subtle 500km radius circle around central Israel (approx)
    L.circle([31.5, 35.0], {
      color: '#00e5ff',
      fillColor: '#00e5ff',
      fillOpacity: 0.02,
      weight: 1,
      radius: 500000,
      dashArray: '4 4'
    }).addTo(this.map);
  }

  updateMarkers(features) {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();

    features.forEach(f => {
      const coords = f.geometry.coordinates; // [lon, lat, depth]
      const props = f.properties;
      const lat = coords[1];
      const lng = coords[0];
      const mag = props.mag;

      // Determine color and size
      let color = '#90a4ae'; // low (<2)
      let radius = 4;
      if (mag >= 4.0) { color = '#ff1744'; radius = 10; } // red
      else if (mag >= 3.0) { color = '#ff6d00'; radius = 8; } // orange
      else if (mag >= 2.0) { color = '#ffd600'; radius = 6; } // yellow

      const marker = L.circleMarker([lat, lng], {
        radius: radius,
        fillColor: color,
        color: '#fff',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6
      });

      // Simple JS date object formatting
      const t = new Date(props.time).toLocaleString('he-IL');

      marker.bindPopup(`
        <div style="direction:ltr; text-align:left; font-family:var(--font-display);">
          <strong style="color:${color}; font-size:1.1rem">M ${mag.toFixed(1)}</strong><br>
          <small>${props.place}</small><br>
          <small style="color:#666">${t}</small>
        </div>
      `);

      this.markersLayer.addLayer(marker);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.seismicMap = new SeismicMap();
  window.seismicMap.init();
});
