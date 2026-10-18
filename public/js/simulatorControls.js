// Simulator Drawer & Telemetry Fault Injection Controller
// Smart Hospital Hygiene & Resource Intelligence Platform

class SimulatorControls {
  constructor(app) {
    this.app = app;
    this.drawer = document.getElementById('simulator-drawer');
    this.backdrop = document.getElementById('drawer-backdrop');
    this.initEvents();
  }

  initEvents() {
    const triggerBtn = document.getElementById('btn-open-simulator');
    const closeBtn = document.getElementById('btn-close-simulator');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.open());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
  }

  open() {
    if (this.drawer) this.drawer.classList.add('active');
    if (this.backdrop) this.backdrop.classList.add('active');
  }

  close() {
    if (this.drawer) this.drawer.classList.remove('active');
    if (this.backdrop) this.backdrop.classList.remove('active');
  }

  async triggerAnomaly(anomalyType, zoneId) {
    try {
      const response = await fetch('/api/actions/simulate-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalyType, zoneId })
      });
      const data = await response.json();
      if (data.success) {
        this.app.alertsManager.showToast('critical', 'Fault Injected', `Triggered simulated event: ${anomalyType}`);
        this.close();
      }
    } catch (e) {
      console.error('Failed to trigger anomaly:', e);
    }
  }

  async resetBaseline() {
    try {
      const response = await fetch('/api/actions/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        this.app.alertsManager.showToast('info', 'System Reset', 'All hospital telemetry reset to optimal sterile baseline.');
        this.close();
      }
    } catch (e) {
      console.error('Failed to reset baseline:', e);
    }
  }
}

window.SimulatorControls = SimulatorControls;
