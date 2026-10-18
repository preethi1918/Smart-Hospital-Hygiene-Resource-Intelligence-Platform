// Critical Resources & Asset Intelligence Controller
// Smart Hospital Hygiene & Resource Intelligence Platform

class ResourceMonitor {
  constructor(app) {
    this.app = app;
  }

  renderResources(resources, containerId = 'resources-container') {
    const container = document.getElementById(containerId);
    if (!container || !resources) return;

    const o2 = resources.oxygen;
    const beds = resources.beds;
    const eq = resources.equipment;
    const cons = resources.consumables;

    let o2StatusClass = 'active';
    if (o2.manifoldPressureBar < 3.8) o2StatusClass = 'critical';

    container.innerHTML = `
      <!-- Top Resource Decks -->
      <div class="resource-summary-deck">
        <!-- 1. Medical Oxygen Infrastructure -->
        <div class="glass-panel">
          <div class="panel-header">
            <span class="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Liquid Medical Oxygen (LMO) Telemetry
            </span>
            <span class="status-badge ${o2StatusClass}">${o2.status}</span>
          </div>

          <!-- Cryogenic Bulk Tank Wave Visual -->
          <div class="tank-gauge-visual">
            <div class="tank-liquid-wave" style="height: ${o2.lmoBulkTankPct}%;"></div>
            <div class="tank-center-readout">
              <h3>${o2.lmoBulkTankPct}%</h3>
              <span>Bulk Cryo Tank Volume</span>
            </div>
          </div>

          <div style="margin-top: 1.2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
            <div class="mini-telemetry-box">
              <span>Manifold Line Pressure</span>
              <strong style="color: ${o2.manifoldPressureBar < 3.8 ? 'var(--accent-crimson)' : 'var(--accent-cyan)'}">
                ${o2.manifoldPressureBar} bar
              </strong>
              <small style="color: var(--text-dim); font-size: 0.7rem;">Nominal Baseline: ${o2.targetPressureBar} bar</small>
            </div>
            <div class="mini-telemetry-box">
              <span>Aggregate Gas Flow</span>
              <strong>${o2.totalFlowRateLpm} L/min</strong>
              <small style="color: var(--text-dim); font-size: 0.7rem;">~${o2.reserveHoursRemaining}h Reserves</small>
            </div>
          </div>
        </div>

        <!-- 2. Critical Bed Capacity & Turnover -->
        <div class="glass-panel">
          <div class="panel-header">
            <span class="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>
              </svg>
              Critical Care Beds & Isolation
            </span>
            <span class="status-badge active">${beds.occupied} / ${beds.total} Occupied</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.9rem;">
            <!-- ICU Beds -->
            <div class="metric-bar-group">
              <div class="metric-bar-label">
                <span>ICU Beds (Wings A & B)</span>
                <strong>${beds.icuOccupied} / ${beds.icuTotal} (${Math.round((beds.icuOccupied/beds.icuTotal)*100)}%)</strong>
              </div>
              <div class="metric-bar-track">
                <div class="metric-bar-fill crimson" style="width: ${(beds.icuOccupied/beds.icuTotal)*100}%"></div>
              </div>
            </div>

            <!-- Negative Pressure Isolation Beds -->
            <div class="metric-bar-group">
              <div class="metric-bar-label">
                <span>Airborne Isolation Suites</span>
                <strong>${beds.isolationOccupied} / ${beds.isolationTotal} (${Math.round((beds.isolationOccupied/beds.isolationTotal)*100)}%)</strong>
              </div>
              <div class="metric-bar-track">
                <div class="metric-bar-fill amber" style="width: ${(beds.isolationOccupied/beds.isolationTotal)*100}%"></div>
              </div>
            </div>

            <!-- General Inpatient Beds -->
            <div class="metric-bar-group">
              <div class="metric-bar-label">
                <span>Total Hospital Inpatient Beds</span>
                <strong>${beds.occupied} / ${beds.total} (${Math.round((beds.occupied/beds.total)*100)}%)</strong>
              </div>
              <div class="metric-bar-track">
                <div class="metric-bar-fill cyan" style="width: ${(beds.occupied/beds.total)*100}%"></div>
              </div>
            </div>
          </div>

          <div style="margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted);">
            <span>Available Beds: <strong style="color: var(--accent-emerald);">${beds.available}</strong></span>
            <span>Avg Turnover: <strong style="color: #fff;">${beds.turnoverRateAvgHours} hrs</strong></span>
          </div>
        </div>

        <!-- 3. Critical Equipment Fleet -->
        <div class="glass-panel">
          <div class="panel-header">
            <span class="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Life-Support & Sanitation Devices
            </span>
            <span class="status-badge active">Fleet Nominal</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
            <div class="mini-telemetry-box">
              <span>Ventilators In-Use</span>
              <strong style="color: var(--accent-cyan);">${eq.ventilatorsInUse} / ${eq.ventilatorsTotal}</strong>
              <small style="color: var(--text-dim); font-size: 0.7rem;">${eq.ventilatorsTotal - eq.ventilatorsInUse} Available</small>
            </div>
            <div class="mini-telemetry-box">
              <span>Infusion Pumps</span>
              <strong>${eq.infusionPumpsInUse} / ${eq.infusionPumpsTotal}</strong>
              <small style="color: var(--text-dim); font-size: 0.7rem;">Telemetry Online</small>
            </div>
            <div class="mini-telemetry-box">
              <span>Mobile HEPA Units</span>
              <strong style="color: var(--accent-emerald);">${eq.hepaMobileUnitsActive} / ${eq.hepaMobileUnitsTotal} Active</strong>
              <small style="color: var(--text-dim); font-size: 0.7rem;">100% Deployed</small>
            </div>
            <div class="mini-telemetry-box">
              <span>Autonomous UV-C Bots</span>
              <strong style="color: #c4b5fd;">${eq.uvcRobotsActive} Active / ${eq.uvcRobotsTotal}</strong>
              <small style="color: var(--text-dim); font-size: 0.7rem;">Docked / Cleaning</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Consumables Stock Tracking Deck -->
      <div class="glass-panel">
        <div class="panel-header">
          <span class="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            Infection Prevention Consumables & Stock Levels
          </span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">Automated RFID Depot Restock</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem;">
          <!-- Sanitizer -->
          <div class="mini-telemetry-box">
            <span>Antiseptic Solution Reserves</span>
            <strong style="color: var(--accent-cyan);">${cons.hospitalGradeSanitizerLiters} Liters</strong>
            <div class="metric-bar-track" style="margin-top: 0.4rem;">
              <div class="metric-bar-fill cyan" style="width: ${(cons.hospitalGradeSanitizerLiters/cons.maxSanitizerLiters)*100}%;"></div>
            </div>
          </div>

          <!-- PPE Kits -->
          <div class="mini-telemetry-box">
            <span>Sterile PPE Kits</span>
            <strong style="color: var(--accent-emerald);">${cons.ppeKitsFull.toLocaleString()} Sets</strong>
            <small style="color: var(--text-dim); font-size: 0.7rem;">Safety Minimum: ${cons.ppeKitsThreshold}</small>
          </div>

          <!-- N95 Masks -->
          <div class="mini-telemetry-box">
            <span>N95 Surgical Respirators</span>
            <strong>${cons.n95RespiratorMasks.toLocaleString()} Units</strong>
            <small style="color: var(--text-dim); font-size: 0.7rem;">Stocked across 6 zones</small>
          </div>

          <!-- Gloves -->
          <div class="mini-telemetry-box">
            <span>Sterile Nitrile Gloves</span>
            <strong>${cons.sterileNitrileGlovesBoxes.toLocaleString()} Boxes</strong>
            <small style="color: var(--text-dim); font-size: 0.7rem;">Sizes S / M / L</small>
          </div>

          <!-- Liners -->
          <div class="mini-telemetry-box">
            <span>Bio-hazard Liner Bags</span>
            <strong>${cons.biohazardLinerBags.toLocaleString()} Rolls</strong>
            <small style="color: var(--text-dim); font-size: 0.7rem;">Infectious + Sharps</small>
          </div>
        </div>
      </div>
    `;
  }
}

window.ResourceMonitor = ResourceMonitor;
