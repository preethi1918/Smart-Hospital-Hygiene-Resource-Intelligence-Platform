/**
 * Smart Hospital Hygiene & Resource Intelligence Platform
 * Cleaning & Hygiene Management Module (HospitalCleaningManager)
 * Supports: Rooms, Beds, Toilets, Corridors, Waiting areas, Handwash stations
 * Statuses: PENDING, IN_PROGRESS, COMPLETED, OVERDUE, VERIFIED
 * QR Workflow: Real-time scan completion, automatic date/time/staff recording, audit history
 */

class HospitalCleaningManager {
  constructor(containerId = 'cleaning-management-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`HospitalCleaningManager: container #${containerId} not found.`);
      return;
    }

    this.tasks = [];
    this.history = [];
    this.stats = {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      verifiedTasks: 0,
      totalLogs: 0,
      tasksByLocation: {}
    };

    this.activeView = 'grid'; // 'grid' | 'table' | 'history'
    this.filterLocation = ''; // all or ROOM, BED, TOILET, etc.
    this.filterStatus = ''; // all or PENDING, IN_PROGRESS, etc.
    this.searchQuery = '';
    this.token = localStorage.getItem('token') || '';
    this.currentUser = null;

    this.init();
  }

  async init() {
    await this.ensureAuthentication();
    await this.loadAll();
    this.render();

    // Periodic auto-refresh every 15 seconds to reflect overdue transitions
    this.pollInterval = setInterval(() => {
      this.loadAll().then(() => this.renderViewContentOnly());
    }, 15000);
  }

  async ensureAuthentication() {
    if (!this.token) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@hospital.com', password: 'Admin@123456' })
        });
        if (res.ok) {
          const data = await res.json();
          this.token = data.data.token;
          localStorage.setItem('token', this.token);
          this.currentUser = data.data.user;
        }
      } catch (err) {
        console.warn('Authentication auto-handshake error:', err);
      }
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async loadAll() {
    try {
      const [tasksRes, statsRes, histRes] = await Promise.all([
        fetch('/api/cleaning/tasks', { headers: this.getHeaders() }),
        fetch('/api/cleaning/stats', { headers: this.getHeaders() }),
        fetch('/api/cleaning/history', { headers: this.getHeaders() })
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        this.tasks = data.data || [];
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        this.stats = data.data || this.stats;
      }
      if (histRes.ok) {
        const data = await histRes.json();
        this.history = data.data || [];
      }
    } catch (err) {
      console.error('Error fetching cleaning data:', err);
      this.showToast('Failed to sync with Cleaning & Hygiene API', 'error');
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  getLocationLabel(type) {
    switch (type) {
      case 'ROOM': return 'Room';
      case 'BED': return 'Bed';
      case 'TOILET': return 'Toilet / Restroom';
      case 'CORRIDOR': return 'Corridor';
      case 'WAITING_AREA': return 'Waiting Area';
      case 'HANDWASH_STATION': return 'Handwash Station';
      default: return type || 'Area';
    }
  }

  getFilteredTasks() {
    return this.tasks.filter(t => {
      if (this.filterLocation && t.locationType !== this.filterLocation) return false;
      if (this.filterStatus && t.status !== this.filterStatus) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const code = (t.taskCode || '').toLowerCase();
        const loc = (t.location || '').toLowerCase();
        const staff = (t.assignedStaff || '').toLowerCase();
        const qr = (t.targetQrCode || '').toLowerCase();
        const notes = (t.notes || '').toLowerCase();
        if (!code.includes(q) && !loc.includes(q) && !staff.includes(q) && !qr.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }

  getFilteredHistory() {
    return this.history.filter(h => {
      if (this.filterLocation && h.locationType !== this.filterLocation) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const loc = (h.locationName || '').toLowerCase();
        const staff = (h.performedByStaff || '').toLowerCase();
        const qr = (h.qrScannedToken || '').toLowerCase();
        const notes = (h.notes || '').toLowerCase();
        if (!loc.includes(q) && !staff.includes(q) && !qr.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="cleaning-container">
        <!-- Top Title & Action Bar -->
        <div class="cleaning-top-bar">
          <div class="cleaning-title-area">
            <div class="cleaning-icon-badge">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div class="cleaning-title-text">
              <h2>Cleaning & Hygiene Management</h2>
              <p>Rooms • Beds • Toilets • Corridors • Waiting Areas • Handwash Stations</p>
            </div>
          </div>
          <div class="cleaning-header-actions">
            <button class="btn-clean-action btn-clean-qr" id="btn-quick-qr-complete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6"/>
              </svg>
              Complete via QR Scan
            </button>
            <button class="btn-clean-action btn-clean-complete" id="btn-open-create-task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Schedule Cleaning Task
            </button>
            <button class="btn-clean-action btn-clean-start" id="btn-refresh-cleaning" title="Refresh Live Data">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <!-- KPI Metrics Grid -->
        <div class="cleaning-stats-grid">
          <div class="cleaning-stat-card stat-card-total" data-status-filter="">
            <span class="stat-label">Total Tasks</span>
            <div class="stat-val-row">
              <span class="stat-val">${this.stats.totalTasks || 0}</span>
              <span class="stat-sub">Active platform</span>
            </div>
          </div>
          <div class="cleaning-stat-card stat-card-overdue" data-status-filter="OVERDUE">
            <span class="stat-label" style="color: #f87171;">Overdue</span>
            <div class="stat-val-row">
              <span class="stat-val" style="color: #f87171;">${this.stats.overdueTasks || 0}</span>
              <span class="stat-sub">Action required</span>
            </div>
          </div>
          <div class="cleaning-stat-card stat-card-inprogress" data-status-filter="IN_PROGRESS">
            <span class="stat-label" style="color: #60a5fa;">In Progress</span>
            <div class="stat-val-row">
              <span class="stat-val" style="color: #60a5fa;">${this.stats.inProgressTasks || 0}</span>
              <span class="stat-sub">Under sanitization</span>
            </div>
          </div>
          <div class="cleaning-stat-card stat-card-pending" data-status-filter="PENDING">
            <span class="stat-label" style="color: #c084fc;">Pending</span>
            <div class="stat-val-row">
              <span class="stat-val" style="color: #c084fc;">${this.stats.pendingTasks || 0}</span>
              <span class="stat-sub">Scheduled queued</span>
            </div>
          </div>
          <div class="cleaning-stat-card stat-card-completed" data-status-filter="COMPLETED">
            <span class="stat-label" style="color: #34d399;">Completed</span>
            <div class="stat-val-row">
              <span class="stat-val" style="color: #34d399;">${this.stats.completedTasks || 0}</span>
              <span class="stat-sub">Sanitized clean</span>
            </div>
          </div>
          <div class="cleaning-stat-card stat-card-verified" data-status-filter="VERIFIED">
            <span class="stat-label" style="color: #22d3ee;">Verified</span>
            <div class="stat-val-row">
              <span class="stat-val" style="color: #22d3ee;">${this.stats.verifiedTasks || 0}</span>
              <span class="stat-sub">Quality certified</span>
            </div>
          </div>
        </div>

        <!-- Filter & Control Card -->
        <div class="cleaning-controls-card">
          <div class="cleaning-tabs-row">
            <div class="cleaning-view-tabs">
              <button class="cleaning-view-tab ${this.activeView === 'grid' ? 'active' : ''}" data-view="grid">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Task Cards
              </button>
              <button class="cleaning-view-tab ${this.activeView === 'table' ? 'active' : ''}" data-view="table">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                Task Table
              </button>
              <button class="cleaning-view-tab ${this.activeView === 'history' ? 'active' : ''}" data-view="history">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Cleaning History (${this.history.length})
              </button>
            </div>

            <!-- Location Filter Chips across all 6 requested locations -->
            <div class="location-chips-bar">
              <button class="location-chip ${!this.filterLocation ? 'active' : ''}" data-loc="">All Locations</button>
              <button class="location-chip ${this.filterLocation === 'ROOM' ? 'active' : ''}" data-loc="ROOM">🛏️ Rooms</button>
              <button class="location-chip ${this.filterLocation === 'BED' ? 'active' : ''}" data-loc="BED">🛌 Beds</button>
              <button class="location-chip ${this.filterLocation === 'TOILET' ? 'active' : ''}" data-loc="TOILET">🚻 Toilets</button>
              <button class="location-chip ${this.filterLocation === 'CORRIDOR' ? 'active' : ''}" data-loc="CORRIDOR">🚶 Corridors</button>
              <button class="location-chip ${this.filterLocation === 'WAITING_AREA' ? 'active' : ''}" data-loc="WAITING_AREA">🛋️ Waiting Areas</button>
              <button class="location-chip ${this.filterLocation === 'HANDWASH_STATION' ? 'active' : ''}" data-loc="HANDWASH_STATION">🧼 Handwash Stations</button>
            </div>
          </div>

          <!-- Search and Dropdown Filter Row -->
          <div class="cleaning-filter-grid">
            <input type="text" class="cleaning-input" id="cleaning-search-input"
                   placeholder="Search by Task Code, Location, Staff, QR Code or Notes..."
                   value="${this.searchQuery}">

            <select class="cleaning-select" id="cleaning-status-select">
              <option value="">All Statuses</option>
              <option value="PENDING" ${this.filterStatus === 'PENDING' ? 'selected' : ''}>PENDING</option>
              <option value="IN_PROGRESS" ${this.filterStatus === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
              <option value="COMPLETED" ${this.filterStatus === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
              <option value="OVERDUE" ${this.filterStatus === 'OVERDUE' ? 'selected' : ''}>OVERDUE</option>
              <option value="VERIFIED" ${this.filterStatus === 'VERIFIED' ? 'selected' : ''}>VERIFIED</option>
            </select>

            <select class="cleaning-select" id="cleaning-location-select">
              <option value="">All Location Types</option>
              <option value="ROOM" ${this.filterLocation === 'ROOM' ? 'selected' : ''}>Rooms</option>
              <option value="BED" ${this.filterLocation === 'BED' ? 'selected' : ''}>Beds</option>
              <option value="TOILET" ${this.filterLocation === 'TOILET' ? 'selected' : ''}>Toilets</option>
              <option value="CORRIDOR" ${this.filterLocation === 'CORRIDOR' ? 'selected' : ''}>Corridors</option>
              <option value="WAITING_AREA" ${this.filterLocation === 'WAITING_AREA' ? 'selected' : ''}>Waiting Areas</option>
              <option value="HANDWASH_STATION" ${this.filterLocation === 'HANDWASH_STATION' ? 'selected' : ''}>Handwash Stations</option>
            </select>

            <button class="btn-clean-action btn-clean-start" id="btn-reset-filters">
              Reset
            </button>
          </div>
        </div>

        <!-- Dynamic Main Content Area -->
        <div id="cleaning-view-mount">
          ${this.renderViewContent()}
        </div>
      </div>

      <!-- Modal Placeholder -->
      <div id="cleaning-modal-root"></div>
    `;

    this.bindEvents();
  }

  renderViewContentOnly() {
    const mount = document.getElementById('cleaning-view-mount');
    if (mount) {
      mount.innerHTML = this.renderViewContent();
      this.bindCardEvents();
    }
  }

  renderViewContent() {
    if (this.activeView === 'history') {
      return this.renderHistoryView();
    } else if (this.activeView === 'table') {
      return this.renderTableView();
    } else {
      return this.renderGridView();
    }
  }

  renderGridView() {
    const tasks = this.getFilteredTasks();
    if (!tasks.length) {
      return `
        <div style="text-align: center; padding: 4rem 1rem; color: #64748b;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.8rem; opacity: 0.5;">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <h3 style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 0.4rem;">No Cleaning Tasks Found</h3>
          <p style="font-size: 0.85rem;">Try adjusting your filters or click "Schedule Cleaning Task" to create one.</p>
        </div>
      `;
    }

    return `
      <div class="cleaning-tasks-grid">
        ${tasks.map(t => this.renderTaskCard(t)).join('')}
      </div>
    `;
  }

  renderTaskCard(task) {
    const statusPillClass = `pill-${task.status}`;
    const cardStatusClass = `card-status-${task.status}`;
    const locBadgeClass = `loc-${task.locationType}`;

    return `
      <div class="cleaning-task-card ${cardStatusClass}" data-task-id="${task.taskId}">
        <div class="task-card-header">
          <div class="task-code-wrap">
            <span class="task-code">
              ${task.taskCode}
              ${task.targetQrCode ? `<span style="font-size: 0.7rem; color: #06b6d4; background: rgba(6,182,212,0.15); padding: 0.1rem 0.4rem; border-radius: 4px;">QR: ${task.targetQrCode}</span>` : ''}
            </span>
            <span class="task-type-badge">${(task.taskType || '').replace(/_/g, ' ')}</span>
          </div>
          <span class="status-pill ${statusPillClass}">${task.status}</span>
        </div>

        <div class="task-location-row">
          <span class="loc-badge ${locBadgeClass}">${this.getLocationLabel(task.locationType)}</span>
          <span class="loc-name" title="${task.location}">${task.location}</span>
        </div>

        <div class="task-meta-grid">
          <div class="task-meta-item">
            <span class="task-meta-label">Assigned Staff</span>
            <span class="task-meta-value">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              ${task.assignedStaff || 'Unassigned'}
            </span>
          </div>

          <div class="task-meta-item">
            <span class="task-meta-label">Priority</span>
            <span class="task-meta-value" style="font-weight: 700; color: ${task.priority === 'STAT_EMERGENCY' ? '#ef4444' : task.priority === 'URGENT' ? '#f59e0b' : '#38bdf8'};">
              ${task.priority || 'ROUTINE'}
            </span>
          </div>

          <div class="task-meta-item">
            <span class="task-meta-label">Scheduled Time</span>
            <span class="task-meta-value">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${this.formatDate(task.scheduledTime)}
            </span>
          </div>

          <div class="task-meta-item">
            <span class="task-meta-label">Completed Time</span>
            <span class="task-meta-value" style="color: ${task.completedTime ? '#34d399' : '#64748b'};">
              ${task.completedTime ? this.formatDate(task.completedTime) : 'Pending completion'}
            </span>
          </div>
        </div>

        ${task.notes ? `
          <div class="task-notes-block" title="Task notes">
            ${task.notes}
          </div>
        ` : ''}

        ${task.completedByStaff ? `
          <div style="font-size: 0.72rem; color: #10b981; display: flex; align-items: center; gap: 0.35rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Completed by: <strong>${task.completedByStaff}</strong>
          </div>
        ` : ''}

        ${task.verifiedByStaff ? `
          <div style="font-size: 0.72rem; color: #06b6d4; display: flex; align-items: center; gap: 0.35rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Verified by: <strong>${task.verifiedByStaff}</strong>
          </div>
        ` : ''}

        <div class="task-card-actions">
          ${task.status === 'PENDING' || task.status === 'OVERDUE' ? `
            <button class="btn-clean-action btn-clean-start action-start" data-id="${task.taskId}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start
            </button>
          ` : ''}

          ${task.status === 'PENDING' || task.status === 'IN_PROGRESS' || task.status === 'OVERDUE' ? `
            <button class="btn-clean-action btn-clean-complete action-complete" data-id="${task.taskId}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Complete
            </button>
            <button class="btn-clean-action btn-clean-qr action-qr" data-qr="${task.targetQrCode || ''}" data-id="${task.taskId}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6"/></svg>
              QR Complete
            </button>
          ` : ''}

          ${task.status === 'COMPLETED' ? `
            <button class="btn-clean-action btn-clean-verify action-verify" data-id="${task.taskId}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Verify Quality
            </button>
          ` : ''}

          <button class="btn-clean-action btn-clean-start action-history-filter" data-loc="${task.locationType}" style="margin-left: auto;">
            History
          </button>
        </div>
      </div>
    `;
  }

  renderTableView() {
    const tasks = this.getFilteredTasks();
    return `
      <div class="cleaning-table-wrap">
        <table class="cleaning-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Location</th>
              <th>Type</th>
              <th>Assigned Staff</th>
              <th>Scheduled Time</th>
              <th>Completed Time</th>
              <th>Status</th>
              <th>Notes / Audit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td>
                  <strong style="font-family: 'JetBrains Mono', monospace; color: #fff;">${t.taskCode}</strong>
                  ${t.targetQrCode ? `<div style="font-size: 0.7rem; color: #06b6d4;">QR: ${t.targetQrCode}</div>` : ''}
                </td>
                <td>
                  <span class="loc-badge loc-${t.locationType}">${this.getLocationLabel(t.locationType)}</span>
                  <div style="font-weight: 600; color: #fff; margin-top: 0.2rem;">${t.location}</div>
                </td>
                <td><span style="font-size: 0.75rem; color: #94a3b8;">${(t.taskType || '').replace(/_/g, ' ')}</span></td>
                <td>${t.assignedStaff || 'Unassigned'}</td>
                <td style="white-space: nowrap;">${this.formatDate(t.scheduledTime)}</td>
                <td style="white-space: nowrap; color: ${t.completedTime ? '#34d399' : '#64748b'};">
                  ${t.completedTime ? this.formatDate(t.completedTime) : '—'}
                </td>
                <td><span class="status-pill pill-${t.status}">${t.status}</span></td>
                <td style="max-width: 240px; font-size: 0.75rem; color: #94a3b8;">${t.notes || '—'}</td>
                <td>
                  <div style="display: flex; gap: 0.4rem; flex-wrap: nowrap;">
                    ${t.status === 'PENDING' || t.status === 'OVERDUE' ? `
                      <button class="btn-clean-action btn-clean-start action-start" data-id="${t.taskId}">Start</button>
                    ` : ''}
                    ${t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE' ? `
                      <button class="btn-clean-action btn-clean-complete action-complete" data-id="${t.taskId}">Complete</button>
                      <button class="btn-clean-action btn-clean-qr action-qr" data-qr="${t.targetQrCode || ''}" data-id="${t.taskId}">QR</button>
                    ` : ''}
                    ${t.status === 'COMPLETED' ? `
                      <button class="btn-clean-action btn-clean-verify action-verify" data-id="${t.taskId}">Verify</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderHistoryView() {
    const history = this.getFilteredHistory();
    if (!history.length) {
      return `
        <div style="text-align: center; padding: 4rem 1rem; color: #64748b;">
          <h3 style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 0.4rem;">No Cleaning History Audit Logs Found</h3>
          <p style="font-size: 0.85rem;">Cleaning logs are automatically recorded when staff completes tasks via QR or manual verification.</p>
        </div>
      `;
    }

    return `
      <div class="cleaning-table-wrap">
        <table class="cleaning-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Task Code</th>
              <th>Location</th>
              <th>Staff Member</th>
              <th>Completed Date & Time</th>
              <th>QR Identifier</th>
              <th>Disinfectant Used</th>
              <th>Method</th>
              <th>Hygiene Score</th>
              <th>Verification</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(h => `
              <tr>
                <td><strong style="color: #06b6d4;">#LOG-${h.cleaningLogId}</strong></td>
                <td><span style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${h.taskCode || 'ON-DEMAND'}</span></td>
                <td>
                  <span class="loc-badge loc-${h.locationType}">${this.getLocationLabel(h.locationType)}</span>
                  <div style="font-weight: 600; color: #fff; margin-top: 0.2rem;">${h.locationName}</div>
                </td>
                <td><strong style="color: #10b981;">${h.performedByStaff || 'Authorized Specialist'}</strong></td>
                <td style="white-space: nowrap; font-family: 'JetBrains Mono', monospace;">${this.formatDate(h.completedAt)}</td>
                <td><span style="background: rgba(6,182,212,0.15); color: #22d3ee; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem;">${h.qrScannedToken}</span></td>
                <td style="font-size: 0.76rem; color: #cbd5e1;">${h.disinfectantUsed || 'Hospital Standard'}</td>
                <td style="font-size: 0.74rem; text-transform: uppercase; color: #94a3b8;">${(h.cleaningMethod || '').replace(/_/g, ' ')}</td>
                <td>
                  <span style="font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">
                    ${h.hygieneScorePostClean ? h.hygieneScorePostClean + '%' : '98.50%'}
                  </span>
                </td>
                <td>
                  ${h.verifiedByStaff ? `
                    <span style="color: #06b6d4; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      ${h.verifiedByStaff}
                    </span>
                  ` : '<span style="color: #64748b; font-size: 0.75rem;">Pending Audit</span>'}
                </td>
                <td style="max-width: 200px; font-size: 0.75rem; color: #94a3b8;">${h.notes || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  bindEvents() {
    // Quick QR Complete
    const btnQr = document.getElementById('btn-quick-qr-complete');
    if (btnQr) btnQr.onclick = () => this.openQrCompleteModal();

    // Schedule Task Modal
    const btnCreate = document.getElementById('btn-open-create-task');
    if (btnCreate) btnCreate.onclick = () => this.openCreateModal();

    // Refresh button
    const btnRefresh = document.getElementById('btn-refresh-cleaning');
    if (btnRefresh) {
      btnRefresh.onclick = async () => {
        btnRefresh.classList.add('loading');
        await this.loadAll();
        this.render();
        this.showToast('Cleaning data refreshed', 'success');
      };
    }

    // View switch tabs
    document.querySelectorAll('.cleaning-view-tab').forEach(tab => {
      tab.onclick = () => {
        this.activeView = tab.getAttribute('data-view');
        this.render();
      };
    });

    // KPI status filters
    document.querySelectorAll('.cleaning-stat-card').forEach(card => {
      card.onclick = () => {
        this.filterStatus = card.getAttribute('data-status-filter') || '';
        const statusSelect = document.getElementById('cleaning-status-select');
        if (statusSelect) statusSelect.value = this.filterStatus;
        this.renderViewContentOnly();
      };
    });

    // Location chips
    document.querySelectorAll('.location-chip').forEach(chip => {
      chip.onclick = () => {
        this.filterLocation = chip.getAttribute('data-loc') || '';
        document.querySelectorAll('.location-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const locSelect = document.getElementById('cleaning-location-select');
        if (locSelect) locSelect.value = this.filterLocation;
        this.renderViewContentOnly();
      };
    });

    // Search input
    const searchInput = document.getElementById('cleaning-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value;
        this.renderViewContentOnly();
      };
    }

    // Status dropdown
    const statusSelect = document.getElementById('cleaning-status-select');
    if (statusSelect) {
      statusSelect.onchange = (e) => {
        this.filterStatus = e.target.value;
        this.renderViewContentOnly();
      };
    }

    // Location dropdown
    const locSelect = document.getElementById('cleaning-location-select');
    if (locSelect) {
      locSelect.onchange = (e) => {
        this.filterLocation = e.target.value;
        document.querySelectorAll('.location-chip').forEach(c => {
          c.classList.toggle('active', (c.getAttribute('data-loc') || '') === this.filterLocation);
        });
        this.renderViewContentOnly();
      };
    }

    // Reset filters
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.onclick = () => {
        this.filterLocation = '';
        this.filterStatus = '';
        this.searchQuery = '';
        this.render();
      };
    }

    this.bindCardEvents();
  }

  bindCardEvents() {
    // Start task
    document.querySelectorAll('.action-start').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        await this.startTask(id);
      };
    });

    // Complete task (manual)
    document.querySelectorAll('.action-complete').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const task = this.tasks.find(t => t.taskId == id);
        this.openCompleteModal(task);
      };
    });

    // Complete via QR
    document.querySelectorAll('.action-qr').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const qr = btn.getAttribute('data-qr');
        const id = btn.getAttribute('data-id');
        this.openQrCompleteModal(qr, id);
      };
    });

    // Verify task
    document.querySelectorAll('.action-verify').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const task = this.tasks.find(t => t.taskId == id);
        this.openVerifyModal(task);
      };
    });

    // Filter history by location
    document.querySelectorAll('.action-history-filter').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const loc = btn.getAttribute('data-loc');
        this.filterLocation = loc;
        this.activeView = 'history';
        this.render();
      };
    });
  }

  async startTask(id) {
    try {
      const res = await fetch(`/api/cleaning/tasks/${id}/start`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.showToast('Cleaning task marked IN_PROGRESS', 'success');
        await this.loadAll();
        this.render();
      } else {
        const err = await res.json();
        this.showToast(err.message || 'Failed to start task', 'error');
      }
    } catch (e) {
      this.showToast('Network error starting task', 'error');
    }
  }

  openCompleteModal(task) {
    const modalRoot = document.getElementById('cleaning-modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="cleaning-modal-overlay">
        <div class="modal-content-glass">
          <div class="modal-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Complete Cleaning Task
            </h3>
            <button class="modal-close-btn" id="modal-close-x">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background: rgba(255,255,255,0.04); padding: 0.85rem; border-radius: 8px;">
              <strong style="color: #fff; font-family: 'JetBrains Mono', monospace;">${task.taskCode}</strong>
              <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.2rem;">Location: <strong style="color: #fff;">${task.location}</strong> (${this.getLocationLabel(task.locationType)})</div>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">Target QR: <code>${task.targetQrCode || 'N/A'}</code></div>
            </div>

            <div class="form-group">
              <label class="form-label">Disinfectant Solution Used</label>
              <input type="text" class="cleaning-input" id="complete-disinfectant"
                     value="Hospital-Grade Quaternary Disinfectant (Virex II 256)" placeholder="e.g. Quaternary, Bleach 1:10, Peracetic Acid">
            </div>

            <div class="form-group">
              <label class="form-label">Cleaning & Sterilization Method</label>
              <select class="cleaning-select" id="complete-method">
                <option value="SURFACE_CHEMICAL_WIPE">Surface Chemical Wipe</option>
                <option value="TERMINAL_DECONTAMINATION">Terminal Decontamination</option>
                <option value="UVC_IRRADIATION">UV-C Irradiation</option>
                <option value="HYDROGEN_PEROXIDE_FOG">Hydrogen Peroxide Dry Fog</option>
                <option value="STEAM_STERILIZATION">Steam Sterilization</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Completion Notes / Inspection Remarks</label>
              <textarea class="cleaning-input" id="complete-notes" rows="3" placeholder="Detail any specific surfaces disinfected, consumable replacements, or observations..."></textarea>
            </div>

            <div style="font-size: 0.78rem; color: #10b981; background: rgba(16,185,129,0.1); padding: 0.6rem 0.8rem; border-radius: 6px;">
              ℹ️ Current staff member and completion timestamp will be <strong>automatically recorded</strong> into the cleaning audit trail.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-clean-action btn-clean-start" id="modal-cancel-btn">Cancel</button>
            <button class="btn-clean-action btn-clean-complete" id="modal-confirm-complete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Mark Task Completed
            </button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalRoot.innerHTML = ''; };
    document.getElementById('modal-close-x').onclick = close;
    document.getElementById('modal-cancel-btn').onclick = close;
    document.getElementById('cleaning-modal-overlay').onclick = (e) => {
      if (e.target.id === 'cleaning-modal-overlay') close();
    };

    document.getElementById('modal-confirm-complete').onclick = async () => {
      const disinfectant = document.getElementById('complete-disinfectant').value;
      const method = document.getElementById('complete-method').value;
      const notes = document.getElementById('complete-notes').value;

      try {
        const res = await fetch(`/api/cleaning/tasks/${task.taskId}/complete`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ disinfectantUsed: disinfectant, cleaningMethod: method, notes })
        });
        if (res.ok) {
          close();
          this.showToast(`Task ${task.taskCode} marked completed & logged`, 'success');
          await this.loadAll();
          this.render();
        } else {
          const err = await res.json();
          this.showToast(err.message || 'Failed to complete task', 'error');
        }
      } catch (e) {
        this.showToast('Network error completing task', 'error');
      }
    };
  }

  openQrCompleteModal(prefillQr = '', taskId = null) {
    const modalRoot = document.getElementById('cleaning-modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="cleaning-modal-overlay">
        <div class="modal-content-glass">
          <div class="modal-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.5"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6"/></svg>
              Complete Cleaning via QR Workflow
            </h3>
            <button class="modal-close-btn" id="modal-close-x">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">
              Scan or enter the hospital resource QR identifier (e.g. <code>ROOM-204</code>, <code>BED-204</code>, <code>TOILET-W2-01</code>, <code>CORR-L3-N</code>, <code>WAIT-ER-01</code>, <code>HWASH-ICU-01</code>).
            </p>

            <div class="form-group">
              <label class="form-label">Scanned QR Code Identifier *</label>
              <input type="text" class="cleaning-input" id="qr-input-code"
                     value="${prefillQr}" placeholder="e.g. ROOM-204, BED-204, TOILET-W2-01..." autofocus>
            </div>

            <!-- Quick Preset Chips -->
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: -0.4rem;">
              <button type="button" class="location-chip qr-chip-preset" data-code="ROOM-204">ROOM-204</button>
              <button type="button" class="location-chip qr-chip-preset" data-code="BED-204">BED-204</button>
              <button type="button" class="location-chip qr-chip-preset" data-code="TOILET-W2-01">TOILET-W2-01</button>
              <button type="button" class="location-chip qr-chip-preset" data-code="CORR-L3-N">CORR-L3-N</button>
              <button type="button" class="location-chip qr-chip-preset" data-code="WAIT-ER-01">WAIT-ER-01</button>
              <button type="button" class="location-chip qr-chip-preset" data-code="HWASH-ICU-01">HWASH-ICU-01</button>
            </div>

            <div class="form-group">
              <label class="form-label">Disinfectant Used</label>
              <input type="text" class="cleaning-input" id="qr-disinfectant"
                     value="Hospital-Grade Quaternary Disinfectant (Virex II 256)" placeholder="Disinfectant brand / formula">
            </div>

            <div class="form-group">
              <label class="form-label">Cleaning Method</label>
              <select class="cleaning-select" id="qr-method">
                <option value="SURFACE_CHEMICAL_WIPE">Surface Chemical Wipe</option>
                <option value="TERMINAL_DECONTAMINATION">Terminal Decontamination</option>
                <option value="UVC_IRRADIATION">UV-C Irradiation</option>
                <option value="HYDROGEN_PEROXIDE_FOG">Hydrogen Peroxide Dry Fog</option>
                <option value="STEAM_STERILIZATION">Steam Sterilization</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Notes / Observations</label>
              <input type="text" class="cleaning-input" id="qr-notes" placeholder="e.g. Full sanitize completed, soap replenished.">
            </div>

            <div style="font-size: 0.78rem; color: #38bdf8; background: rgba(6,182,212,0.1); padding: 0.6rem 0.8rem; border-radius: 6px;">
              ⚡ <strong>Instant QR Workflow:</strong> Completes the active task or automatically records on-demand hygiene service with date, timestamp and authenticated staff ID.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-clean-action btn-clean-start" id="modal-cancel-btn">Cancel</button>
            <button class="btn-clean-action btn-clean-complete" id="modal-confirm-qr">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Verify & Complete via QR
            </button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalRoot.innerHTML = ''; };
    document.getElementById('modal-close-x').onclick = close;
    document.getElementById('modal-cancel-btn').onclick = close;
    document.getElementById('cleaning-modal-overlay').onclick = (e) => {
      if (e.target.id === 'cleaning-modal-overlay') close();
    };

    document.querySelectorAll('.qr-chip-preset').forEach(btn => {
      btn.onclick = () => {
        document.getElementById('qr-input-code').value = btn.getAttribute('data-code');
      };
    });

    document.getElementById('modal-confirm-qr').onclick = async () => {
      const qrCode = document.getElementById('qr-input-code').value.trim();
      const disinfectant = document.getElementById('qr-disinfectant').value;
      const method = document.getElementById('qr-method').value;
      const notes = document.getElementById('qr-notes').value;

      if (!qrCode) {
        this.showToast('Please enter or scan a valid QR Code', 'error');
        return;
      }

      try {
        const payload = {
          qrCode,
          disinfectantUsed: disinfectant,
          cleaningMethod: method,
          notes: notes
        };
        if (taskId) payload.taskId = taskId;

        const res = await fetch('/api/cleaning/tasks/complete-qr', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          close();
          this.showToast(`Task for ${qrCode} successfully completed via QR workflow!`, 'success');
          await this.loadAll();
          this.render();
        } else {
          const err = await res.json();
          this.showToast(err.message || 'QR Task completion failed', 'error');
        }
      } catch (e) {
        this.showToast('Network error completing task via QR', 'error');
      }
    };
  }

  openVerifyModal(task) {
    const modalRoot = document.getElementById('cleaning-modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="cleaning-modal-overlay">
        <div class="modal-content-glass">
          <div class="modal-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Hygiene Quality Verification & Certification
            </h3>
            <button class="modal-close-btn" id="modal-close-x">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background: rgba(255,255,255,0.04); padding: 0.85rem; border-radius: 8px;">
              <strong style="color: #fff; font-family: 'JetBrains Mono', monospace;">${task.taskCode}</strong>
              <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.2rem;">Location: <strong style="color: #fff;">${task.location}</strong> (${this.getLocationLabel(task.locationType)})</div>
              <div style="font-size: 0.8rem; color: #34d399; margin-top: 0.2rem;">Completed by: ${task.completedByStaff || 'Staff Specialist'} at ${this.formatDate(task.completedTime)}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Post-Clean Hygiene Score (0 - 100%)</label>
              <input type="number" step="0.1" min="80" max="100" class="cleaning-input" id="verify-score" value="98.5">
            </div>

            <div class="form-group">
              <label class="form-label">Auditor Inspection Verification Notes</label>
              <textarea class="cleaning-input" id="verify-notes" rows="3" placeholder="State inspection methodology, ATP bioluminescence test results, or swab verification..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-clean-action btn-clean-start" id="modal-cancel-btn">Cancel</button>
            <button class="btn-clean-action btn-clean-verify" id="modal-confirm-verify">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Certify & Mark VERIFIED
            </button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalRoot.innerHTML = ''; };
    document.getElementById('modal-close-x').onclick = close;
    document.getElementById('modal-cancel-btn').onclick = close;
    document.getElementById('cleaning-modal-overlay').onclick = (e) => {
      if (e.target.id === 'cleaning-modal-overlay') close();
    };

    document.getElementById('modal-confirm-verify').onclick = async () => {
      const score = document.getElementById('verify-score').value;
      const notes = document.getElementById('verify-notes').value;

      try {
        const res = await fetch(`/api/cleaning/tasks/${task.taskId}/verify`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ score, notes })
        });
        if (res.ok) {
          close();
          this.showToast(`Task ${task.taskCode} certified & VERIFIED`, 'success');
          await this.loadAll();
          this.render();
        } else {
          const err = await res.json();
          this.showToast(err.message || 'Verification failed', 'error');
        }
      } catch (e) {
        this.showToast('Network error during verification', 'error');
      }
    };
  }

  openCreateModal() {
    const modalRoot = document.getElementById('cleaning-modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="cleaning-modal-overlay">
        <div class="modal-content-glass">
          <div class="modal-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Schedule New Cleaning Task
            </h3>
            <button class="modal-close-btn" id="modal-close-x">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Location Type *</label>
                <select class="cleaning-select" id="new-loc-type">
                  <option value="ROOM">Room</option>
                  <option value="BED">Bed</option>
                  <option value="TOILET">Toilet / Restroom</option>
                  <option value="CORRIDOR">Corridor</option>
                  <option value="WAITING_AREA">Waiting Area</option>
                  <option value="HANDWASH_STATION">Handwash Station</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Task Type *</label>
                <select class="cleaning-select" id="new-task-type">
                  <option value="TERMINAL_ROOM_CLEAN">Terminal Room Clean</option>
                  <option value="BED_LINEN_CHANGE">Bed Linen Change</option>
                  <option value="BED_DISINFECTION">Bed Disinfection</option>
                  <option value="TOILET_DEEP_CLEAN">Toilet Deep Clean</option>
                  <option value="CORRIDOR_SANITY_MOP">Corridor Sanity Mop</option>
                  <option value="WAITING_AREA_SANITATION">Waiting Area Sanitation</option>
                  <option value="HANDWASH_STATION_SERVICE">Handwash Station Service</option>
                  <option value="HIGH_TOUCH_SURFACE_DISINFECTION">High Touch Surface Disinfection</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Location Description / Name *</label>
              <input type="text" class="cleaning-input" id="new-loc-name"
                     placeholder="e.g. Inpatient Room 204, Ward 2 Restroom, Level 3 North Hallway" required>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Target QR Code</label>
                <input type="text" class="cleaning-input" id="new-target-qr"
                       placeholder="e.g. ROOM-204, BED-204, TOILET-W2-01 (or auto-generated)">
              </div>

              <div class="form-group">
                <label class="form-label">Task Priority</label>
                <select class="cleaning-select" id="new-priority">
                  <option value="ROUTINE">ROUTINE</option>
                  <option value="URGENT">URGENT</option>
                  <option value="STAT_EMERGENCY">STAT EMERGENCY</option>
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Assigned Staff Name</label>
                <input type="text" class="cleaning-input" id="new-assigned-staff"
                       placeholder="e.g. Nurse Sarah Jenkins, Robert Chang">
              </div>

              <div class="form-group">
                <label class="form-label">Scheduled Time (Minutes from now)</label>
                <select class="cleaning-select" id="new-scheduled-offset">
                  <option value="0">Immediate (Now)</option>
                  <option value="30">In 30 Minutes</option>
                  <option value="60" selected>In 1 Hour</option>
                  <option value="120">In 2 Hours</option>
                  <option value="240">In 4 Hours</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Special Instructions & Protocols</label>
              <textarea class="cleaning-input" id="new-instructions" rows="2" placeholder="e.g. High-touch touchpoint wipe-down, PPE required, biohazard warning..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Initial Notes</label>
              <input type="text" class="cleaning-input" id="new-notes" placeholder="Optional background notes...">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-clean-action btn-clean-start" id="modal-cancel-btn">Cancel</button>
            <button class="btn-clean-action btn-clean-complete" id="modal-confirm-create">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Create Cleaning Task
            </button>
          </div>
        </div>
      </div>
    `;

    // Dynamic task type suggestion on location type change
    const locTypeSelect = document.getElementById('new-loc-type');
    const taskTypeSelect = document.getElementById('new-task-type');
    locTypeSelect.onchange = () => {
      const val = locTypeSelect.value;
      if (val === 'ROOM') taskTypeSelect.value = 'TERMINAL_ROOM_CLEAN';
      else if (val === 'BED') taskTypeSelect.value = 'BED_DISINFECTION';
      else if (val === 'TOILET') taskTypeSelect.value = 'TOILET_DEEP_CLEAN';
      else if (val === 'CORRIDOR') taskTypeSelect.value = 'CORRIDOR_SANITY_MOP';
      else if (val === 'WAITING_AREA') taskTypeSelect.value = 'WAITING_AREA_SANITATION';
      else if (val === 'HANDWASH_STATION') taskTypeSelect.value = 'HANDWASH_STATION_SERVICE';
    };

    const close = () => { modalRoot.innerHTML = ''; };
    document.getElementById('modal-close-x').onclick = close;
    document.getElementById('modal-cancel-btn').onclick = close;
    document.getElementById('cleaning-modal-overlay').onclick = (e) => {
      if (e.target.id === 'cleaning-modal-overlay') close();
    };

    document.getElementById('modal-confirm-create').onclick = async () => {
      const locName = document.getElementById('new-loc-name').value.trim();
      if (!locName) {
        this.showToast('Location description is required', 'error');
        return;
      }

      const locType = document.getElementById('new-loc-type').value;
      const taskType = document.getElementById('new-task-type').value;
      const targetQr = document.getElementById('new-target-qr').value.trim();
      const priority = document.getElementById('new-priority').value;
      const assignedStaff = document.getElementById('new-assigned-staff').value.trim();
      const offsetMinutes = parseInt(document.getElementById('new-scheduled-offset').value, 10);
      const instructions = document.getElementById('new-instructions').value.trim();
      const notes = document.getElementById('new-notes').value.trim();

      const scheduledDate = new Date(Date.now() + offsetMinutes * 60000).toISOString();

      try {
        const payload = {
          locationName: locName,
          locationType: locType,
          taskType: taskType,
          priority: priority,
          targetQrCode: targetQr,
          assignedStaffName: assignedStaff,
          scheduledStartTime: scheduledDate,
          specialInstructions: instructions,
          notes: notes
        };

        const res = await fetch('/api/cleaning/tasks', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          close();
          this.showToast(`Task ${data.data.taskCode} scheduled successfully!`, 'success');
          await this.loadAll();
          this.render();
        } else {
          const err = await res.json();
          this.showToast(err.message || 'Task creation failed', 'error');
        }
      } catch (e) {
        this.showToast('Network error creating task', 'error');
      }
    };
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: #0f172a;
      border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#06b6d4'};
      color: #fff;
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      margin-top: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      animation: fadeIn 0.3s ease-out;
      z-index: 10000;
    `;
    toast.innerHTML = `
      <span style="color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#06b6d4'};">
        ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
}

// Export for global access in browsers
window.HospitalCleaningManager = HospitalCleaningManager;
