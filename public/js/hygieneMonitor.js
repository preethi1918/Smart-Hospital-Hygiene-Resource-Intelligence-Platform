// Hygiene & Disinfection Telemetry Controller
// Smart Hospital Hygiene & Resource Intelligence Platform

class HygieneMonitor {
  constructor(app) {
    this.app = app;
  }

  renderDispensers(zones, containerId = 'dispensers-grid-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    zones.forEach(zone => {
      zone.devices.dispensers.forEach(dsp => {
        let fillClass = 'cyan';
        if (dsp.levelPct < 20) fillClass = 'crimson';
        else if (dsp.levelPct < 40) fillClass = 'amber';

        let statusClass = 'active';
        if (dsp.status === 'Refill Required' || dsp.status === 'Low Liquid Warning') statusClass = 'critical';

        html += `
          <div class="device-card">
            <div class="device-card-header">
              <div class="device-title-box">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v6m-4-3h8M7 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"/>
                  </svg>
                  ${dsp.id}
                </h4>
                <span class="device-zone-tag">${zone.name} &bull; ${dsp.location}</span>
              </div>
              <span class="status-badge ${statusClass}">${dsp.status}</span>
            </div>

            <!-- Sanitizer Fill Level -->
            <div class="metric-bar-group">
              <div class="metric-bar-label">
                <span>Antiseptic Gel Volume</span>
                <strong style="color: ${dsp.levelPct < 20 ? 'var(--accent-crimson)' : '#fff'}">${dsp.levelPct}%</strong>
              </div>
              <div class="metric-bar-track">
                <div class="metric-bar-fill ${fillClass}" style="width: ${dsp.levelPct}%"></div>
              </div>
            </div>

            <!-- Meta statistics -->
            <div class="device-meta-row">
              <div class="meta-item">
                <span>Compliance Rate</span>
                <strong style="color: ${dsp.compliancePct >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}">${dsp.compliancePct}%</strong>
              </div>
              <div class="meta-item">
                <span>Total Dispenses</span>
                <strong>${dsp.totalDispenses.toLocaleString()}</strong>
              </div>
              <div class="meta-item">
                <span>IoT Battery</span>
                <strong>${dsp.batteryPct}%</strong>
              </div>
              <div class="meta-item">
                <span>Dispense Type</span>
                <strong style="font-size: 0.78rem;">Touchless IR</strong>
              </div>
            </div>

            <button class="btn-card-action" onclick="window.hospitalApp.refillDispenser('${dsp.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              Quick Refill Cartridge
            </button>
          </div>
        `;
      });
    });

    container.innerHTML = html;
  }

  renderUvcUnits(zones, containerId = 'uvc-grid-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    zones.forEach(zone => {
      zone.devices.uvcUnits.forEach(uvc => {
        const circumference = 2 * Math.PI * 27; // r=27
        const strokeOffset = circumference - (uvc.progressPct / 100) * circumference;

        let statusBadgeClass = 'active';
        if (uvc.status === 'Idle') statusBadgeClass = 'warning';
        if (uvc.status === 'Completed') statusBadgeClass = 'active';

        html += `
          <div class="device-card">
            <div class="device-card-header">
              <div class="device-title-box">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                  </svg>
                  ${uvc.name}
                </h4>
                <span class="device-zone-tag">${zone.name} &bull; ${uvc.room}</span>
              </div>
              <span class="status-badge ${statusBadgeClass}">${uvc.status}</span>
            </div>

            <div class="uvc-progress-wrapper">
              <div class="uvc-radial-container">
                <svg class="radial-svg" viewBox="0 0 64 64">
                  <circle class="radial-circle-bg" cx="32" cy="32" r="27"/>
                  <circle class="radial-circle-val" cx="32" cy="32" r="27"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${strokeOffset}"/>
                </svg>
                <div class="radial-center-text">${uvc.progressPct}%</div>
              </div>

              <div class="uvc-meta-details">
                <span>Radiation Dosage: <strong style="color: #c4b5fd;">${uvc.dosageMj} / ${uvc.targetDosage} mJ/cm²</strong></span>
                <span>Last Disinfection: <strong>${uvc.lastCycleTime}</strong></span>
                <span style="margin-top: 0.2rem;">
                  <span class="interlock-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    PIR Motion Lockout: ${uvc.motionLockout ? 'ARMED' : 'STANDBY'}
                  </span>
                </span>
              </div>
            </div>

            <button class="btn-card-action" onclick="window.hospitalApp.startUvcCycle('${uvc.id}')" ${uvc.status === 'Active' ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              ${uvc.status === 'Active' ? 'Disinfection in Progress...' : 'Start Terminal Sterilization'}
            </button>
          </div>
        `;
      });
    });

    container.innerHTML = html;
  }

  renderBioBins(zones, containerId = 'biobins-grid-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    zones.forEach(zone => {
      zone.devices.bioBins.forEach(bin => {
        let fillClass = 'emerald';
        if (bin.fillPct > 85) fillClass = 'crimson';
        else if (bin.fillPct > 65) fillClass = 'amber';

        let dotColor = 'yellow';
        if (bin.type.includes('Sharps') || bin.type.includes('Red')) dotColor = 'red';
        else if (bin.type.includes('Cytotoxic') || bin.type.includes('Purple')) dotColor = 'purple';
        else if (bin.type.includes('Black')) dotColor = 'black';

        html += `
          <div class="device-card">
            <div class="device-card-header">
              <div class="device-title-box">
                <h4>
                  <span class="bin-indicator-dot ${dotColor}"></span>
                  ${bin.id}
                </h4>
                <span class="device-zone-tag">${zone.name}</span>
              </div>
              <span class="status-badge ${bin.fillPct > 85 ? 'critical' : (bin.fillPct > 65 ? 'warning' : 'active')}">${bin.status}</span>
            </div>

            <div style="font-size: 0.82rem; color: #e2e8f0; font-weight: 600;">
              Classification: ${bin.type}
            </div>

            <!-- Capacity Fill Bar -->
            <div class="metric-bar-group">
              <div class="metric-bar-label">
                <span>Container Fill Level</span>
                <strong style="color: ${bin.fillPct > 85 ? 'var(--accent-crimson)' : '#fff'}">${bin.fillPct}%</strong>
              </div>
              <div class="metric-bar-track">
                <div class="metric-bar-fill ${fillClass}" style="width: ${bin.fillPct}%"></div>
              </div>
            </div>

            <div class="device-meta-row">
              <div class="meta-item">
                <span>Weight</span>
                <strong>${bin.weightKg} / ${bin.maxWeightKg} kg</strong>
              </div>
              <div class="meta-item">
                <span>Last Emptied</span>
                <strong>${bin.lastEmptied}</strong>
              </div>
            </div>

            <button class="btn-card-action" onclick="window.hospitalApp.emptyBin('${bin.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Empty & Decant Container
            </button>
          </div>
        `;
      });
    });

    container.innerHTML = html;
  }

  renderAirQuality(zones, containerId = 'air-quality-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    zones.forEach(zone => {
      const isPositive = zone.pressurePa >= 0;
      html += `
        <div class="air-zone-panel">
          <div class="device-card-header">
            <div>
              <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff;">${zone.name}</h4>
              <span class="device-zone-tag" style="font-size: 0.76rem;">${zone.category} &bull; ${zone.floor}</span>
            </div>
            <span class="status-badge ${zone.riskLevel === 'Nominal' ? 'active' : (zone.riskLevel === 'Moderate' ? 'warning' : 'critical')}">
              ${zone.riskLevel}
            </span>
          </div>

          <!-- Pressure Differential Bar -->
          <div class="pressure-differential-bar ${isPositive ? '' : 'negative'}">
            <span class="pressure-title">
              Airflow Barrier: ${isPositive ? 'Positive Outflow (+)' : 'Negative Isolation Containment (-)'}
            </span>
            <span class="pressure-val ${isPositive ? '' : 'neg'}">
              ${isPositive ? '+' : ''}${zone.pressurePa} Pa
            </span>
          </div>

          <!-- Air Readouts -->
          <div class="air-readout-row">
            <div class="readout-box">
              <label>Ventilation ACH</label>
              <val style="color: var(--accent-cyan);">${zone.ach}</val>
              <sub>Target: >${zone.targetAch}</sub>
            </div>
            <div class="readout-box">
              <label>PM2.5 Particulate</label>
              <val style="color: ${zone.pm25 < 5 ? 'var(--accent-emerald)' : (zone.pm25 < 15 ? 'var(--accent-amber)' : 'var(--accent-crimson)')};">${zone.pm25}</val>
              <sub>µg/m³</sub>
            </div>
            <div class="readout-box">
              <label>Microbial CFU</label>
              <val style="color: ${zone.cfuEst < 10 ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${zone.cfuEst}</val>
              <sub>CFU/m³ est</sub>
            </div>
          </div>

          <!-- HEPA Filter Life -->
          <div class="metric-bar-group">
            <div class="metric-bar-label">
              <span>HEPA H14 Filter Life Remaining</span>
              <strong>${zone.hepaFilterLife}%</strong>
            </div>
            <div class="metric-bar-track">
              <div class="metric-bar-fill ${zone.hepaFilterLife > 50 ? 'emerald' : (zone.hepaFilterLife > 20 ? 'amber' : 'crimson')}" style="width: ${zone.hepaFilterLife}%"></div>
            </div>
          </div>

          <!-- Environmental details -->
          <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-muted); padding-top: 0.4rem; border-top: 1px solid rgba(255, 255, 255, 0.05);">
            <span>Temp: <strong style="color: #fff;">${zone.temperatureC}°C</strong></span>
            <span>Humidity: <strong style="color: #fff;">${zone.humidityPct}% RH</strong></span>
            <span>Composite Hygiene: <strong style="color: var(--accent-cyan);">${zone.hygieneScore}%</strong></span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
}

window.HygieneMonitor = HygieneMonitor;
