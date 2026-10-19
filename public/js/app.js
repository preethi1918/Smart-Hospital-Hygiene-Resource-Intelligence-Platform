// Master Application Controller
// Smart Hospital Hygiene & Resource Intelligence Platform

class HospitalIntelligenceApp {
  constructor() {
    this.state = {
      zones: [],
      resources: null,
      alerts: [],
      systemStats: null,
      selectedZoneId: 'OT-COMPLEX',
      activeTab: 'overview'
    };

    this.ws = null;
    this.wsReconnectTimer = null;
    this.alertsManager = null;
    this.hygieneMonitor = null;
    this.resourceMonitor = null;
    this.floorMap = null;
    this.charts = null;
    this.simulatorControls = null;

    this.init();
  }

  init() {
    // Instantiate component controllers
    this.alertsManager = new AlertsManager(this);
    this.hygieneMonitor = new HygieneMonitor(this);
    this.resourceMonitor = new ResourceMonitor(this);
    this.charts = new HospitalAnalyticsCharts();
    this.simulatorControls = new SimulatorControls(this);
    this.floorMap = new HospitalFloorMap('floor-map-container', (zoneId) => this.selectZone(zoneId));

    if (typeof HospitalStructureManager !== 'undefined') {
      this.structureManager = new HospitalStructureManager('structure-management-container');
      window.structureManager = this.structureManager;
    }

    if (typeof HospitalLinenManager !== 'undefined') {
      this.linenManager = new HospitalLinenManager('linen-management-container');
      window.linenManager = this.linenManager;
    }

    this.initTabs();
    this.connectWebSocket();
  }

  initTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.state.activeTab = tabId;

    // Update buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    // If analytics tab opened, trigger chart render
    if (tabId === 'analytics') {
      setTimeout(() => this.charts.renderAll(), 80);
    }

    // If structure tab opened, refresh current structure view
    if (tabId === 'structure' && this.structureManager) {
      this.structureManager.loadCurrentTabData();
    }

    // If linen tab opened, refresh linen data
    if (tabId === 'linen' && this.linenManager) {
      this.linenManager.refreshData();
    }
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.updateConnectionStatus('connecting', 'Connecting...');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.updateConnectionStatus('connected', 'Live Telemetry Active');
        if (this.wsReconnectTimer) {
          clearTimeout(this.wsReconnectTimer);
          this.wsReconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleSocketMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.updateConnectionStatus('disconnected', 'Reconnecting...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
        this.ws.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.wsReconnectTimer) return;
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      this.connectWebSocket();
    }, 3000);
  }

  updateConnectionStatus(status, text) {
    const badge = document.getElementById('connection-status-badge');
    const dot = document.getElementById('connection-status-dot');
    const label = document.getElementById('connection-status-text');

    if (label) label.textContent = text;
    if (dot) {
      if (status === 'connected') {
        dot.style.backgroundColor = 'var(--accent-emerald)';
        dot.style.boxShadow = '0 0 10px var(--accent-emerald)';
      } else if (status === 'connecting') {
        dot.style.backgroundColor = 'var(--accent-amber)';
        dot.style.boxShadow = '0 0 10px var(--accent-amber)';
      } else {
        dot.style.backgroundColor = 'var(--accent-crimson)';
        dot.style.boxShadow = '0 0 10px var(--accent-crimson)';
      }
    }
  }

  handleSocketMessage(message) {
    switch (message.type) {
      case 'INIT_STATE':
        this.state.zones = message.data.zones;
        this.state.resources = message.data.resources;
        this.state.alerts = message.data.alerts;
        this.state.systemStats = message.data.systemStats;

        this.alertsManager.updateAlerts(this.state.alerts);
        this.updateAllViews();
        break;

      case 'TELEMETRY_UPDATE':
        this.state.zones = message.data.zones;
        this.state.resources = message.data.resources;
        this.state.systemStats = message.data.systemStats;

        this.updateTelemetryViews();
        break;

      case 'NEW_ALERT':
        this.alertsManager.addAlert(message.alert);
        break;

      case 'ALERT_UPDATED':
        this.alertsManager.updateSingleAlert(message.alert);
        break;

      default:
        break;
    }
  }

  updateAllViews() {
    this.updateKPIs();
    this.updateZoneInspector();
    this.floorMap.updateData(this.state.zones);

    // Hygiene views
    this.hygieneMonitor.renderDispensers(this.state.zones);
    this.hygieneMonitor.renderUvcUnits(this.state.zones);
    this.hygieneMonitor.renderBioBins(this.state.zones);
    this.hygieneMonitor.renderAirQuality(this.state.zones);

    // Resources view
    this.resourceMonitor.renderResources(this.state.resources);

    // Alerts
    this.alertsManager.renderAlerts();
  }

  updateTelemetryViews() {
    this.updateKPIs();
    this.updateZoneInspector();
    this.floorMap.updateBeacons();

    // Re-render submodules
    this.hygieneMonitor.renderDispensers(this.state.zones);
    this.hygieneMonitor.renderUvcUnits(this.state.zones);
    this.hygieneMonitor.renderBioBins(this.state.zones);
    this.hygieneMonitor.renderAirQuality(this.state.zones);

    this.resourceMonitor.renderResources(this.state.resources);
  }

  updateKPIs() {
    const stats = this.state.systemStats;
    if (!stats) return;

    const elHygiene = document.getElementById('kpi-overall-hygiene');
    const elCompliance = document.getElementById('kpi-avg-compliance');
    const elAlerts = document.getElementById('kpi-active-alarms');
    const elUvc = document.getElementById('kpi-uvc-active');
    const elO2 = document.getElementById('kpi-oxygen-pressure');
    const elBeds = document.getElementById('kpi-icu-beds');

    if (elHygiene) elHygiene.textContent = `${stats.overallHygieneIndex}%`;
    if (elCompliance) elCompliance.textContent = `${stats.avgCompliance}%`;
    if (elAlerts) elAlerts.textContent = stats.activeAlertsCount;
    if (elUvc) elUvc.textContent = stats.activeUvcCount;
    if (elO2) elO2.textContent = `${stats.oxygenPressure} bar`;
    if (elBeds) elBeds.textContent = `${stats.icuOccupancyRate}%`;
  }

  selectZone(zoneId) {
    this.state.selectedZoneId = zoneId;
    this.floorMap.setSelectedZone(zoneId);
    this.updateZoneInspector();
  }

  updateZoneInspector() {
    const container = document.getElementById('selected-zone-inspector');
    if (!container) return;

    const zone = this.state.zones.find(z => z.id === this.state.selectedZoneId);
    if (!zone) return;

    let badgeClass = 'nominal';
    if (zone.riskLevel === 'Moderate') badgeClass = 'moderate';
    else if (zone.riskLevel === 'High Risk' || zone.riskLevel === 'Elevated') badgeClass = 'critical';

    container.innerHTML = `
      <div class="zone-header-pill">
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff;">${zone.name}</h4>
          <span style="font-size: 0.74rem; color: var(--accent-cyan); font-weight: 600;">${zone.category} &bull; ${zone.floor}</span>
        </div>
        <span class="zone-badge-level ${badgeClass}">${zone.riskLevel}</span>
      </div>

      <div class="telemetry-row">
        <div class="mini-telemetry-box">
          <span>Hygiene Index</span>
          <strong style="color: var(--accent-cyan);">${zone.hygieneScore}%</strong>
        </div>
        <div class="mini-telemetry-box">
          <span>Airflow Pressure</span>
          <strong style="color: ${zone.pressurePa >= 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
            ${zone.pressurePa >= 0 ? '+' : ''}${zone.pressurePa} Pa
          </strong>
        </div>
        <div class="mini-telemetry-box">
          <span>Ventilation ACH</span>
          <strong>${zone.ach} ACH</strong>
        </div>
        <div class="mini-telemetry-box">
          <span>PM2.5 Particulate</span>
          <strong style="color: ${zone.pm25 < 10 ? 'var(--accent-emerald)' : 'var(--accent-crimson)'};">
            ${zone.pm25} µg/m³
          </strong>
        </div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.02); border-radius: 8px; padding: 0.9rem; border: 1px solid rgba(255, 255, 255, 0.05);">
        <h5 style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem;">Zone IoT Device Inventory</h5>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.78rem;">
          <div style="display: flex; justify-content: space-between;">
            <span>Smart Dispensers:</span>
            <strong>${zone.devices.dispensers.length} Online</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>UV-C Disinfection Units:</span>
            <strong>${zone.devices.uvcUnits.length} Deployed</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Hazardous Waste Bins:</span>
            <strong>${zone.devices.bioBins.length} Monitored</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>HEPA Filtration Health:</span>
            <strong style="color: ${zone.hepaFilterLife > 50 ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${zone.hepaFilterLife}%</strong>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.6rem; margin-top: 0.4rem;">
        <button class="panel-action-btn" style="flex: 1; padding: 0.6rem;" onclick="window.hospitalApp.switchTab('hygiene')">
          Inspect Disinfection Devices
        </button>
      </div>
    `;
  }

  async refillDispenser(dispenserId) {
    try {
      const res = await fetch('/api/actions/refill-dispenser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispenserId })
      });
      const data = await res.json();
      if (data.success) {
        this.alertsManager.showToast('info', 'Cartridge Refilled', `Dispenser ${dispenserId} replenished to 100%.`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async emptyBin(binId) {
    try {
      const res = await fetch('/api/actions/empty-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binId })
      });
      const data = await res.json();
      if (data.success) {
        this.alertsManager.showToast('info', 'Hazardous Waste Emptied', `Container ${binId} decanted and logged.`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async startUvcCycle(uvcId) {
    try {
      const res = await fetch('/api/actions/start-uvc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uvcId })
      });
      const data = await res.json();
      if (data.success) {
        this.alertsManager.showToast('warning', 'UV-C Initiated', `High-intensity sterilization started on unit ${uvcId}.`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async acknowledgeAlert(alertId) {
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName: 'Rapid Response Team (Auto-Dispatched)' })
      });
      const data = await res.json();
      if (data.success) {
        this.alertsManager.showToast('info', 'Incident Acknowledged', `Incident ${alertId} acknowledged.`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async resolveAlert(alertId) {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNote: 'Sanitization and sterilization confirmed by staff.' })
      });
      const data = await res.json();
      if (data.success) {
        this.alertsManager.showToast('info', 'Incident Resolved', `Incident ${alertId} resolved and logged.`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.hospitalApp = new HospitalIntelligenceApp();
});
