// Interactive Hospital SVG Floor Map Controller
// Smart Hospital Hygiene & Resource Intelligence Platform

class HospitalFloorMap {
  constructor(containerId, onZoneSelect) {
    this.container = document.getElementById(containerId);
    this.onZoneSelect = onZoneSelect;
    this.selectedZoneId = 'OT-COMPLEX';
    this.zonesData = [];
    this.render();
  }

  updateData(zones) {
    this.zonesData = zones;
    this.updateBeacons();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="map-svg-wrapper">
        <svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Zone Gradients -->
            <linearGradient id="grad-ot" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#0369a1" stop-opacity="0.10"/>
            </linearGradient>
            <linearGradient id="grad-icu" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#059669" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#047857" stop-opacity="0.10"/>
            </linearGradient>
            <linearGradient id="grad-er" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#d97706" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#b45309" stop-opacity="0.10"/>
            </linearGradient>
            <linearGradient id="grad-nicu" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#6d28d9" stop-opacity="0.10"/>
            </linearGradient>
            <linearGradient id="grad-ward" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2563eb" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.10"/>
            </linearGradient>
            <linearGradient id="grad-lab" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0d9488" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#0f766e" stop-opacity="0.10"/>
            </linearGradient>

            <!-- Glow Filters -->
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          <!-- Outer Architectural Perimeter -->
          <rect x="20" y="20" width="920" height="500" rx="16" fill="#080e1c" stroke="rgba(255, 255, 255, 0.12)" stroke-width="2"/>
          
          <!-- Central Sterile Corridor System -->
          <path d="M 440 20 L 520 20 L 520 520 L 440 520 Z" fill="#0b1426" stroke="rgba(0, 242, 254, 0.18)" stroke-width="1.5" stroke-dasharray="6,4"/>
          <path d="M 20 250 L 940 250 L 940 310 L 20 310 Z" fill="#0b1426" stroke="rgba(0, 242, 254, 0.18)" stroke-width="1.5" stroke-dasharray="6,4"/>
          <text x="480" y="285" fill="rgba(0, 242, 254, 0.45)" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700" letter-spacing="3" text-anchor="middle">CENTRAL STERILE CORRIDOR ARTERY</text>

          <!-- Zone 1: OT COMPLEX (Top Left) -->
          <g id="zone-OT-COMPLEX" class="floor-zone" onclick="window.hospitalApp.selectZone('OT-COMPLEX')">
            <rect x="40" y="40" width="380" height="190" rx="10" fill="url(#grad-ot)" stroke="rgba(0, 242, 254, 0.4)" stroke-width="1.5"/>
            <!-- OT Subrooms -->
            <rect x="55" y="55" width="165" height="120" rx="6" fill="rgba(2, 132, 199, 0.12)" stroke="rgba(255, 255, 255, 0.1)"/>
            <text x="65" y="80" fill="#fff" font-size="12" font-weight="700">OT-1 (Cardiac Suite)</text>
            <text x="65" y="98" fill="#38bdf8" font-size="9" font-family="JetBrains Mono">+25 Pa | Laminar Flow</text>

            <rect x="235" y="55" width="170" height="120" rx="6" fill="rgba(2, 132, 199, 0.12)" stroke="rgba(255, 255, 255, 0.1)"/>
            <text x="245" y="80" fill="#fff" font-size="12" font-weight="700">OT-2 (Ortho Suite)</text>
            <text x="245" y="98" fill="#38bdf8" font-size="9" font-family="JetBrains Mono">+24 Pa | HEPA Life 88%</text>

            <!-- Scrub Station -->
            <rect x="55" y="185" width="350" height="35" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)"/>
            <text x="70" y="206" fill="#10b981" font-size="11" font-weight="600">Surgical Scrub & Antechamber Station</text>
            
            <text x="400" y="65" fill="#e2e8f0" font-size="14" font-weight="800" text-anchor="end">ZONE: OT COMPLEX</text>
          </g>

          <!-- Zone 2: ICU WINGS A & B (Top Right) -->
          <g id="zone-ICU-W1" class="floor-zone" onclick="window.hospitalApp.selectZone('ICU-W1')">
            <rect x="540" y="40" width="380" height="190" rx="10" fill="url(#grad-icu)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1.5"/>
            <!-- ICU Bays -->
            <rect x="555" y="55" width="220" height="160" rx="6" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(255, 255, 255, 0.1)"/>
            <text x="568" y="80" fill="#fff" font-size="12" font-weight="700">ICU Beds 1-12 (Main Bay)</text>
            <text x="568" y="98" fill="#34d399" font-size="9" font-family="JetBrains Mono">Central Station | Dispenser Active</text>

            <!-- Negative Pressure Isolation -->
            <rect x="790" y="55" width="115" height="160" rx="6" fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.35)"/>
            <text x="800" y="80" fill="#f87171" font-size="11" font-weight="700">Isolation 101-102</text>
            <text x="800" y="98" fill="#fca5a5" font-size="9" font-family="JetBrains Mono">-8.2 Pa (Airborne)</text>

            <text x="900" y="65" fill="#e2e8f0" font-size="14" font-weight="800" text-anchor="end">ZONE: ICU WING</text>
          </g>

          <!-- Zone 3: EMERGENCY & TRAUMA (Bottom Left) -->
          <g id="zone-ER-TRAUMA" class="floor-zone" onclick="window.hospitalApp.selectZone('ER-TRAUMA')">
            <rect x="40" y="330" width="260" height="170" rx="10" fill="url(#grad-er)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1.5"/>
            <text x="55" y="358" fill="#fff" font-size="13" font-weight="700">EMERGENCY & TRAUMA</text>
            <text x="55" y="376" fill="#fbbf24" font-size="9" font-family="JetBrains Mono">High Foot-Traffic | Resuscitation Bay</text>
            <rect x="55" y="390" width="230" height="95" rx="6" fill="rgba(245, 158, 11, 0.08)" stroke="rgba(255, 255, 255, 0.08)"/>
            <text x="68" y="418" fill="#e2e8f0" font-size="10">Ambulance Bay & Triage</text>
            <text x="68" y="440" fill="#94a3b8" font-size="9">Bio-waste bins & Fast Disinfection</text>
          </g>

          <!-- Zone 4: NEONATAL ICU (Bottom Center-Left) -->
          <g id="zone-NEONATAL-ICU" class="floor-zone" onclick="window.hospitalApp.selectZone('NEONATAL-ICU')">
            <rect x="320" y="330" width="180" height="170" rx="10" fill="url(#grad-nicu)" stroke="rgba(139, 92, 246, 0.4)" stroke-width="1.5"/>
            <text x="335" y="358" fill="#fff" font-size="13" font-weight="700">NICU WING</text>
            <text x="335" y="376" fill="#c4b5fd" font-size="9" font-family="JetBrains Mono">Ultra-Sensitive Pods</text>
            <rect x="335" y="390" width="150" height="95" rx="6" fill="rgba(139, 92, 246, 0.08)" stroke="rgba(255, 255, 255, 0.08)"/>
            <text x="345" y="418" fill="#e2e8f0" font-size="10">Incubator Pods 1-12</text>
            <text x="345" y="440" fill="#c4b5fd" font-size="9">Far-UVC 222nm Active</text>
          </g>

          <!-- Zone 5: GENERAL WARD 3A (Bottom Center-Right) -->
          <g id="zone-GENERAL-WARD-3A" class="floor-zone" onclick="window.hospitalApp.selectZone('GENERAL-WARD-3A')">
            <rect x="520" y="330" width="220" height="170" rx="10" fill="url(#grad-ward)" stroke="rgba(59, 130, 246, 0.4)" stroke-width="1.5"/>
            <text x="535" y="358" fill="#fff" font-size="13" font-weight="700">INPATIENT WARD 3A</text>
            <text x="535" y="376" fill="#93c5fd" font-size="9" font-family="JetBrains Mono">36 Beds Capacity</text>
            <rect x="535" y="390" width="190" height="95" rx="6" fill="rgba(59, 130, 246, 0.08)" stroke="rgba(255, 255, 255, 0.08)"/>
            <text x="548" y="418" fill="#e2e8f0" font-size="10">North & South Nurse Stations</text>
            <text x="548" y="440" fill="#94a3b8" font-size="9">Sanitizer Hubs & Bed Monitors</text>
          </g>

          <!-- Zone 6: PATHOLOGY & LAB (Bottom Right) -->
          <g id="zone-PATH-LAB" class="floor-zone" onclick="window.hospitalApp.selectZone('PATH-LAB')">
            <rect x="760" y="330" width="160" height="170" rx="10" fill="url(#grad-lab)" stroke="rgba(13, 148, 136, 0.4)" stroke-width="1.5"/>
            <text x="775" y="358" fill="#fff" font-size="13" font-weight="700">PATH / MICRO LAB</text>
            <text x="775" y="376" fill="#5eead4" font-size="9" font-family="JetBrains Mono">BSL-2 Biosafety</text>
            <rect x="775" y="390" width="130" height="95" rx="6" fill="rgba(13, 148, 136, 0.08)" stroke="rgba(255, 255, 255, 0.08)"/>
            <text x="785" y="418" fill="#e2e8f0" font-size="10">Culture & Autoclave</text>
            <text x="785" y="440" fill="#5eead4" font-size="9">-12 Pa Pressure Seal</text>
          </g>

          <!-- Dynamic Sensor Pins Layer -->
          <g id="sensor-pins-layer"></g>
        </svg>
      </div>

      <!-- Map Legend -->
      <div class="map-legend">
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #00f2fe; box-shadow: 0 0 6px #00f2fe;"></span>
          <span>RFID Smart Sanitizer</span>
        </div>
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #a855f7; box-shadow: 0 0 6px #a855f7;"></span>
          <span>UV-C Disinfection Robot / Emitter</span>
        </div>
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #facc15; box-shadow: 0 0 6px #facc15;"></span>
          <span>Smart Biohazard Waste Bin</span>
        </div>
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #10b981; box-shadow: 0 0 6px #10b981;"></span>
          <span>HEPA & Pressure Sensor (+ / - Pa)</span>
        </div>
      </div>
    `;

    this.updateBeacons();
  }

  updateBeacons() {
    const pinsLayer = document.getElementById('sensor-pins-layer');
    if (!pinsLayer) return;

    // Pin coordinates mapped to hospital floor zones
    const pinConfigs = [
      // OT COMPLEX
      { id: 'DSP-OT-01', x: 130, y: 195, type: 'dsp', color: '#00f2fe', label: 'OT-1 Scrub' },
      { id: 'DSP-OT-02', x: 310, y: 195, type: 'dsp', color: '#00f2fe', label: 'OT-2 Corridor' },
      { id: 'UVC-OT-BETA', x: 320, y: 110, type: 'uvc', color: '#a855f7', label: 'Ceiling UVGI' },
      { id: 'BIN-OT-01', x: 190, y: 140, type: 'bin', color: '#facc15', label: 'Yellow Bin' },
      
      // ICU
      { id: 'DSP-ICU-01', x: 640, y: 130, type: 'dsp', color: '#00f2fe', label: 'ICU Bed 1-4' },
      { id: 'DSP-ICU-02', x: 840, y: 130, type: 'dsp', color: '#00f2fe', label: 'Iso 101' },
      { id: 'BIN-ICU-01', x: 740, y: 190, type: 'bin', color: '#ef4444', label: 'ICU Waste' },
      { id: 'UVC-ICU-MOB1', x: 860, y: 180, type: 'uvc', color: '#a855f7', label: 'SanitiBot' },

      // ER TRAUMA
      { id: 'DSP-ER-01', x: 140, y: 440, type: 'dsp', color: '#00f2fe', label: 'Triage Entry' },
      { id: 'BIN-ER-01', x: 230, y: 450, type: 'bin', color: '#facc15', label: 'ER Bin' },

      // NICU
      { id: 'DSP-NICU-01', x: 400, y: 440, type: 'dsp', color: '#00f2fe', label: 'Airlock' },
      { id: 'UVC-NICU-01', x: 450, y: 420, type: 'uvc', color: '#a855f7', label: 'Far-UVC' },

      // GENERAL WARD 3A
      { id: 'DSP-WARD-01', x: 620, y: 440, type: 'dsp', color: '#00f2fe', label: 'Station 3A' },
      { id: 'BIN-WARD-01', x: 680, y: 450, type: 'bin', color: '#facc15', label: 'Ward Bin' },

      // PATH LAB
      { id: 'DSP-LAB-01', x: 830, y: 440, type: 'dsp', color: '#00f2fe', label: 'BSL-2 Air Shower' },
      { id: 'BIN-LAB-01', x: 880, y: 450, type: 'bin', color: '#ef4444', label: 'Autoclave Bag' }
    ];

    let svgPinsHtml = '';
    pinConfigs.forEach(pin => {
      svgPinsHtml += `
        <g class="sensor-pin" transform="translate(${pin.x}, ${pin.y})">
          <circle cx="0" cy="0" r="14" fill="${pin.color}" opacity="0.18" class="pulse-beacon"/>
          <circle cx="0" cy="0" r="5" fill="${pin.color}" stroke="#ffffff" stroke-width="1.5"/>
          <title>${pin.id} - ${pin.label}</title>
        </g>
      `;
    });

    pinsLayer.innerHTML = svgPinsHtml;

    // Highlight selected zone border
    document.querySelectorAll('.floor-zone').forEach(z => z.classList.remove('selected'));
    const activeGroup = document.getElementById(`zone-${this.selectedZoneId}`);
    if (activeGroup) activeGroup.classList.add('selected');
  }

  setSelectedZone(zoneId) {
    this.selectedZoneId = zoneId;
    document.querySelectorAll('.floor-zone').forEach(z => z.classList.remove('selected'));
    const activeGroup = document.getElementById(`zone-${zoneId}`);
    if (activeGroup) activeGroup.classList.add('selected');
  }
}

window.HospitalFloorMap = HospitalFloorMap;
