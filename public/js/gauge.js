/* ============================================================
   SeismicRadar – gauge.js
   Handles SVG Arc Gauge Animation and Color Interpolation
   ============================================================ */

class SeismicGauge {
  constructor() {
    this.arc = document.getElementById('gauge-arc');
    this.needle = document.getElementById('gauge-needle');
    // Using a 180-deg arc (half circle). The exact path length for r=80 is ~251.3
    this.pathLength = 251.32;
    // Current value
    this.value = 0;
  }

  /**
   * Set gauge value (0-100)
   */
  setValue(val) {
    if (val < 0) val = 0;
    if (val > 100) val = 100;
    this.value = val;

    this.updateDOM();
  }

  updateDOM() {
    if (!this.arc || !this.needle) return;

    // Calculate stroke-dashoffset implementation (0% = 251.3 length, 100% = 0 length)
    // Actually, we want it to draw from left to right.
    // Full visible arc means dashoffset = 0.
    // Initially dasharray = 251.3, dashoffset = 251.3 (hidden)
    const offset = this.pathLength - (this.value / 100) * this.pathLength;
    this.arc.style.strokeDashoffset = offset;

    // Calculate needle rotation: 0% = -90deg, 100% = +90deg
    // Default needle points straight up (0deg). Left is -90, Right is +90.
    const angle = (this.value / 100) * 180 - 90;
    this.needle.style.transform = `rotate(${angle}deg)`;

    // Calculate colors
    const color = this.getColor(this.value);
    this.arc.style.stroke = color;
    // The gauge value text color transitions via CSS, but we set the variable locally
    const valText = document.getElementById('gauge-value');
    if (valText) {
      valText.style.color = color;
      valText.style.textShadow = `0 0 30px ${this.hexToRgbA(color, 0.4)}`;
    }
  }

  /**
   * Simple linear interpolation for risk color bands
   */
  getColor(val) {
    // Colors match CSS variables: green -> yellow -> orange -> red
    // low 0-35, med 35-60, high 60-80, crit >80
    if (val < 20) return '#00ff88'; // pure green
    if (val < 40) return '#ffd600'; // pure yellow
    if (val < 65) return '#ff6d00'; // pure orange
    return '#ff1744'; // pure red
  }

  // helper for text-shadow
  hexToRgbA(hex, alpha){
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
        c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(255,0,0,${alpha})`;
  }
}

// Init when DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.seismicGauge = new SeismicGauge();
  // Wait a small delay to trigger the initial CSS transition animation
  setTimeout(() => window.seismicGauge.setValue(0), 100);
});
