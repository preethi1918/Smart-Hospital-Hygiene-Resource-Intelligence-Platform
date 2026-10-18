// Real-Time Incident Response, Alarms & Audio Synthesizer
// Smart Hospital Hygiene & Resource Intelligence Platform

class AlertsManager {
  constructor(app) {
    this.app = app;
    this.alerts = [];
    this.filter = 'all';
    this.audioEnabled = true;
    this.audioCtx = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  playAlertSound(severity) {
    if (!this.audioEnabled || !this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    if (severity === 'critical') {
      // Urgent triple-tone medical alarm
      [0, 0.12, 0.24].forEach((delay, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx % 2 === 0 ? 880 : 1100, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.11);
      });
    } else {
      // Harmonic clinical notification chime
      [587.33, 880].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.08));

        gain.gain.setValueAtTime(0, now + (idx * 0.08));
        gain.gain.linearRampToValueAtTime(0.12, now + (idx * 0.08) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + (idx * 0.08));
        osc.stop(now + (idx * 0.08) + 0.26);
      });
    }
  }

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) {
      btn.classList.toggle('active', this.audioEnabled);
      btn.title = this.audioEnabled ? 'Alarm Audio: Enabled' : 'Alarm Audio: Muted';
    }
    this.showToast('info', 'Audio Settings', this.audioEnabled ? 'Alarm audio alerts unmuted.' : 'Alarm audio alerts muted.');
  }

  showToast(severity, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${severity}`;
    toast.innerHTML = `
      <div class="toast-body">
        <h5>${title}</h5>
        <p>${message}</p>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  updateAlerts(alertsList) {
    this.alerts = alertsList || [];
    this.renderAlerts();
    this.updateBadge();
  }

  addAlert(newAlert) {
    this.alerts.unshift(newAlert);
    this.playAlertSound(newAlert.severity);
    this.showToast(newAlert.severity, `${newAlert.severity.toUpperCase()}: ${newAlert.zoneName}`, newAlert.message);
    this.renderAlerts();
    this.updateBadge();
  }

  updateSingleAlert(updatedAlert) {
    const idx = this.alerts.findIndex(a => a.id === updatedAlert.id);
    if (idx !== -1) {
      this.alerts[idx] = updatedAlert;
      this.renderAlerts();
      this.updateBadge();
    }
  }

  updateBadge() {
    const activeCount = this.alerts.filter(a => a.status === 'Active').length;
    const badge = document.getElementById('alerts-count-badge');
    if (badge) {
      badge.textContent = activeCount;
      badge.style.display = activeCount > 0 ? 'flex' : 'none';
    }
  }

  setFilter(filterName) {
    this.filter = filterName;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterName);
    });
    this.renderAlerts();
  }

  renderAlerts(containerId = 'alerts-list-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let filtered = this.alerts;
    if (this.filter !== 'all') {
      filtered = this.alerts.filter(a => a.severity === this.filter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-dim);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.8rem; opacity: 0.5;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4m0 4h.01"/>
          </svg>
          <p>No alerts in this view. All hospital hygiene and resource channels nominal.</p>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(alert => {
      const isCritical = alert.severity === 'critical';
      const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      html += `
        <div class="alert-row-item ${alert.severity}">
          <div class="alert-main-content">
            <div class="alert-top-meta">
              <span class="alert-id">${alert.id}</span>
              <span class="status-badge ${alert.severity}">${alert.severity}</span>
              <span class="alert-zone-chip">${alert.zoneName}</span>
              <span class="alert-time">${timeStr}</span>
              <span style="color: var(--text-dim);">&bull;</span>
              <span style="color: #fff; font-weight: 600;">${alert.device}</span>
            </div>

            <div class="alert-msg-text">
              ${alert.message}
            </div>

            <div class="alert-staff-meta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Assigned: <strong>${alert.assignedStaff}</strong>
              ${alert.status === 'Resolved' ? `<span style="color: var(--accent-emerald); margin-left: 0.5rem;">[RESOLVED: ${alert.resolutionNote || 'Verified'}]</span>` : ''}
            </div>
          </div>

          <div class="alert-actions-cell">
            ${alert.status === 'Active' ? `
              <button class="btn-ack" onclick="window.hospitalApp.acknowledgeAlert('${alert.id}')">
                Acknowledge
              </button>
            ` : ''}
            ${alert.status !== 'Resolved' ? `
              <button class="btn-resolve" onclick="window.hospitalApp.resolveAlert('${alert.id}')">
                Resolve & Clear
              </button>
            ` : `
              <span style="font-size: 0.76rem; color: var(--accent-emerald); font-weight: 700;">CLOSED</span>
            `}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
}

window.AlertsManager = AlertsManager;
