/* ============================================================
   SeismicRadar – app.js
   Main Orchestrator: Fetches API data, updates DOM, handles i18n
   ============================================================ */

const API_BASE = "/api";
const REFRESH_INTERVAL_SCORE = 30000; // 30 sec
const REFRESH_INTERVAL_QUAKES = 60000; // 60 sec

class SeismicApp {
  constructor() {
    this.currentLang = "he";
    this.state = {
      scoreData: null,
      quakesData: null,
      lastUpdate: null,
      isPolling: false,
    };

    // Dictionary for basic static i18n
    this.i18n = {
      he: {
        score_title: "מדד הסיכון המשוקלל",
        score_subtitle: "הסתברות להתרחשות רעידת אדמה משמעותית ב-24 השעות הקרובות על בסיס שקלול מידע רב-ממדי",
        last_update: "עדכון אחרון:",
        panel_seismic: "פעילות סיסמית",
        panel_iono: "יונוספירה וסביבה",
        panel_time: "זמן מהרעידה האחרונה",
        panel_crowd: "חוכמת ההמונים",
        m_events_48h: "אירועים 48 שעות",
        m_baseline: "ממוצע רגיל (חודשי)",
        m_etas_prob: "הסתברות ETAS",
        m_max_mag: "עוצמה מרבית",
        m_tec: "TEC (GNSS)",
        m_tec_anomaly: "חריגת TEC",
        m_pressure: "לחץ אטמוספרי",
        m_pressure_anomaly: "חריגת לחץ",
        m_last_major: "רעידה ≥4.0 אחרונה",
        m_fault: "העתק ים המלח",
        m_fault_carmel: "העתק הכרמל",
        m_recurrence: "מחזוריות ממוצעת",
        m_felt_24h: 'דיווחי "הרגשתי" (24 ש)',
        m_felt_1h: "דיווחים בשעה האחרונה",
        m_felt_avg: "ממוצע רגיל",
        m_source: "מקור",
        map_title: "מפת אירועים",
        map_radius: '500 ק"מ רדיוס',
        table_title: "רעידות אחרונות",
        th_time: "זמן",
        th_mag: "עוצמה",
        th_depth: 'עומק (ק"מ)',
        th_location: "מיקום",
        th_source: "מקור",
        sources_title: "מקורות נתונים נתמכים API",
        footer_legal: "© 2026 SeismicRadar | מבוסס על מודלים סטטיסטיים בלבד | אינו מחליף מערכת התרעה רשמית",
        modal_title: "הצהרת אחריות חשובה",
        modal_subtitle: "מערכת ניתוח מודלים סיסמיים סטטיסטיים להערכת סיכויים לרעידת אדמה בישראל",
        modal_p1: "חשוב להבהיר: אתר זה מבוסס על מודלים מחקריים-סטטיסטיים בלבד ואינו מהווה מערכת התרעה רשמית. המידע המוצג כאן אינו תחליף ליישומון פיקוד העורף.",
        modal_p2: "פיקוד העורף ורשות החירום הלאומית (רח\"ל) הם הגופים המוסמכים היחידים להוציא התרעות רשמיות על רעידות אדמה בישראל.",
        modal_p3: "מערכת \"תרועה\" הלאומית מפעילה צופרים ושולחת התרעות רק כאשר מזוהה רעידה בפועל בעוצמה של 4.5 ומעלה, מתוך כוונה להתריע רק במקרים של סכנה ממשית לחיי אדם או לתשתיות.",
        modal_p4: "המשתמש באחוזים המוצגים באתר עושה זאת על אחריותו הבלעדית בלבד.",
        modal_btn: "קראתי ומאשר/ת – כניסה לאתר",
        disclaimer_text: "אתר זה אינו מערכת התרעה רשמית. למידע רשמי: פיקוד העורף ורח\"ל בלבד.",
        footer_legal_title: "המשתמש באחוזים המוצגים באתר עושה זאת על אחריותו הבלעדית בלבד",
        footer_legal_body: "חשוב להבהיר: אתר זה מבוסס על מודלים מחקריים-סטטיסטיים בלבד ואינו מהווה מערכת התרעה רשמית. המידע המוצג כאן אינו תחליף ליישומון פיקוד העורף. פיקוד העורף ורשות החירום הלאומית (רח\"ל) הם הגופים המוסמכים היחידים להוציא התרעות רשמיות על רעידות אדמה בישראל.",
        footer_apps_title: "הורד את האפליקציה הרשמית של פיקוד העורף",
        footer_guide_title: "מה עושים בעת רעידת אדמה?",
        footer_g1: "בתוך מבנה: צאו מיד לשטח פתוח. אם לא ניתן, היכנסו לממ\"ד והשאירו דלת פתוחה. אם אין ממ\"ד, צאו לחדר המדרגות. הקפידו להתרחק מחלונות ושימשות.",
        footer_g2: "בחוץ: הישארו בשטח הפתוח, התרחקו ממבנים, עצים, וקווי מתח ועמודי חשמל.",
        footer_g3: "ברכב: עצרו בצד הדרך וחכו בתוך הרכב עד לסיום הרעידה. התרחקו מגשרים ומחלפים.",
        footer_g4: "בחוף הים: התרחקו קילומטר אחד מחוף הים מתוך חשש לצונאמי.",
        footer_copyright: "נבנה על ידי גל צ'יפרוט ובינה מלאכותית (Gal Chiprut)",
        close: "סגור",
        info_modal_title: "מידע על המדד",
        risk: {
          low: "נמוך",
          medium: "בינוני",
          high: "גבוה חריג",
          critical: "קריטי",
        },
        lang_toggle: "EN", // switch to EN
        desc: {
          seismic: "<b>פעילות סיסמית (40%):</b><br>שקלול של רעידות האדמה שהתרחשו ב-48 השעות האחרונות באמצעות מודל ETAS. המודל מזהה 'נחילים' סיסמיים באזור שבר סורי-אפריקאי ומחשב את ההסתברות לרעידת אדמה עוקבת משמעותית.",
          iono: "<b>יונוספירה וסביבה (30%):</b><br>חיבור ללווייני נאסא (GNSS). שינויים בריכוז האלקטרונים (TEC) עשויים להעיד על פליטת גזים מהקרקע עקב לחץ טקטוני גובר לפני רעידה.",
          time: "<b>זמן מהרעידה האחרונה (20%):</b><br>סטטיסטיקת המרווחים. ככל שעובר יותר זמן מהרעידה הגדולה האחרונה על העתקי הים המלח והכרמל, על פי מודל ה-Gap, סבירות השחרור גדלה.",
          crowd: "<b>חוכמת ההמונים (10%):</b><br>נתונים מהמרכז הסיסמולוגי האירופי-ים-תיכוני (EMSC). ניתוח של דיווחי אזרחים ('הרגשתי רעידה') שיכולים להעיד על פעילות מקדימה.",
          map: "<b>מפת אירועים:</b><br>מפה אינטראקטיבית טופוגרפית המציגה את מיקומי כלל הפעילות הסיסמית שהתרחשה לאחרונה בטווח של עד 500 קילומטרים מגבולות ישראל. הצבע וגודל העיגולים משקפים את העוצמה.",
          table: "<b>רעידות אחרונות:</b><br>רשימה כרונולוגית של האירועים האחרונים כפי שדווחו על ידי הרשתות המקומיות והעולמיות (USGS, EMSC, המכון הגיאולוגי לישראל). הנתונים מתעדכנים אוטומטית בכל דקה."
        }
      },
      en: {
        score_title: "Weighted Risk Index",
        score_subtitle: "Probability of a significant earthquake occurring within the next 24 hours based on multi-dimensional analysis",
        last_update: "Last updated:",
        panel_seismic: "Seismic Activity",
        panel_iono: "Ionosphere & Env",
        panel_time: "Time Since Last",
        panel_crowd: "Crowd Wisdom",
        m_events_48h: "Events (48h)",
        m_baseline: "Normal Avg (Mo)",
        m_etas_prob: "ETAS Probability",
        m_max_mag: "Max Magnitude",
        m_tec: "TEC (GNSS)",
        m_tec_anomaly: "TEC Anomaly",
        m_pressure: "Atmospheric Pres.",
        m_pressure_anomaly: "Pres. Anomaly",
        m_last_major: "Last ≥4.0 Event",
        m_fault: "Dead Sea Fault",
        m_fault_carmel: "Carmel Fault",
        m_recurrence: "Avg. Recurrence",
        m_felt_24h: "Felt Reports (24h)",
        m_felt_1h: "Reports (Last 1h)",
        m_felt_avg: "Normal Average",
        m_source: "Source",
        map_title: "Event Map",
        map_radius: "500 km radius",
        table_title: "Recent Earthquakes",
        th_time: "Time",
        th_mag: "Mag",
        th_depth: "Depth (km)",
        th_location: "Location",
        th_source: "Source",
        sources_title: "API Data Sources",
        footer_legal: "© 2026 SeismicRadar | Based purely on statistical models | Not an official early warning system",
        modal_title: "Important Disclaimer",
        modal_subtitle: "Statistical Seismic Modeling Dashboard",
        modal_p1: "Important: This site is based purely on statistical research models and is not an official early warning system. The information here does not replace the Home Front Command app.",
        modal_p2: "The Home Front Command and the National Emergency Management Authority (NEMA) are the only authorized bodies to issue official earthquake warnings in Israel.",
        modal_p3: "The national \"Trua\" system sounds alarms and sends warnings only when an actual earthquake of magnitude 4.5 or higher is detected, intending to warn only in cases of real danger to human life or infrastructure.",
        modal_p4: "Users of the percentages displayed on this site do so entirely at their own risk.",
        modal_btn: "I have read and agree – Enter Site",
        disclaimer_text: "This site is not an official warning system. For official information: Home Front Command and NEMA only.",
        footer_legal_title: "Users of the percentages displayed do so at their own risk",
        footer_legal_body: "Important: This site is based purely on statistical research models and is not an official early warning system. The information here does not replace the official app. The Home Front Command and NEMA are the only authorized bodies to issue official earthquake warnings.",
        footer_apps_title: "Download the Official Home Front Command App",
        footer_guide_title: "What to do during an earthquake?",
        footer_g1: "Indoors: Go outside immediately. If impossible, enter the Mamad (safe room) and leave the door open. If none, go to the stairwell. Keep away from windows and glass.",
        footer_g2: "Outdoors: Stay in open areas, away from buildings, trees, and power lines.",
        footer_g3: "In a vehicle: Stop on the side of the road and wait inside until the shaking stops. Keep away from bridges.",
        footer_g4: "At the beach: Move at least one kilometer away from the shore due to tsunami risks.",
        footer_copyright: "Built by Gal Chiprut & AI",
        close: "Close",
        info_modal_title: "Indicator Info",
        risk: {
          low: "Low",
          medium: "Medium",
          high: "High",
          critical: "Critical",
        },
        lang_toggle: "HE", // switch to HE
        desc: {
          seismic: "<b>Seismic Activity (40%):</b><br>Aggregation of earthquakes in the last 48 hours using the ETAS model. It detects swarms in the Dead Sea Rift and calculates the probability of a significant aftershock.",
          iono: "<b>Ionosphere & Env (30%):</b><br>NASA GNSS satellite data. Changes in Total Electron Content (TEC) in the ionosphere can indicate gas release from the ground due to tectonic stress prior to an earthquake.",
          time: "<b>Time Since Last (20%):</b><br>Statistical gap model. The longer the interval since the last major event on the Dead Sea/Carmel faults, the higher the probability of stress release.",
          crowd: "<b>Crowd Wisdom (10%):</b><br>Data from the EMSC. Analysis of citizen 'felt' reports which may indicate precursor activity not immediately recognized by instruments.",
          map: "<b>Events Map:</b><br>An interactive topographic map showing recent seismic activity within a 500km radius of Israel. Circle color and size reflect magnitude.",
          table: "<b>Recent Earthquakes:</b><br>A chronological list of recent events as reported by local and global networks (USGS, EMSC, GSI). Data refreshes automatically every minute."
        }
      },
    };
  }

  init() {
    this.setupClock();
    this.startPolling();
    this.applyTranslations();
  }

  // --- Clock ---
  setupClock() {
    const updateClock = () => {
      const now = new Date();
      const timeOpts = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      const dateOpts = { day: "2-digit", month: "2-digit", year: "numeric" };

      document.getElementById("clock-time").textContent =
        now.toLocaleTimeString(this.currentLang, timeOpts);
      document.getElementById("clock-date").textContent =
        now.toLocaleDateString(this.currentLang, dateOpts);
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // --- Polling & Data Fetching ---
  async startPolling() {
    if (this.state.isPolling) return;
    this.state.isPolling = true;

    // Initial fetch
    await this.fetchScore();
    await this.fetchQuakes();

    // Set intervals
    setInterval(() => this.fetchScore(), REFRESH_INTERVAL_SCORE);
    setInterval(() => this.fetchQuakes(), REFRESH_INTERVAL_QUAKES);
  }

  async fetchScore() {
    try {
      const res = await fetch(`${API_BASE}/score`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();

      this.state.scoreData = data;
      this.updateDashboard();
    } catch (err) {
      console.error("Failed to fetch score data:", err);
    }
  }

  async fetchQuakes() {
    try {
      // Fetch combined/recent quakes from our backend
      const res = await fetch(`${API_BASE}/quakes`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();

      this.state.quakesData = data;
      this.updateQuakesTable();
      if (window.seismicMap) {
        window.seismicMap.updateMarkers(data.features);
      }
    } catch (err) {
      console.error("Failed to fetch quakes data:", err);
    }
  }

  // --- UI Updaters ---
  updateDashboard() {
    const data = this.state.scoreData;
    if (!data) return;

    // 1. Update Gauge
    if (window.seismicGauge) {
      window.seismicGauge.setValue(data.totalScore);
    }
    const valEl = document.getElementById("gauge-value");
    if (valEl) valEl.textContent = data.totalScore;

    // 2. Risk Badge
    this.updateRiskBadge(data.totalScore);

    // 3. Last Update time
    const t = new Date(data.timestamp);
    const timeOpts = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
    document.getElementById("update-time").textContent = t.toLocaleTimeString(
      this.currentLang,
      timeOpts,
    );

    // 4. Update Panels
    this.updatePanel("seismic", data.totalScore, data.components.seismic);
    this.updatePanel("ionosphere", data.totalScore, data.components.ionosphere);
    this.updatePanel("time", data.totalScore, data.components.time);
    this.updatePanel("crowd", data.totalScore, data.components.crowd);
  }

  updateRiskBadge(score) {
    const badge = document.getElementById("risk-badge");
    const label = document.getElementById("risk-label");
    if (!badge || !label) return;

    badge.className = "risk-level-badge"; // reset

    let riskKey = "low";
    if (score >= 80) {
      riskKey = "critical";
      badge.classList.add("risk-badge-critical");
    } else if (score >= 60) {
      riskKey = "high";
      badge.classList.add("risk-badge-high");
    } else if (score >= 35) {
      riskKey = "medium";
      badge.classList.add("risk-badge-medium");
    } else {
      riskKey = "low";
      badge.classList.add("risk-badge-low");
    }

    // save current key for translation toggle
    badge.setAttribute("data-i18n-key", `risk.${riskKey}`);
    label.textContent = this.i18n[this.currentLang].risk[riskKey];

    // Toggle gauge pulse animation
    const wrapper = document.querySelector(".gauge-wrapper");
    if (wrapper) {
      if (score >= 60) wrapper.classList.add("pulse");
      else wrapper.classList.remove("pulse");
    }
  }

  updatePanel(id, total, compData) {
    const p = document.getElementById(`panel-${id}`);
    if (!p || !compData) return;

    const scoreBadge = document.getElementById(`${id}-score`);
    if (scoreBadge) scoreBadge.textContent = compData.score || "0";

    // Update specific metrics based on id
    if (id === "seismic") {
      this.setText("seismic-events48", compData.events48h);
      this.setText("seismic-baseline", compData.baseline);
      this.setText("seismic-etas", `${compData.etasProb}%`);
      this.setText("seismic-maxmag", `M${compData.maxMag}`);
      this.updateBar("seismic-bar", (compData.score / 40) * 100);
    } else if (id === "ionosphere") {
      this.setText("iono-tec", compData.tec);
      this.setText("iono-tec-anomaly", compData.tecAnomaly);
      this.setText("iono-pressure", compData.pressure);
      this.setText("iono-pressure-anomaly", compData.pressureAnomaly);
      this.updateBar("iono-bar", (compData.score / 30) * 100);
    } else if (id === "time") {
      this.setText("time-last-major", compData.lastMajorDate);
      this.setText("time-dsf", compData.dsfActive);
      this.setText("time-carmel", compData.carmelActive);
      this.updateBar("time-bar", (compData.score / 20) * 100);
    } else if (id === "crowd") {
      this.setText("crowd-felt24", compData.felt24h);
      this.setText("crowd-felt1h", compData.felt1h);
      this.setText("crowd-avg", compData.avg);
      this.updateBar("crowd-bar", (compData.score / 10) * 100);
    }
  }

  updateBar(barId, pctComplete) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    const fill = bar.querySelector(".panel-bar-fill");
    if (fill) {
      const p = Math.min(Math.max(pctComplete, 0), 100);
      fill.style.width = `${p}%`;
      // Color gradient transition logic could be added here based on %
    }
  }

  updateQuakesTable() {
    const data = this.state.quakesData;
    if (!data || !data.features) return;

    document.getElementById("quake-count").textContent = data.count || data.features.length;
    const tbody = document.getElementById("quake-tbody");
    if (!tbody) return;

    tbody.innerHTML = ""; // clear

    if (data.features.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">אין נתונים</td></tr>`;
      return;
    }

    data.features.forEach((f) => {
      const props = f.properties;
      const t = new Date(props.time);
      const magDisplay = props.mag.toFixed(1);

      let magClass = "mag-low";
      if (props.mag >= 4.0) magClass = "mag-major";
      else if (props.mag >= 3.0) magClass = "mag-high";
      else if (props.mag >= 2.0) magClass = "mag-medium";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div style="font-size:0.7rem; color: var(--text-muted)">${t.toLocaleDateString(this.currentLang)}</div>
          <div>${t.toLocaleTimeString(this.currentLang, { hour: "2-digit", minute: "2-digit" })}</div>
        </td>
        <td><span class="mag-badge ${magClass}">M${magDisplay}</span></td>
        <td>${f.geometry.coordinates[2]}</td>
        <td>${props.place}</td>
        <td>${f.source || "Generic"}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // --- i18n ---
  toggleLang() {
    this.currentLang = this.currentLang === "he" ? "en" : "he";
    const isRtl = this.currentLang === "he";
    document.documentElement.lang = this.currentLang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.body.setAttribute("dir", isRtl ? "rtl" : "ltr");

    document.getElementById("lang-toggle").textContent =
      this.i18n[this.currentLang].lang_toggle;

    this.applyTranslations();

    // Re-render data dependent on locale
    this.updateQuakesTable();
    if (this.state.scoreData) {
      const riskKeyAttr = document
        .getElementById("risk-badge")
        ?.getAttribute("data-i18n-key");
      if (riskKeyAttr && riskKeyAttr.startsWith("risk.")) {
        const k = riskKeyAttr.split(".")[1];
        document.getElementById("risk-label").textContent =
          this.i18n[this.currentLang].risk[k];
      }
    }
  }

  applyTranslations() {
    const dict = this.i18n[this.currentLang];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Special case for logo text offset in LTR
    const sub = document.querySelector(".logo-sub");
    if (sub) {
      sub.textContent = this.currentLang === "he" ? "ישראל" : "ISRAEL";
    }
  }

  showTooltip(panelId) {
    const modal = document.getElementById('info-modal-overlay');
    const title = document.getElementById('info-modal-title');
    const body = document.getElementById('info-modal-body');
    const dict = this.i18n[this.currentLang].desc;

    if (modal && dict[panelId]) {
      title.textContent = this.currentLang === 'he' ? 'מידע על המדד' : 'Indicator Info';
      body.innerHTML = dict[panelId];
      // ensure text direction is correct
      body.style.direction = this.currentLang === 'he' ? 'rtl' : 'ltr';
      body.style.textAlign = this.currentLang === 'he' ? 'right' : 'left';
      modal.classList.remove('hidden');
    }
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  window.seismicApp = new SeismicApp();
  window.seismicApp.init();
});
