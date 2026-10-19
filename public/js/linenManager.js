// ==========================================================================
// SMART HOSPITAL HYGIENE & RESOURCE INTELLIGENCE PLATFORM
// Hospital Linen & Laundry Management Controller
// Tracks: ID, Type, Status, Location, Bed, Last Washed, Wash Cycles, Issue Date, Damage Status
// Connects to Spring Boot REST APIs with JWT Authentication
// ==========================================================================

class HospitalLinenManager {
  constructor(containerId = 'linen-management-container') {
    this.containerId = containerId;
    this.container = null;

    // API Config
    this.apiBaseUrl = window.location.port === '3000' ? '/api' : 'http://localhost:8080/api';
    this.jwtTokenKey = 'sh_jwt_token';
    this.currentUserKey = 'sh_current_user';
    this.token = localStorage.getItem(this.jwtTokenKey) || '';
    this.currentUser = null;

    // Data Caches
    this.linens = [];
    this.beds = [];
    this.stats = {
      totalLinen: 0,
      cleanCount: 0,
      inUseCount: 0,
      dueForChangeCount: 0,
      inLaundryCount: 0,
      damagedCount: 0,
      retiredCount: 0,
      typeCounts: {},
      statusCounts: {}
    };

    // Filter & Search States
    this.filters = {
      keyword: '',
      linenType: '',
      status: '',
      damageStatus: ''
    };

    // UI States
    this.loading = false;
    this.error = null;
    this.activeModal = null;
    this.activeLinenItem = null;
    this.activeHistory = [];

    // Reference Enums
    this.enums = {
      types: [
        { value: 'BEDSHEET', label: 'Bedsheet', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M4 10h16' },
        { value: 'PILLOW_COVER', label: 'Pillow Cover', icon: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
        { value: 'BLANKET', label: 'Blanket', icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm0 6h18' },
        { value: 'PATIENT_GOWN', label: 'Patient Gown', icon: 'M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z' },
        { value: 'OTHER', label: 'Other', icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' }
      ],
      statuses: [
        { value: 'CLEAN', label: 'Clean / Sterile', cssClass: 'clean', color: '#10b981' },
        { value: 'IN_USE', label: 'In Use', cssClass: 'in_use', color: '#3b82f6' },
        { value: 'DUE_FOR_CHANGE', label: 'Due For Change', cssClass: 'due_for_change', color: '#f59e0b' },
        { value: 'IN_LAUNDRY', label: 'In Laundry', cssClass: 'in_laundry', color: '#a855f7' },
        { value: 'DAMAGED', label: 'Damaged', cssClass: 'damaged', color: '#ef4444' },
        { value: 'RETIRED', label: 'Retired', cssClass: 'retired', color: '#64748b' }
      ],
      damageStatuses: [
        { value: 'NONE', label: 'Intact / Pristine', cssClass: 'none' },
        { value: 'MINOR_WEAR', label: 'Minor Wear', cssClass: 'minor_wear' },
        { value: 'STAINED', label: 'Stained', cssClass: 'stained' },
        { value: 'TORN', label: 'Torn / Frayed', cssClass: 'torn' },
        { value: 'CONTAMINATED', label: 'Contaminated', cssClass: 'contaminated' },
        { value: 'SEVERELY_DAMAGED', label: 'Severely Damaged', cssClass: 'severely_damaged' }
      ]
    };

    this.init();
  }

  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Linen container #${this.containerId} not found.`);
      return;
    }

    const savedUser = localStorage.getItem(this.currentUserKey);
    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) {}
    }

    await this.ensureAuthenticated();
    this.render();
    await this.refreshData();
    this.loadBeds();
  }

  // ==========================================================================
  // Auth & API Request Helpers
  // ==========================================================================

  async ensureAuthenticated() {
    if (this.token) return true;

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@hospital.com', password: 'Admin@123456' })
      });

      if (!response.ok) throw new Error(`Auth failed with HTTP ${response.status}`);
      const resJson = await response.json();
      if (resJson.success && resJson.data && resJson.data.token) {
        this.token = resJson.data.token;
        this.currentUser = resJson.data;
        localStorage.setItem(this.jwtTokenKey, this.token);
        localStorage.setItem(this.currentUserKey, JSON.stringify(this.currentUser));
        return true;
      }
    } catch (err) {
      console.error('Linen manager auto-auth error:', err);
      this.error = `Authentication failed: ${err.message}`;
      return false;
    }
    return false;
  }

  async apiRequest(endpoint, method = 'GET', body = null) {
    if (!this.token) await this.ensureAuthenticated();

    const headers = { 'Accept': 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const url = `${this.apiBaseUrl}${endpoint}`;
    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (networkErr) {
      throw new Error(`Connection error to ${url}: ${networkErr.message}`);
    }

    if (response.status === 401) {
      this.token = '';
      localStorage.removeItem(this.jwtTokenKey);
      const reauthed = await this.ensureAuthenticated();
      if (reauthed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined
        });
      }
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errMsg = (data && data.message) ? data.message : `HTTP ${response.status} ${response.statusText}`;
      throw new Error(errMsg);
    }
    return data;
  }

  // ==========================================================================
  // Data Fetching
  // ==========================================================================

  async refreshData() {
    this.loading = true;
    this.error = null;
    this.updateLoadingState();

    try {
      // 1. Fetch Stats
      const statsRes = await this.apiRequest('/linen/stats');
      if (statsRes && statsRes.data) {
        this.stats = statsRes.data;
      }

      // 2. Fetch Linens with Active Filters
      const queryParams = new URLSearchParams();
      if (this.filters.keyword) queryParams.set('keyword', this.filters.keyword);
      if (this.filters.linenType) queryParams.set('linenType', this.filters.linenType);
      if (this.filters.status) queryParams.set('status', this.filters.status);
      if (this.filters.damageStatus) queryParams.set('damageStatus', this.filters.damageStatus);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const listRes = await this.apiRequest(`/linen${qs}`);
      this.linens = (listRes && listRes.data) ? listRes.data : [];
    } catch (err) {
      console.error('Failed to load linen data:', err);
      this.error = err.message;
      this.showToast(err.message, 'error');
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async loadBeds() {
    try {
      const res = await this.apiRequest('/beds');
      if (res && res.data) {
        this.beds = res.data;
      }
    } catch (e) {
      console.warn('Could not preload beds for linen assignment:', e.message);
    }
  }

  // ==========================================================================
  // UI Rendering
  // ==========================================================================

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="linen-container">
        <!-- Top Bar -->
        ${this.renderTopBar()}

        <!-- KPI Metrics Deck -->
        ${this.renderKpiDeck()}

        <!-- Search & Filter Toolbar -->
        ${this.renderToolbar()}

        <!-- Error State -->
        ${this.error ? this.renderErrorBanner() : ''}

        <!-- Main Data Table / Empty State -->
        ${this.loading ? this.renderLoadingPlaceholder() : this.renderTableOrEmpty()}
      </div>

      <!-- Modal Container -->
      <div id="linen-modal-container"></div>
    `;

    this.attachEventListeners();
  }

  renderTopBar() {
    return `
      <div class="linen-top-bar">
        <div class="linen-title-area">
          <div class="linen-icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <path d="M4 10h16M10 4v16"/>
            </svg>
          </div>
          <div class="linen-title-text">
            <h2>Linen Fleet & Laundry Lifecycle</h2>
            <p>9-attribute tracking: ID, Type, Status, Location, Bed, Last Washed, Wash Cycles, Issue Date, Damage Status</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="btn-card-action" id="btn-refresh-linen" style="display: inline-flex; align-items: center; gap: 0.4rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
          <button class="btn-primary-action" id="btn-create-linen" style="display: inline-flex; align-items: center; gap: 0.45rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Register New Linen
          </button>
        </div>
      </div>
    `;
  }

  renderKpiDeck() {
    const s = this.stats || {};
    return `
      <div class="linen-kpi-deck">
        <!-- Total -->
        <div class="linen-kpi-card">
          <div class="linen-kpi-header">
            <span class="linen-kpi-title">Total Active Assets</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="linen-kpi-value-row">
            <span class="linen-kpi-value">${s.totalLinen || 0}</span>
            <span class="linen-kpi-sub">registered items</span>
          </div>
        </div>

        <!-- Clean -->
        <div class="linen-kpi-card clean" style="cursor: pointer;" onclick="window.linenManager.setFilterStatus('CLEAN')">
          <div class="linen-kpi-header">
            <span class="linen-kpi-title" style="color: #34d399;">Clean / Sterile</span>
            <span class="status-dot online"></span>
          </div>
          <div class="linen-kpi-value-row">
            <span class="linen-kpi-value" style="color: #34d399;">${s.cleanCount || 0}</span>
            <span class="linen-kpi-sub">ready for deployment</span>
          </div>
        </div>

        <!-- In Use -->
        <div class="linen-kpi-card in_use" style="cursor: pointer;" onclick="window.linenManager.setFilterStatus('IN_USE')">
          <div class="linen-kpi-header">
            <span class="linen-kpi-title" style="color: #60a5fa;">In-Use</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
              <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>
            </svg>
          </div>
          <div class="linen-kpi-value-row">
            <span class="linen-kpi-value" style="color: #60a5fa;">${s.inUseCount || 0}</span>
            <span class="linen-kpi-sub">assigned to beds</span>
          </div>
        </div>

        <!-- Due for Change -->
        <div class="linen-kpi-card due_change" style="cursor: pointer;" onclick="window.linenManager.setFilterStatus('DUE_FOR_CHANGE')">
          <div class="linen-kpi-header">
            <span class="linen-kpi-title" style="color: #fbbf24;">Due For Change</span>
            <span class="status-dot degraded"></span>
          </div>
          <div class="linen-kpi-value-row">
            <span class="linen-kpi-value" style="color: #fbbf24;">${s.dueForChangeCount || 0}</span>
            <span class="linen-kpi-sub">requires replacement</span>
          </div>
        </div>

        <!-- In Laundry -->
        <div class="linen-kpi-card in_laundry" style="cursor: pointer;" onclick="window.linenManager.setFilterStatus('IN_LAUNDRY')">
          <div class="linen-kpi-header">
            <span class="linen-kpi-title" style="color: #c084fc;">In Laundry</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </div>
          <div class="linen-kpi-value-row">
            <span class="linen-kpi-value" style="color: #c084fc;">${s.inLaundryCount || 0}</span>
            <span class="linen-kpi-sub">washing / decontamination</span>
          </div>
        </div>

        <!-- Damaged / Retired -->
        <div class="linen-kpi-card damaged" style="cursor: pointer;" onclick="window.linenManager.setFilterStatus('DAMAGED')">
          <div class="linen-kpi-header">
            <span class="linen-kpi-title" style="color: #f87171;">Damaged / Retired</span>
            <span class="status-dot critical"></span>
          </div>
          <div class="linen-kpi-value-row">
            <span class="linen-kpi-value" style="color: #f87171;">${(s.damagedCount || 0) + (s.retiredCount || 0)}</span>
            <span class="linen-kpi-sub">${s.damagedCount || 0} damaged &bull; ${s.retiredCount || 0} retired</span>
          </div>
        </div>
      </div>
    `;
  }

  renderToolbar() {
    return `
      <div class="linen-toolbar">
        <div class="linen-toolbar-group">
          <!-- Keyword Search -->
          <div class="search-input-wrapper" style="position: relative; min-width: 260px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none;">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              id="linen-search-input" 
              class="form-control" 
              style="padding-left: 36px;" 
              placeholder="Search Linen ID, code, location, or bed..." 
              value="${this.escapeHtml(this.filters.keyword)}"
            />
          </div>

          <!-- Type Filter -->
          <select id="linen-filter-type" class="form-control" style="width: auto; min-width: 140px;">
            <option value="">All Types (Any)</option>
            ${this.enums.types.map(t => `
              <option value="${t.value}" ${this.filters.linenType === t.value ? 'selected' : ''}>${t.label}</option>
            `).join('')}
          </select>

          <!-- Status Filter -->
          <select id="linen-filter-status" class="form-control" style="width: auto; min-width: 155px;">
            <option value="">All Statuses (Any)</option>
            ${this.enums.statuses.map(st => `
              <option value="${st.value}" ${this.filters.status === st.value ? 'selected' : ''}>${st.label}</option>
            `).join('')}
          </select>

          <!-- Damage Status Filter -->
          <select id="linen-filter-damage" class="form-control" style="width: auto; min-width: 160px;">
            <option value="">Damage Status (Any)</option>
            ${this.enums.damageStatuses.map(d => `
              <option value="${d.value}" ${this.filters.damageStatus === d.value ? 'selected' : ''}>${d.label}</option>
            `).join('')}
          </select>

          <!-- Reset Filter Button -->
          ${(this.filters.keyword || this.filters.linenType || this.filters.status || this.filters.damageStatus) ? `
            <button class="btn-card-action" id="btn-reset-filters" title="Reset Filters" style="color: var(--accent-cyan);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Clear
            </button>
          ` : ''}
        </div>

        <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
          Showing <strong>${this.linens.length}</strong> matching assets
        </div>
      </div>
    `;
  }

  renderTableOrEmpty() {
    if (!this.linens || this.linens.length === 0) {
      return this.renderEmptyState();
    }

    return `
      <div class="glass-panel" style="overflow-x: auto; padding: 0;">
        <table class="table-custom" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 1rem 1.2rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.05em;">Linen ID / Identifier</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Type</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Status</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Current Location</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Assigned Bed</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Last Washed</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Wash Cycles</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Issue Date</th>
              <th style="padding: 1rem 1rem; text-align: left; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Damage Status</th>
              <th style="padding: 1rem 1.2rem; text-align: right; font-size: 0.74rem; text-transform: uppercase; color: var(--text-dim);">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.linens.map(item => this.renderTableRow(item)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderTableRow(item) {
    const typeMeta = this.enums.types.find(t => t.value === item.linenType) || { label: item.linenType, icon: '' };
    const statusMeta = this.enums.statuses.find(s => s.value === item.status) || { label: item.status, cssClass: 'clean', color: '#10b981' };
    const damageMeta = this.enums.damageStatuses.find(d => d.value === item.damageStatus) || { label: item.damageStatus || 'NONE', cssClass: 'none' };

    const cycles = item.washCycleCount || 0;
    const maxCycles = item.maxWashCycles || 60;
    const cyclePercent = Math.min(100, Math.round((cycles / maxCycles) * 100));
    let meterColor = 'var(--accent-emerald)';
    if (cyclePercent > 70) meterColor = 'var(--accent-amber)';
    if (cyclePercent >= 90) meterColor = 'var(--accent-crimson)';

    const lastWashedFormatted = item.lastWashedDate ? item.lastWashedDate : '<span style="color: var(--text-dim);">Never</span>';
    const issueDateFormatted = item.issueDate ? item.issueDate : '-';

    return `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04); transition: background var(--transition-fast);">
        <!-- 1. Linen ID -->
        <td style="padding: 1rem 1.2rem;">
          <div style="display: flex; flex-direction: column; gap: 0.2rem;">
            <span style="font-weight: 700; color: #fff; font-family: var(--font-mono); font-size: 0.88rem; display: flex; align-items: center; gap: 0.4rem;">
              ${this.escapeHtml(item.linenCode)}
            </span>
            <span style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-mono);">
              ID: #${item.linenId} &bull; ${item.historyCount || 0} events
            </span>
          </div>
        </td>

        <!-- 2. Type -->
        <td style="padding: 1rem 1rem;">
          <span class="linen-type-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="${typeMeta.icon}"/>
            </svg>
            ${typeMeta.label}
          </span>
        </td>

        <!-- 3. Status -->
        <td style="padding: 1rem 1rem;">
          <span class="linen-status-badge ${statusMeta.cssClass}">
            <span class="badge-dot"></span>
            ${statusMeta.label}
          </span>
        </td>

        <!-- 4. Location -->
        <td style="padding: 1rem 1rem;">
          <span style="font-size: 0.82rem; color: var(--text-normal); display: flex; align-items: center; gap: 0.4rem;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${this.escapeHtml(item.currentLocation || 'Unassigned')}
          </span>
        </td>

        <!-- 5. Assigned Bed -->
        <td style="padding: 1rem 1rem;">
          ${item.assignedBedNumber ? `
            <span class="badge" style="background: rgba(59, 130, 246, 0.14); border: 1px solid rgba(59, 130, 246, 0.35); color: #93c5fd; font-size: 0.76rem; font-weight: 600;">
              🛏️ ${this.escapeHtml(item.assignedBedNumber)}
            </span>
          ` : `
            <span style="color: var(--text-dim); font-size: 0.78rem;">None (Storage)</span>
          `}
        </td>

        <!-- 6. Last Washed -->
        <td style="padding: 1rem 1rem;">
          <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-normal);">
            ${lastWashedFormatted}
          </span>
        </td>

        <!-- 7. Wash Cycles Meter -->
        <td style="padding: 1rem 1rem;">
          <div class="wash-meter">
            <div class="wash-meter-label">
              <span><strong>${cycles}</strong> / ${maxCycles}</span>
              <span>${cyclePercent}%</span>
            </div>
            <div class="wash-bar-bg">
              <div class="wash-bar-fill" style="width: ${cyclePercent}%; background: ${meterColor};"></div>
            </div>
          </div>
        </td>

        <!-- 8. Issue Date -->
        <td style="padding: 1rem 1rem;">
          <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-muted);">
            ${issueDateFormatted}
          </span>
        </td>

        <!-- 9. Damage Status -->
        <td style="padding: 1rem 1rem;">
          <span class="damage-pill ${damageMeta.cssClass}">
            ${damageMeta.label}
          </span>
          ${item.damageNotes ? `
            <div style="font-size: 0.7rem; color: var(--accent-amber); margin-top: 0.2rem; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(item.damageNotes)}">
              ⚠️ ${this.escapeHtml(item.damageNotes)}
            </div>
          ` : ''}
        </td>

        <!-- 10. Actions -->
        <td style="padding: 1rem 1.2rem; text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
            <!-- Wash Action -->
            <button class="btn-card-action" title="Log Disinfection Wash Cycle" onclick="window.linenManager.openWashModal(${item.linenId})" style="padding: 0.35rem 0.55rem; color: var(--accent-purple);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </button>

            <!-- Assign Bed Action -->
            <button class="btn-card-action" title="Assign Bed / Location" onclick="window.linenManager.openAssignModal(${item.linenId})" style="padding: 0.35rem 0.55rem; color: var(--accent-blue);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>
              </svg>
            </button>

            <!-- Status Transition Action -->
            <button class="btn-card-action" title="Change Operational Status" onclick="window.linenManager.openStatusModal(${item.linenId})" style="padding: 0.35rem 0.55rem; color: var(--accent-amber);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>

            <!-- Damage Report Action -->
            <button class="btn-card-action" title="Report Damage / Inspection" onclick="window.linenManager.openDamageModal(${item.linenId})" style="padding: 0.35rem 0.55rem; color: var(--accent-crimson);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>

            <!-- Lifecycle History Timeline -->
            <button class="btn-card-action" title="View Lifecycle History" onclick="window.linenManager.openHistoryModal(${item.linenId})" style="padding: 0.35rem 0.55rem; color: var(--accent-cyan);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>

            <!-- Edit Details -->
            <button class="btn-card-action" title="Edit Linen" onclick="window.linenManager.openEditModal(${item.linenId})" style="padding: 0.35rem 0.55rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            <!-- Delete -->
            <button class="btn-card-action" title="Delete Asset" onclick="window.linenManager.confirmDelete(${item.linenId})" style="padding: 0.35rem 0.55rem; color: var(--text-dim);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  renderEmptyState() {
    const isFiltered = this.filters.keyword || this.filters.linenType || this.filters.status || this.filters.damageStatus;
    return `
      <div class="empty-state-card" style="padding: 3.5rem 2rem; text-align: center; background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(0, 242, 254, 0.08); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.2rem; color: var(--accent-cyan);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <path d="M4 10h16M10 4v16"/>
          </svg>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem;">
          ${isFiltered ? 'No matching linen items found' : 'No linen assets registered yet'}
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 480px; margin: 0 auto 1.5rem;">
          ${isFiltered 
            ? 'Try adjusting your search query, type selection, or status filters to view other inventory records.' 
            : 'Track bedsheets, blankets, pillow covers, and patient gowns across wards and laundry decontamination cycles.'}
        </p>
        <div style="display: flex; justify-content: center; gap: 0.75rem;">
          ${isFiltered ? `
            <button class="btn-card-action" onclick="window.linenManager.resetFilters()">Clear Filters</button>
          ` : ''}
          <button class="btn-primary-action" onclick="window.linenManager.openCreateModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Register First Linen
          </button>
        </div>
      </div>
    `;
  }

  renderLoadingPlaceholder() {
    return `
      <div style="padding: 4rem 2rem; text-align: center; background: var(--bg-card); border-radius: var(--radius-md);">
        <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(0, 242, 254, 0.2); border-top-color: var(--accent-cyan); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;"></div>
        <div style="color: var(--text-muted); font-size: 0.85rem;">Retrieving linen telemetry from platform...</div>
      </div>
    `;
  }

  renderErrorBanner() {
    return `
      <div style="padding: 1rem 1.4rem; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; color: #f87171; font-size: 0.85rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>${this.escapeHtml(this.error)}</span>
        </div>
        <button class="btn-card-action" onclick="window.linenManager.refreshData()" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4);">
          Retry
        </button>
      </div>
    `;
  }

  updateLoadingState() {
    const refreshBtn = document.getElementById('btn-refresh-linen');
    if (refreshBtn) {
      refreshBtn.style.opacity = this.loading ? '0.6' : '1';
      refreshBtn.disabled = this.loading;
    }
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  attachEventListeners() {
    // Search input debounced
    const searchInput = document.getElementById('linen-search-input');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.filters.keyword = e.target.value.trim();
          this.refreshData();
        }, 320);
      });
    }

    // Type filter
    const typeFilter = document.getElementById('linen-filter-type');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.filters.linenType = e.target.value;
        this.refreshData();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('linen-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.refreshData();
      });
    }

    // Damage filter
    const damageFilter = document.getElementById('linen-filter-damage');
    if (damageFilter) {
      damageFilter.addEventListener('change', (e) => {
        this.filters.damageStatus = e.target.value;
        this.refreshData();
      });
    }

    // Reset filters
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }

    // Refresh button
    const refreshBtn = document.getElementById('btn-refresh-linen');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // Create linen button
    const createBtn = document.getElementById('btn-create-linen');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateModal());
    }
  }

  setFilterStatus(status) {
    this.filters.status = status;
    this.refreshData();
  }

  resetFilters() {
    this.filters = { keyword: '', linenType: '', status: '', damageStatus: '' };
    this.refreshData();
  }

  // ==========================================================================
  // Modals & Action Workflows
  // ==========================================================================

  // --- 1. Create Linen Modal ---
  openCreateModal() {
    const modalHtml = `
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 620px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <path d="M4 10h16M10 4v16"/>
              </svg>
              Register New Hospital Linen Asset
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>

          <form id="form-create-linen" onsubmit="window.linenManager.handleCreateSubmit(event)">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem; max-height: 70vh; overflow-y: auto;">
              
              <!-- Linen ID / Tracking Code -->
              <div class="form-group">
                <label class="form-label" for="inp-linen-code">Linen Tracking Code / Identifier *</label>
                <input type="text" id="inp-linen-code" class="form-control" placeholder="e.g. LIN-BS-ICU-101" required />
                <span class="form-hint" style="font-size: 0.72rem; color: var(--text-dim);">Must be unique across hospital inventory.</span>
              </div>

              <!-- Two column row: Type & Initial Status -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="inp-linen-type">Linen Type *</label>
                  <select id="inp-linen-type" class="form-control" required>
                    <option value="" disabled selected>Select Linen Type</option>
                    ${this.enums.types.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="inp-linen-status">Initial Hygiene Status *</label>
                  <select id="inp-linen-status" class="form-control" required>
                    ${this.enums.statuses.map(st => `<option value="${st.value}" ${st.value === 'CLEAN' ? 'selected' : ''}>${st.label}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Current Location -->
              <div class="form-group">
                <label class="form-label" for="inp-linen-location">Current Location</label>
                <input type="text" id="inp-linen-location" class="form-control" placeholder="e.g. Central Linen Storage Bay 1" value="Central Linen Storage" />
              </div>

              <!-- Assigned Bed (Optional) -->
              <div class="form-group">
                <label class="form-label" for="inp-linen-bed">Assigned Bed (Optional)</label>
                <select id="inp-linen-bed" class="form-control">
                  <option value="">Unassigned (In Storage)</option>
                  ${this.beds.map(b => `<option value="${b.bedId}">Bed ${b.bedNumber} (${b.roomNumber || 'Room'})</option>`).join('')}
                </select>
              </div>

              <!-- Two column row: Issue Date & Max Wash Cycles -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="inp-linen-issue-date">Issue Date</label>
                  <input type="date" id="inp-linen-issue-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="inp-linen-max-wash">Max Recommended Wash Cycles</label>
                  <input type="number" id="inp-linen-max-wash" class="form-control" min="1" max="200" value="60" />
                </div>
              </div>

              <!-- Two column row: Wash Cycle Count & Last Washed Date -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="inp-linen-wash-count">Current Wash Cycle Count</label>
                  <input type="number" id="inp-linen-wash-count" class="form-control" min="0" value="0" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="inp-linen-last-washed">Last Washed Date</label>
                  <input type="date" id="inp-linen-last-washed" class="form-control" />
                </div>
              </div>

              <!-- Damage Status & Notes -->
              <div class="form-group">
                <label class="form-label" for="inp-linen-damage">Damage Status</label>
                <select id="inp-linen-damage" class="form-control">
                  ${this.enums.damageStatuses.map(d => `<option value="${d.value}" ${d.value === 'NONE' ? 'selected' : ''}>${d.label}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="inp-linen-notes">Inspection / Condition Notes</label>
                <textarea id="inp-linen-notes" class="form-control" rows="2" placeholder="Optional textile notes or serial inspection remarks..."></textarea>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn-card-action" onclick="window.linenManager.closeModal()">Cancel</button>
              <button type="submit" class="btn-primary-action" id="btn-submit-create-linen">Register Linen</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  }

  async handleCreateSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit-create-linen');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering...';
    }

    const payload = {
      linenCode: document.getElementById('inp-linen-code').value.trim(),
      linenType: document.getElementById('inp-linen-type').value,
      status: document.getElementById('inp-linen-status').value,
      currentLocation: document.getElementById('inp-linen-location').value.trim() || 'Central Linen Storage',
      assignedBedId: document.getElementById('inp-linen-bed').value ? Number(document.getElementById('inp-linen-bed').value) : null,
      issueDate: document.getElementById('inp-linen-issue-date').value || null,
      maxWashCycles: Number(document.getElementById('inp-linen-max-wash').value) || 60,
      washCycleCount: Number(document.getElementById('inp-linen-wash-count').value) || 0,
      lastWashedDate: document.getElementById('inp-linen-last-washed').value || null,
      damageStatus: document.getElementById('inp-linen-damage').value,
      damageNotes: document.getElementById('inp-linen-notes').value.trim() || null
    };

    try {
      const res = await this.apiRequest('/linen', 'POST', payload);
      this.closeModal();
      this.showToast(`Linen '${payload.linenCode}' registered successfully`, 'success');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register Linen';
      }
    }
  }

  // --- 2. Edit Linen Modal ---
  async openEditModal(linenId) {
    const linen = this.linens.find(l => l.linenId === linenId);
    if (!linen) return;

    const modalHtml = `
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 620px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff;">
              Edit Linen Asset: ${this.escapeHtml(linen.linenCode)}
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>

          <form id="form-edit-linen" onsubmit="window.linenManager.handleEditSubmit(event, ${linenId})">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem; max-height: 70vh; overflow-y: auto;">
              
              <div class="form-group">
                <label class="form-label" for="edit-linen-code">Linen Tracking Code</label>
                <input type="text" id="edit-linen-code" class="form-control" value="${this.escapeHtml(linen.linenCode)}" required />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="edit-linen-type">Linen Type</label>
                  <select id="edit-linen-type" class="form-control" required>
                    ${this.enums.types.map(t => `<option value="${t.value}" ${linen.linenType === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-linen-status">Hygiene Status</label>
                  <select id="edit-linen-status" class="form-control" required>
                    ${this.enums.statuses.map(st => `<option value="${st.value}" ${linen.status === st.value ? 'selected' : ''}>${st.label}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-linen-location">Current Location</label>
                <input type="text" id="edit-linen-location" class="form-control" value="${this.escapeHtml(linen.currentLocation || '')}" />
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-linen-bed">Assigned Bed</label>
                <select id="edit-linen-bed" class="form-control">
                  <option value="">Unassigned (In Storage)</option>
                  ${this.beds.map(b => `<option value="${b.bedId}" ${linen.assignedBedId === b.bedId ? 'selected' : ''}>Bed ${b.bedNumber} (${b.roomNumber || 'Room'})</option>`).join('')}
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="edit-linen-issue-date">Issue Date</label>
                  <input type="date" id="edit-linen-issue-date" class="form-control" value="${linen.issueDate || ''}" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-linen-max-wash">Max Recommended Cycles</label>
                  <input type="number" id="edit-linen-max-wash" class="form-control" value="${linen.maxWashCycles || 60}" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="edit-linen-wash-count">Wash Cycle Count</label>
                  <input type="number" id="edit-linen-wash-count" class="form-control" value="${linen.washCycleCount || 0}" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="edit-linen-last-washed">Last Washed Date</label>
                  <input type="date" id="edit-linen-last-washed" class="form-control" value="${linen.lastWashedDate || ''}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-linen-damage">Damage Status</label>
                <select id="edit-linen-damage" class="form-control">
                  ${this.enums.damageStatuses.map(d => `<option value="${d.value}" ${linen.damageStatus === d.value ? 'selected' : ''}>${d.label}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-linen-notes">Inspection / Condition Notes</label>
                <textarea id="edit-linen-notes" class="form-control" rows="2">${this.escapeHtml(linen.damageNotes || '')}</textarea>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn-card-action" onclick="window.linenManager.closeModal()">Cancel</button>
              <button type="submit" class="btn-primary-action" id="btn-submit-edit-linen">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  }

  async handleEditSubmit(e, linenId) {
    e.preventDefault();
    const payload = {
      linenCode: document.getElementById('edit-linen-code').value.trim(),
      linenType: document.getElementById('edit-linen-type').value,
      status: document.getElementById('edit-linen-status').value,
      currentLocation: document.getElementById('edit-linen-location').value.trim(),
      assignedBedId: document.getElementById('edit-linen-bed').value ? Number(document.getElementById('edit-linen-bed').value) : null,
      issueDate: document.getElementById('edit-linen-issue-date').value || null,
      maxWashCycles: Number(document.getElementById('edit-linen-max-wash').value) || 60,
      washCycleCount: Number(document.getElementById('edit-linen-wash-count').value) || 0,
      lastWashedDate: document.getElementById('edit-linen-last-washed').value || null,
      damageStatus: document.getElementById('edit-linen-damage').value,
      damageNotes: document.getElementById('edit-linen-notes').value.trim() || null
    };

    try {
      await this.apiRequest(`/linen/${linenId}`, 'PUT', payload);
      this.closeModal();
      this.showToast('Linen updated successfully', 'success');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- 3. Quick Status Transition Modal ---
  openStatusModal(linenId) {
    const linen = this.linens.find(l => l.linenId === linenId);
    if (!linen) return;

    const modalHtml = `
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 480px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff;">
              Update Status: ${this.escapeHtml(linen.linenCode)}
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>

          <form onsubmit="window.linenManager.handleStatusSubmit(event, ${linenId})">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Current Status: <span class="badge" style="color: #60a5fa;">${linen.status}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="trans-status">Target Status *</label>
                <select id="trans-status" class="form-control" required>
                  ${this.enums.statuses.map(st => `<option value="${st.value}" ${linen.status === st.value ? 'selected' : ''}>${st.label}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="trans-location">Updated Location (Optional)</label>
                <input type="text" id="trans-location" class="form-control" placeholder="Leave blank to keep current location" />
              </div>

              <div class="form-group">
                <label class="form-label" for="trans-staff">Performed By Staff</label>
                <input type="text" id="trans-staff" class="form-control" value="${this.currentUser ? this.currentUser.fullName || this.currentUser.email : 'Hygiene Staff'}" />
              </div>

              <div class="form-group">
                <label class="form-label" for="trans-reason">Audit Reason / Remarks</label>
                <textarea id="trans-reason" class="form-control" rows="2" placeholder="e.g. Daily shift replacement, routine laundry dispatch..."></textarea>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn-card-action" onclick="window.linenManager.closeModal()">Cancel</button>
              <button type="submit" class="btn-primary-action">Apply Transition</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  }

  async handleStatusSubmit(e, linenId) {
    e.preventDefault();
    const payload = {
      status: document.getElementById('trans-status').value,
      location: document.getElementById('trans-location').value.trim() || undefined,
      performedBy: document.getElementById('trans-staff').value.trim(),
      reason: document.getElementById('trans-reason').value.trim()
    };

    try {
      await this.apiRequest(`/linen/${linenId}/status`, 'PATCH', payload);
      this.closeModal();
      this.showToast(`Status updated to ${payload.status}`, 'success');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- 4. Bed & Location Assignment Modal ---
  openAssignModal(linenId) {
    const linen = this.linens.find(l => l.linenId === linenId);
    if (!linen) return;

    const modalHtml = `
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 480px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff;">
              Assign Bed: ${this.escapeHtml(linen.linenCode)}
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>

          <form onsubmit="window.linenManager.handleAssignSubmit(event, ${linenId})">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Currently Assigned: <strong>${linen.assignedBedNumber || 'None (In Storage)'}</strong>
              </div>

              <div class="form-group">
                <label class="form-label" for="assign-bed-id">Target Bed</label>
                <select id="assign-bed-id" class="form-control">
                  <option value="">-- De-assign (Move to Storage) --</option>
                  ${this.beds.map(b => `<option value="${b.bedId}" ${linen.assignedBedId === b.bedId ? 'selected' : ''}>Bed ${b.bedNumber} (${b.roomNumber || 'Room'})</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="assign-location">Location Override</label>
                <input type="text" id="assign-location" class="form-control" placeholder="Auto-populated from Bed, or type custom location" />
              </div>

              <div class="form-group">
                <label class="form-label" for="assign-staff">Performed By</label>
                <input type="text" id="assign-staff" class="form-control" value="${this.currentUser ? this.currentUser.fullName || this.currentUser.email : 'Ward Nurse'}" />
              </div>

              <div class="form-group">
                <label class="form-label" for="assign-notes">Assignment Notes</label>
                <textarea id="assign-notes" class="form-control" rows="2" placeholder="e.g. Clean bedsheet outfitted for post-op admission"></textarea>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn-card-action" onclick="window.linenManager.closeModal()">Cancel</button>
              <button type="submit" class="btn-primary-action">Confirm Assignment</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  }

  async handleAssignSubmit(e, linenId) {
    e.preventDefault();
    const bedIdVal = document.getElementById('assign-bed-id').value;
    const payload = {
      bedId: bedIdVal ? Number(bedIdVal) : null,
      location: document.getElementById('assign-location').value.trim() || undefined,
      performedBy: document.getElementById('assign-staff').value.trim(),
      notes: document.getElementById('assign-notes').value.trim()
    };

    try {
      await this.apiRequest(`/linen/${linenId}/assign`, 'PATCH', payload);
      this.closeModal();
      this.showToast('Bed assignment updated', 'success');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- 5. Wash Cycle Log Modal ---
  openWashModal(linenId) {
    const linen = this.linens.find(l => l.linenId === linenId);
    if (!linen) return;

    const modalHtml = `
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 500px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              Log Thermal Wash & Disinfection Cycle
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>

          <form onsubmit="window.linenManager.handleWashSubmit(event, ${linenId})">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="font-size: 0.8rem; color: var(--text-muted); background: rgba(139, 92, 246, 0.08); padding: 0.8rem; border-radius: var(--radius-sm); border: 1px solid rgba(139, 92, 246, 0.2);">
                Recording wash cycle will automatically increment count from <strong>${linen.washCycleCount || 0}</strong> to <strong>${(linen.washCycleCount || 0) + 1}</strong>, update last washed date to today, transition status to <strong>CLEAN</strong>, and log an audit history event.
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label" for="wash-temp">Water Temp (°C)</label>
                  <input type="number" id="wash-temp" class="form-control" value="75.0" step="0.5" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="wash-agent">Sanitizer Agent</label>
                  <input type="text" id="wash-agent" class="form-control" value="Peracetic Acid 250ppm" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="wash-staff">Laundry Technician</label>
                <input type="text" id="wash-staff" class="form-control" value="${this.currentUser ? this.currentUser.fullName || this.currentUser.email : 'Laundry Tech'}" />
              </div>

              <div class="form-group">
                <label class="form-label" for="wash-notes">Cycle Notes / Batch ID</label>
                <textarea id="wash-notes" class="form-control" rows="2" placeholder="e.g. Batch #LW-9082 - Thermal sterilization cycle complete, passed inspection"></textarea>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn-card-action" onclick="window.linenManager.closeModal()">Cancel</button>
              <button type="submit" class="btn-primary-action" style="background: linear-gradient(135deg, #8b5cf6, #06b6d4);">Complete & Verify Wash</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  }

  async handleWashSubmit(e, linenId) {
    e.preventDefault();
    const payload = {
      waterTemperatureCelsius: parseFloat(document.getElementById('wash-temp').value) || 75.0,
      sanitizerAgent: document.getElementById('wash-agent').value.trim(),
      performedBy: document.getElementById('wash-staff').value.trim(),
      notes: document.getElementById('wash-notes').value.trim()
    };

    try {
      const res = await this.apiRequest(`/linen/${linenId}/wash`, 'PATCH', payload);
      this.closeModal();
      this.showToast(`Wash cycle recorded! New wash count: ${res.data.washCycleCount}`, 'success');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- 6. Report Damage Modal ---
  openDamageModal(linenId) {
    const linen = this.linens.find(l => l.linenId === linenId);
    if (!linen) return;

    const modalHtml = `
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 480px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-crimson)" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
              Report Linen Damage / Degradation
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>

          <form onsubmit="window.linenManager.handleDamageSubmit(event, ${linenId})">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
              <div class="form-group">
                <label class="form-label" for="dmg-status">Damage Severity *</label>
                <select id="dmg-status" class="form-control" required>
                  ${this.enums.damageStatuses.filter(d => d.value !== 'NONE').map(d => `
                    <option value="${d.value}" ${linen.damageStatus === d.value ? 'selected' : ''}>${d.label}</option>
                  `).join('')}
                  <option value="NONE">Clear Damage (Intact / Repaired)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="dmg-transition">Auto-Transition Linen Status?</label>
                <select id="dmg-transition" class="form-control">
                  <option value="DAMAGED">Set Status: DAMAGED (Quarantine for Inspection)</option>
                  <option value="RETIRED">Set Status: RETIRED (Decommission / Write-off)</option>
                  <option value="KEEP">Keep Current Status (${linen.status})</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="dmg-staff">Inspecting Officer</label>
                <input type="text" id="dmg-staff" class="form-control" value="${this.currentUser ? this.currentUser.fullName || this.currentUser.email : 'Hygiene Quality Officer'}" />
              </div>

              <div class="form-group">
                <label class="form-label" for="dmg-notes">Damage Description & Circumstances *</label>
                <textarea id="dmg-notes" class="form-control" rows="3" placeholder="Describe tear location, staining agent, burn mark, or contamination source..." required></textarea>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn-card-action" onclick="window.linenManager.closeModal()">Cancel</button>
              <button type="submit" class="btn-primary-action" style="background: var(--accent-crimson);">Submit Damage Report</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  }

  async handleDamageSubmit(e, linenId) {
    e.preventDefault();
    const damageStatus = document.getElementById('dmg-status').value;
    const transitionOpt = document.getElementById('dmg-transition').value;
    const payload = {
      damageStatus,
      damageNotes: document.getElementById('dmg-notes').value.trim(),
      performedBy: document.getElementById('dmg-staff').value.trim(),
      newStatus: transitionOpt === 'KEEP' ? undefined : transitionOpt
    };

    try {
      await this.apiRequest(`/linen/${linenId}/damage`, 'PATCH', payload);
      this.closeModal();
      this.showToast('Damage report logged successfully', 'success');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- 7. Lifecycle History Timeline Modal ---
  async openHistoryModal(linenId) {
    const linen = this.linens.find(l => l.linenId === linenId);
    if (!linen) return;

    this.activeLinenItem = linen;
    this.mountModal(`
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 680px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Lifecycle History: ${this.escapeHtml(linen.linenCode)}
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>

          <div class="modal-body" style="max-height: 72vh; overflow-y: auto;">
            <!-- Asset Summary Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1rem; background: rgba(15, 23, 42, 0.7); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 1.2rem;">
              <div>
                <span style="font-size: 0.76rem; color: var(--text-dim); text-transform: uppercase;">Asset Type</span>
                <div style="font-size: 0.9rem; font-weight: 700; color: #fff;">${linen.linenType}</div>
              </div>
              <div>
                <span style="font-size: 0.76rem; color: var(--text-dim); text-transform: uppercase;">Status</span>
                <div><span class="badge" style="color: #60a5fa;">${linen.status}</span></div>
              </div>
              <div>
                <span style="font-size: 0.76rem; color: var(--text-dim); text-transform: uppercase;">Wash Cycles</span>
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--accent-cyan); font-family: var(--font-mono);">${linen.washCycleCount} / ${linen.maxWashCycles}</div>
              </div>
              <div>
                <span style="font-size: 0.76rem; color: var(--text-dim); text-transform: uppercase;">Damage</span>
                <div style="font-size: 0.9rem; font-weight: 700; color: #fff;">${linen.damageStatus}</div>
              </div>
            </div>

            <!-- Add Audit Note Form -->
            <div style="margin-bottom: 1.2rem; padding: 0.9rem; background: rgba(0, 242, 254, 0.04); border: 1px solid rgba(0, 242, 254, 0.15); border-radius: var(--radius-sm);">
              <h4 style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.5rem;">Add Manual Hygiene / Inspection Audit Note</h4>
              <form onsubmit="window.linenManager.handleAddHistoryNote(event, ${linenId})" style="display: flex; gap: 0.5rem;">
                <input type="text" id="inp-history-note" class="form-control" placeholder="Enter clinical observation or barcode verification note..." style="flex: 1;" required />
                <button type="submit" class="btn-primary-action" style="padding: 0.4rem 0.9rem; font-size: 0.78rem;">Log Note</button>
              </form>
            </div>

            <!-- Timeline Events List -->
            <div id="history-timeline-content">
              <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <div class="spinner" style="margin: 0 auto 0.5rem;"></div>
                Loading lifecycle timeline...
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding: 0.9rem 1.4rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end;">
            <button class="btn-card-action" onclick="window.linenManager.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `);

    // Fetch history
    try {
      const res = await this.apiRequest(`/linen/${linenId}/history`);
      this.activeHistory = (res && res.data) ? res.data : [];
      this.renderHistoryTimeline();
    } catch (err) {
      const container = document.getElementById('history-timeline-content');
      if (container) {
        container.innerHTML = `<div style="color: #f87171; padding: 1rem; text-align: center;">Failed to load history: ${err.message}</div>`;
      }
    }
  }

  renderHistoryTimeline() {
    const container = document.getElementById('history-timeline-content');
    if (!container) return;

    if (!this.activeHistory || this.activeHistory.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted); font-size: 0.85rem;">
          No lifecycle events recorded yet for this asset.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="linen-history-timeline">
        ${this.activeHistory.map(evt => {
          const recordedAtFormatted = evt.recordedAt ? new Date(evt.recordedAt).toLocaleString() : '-';
          let actionLabel = evt.action.replace(/_/g, ' ');

          return `
            <div class="history-event-item">
              <div class="history-event-header">
                <span class="history-event-action">
                  ${this.getActionBadge(evt.action)}
                  ${actionLabel}
                </span>
                <span class="history-event-time">${recordedAtFormatted}</span>
              </div>

              ${evt.newStatus ? `
                <div style="font-size: 0.78rem; color: var(--text-muted); margin: 0.2rem 0;">
                  Status: <strong style="color: #fff;">${evt.previousStatus || 'NONE'}</strong> &rarr; <strong style="color: var(--accent-cyan);">${evt.newStatus}</strong>
                </div>
              ` : ''}

              ${evt.newLocation ? `
                <div style="font-size: 0.76rem; color: var(--text-dim);">
                  📍 Location: ${this.escapeHtml(evt.newLocation)}
                  ${evt.assignedBedNumber ? ` &bull; Bed: 🛏️ ${this.escapeHtml(evt.assignedBedNumber)}` : ''}
                </div>
              ` : ''}

              ${evt.notes ? `
                <div class="history-event-body">
                  ${this.escapeHtml(evt.notes)}
                </div>
              ` : ''}

              <div class="history-event-footer">
                <span>👤 Staff: <strong>${this.escapeHtml(evt.performedBy || 'System')}</strong></span>
                ${evt.washCycleCountAtEvent !== null && evt.washCycleCountAtEvent !== undefined ? `
                  <span>&bull; Cycle Count: <strong>${evt.washCycleCountAtEvent}</strong></span>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  getActionBadge(action) {
    if (action.includes('WASH')) return '🧼';
    if (action.includes('ASSIGN')) return '🛏️';
    if (action.includes('DAMAGE')) return '⚠️';
    if (action.includes('INITIAL')) return '✨';
    if (action.includes('STATUS')) return '🔄';
    if (action.includes('NOTE')) return '📝';
    return '📌';
  }

  async handleAddHistoryNote(e, linenId) {
    e.preventDefault();
    const noteInp = document.getElementById('inp-history-note');
    if (!noteInp || !noteInp.value.trim()) return;

    const payload = {
      note: noteInp.value.trim(),
      performedBy: this.currentUser ? this.currentUser.fullName || this.currentUser.email : 'Hygiene Auditor'
    };

    try {
      await this.apiRequest(`/linen/${linenId}/history`, 'POST', payload);
      noteInp.value = '';
      this.showToast('Audit note logged to linen timeline', 'success');
      // Reload history
      const res = await this.apiRequest(`/linen/${linenId}/history`);
      this.activeHistory = res.data || [];
      this.renderHistoryTimeline();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- 8. Delete Confirmation Modal ---
  confirmDelete(linenId) {
    const linen = this.linens.find(l => l.linenId === linenId);
    if (!linen) return;

    const modalHtml = `
      <div class="modal-backdrop active" id="modal-backdrop">
        <div class="modal-dialog" style="max-width: 440px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #f87171;">
              Confirm Deletion
            </h3>
            <button class="modal-close-btn" onclick="window.linenManager.closeModal()">&times;</button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <p style="font-size: 0.85rem; color: var(--text-normal);">
              Are you sure you want to permanently delete linen asset <strong>${this.escapeHtml(linen.linenCode)}</strong>?
            </p>
            <p style="font-size: 0.76rem; color: var(--text-dim);">
              All linked wash lifecycle history and bed assignment records will also be removed.
            </p>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid var(--border-subtle);">
            <button class="btn-card-action" onclick="window.linenManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" style="background: var(--accent-crimson);" onclick="window.linenManager.executeDelete(${linenId})">Delete Permanently</button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  }

  async executeDelete(linenId) {
    try {
      await this.apiRequest(`/linen/${linenId}`, 'DELETE');
      this.closeModal();
      this.showToast('Linen record deleted successfully', 'success');
      await this.refreshData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // Modal Utilities & Notifications
  // ==========================================================================

  mountModal(modalHtml) {
    let container = document.getElementById('linen-modal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'linen-modal-container';
      document.body.appendChild(container);
    }
    container.innerHTML = modalHtml;
  }

  closeModal() {
    const container = document.getElementById('linen-modal-container');
    if (container) container.innerHTML = '';
  }

  showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        ${iconSvg}
        <span style="font-size: 0.84rem; color: #fff;">${this.escapeHtml(message)}</span>
      </div>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 1.1rem; padding: 0 0.3rem;">&times;</button>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Attach to window
window.HospitalLinenManager = HospitalLinenManager;
