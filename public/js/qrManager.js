// ==========================================================================
// SMART HOSPITAL HYGIENE & RESOURCE INTELLIGENCE PLATFORM
// QR Code Asset & Resource Intelligence Controller
// Handles: Rooms, Beds, Linen, Equipment, Waste Bins
// Operations: Generate, View, Download/Print, Regenerate, Secure Lookup
// Enforces Zero-PHI Privacy Architecture
// ==========================================================================

class HospitalQrManager {
  constructor(containerId = 'qr-management-container') {
    this.containerId = containerId;
    this.container = null;

    // API Config
    this.apiBaseUrl = window.location.port === '3000' ? '/api' : 'http://localhost:8080/api';
    this.jwtTokenKey = 'sh_jwt_token';
    this.currentUserKey = 'sh_current_user';
    this.token = localStorage.getItem(this.jwtTokenKey) || '';

    // Data State
    this.resources = [];
    this.activeFilter = 'ALL';
    this.searchTerm = '';
    this.viewMode = 'GRID'; // 'GRID' | 'TABLE'
    this.loading = false;
    this.error = null;

    // Active Modal Context
    this.activeResource = null;

    this.init();
  }

  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`HospitalQrManager: Container #${this.containerId} not found.`);
      return;
    }

    this.renderSkeleton();
    await this.ensureAuthenticated();
    await this.loadResources();
  }

  // ==========================================================================
  // AUTHENTICATION & API UTILITIES
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
        localStorage.setItem(this.jwtTokenKey, this.token);
        localStorage.setItem(this.currentUserKey, JSON.stringify(resJson.data));
        return true;
      }
    } catch (err) {
      console.error('QR Manager auto-auth error:', err);
      this.showToast(`Authentication failed: ${err.message}`, 'error');
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
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = json?.message || (json?.errors ? Object.values(json.errors).join(', ') : `HTTP ${response.status}`);
        throw new Error(errorMsg);
      }

      return json?.data !== undefined ? json.data : json;
    } catch (err) {
      console.error(`API Error [${method} ${endpoint}]:`, err);
      throw err;
    }
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  async loadResources() {
    this.loading = true;
    try {
      const data = await this.apiRequest('/qr/resources');
      this.resources = Array.isArray(data) ? data : [];
      this.render();
    } catch (err) {
      this.error = err.message;
      this.render();
      this.showToast(`Failed to load resources: ${err.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  // ==========================================================================
  // RENDER PIPELINE
  // ==========================================================================

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="qr-hub-container">
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="display: inline-block; width: 36px; height: 36px; border: 3px solid rgba(6, 182, 212, 0.2); border-top-color: var(--accent-cyan); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p style="margin-top: 1rem; font-size: 0.9rem;">Initializing QR Asset & Resource Intelligence Hub...</p>
        </div>
      </div>
    `;
  }

  render() {
    const counts = {
      TOTAL: this.resources.length,
      ROOM: this.resources.filter(r => r.resourceType === 'ROOM').length,
      BED: this.resources.filter(r => r.resourceType === 'BED').length,
      LINEN: this.resources.filter(r => r.resourceType === 'LINEN').length,
      EQUIPMENT: this.resources.filter(r => r.resourceType === 'EQUIPMENT').length,
      WASTE_BIN: this.resources.filter(r => r.resourceType === 'WASTE_BIN').length
    };

    const filtered = this.resources.filter(r => {
      const matchType = this.activeFilter === 'ALL' || r.resourceType === this.activeFilter;
      const search = this.searchTerm.toLowerCase().trim();
      const matchSearch = !search ||
        (r.qrCodeIdentifier && r.qrCodeIdentifier.toLowerCase().includes(search)) ||
        (r.resourceName && r.resourceName.toLowerCase().includes(search)) ||
        (r.location && r.location.toLowerCase().includes(search)) ||
        (r.status && r.status.toLowerCase().includes(search));
      return matchType && matchSearch;
    });

    this.container.innerHTML = `
      <div class="qr-hub-container">
        <!-- Top Bar with Actions -->
        <div class="qr-header-bar">
          <div class="qr-title-area">
            <div class="qr-brand-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <path d="M7 7h.01M18 7h.01M7 18h.01M18 18h.01"></path>
              </svg>
            </div>
            <div class="qr-title-text">
              <h2>
                HOSPITAL RESOURCE QR INTELLIGENCE
                <span class="qr-privacy-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Zero-PHI Privacy Architecture
                </span>
              </h2>
              <p>Cryptographic Tag Generation, Asset Labeling, Clinical Sticker Printing & Secure Decoupled Lookups</p>
            </div>
          </div>

          <div class="qr-actions-group">
            <button class="btn-primary-action" id="qr-btn-generate" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.15rem; background: var(--accent-cyan); color: #070b14; font-weight: 700; border-radius: var(--radius-sm); border: none; cursor: pointer; transition: all 0.2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Generate New QR
            </button>
            <button class="btn-secondary-action" id="qr-btn-batch-print" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.15rem; background: rgba(255, 255, 255, 0.08); color: #fff; font-weight: 600; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); cursor: pointer; transition: all 0.2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Batch Print Labels (${filtered.length})
            </button>
          </div>
        </div>

        <!-- Privacy Architecture Guarantee Banner -->
        <div class="qr-privacy-banner">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div class="qr-privacy-banner-text">
            <strong>Zero Protected Health Information (PHI) Stored in QR Matrix:</strong> Each barcode strictly encodes an isolated resource identifier (e.g., <code>BED-204</code>, <code>ROOM-204</code>, <code>LINEN-1024</code>, <code>EQUIP-501</code>, <code>BIN-ICU-01</code>). Operational status, hygiene metrics, and clinical metadata are queried in real time via secure authenticated APIs.
          </div>
        </div>

        <!-- KPI Summary Deck -->
        <div class="qr-kpi-deck">
          <div class="qr-kpi-card ${this.activeFilter === 'ALL' ? 'active' : ''}" data-filter="ALL" style="--card-accent: var(--accent-cyan);">
            <div class="qr-kpi-label">Total Resources <span>⚡</span></div>
            <div class="qr-kpi-value">${counts.TOTAL}</div>
            <div class="qr-kpi-subtext">Active tagged hospital assets</div>
          </div>
          <div class="qr-kpi-card ${this.activeFilter === 'ROOM' ? 'active' : ''}" data-filter="ROOM" style="--card-accent: #0284c7;">
            <div class="qr-kpi-label">Rooms <span>🚪</span></div>
            <div class="qr-kpi-value">${counts.ROOM}</div>
            <div class="qr-kpi-subtext">OT, ICU & Isolation Suites</div>
          </div>
          <div class="qr-kpi-card ${this.activeFilter === 'BED' ? 'active' : ''}" data-filter="BED" style="--card-accent: #2563eb;">
            <div class="qr-kpi-label">Beds <span>🛏️</span></div>
            <div class="qr-kpi-value">${counts.BED}</div>
            <div class="qr-kpi-subtext">Beds & Clinical Stretchers</div>
          </div>
          <div class="qr-kpi-card ${this.activeFilter === 'LINEN' ? 'active' : ''}" data-filter="LINEN" style="--card-accent: #059669;">
            <div class="qr-kpi-label">Linen <span>🧺</span></div>
            <div class="qr-kpi-value">${counts.LINEN}</div>
            <div class="qr-kpi-subtext">Bedsheets, Gowns, Blankets</div>
          </div>
          <div class="qr-kpi-card ${this.activeFilter === 'EQUIPMENT' ? 'active' : ''}" data-filter="EQUIPMENT" style="--card-accent: #7c3aed;">
            <div class="qr-kpi-label">Equipment <span>🔬</span></div>
            <div class="qr-kpi-value">${counts.EQUIPMENT}</div>
            <div class="qr-kpi-subtext">Robots, Vents & Monitors</div>
          </div>
          <div class="qr-kpi-card ${this.activeFilter === 'WASTE_BIN' ? 'active' : ''}" data-filter="WASTE_BIN" style="--card-accent: #dc2626;">
            <div class="qr-kpi-label">Bio-Waste Bins <span>☣️</span></div>
            <div class="qr-kpi-value">${counts.WASTE_BIN}</div>
            <div class="qr-kpi-subtext">Hazardous Waste Containers</div>
          </div>
        </div>

        <!-- Interactive QR Verification / Lookup Sandbox -->
        <div class="qr-sandbox-card">
          <div class="qr-sandbox-header">
            <div class="qr-sandbox-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6"/>
              </svg>
              <span>Instant QR Code Scanner & Decoupled Lookup Sandbox</span>
            </div>
            <div class="qr-preset-chips">
              <span style="font-size: 0.72rem; color: var(--text-muted);">Quick Test Presets:</span>
              <button class="qr-preset-chip" data-code="BED-204">BED-204</button>
              <button class="qr-preset-chip" data-code="ROOM-204">ROOM-204</button>
              <button class="qr-preset-chip" data-code="LINEN-1024">LINEN-1024</button>
              <button class="qr-preset-chip" data-code="EQUIP-501">EQUIP-501</button>
              <button class="qr-preset-chip" data-code="BIN-ICU-01">BIN-ICU-01</button>
            </div>
          </div>

          <div class="qr-sandbox-input-row">
            <div class="qr-sandbox-input-wrapper">
              <svg class="qr-sandbox-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="qr-lookup-input" class="qr-sandbox-input" placeholder="Type or paste scanned QR identifier (e.g. BED-204, LINEN-1024, ROOM-204)..." />
            </div>
            <button class="btn-primary-action" id="qr-btn-do-lookup" style="padding: 0.65rem 1.25rem; background: var(--accent-cyan); color: #070b14; font-weight: 700; border-radius: var(--radius-sm); border: none; cursor: pointer; white-space: nowrap;">
              Verify & Retrieve Backend Data
            </button>
          </div>

          <div id="qr-lookup-result" class="qr-lookup-result">
            <!-- Dynamic lookup result injected here -->
          </div>
        </div>

        <!-- Filter Toolbar -->
        <div class="qr-toolbar">
          <div class="qr-tabs-group">
            <button class="qr-tab-btn ${this.activeFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">
              All Resources <span class="qr-tab-count">${counts.TOTAL}</span>
            </button>
            <button class="qr-tab-btn ${this.activeFilter === 'ROOM' ? 'active' : ''}" data-filter="ROOM">
              Rooms <span class="qr-tab-count">${counts.ROOM}</span>
            </button>
            <button class="qr-tab-btn ${this.activeFilter === 'BED' ? 'active' : ''}" data-filter="BED">
              Beds <span class="qr-tab-count">${counts.BED}</span>
            </button>
            <button class="qr-tab-btn ${this.activeFilter === 'LINEN' ? 'active' : ''}" data-filter="LINEN">
              Linen <span class="qr-tab-count">${counts.LINEN}</span>
            </button>
            <button class="qr-tab-btn ${this.activeFilter === 'EQUIPMENT' ? 'active' : ''}" data-filter="EQUIPMENT">
              Equipment <span class="qr-tab-count">${counts.EQUIPMENT}</span>
            </button>
            <button class="qr-tab-btn ${this.activeFilter === 'WASTE_BIN' ? 'active' : ''}" data-filter="WASTE_BIN">
              Waste Bins <span class="qr-tab-count">${counts.WASTE_BIN}</span>
            </button>
          </div>

          <div class="qr-filter-actions">
            <div class="qr-search-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="qr-search-box" class="qr-search-input" placeholder="Search by code, room, asset..." value="${this.escapeHtml(this.searchTerm)}" />
            </div>

            <div class="qr-view-toggle">
              <button class="qr-toggle-btn ${this.viewMode === 'GRID' ? 'active' : ''}" id="qr-view-grid" title="Clinical Sticker Card Grid">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button class="qr-toggle-btn ${this.viewMode === 'TABLE' ? 'active' : ''}" id="qr-view-table" title="Compact Data Table">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content Area: Sticker Grid or Table -->
        <div id="qr-content-area">
          ${filtered.length === 0 ? this.renderEmptyState() : (this.viewMode === 'GRID' ? this.renderGrid(filtered) : this.renderTable(filtered))}
        </div>
      </div>

      <!-- Generate Modal -->
      <div id="qr-generate-modal" class="qr-modal-backdrop">
        <div class="qr-modal-box">
          <div class="qr-modal-header">
            <div class="qr-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Generate New Resource QR Identifier
            </div>
            <button class="qr-modal-close-btn" id="qr-close-gen-modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="qr-generate-form">
            <div class="qr-modal-body">
              <div class="qr-form-group">
                <label class="qr-form-label">Resource Category</label>
                <select id="gen-resource-type" class="qr-form-select" required>
                  <option value="ROOM">Room (e.g. ROOM-305)</option>
                  <option value="BED">Bed (e.g. BED-305A)</option>
                  <option value="LINEN">Linen Asset (e.g. LINEN-2048)</option>
                  <option value="EQUIPMENT">Biomedical Equipment (e.g. EQUIP-701)</option>
                  <option value="WASTE_BIN">Bio-Hazard Waste Bin (e.g. BIN-OT-03)</option>
                </select>
              </div>

              <div class="qr-form-group">
                <label class="qr-form-label">Resource Target Selection</label>
                <select id="gen-resource-id" class="qr-form-select" required>
                  <option value="">-- Choose Target Hospital Resource --</option>
                  ${this.resources.map(r => `<option value="${r.resourceId}" data-type="${r.resourceType}">[${r.resourceType}] ${this.escapeHtml(r.resourceName)} (Current: ${r.qrCodeIdentifier || 'Unassigned'})</option>`).join('')}
                </select>
              </div>

              <div class="qr-form-group">
                <label class="qr-form-label">Custom Unique Identifier (Optional)</label>
                <input type="text" id="gen-custom-identifier" class="qr-form-input" placeholder="Leave blank to auto-generate standard format (e.g. BED-204, LINEN-1024)..." />
                <span style="font-size: 0.72rem; color: var(--text-muted);">Standard clinical prefix will automatically be formatted if omitted.</span>
              </div>
            </div>
            <div class="qr-modal-footer">
              <button type="button" class="btn-secondary-action" id="qr-cancel-gen" style="padding: 0.55rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: transparent; color: #fff; cursor: pointer;">Cancel</button>
              <button type="submit" class="btn-primary-action" style="padding: 0.55rem 1.25rem; background: var(--accent-cyan); color: #070b14; font-weight: 700; border-radius: var(--radius-sm); border: none; cursor: pointer;">Generate & Assign QR</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Regenerate Modal -->
      <div id="qr-regenerate-modal" class="qr-modal-backdrop">
        <div class="qr-modal-box">
          <div class="qr-modal-header">
            <div class="qr-modal-title" style="color: #fca5a5;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              Regenerate QR Sticker Identifier
            </div>
            <button class="qr-modal-close-btn" id="qr-close-regen-modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="qr-regenerate-form">
            <div class="qr-modal-body">
              <div style="padding: 0.85rem; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); font-size: 0.8rem; color: #fca5a5;">
                <strong>Tag Revocation Warning:</strong> Regenerating will permanently decommission the physical barcode tag currently in circulation. The old tag will immediately fail verification scans.
              </div>

              <div class="qr-form-group">
                <label class="qr-form-label">Current Identifier</label>
                <input type="text" id="regen-current-code" class="qr-form-input" style="font-family: 'JetBrains Mono', monospace; font-weight: 700;" readonly />
              </div>

              <div class="qr-form-group">
                <label class="qr-form-label">Target Resource Name</label>
                <input type="text" id="regen-resource-name" class="qr-form-input" readonly />
              </div>

              <div class="qr-form-group">
                <label class="qr-form-label">Reason for Tag Regeneration</label>
                <select id="regen-reason-select" class="qr-form-select" required>
                  <option value="Physical label damaged / scratched">Physical label damaged / scratched</option>
                  <option value="Thermal autoclave wash abrasion">Thermal autoclave wash abrasion</option>
                  <option value="Physical barcode sticker lost">Physical barcode sticker lost</option>
                  <option value="Routine security cycle replacement">Routine security cycle replacement</option>
                  <option value="Relocated / re-commissioned resource">Relocated / re-commissioned resource</option>
                </select>
              </div>
            </div>
            <div class="qr-modal-footer">
              <button type="button" class="btn-secondary-action" id="qr-cancel-regen" style="padding: 0.55rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: transparent; color: #fff; cursor: pointer;">Cancel</button>
              <button type="submit" class="btn-primary-action" style="padding: 0.55rem 1.25rem; background: #ef4444; color: #fff; font-weight: 700; border-radius: var(--radius-sm); border: none; cursor: pointer;">Revoke Old & Generate New Tag</button>
            </div>
          </form>
        </div>
      </div>

      <!-- View / Print Asset Badge Modal -->
      <div id="qr-view-modal" class="qr-modal-backdrop">
        <div class="qr-modal-box" style="max-width: 480px;">
          <div class="qr-modal-header">
            <div class="qr-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Clinical Asset Badge Preview
            </div>
            <button class="qr-modal-close-btn" id="qr-close-view-modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="qr-modal-body" style="align-items: center;">
            <div id="qr-modal-badge-holder" class="qr-modal-badge-container">
              <!-- Printable Badge Preview Rendered Here -->
            </div>
            <div id="qr-modal-specs" style="width: 100%; font-size: 0.8rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.35rem; background: rgba(15, 23, 42, 0.7); padding: 0.85rem; border-radius: var(--radius-sm);">
              <!-- Resource specs -->
            </div>
          </div>
          <div class="qr-modal-footer" style="justify-content: space-between;">
            <div style="font-size: 0.72rem; color: var(--text-muted);">Format: 2" x 2" Clinical Sticker</div>
            <div style="display: flex; gap: 0.5rem;">
              <button type="button" id="qr-btn-modal-download" class="btn-secondary-action" style="padding: 0.55rem 0.95rem; background: rgba(255, 255, 255, 0.08); color: #fff; font-size: 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); cursor: pointer;">
                Download PNG
              </button>
              <button type="button" id="qr-btn-modal-print" class="btn-primary-action" style="padding: 0.55rem 1.15rem; background: var(--accent-cyan); color: #070b14; font-size: 0.8rem; font-weight: 700; border-radius: var(--radius-sm); border: none; cursor: pointer;">
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
    this.renderQrCodes();
  }

  renderEmptyState() {
    return `
      <div style="padding: 4rem 2rem; text-align: center; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 1rem;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 style="font-size: 1.15rem; font-weight: 600; color: #fff;">No Matching Hospital Resources Found</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem;">Try adjusting your search criteria or switch to another resource category tab.</p>
      </div>
    `;
  }

  // ==========================================================================
  // STICKER GRID PRESENTATION
  // ==========================================================================

  renderGrid(items) {
    return `
      <div class="qr-sticker-grid">
        ${items.map(r => this.renderStickerCard(r)).join('')}
      </div>
    `;
  }

  renderStickerCard(r) {
    const catClass = `badge-cat-${r.resourceType.toLowerCase()}`;
    const statusClass = `qr-status-${(r.status || 'active').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    return `
      <div class="qr-sticker-card" data-code="${this.escapeHtml(r.qrCodeIdentifier)}">
        <!-- Clinical Sticker Badge Core -->
        <div class="clinical-badge-preview">
          <div class="clinical-badge-header">
            <div class="clinical-badge-org">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/></svg>
              SMART HYGIENE
            </div>
            <div class="clinical-badge-category-pill ${catClass}">
              ${this.escapeHtml(r.resourceType)}
            </div>
          </div>

          <!-- Dynamic QR Container -->
          <div class="clinical-badge-qr-box" id="qr-box-${this.escapeHtml(r.qrCodeIdentifier)}">
            <!-- Rendered by HospitalQrEngine -->
          </div>

          <div class="clinical-badge-code">
            ${this.escapeHtml(r.qrCodeIdentifier)}
          </div>

          <div class="clinical-badge-footer">
            <span>SECURE ASSET TAG</span>
            <span>ZERO-PHI ENCRYPTED</span>
          </div>
        </div>

        <!-- Metadata & Actions -->
        <div class="qr-sticker-meta">
          <div class="qr-sticker-name" title="${this.escapeHtml(r.resourceName)}">
            ${this.escapeHtml(r.resourceName)}
          </div>
          <div class="qr-sticker-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${this.escapeHtml(r.location || 'General Ward')}
          </div>
          <div class="qr-sticker-status-row">
            <span class="qr-status-pill ${statusClass}">${this.escapeHtml(r.status || 'ACTIVE')}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${r.subType || ''}</span>
          </div>
        </div>

        <div class="qr-sticker-actions">
          <button class="qr-card-btn primary" data-action="view" data-code="${this.escapeHtml(r.qrCodeIdentifier)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            View
          </button>
          <button class="qr-card-btn" data-action="download" data-code="${this.escapeHtml(r.qrCodeIdentifier)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            PNG
          </button>
          <button class="qr-card-btn" data-action="print" data-code="${this.escapeHtml(r.qrCodeIdentifier)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button class="qr-card-btn regen" data-action="regen" data-code="${this.escapeHtml(r.qrCodeIdentifier)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Regenerate QR Tag
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TABULAR DATA PRESENTATION
  // ==========================================================================

  renderTable(items) {
    return `
      <div class="qr-table-container">
        <table class="qr-data-table">
          <thead>
            <tr>
              <th style="width: 60px;">Barcode</th>
              <th>Identifier</th>
              <th>Resource Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Operational Status</th>
              <th>Sub-Type / Specs</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(r => {
              const statusClass = `qr-status-${(r.status || 'active').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
              return `
                <tr data-code="${this.escapeHtml(r.qrCodeIdentifier)}">
                  <td>
                    <div class="qr-table-thumb" id="qr-box-${this.escapeHtml(r.qrCodeIdentifier)}">
                      <!-- Rendered by HospitalQrEngine -->
                    </div>
                  </td>
                  <td>
                    <span class="qr-code-pill">${this.escapeHtml(r.qrCodeIdentifier)}</span>
                  </td>
                  <td style="font-weight: 600;">
                    ${this.escapeHtml(r.resourceName)}
                  </td>
                  <td>
                    <span class="clinical-badge-category-pill badge-cat-${r.resourceType.toLowerCase()}">
                      ${this.escapeHtml(r.resourceType)}
                    </span>
                  </td>
                  <td style="color: var(--text-muted);">
                    ${this.escapeHtml(r.location || 'General')}
                  </td>
                  <td>
                    <span class="qr-status-pill ${statusClass}">${this.escapeHtml(r.status || 'ACTIVE')}</span>
                  </td>
                  <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--text-muted);">
                    ${this.escapeHtml(r.subType || '-')}
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      <button class="qr-card-btn primary" data-action="view" data-code="${this.escapeHtml(r.qrCodeIdentifier)}" title="View Badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </button>
                      <button class="qr-card-btn" data-action="download" data-code="${this.escapeHtml(r.qrCodeIdentifier)}" title="Download PNG">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <button class="qr-card-btn" data-action="print" data-code="${this.escapeHtml(r.qrCodeIdentifier)}" title="Print Sticker">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      </button>
                      <button class="qr-card-btn regen" data-action="regen" data-code="${this.escapeHtml(r.qrCodeIdentifier)}" title="Regenerate Tag">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================================================
  // QR MATRIX RENDERING VIA HospitalQrEngine
  // ==========================================================================

  renderQrCodes() {
    this.resources.forEach(r => {
      const box = document.getElementById(`qr-box-${r.qrCodeIdentifier}`);
      if (box && window.HospitalQrEngine) {
        box.innerHTML = '';
        const size = this.viewMode === 'GRID' ? 148 : 38;
        const svg = window.HospitalQrEngine.createQrSvg(r.qrCodeIdentifier, { size });
        box.appendChild(svg);
      }
    });
  }

  // ==========================================================================
  // EVENT LISTENERS & ACTIONS
  // ==========================================================================

  attachEvents() {
    // KPI Cards & Filter Tabs
    this.container.querySelectorAll('[data-filter]').forEach(el => {
      el.addEventListener('click', () => {
        this.activeFilter = el.dataset.filter;
        this.render();
      });
    });

    // Search Box
    const searchBox = document.getElementById('qr-search-box');
    if (searchBox) {
      searchBox.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        const filtered = this.resources.filter(r => {
          const matchType = this.activeFilter === 'ALL' || r.resourceType === this.activeFilter;
          const search = this.searchTerm.toLowerCase().trim();
          const matchSearch = !search ||
            (r.qrCodeIdentifier && r.qrCodeIdentifier.toLowerCase().includes(search)) ||
            (r.resourceName && r.resourceName.toLowerCase().includes(search)) ||
            (r.location && r.location.toLowerCase().includes(search)) ||
            (r.status && r.status.toLowerCase().includes(search));
          return matchType && matchSearch;
        });

        const content = document.getElementById('qr-content-area');
        if (content) {
          content.innerHTML = filtered.length === 0 ? this.renderEmptyState() : (this.viewMode === 'GRID' ? this.renderGrid(filtered) : this.renderTable(filtered));
          this.renderQrCodes();
        }
      });
    }

    // View Mode Toggles
    const btnGrid = document.getElementById('qr-view-grid');
    const btnTable = document.getElementById('qr-view-table');
    if (btnGrid) {
      btnGrid.addEventListener('click', () => {
        this.viewMode = 'GRID';
        this.render();
      });
    }
    if (btnTable) {
      btnTable.addEventListener('click', () => {
        this.viewMode = 'TABLE';
        this.render();
      });
    }

    // Action Buttons in Grid/Table via Event Delegation
    const contentArea = document.getElementById('qr-content-area');
    if (contentArea) {
      contentArea.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const code = btn.dataset.code;
        const resource = this.resources.find(r => r.qrCodeIdentifier === code);
        if (!resource) return;

        if (action === 'view') this.openViewModal(resource);
        if (action === 'download') this.handleDownload(resource);
        if (action === 'print') this.handlePrint(resource);
        if (action === 'regen') this.openRegenerateModal(resource);
      });
    }

    // Interactive Lookup Sandbox
    const lookupInput = document.getElementById('qr-lookup-input');
    const btnLookup = document.getElementById('qr-btn-do-lookup');
    if (btnLookup && lookupInput) {
      btnLookup.addEventListener('click', () => this.handleLookupSandbox(lookupInput.value.trim()));
      lookupInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleLookupSandbox(lookupInput.value.trim());
      });
    }

    // Quick Test Preset Chips
    this.container.querySelectorAll('.qr-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const code = chip.dataset.code;
        if (lookupInput) lookupInput.value = code;
        this.handleLookupSandbox(code);
      });
    });

    // Generate Modal Triggers
    const btnGen = document.getElementById('qr-btn-generate');
    const modalGen = document.getElementById('qr-generate-modal');
    const closeGen = document.getElementById('qr-close-gen-modal');
    const cancelGen = document.getElementById('qr-cancel-gen');
    const formGen = document.getElementById('qr-generate-form');

    if (btnGen) btnGen.addEventListener('click', () => this.openGenerateModal());
    if (closeGen) closeGen.addEventListener('click', () => modalGen.classList.remove('active'));
    if (cancelGen) cancelGen.addEventListener('click', () => modalGen.classList.remove('active'));
    if (formGen) formGen.addEventListener('submit', (e) => this.handleGenerateSubmit(e));

    // Dynamic Filter for Target Selection in Generate Modal
    const genTypeSelect = document.getElementById('gen-resource-type');
    const genTargetSelect = document.getElementById('gen-resource-id');
    if (genTypeSelect && genTargetSelect) {
      genTypeSelect.addEventListener('change', () => {
        const selectedType = genTypeSelect.value;
        Array.from(genTargetSelect.options).forEach(opt => {
          if (!opt.value) return;
          opt.style.display = opt.dataset.type === selectedType ? '' : 'none';
        });
      });
    }

    // Regenerate Modal Triggers
    const modalRegen = document.getElementById('qr-regenerate-modal');
    const closeRegen = document.getElementById('qr-close-regen-modal');
    const cancelRegen = document.getElementById('qr-cancel-regen');
    const formRegen = document.getElementById('qr-regenerate-form');

    if (closeRegen) closeRegen.addEventListener('click', () => modalRegen.classList.remove('active'));
    if (cancelRegen) cancelRegen.addEventListener('click', () => modalRegen.classList.remove('active'));
    if (formRegen) formRegen.addEventListener('submit', (e) => this.handleRegenerateSubmit(e));

    // View Modal Triggers
    const modalView = document.getElementById('qr-view-modal');
    const closeView = document.getElementById('qr-close-view-modal');
    const btnModalDownload = document.getElementById('qr-btn-modal-download');
    const btnModalPrint = document.getElementById('qr-btn-modal-print');

    if (closeView) closeView.addEventListener('click', () => modalView.classList.remove('active'));
    if (btnModalDownload) btnModalDownload.addEventListener('click', () => this.handleDownload(this.activeResource));
    if (btnModalPrint) btnModalPrint.addEventListener('click', () => this.handlePrint(this.activeResource));

    // Batch Print
    const btnBatchPrint = document.getElementById('qr-btn-batch-print');
    if (btnBatchPrint) btnBatchPrint.addEventListener('click', () => this.handleBatchPrint());
  }

  // ==========================================================================
  // SECURE DECOUPLED LOOKUP SANDBOX
  // ==========================================================================

  async handleLookupSandbox(code) {
    if (!code) {
      this.showToast('Please enter a QR code identifier (e.g. BED-204, LINEN-1024)', 'warning');
      return;
    }

    const resultBox = document.getElementById('qr-lookup-result');
    if (!resultBox) return;

    resultBox.style.display = 'block';
    resultBox.classList.add('active');
    resultBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--accent-cyan); font-size: 0.85rem;">
        <div class="spinner" style="width: 16px; height: 16px; border: 2px solid rgba(6, 182, 212, 0.3); border-top-color: var(--accent-cyan); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        Querying secure hospital backend for identifier [${this.escapeHtml(code)}]...
      </div>
    `;

    try {
      const data = await this.apiRequest(`/qr/lookup/${encodeURIComponent(code)}`);

      let detailsHtml = '';
      if (data.details) {
        detailsHtml = Object.entries(data.details).map(([k, v]) => `
          <div class="qr-lookup-item">
            <span class="qr-lookup-item-label">${this.escapeHtml(k.replace(/([A-Z])/g, ' $1'))}</span>
            <span class="qr-lookup-item-val" style="color: #6ee7b7;">${this.escapeHtml(String(v))}</span>
          </div>
        `).join('');
      }

      resultBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(6, 182, 212, 0.25); padding-bottom: 0.65rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="clinical-badge-category-pill badge-cat-${data.resourceType.toLowerCase()}">${this.escapeHtml(data.resourceType)}</span>
            <strong style="color: #fff; font-size: 1.05rem;">${this.escapeHtml(data.resourceName)}</strong>
            <span class="qr-code-pill" style="border-color: var(--accent-cyan); color: var(--accent-cyan);">${this.escapeHtml(data.qrCodeIdentifier)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; color: #34d399;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            Authenticated Identity Verified (Zero-PHI)
          </div>
        </div>

        <div class="qr-lookup-grid">
          <div class="qr-lookup-item">
            <span class="qr-lookup-item-label">Current Location</span>
            <span class="qr-lookup-item-val">${this.escapeHtml(data.location || 'Unknown')}</span>
          </div>
          <div class="qr-lookup-item">
            <span class="qr-lookup-item-label">Operational Status</span>
            <span class="qr-lookup-item-val" style="color: var(--accent-cyan);">${this.escapeHtml(data.status || 'ACTIVE')}</span>
          </div>
          <div class="qr-lookup-item">
            <span class="qr-lookup-item-label">Sub-Type / Specs</span>
            <span class="qr-lookup-item-val">${this.escapeHtml(data.subType || 'N/A')}</span>
          </div>
          <div class="qr-lookup-item">
            <span class="qr-lookup-item-label">Last Activity / Audit</span>
            <span class="qr-lookup-item-val">${this.escapeHtml(data.lastActivityDate || 'Recent')}</span>
          </div>
          ${detailsHtml}
        </div>
      `;
    } catch (err) {
      resultBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; color: #f87171; font-size: 0.85rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Resource lookup failed for [${this.escapeHtml(code)}]: ${this.escapeHtml(err.message)}
        </div>
      `;
    }
  }

  // ==========================================================================
  // VIEW, DOWNLOAD & PRINT WORKFLOWS
  // ==========================================================================

  openViewModal(resource) {
    this.activeResource = resource;
    const modal = document.getElementById('qr-view-modal');
    const badgeHolder = document.getElementById('qr-modal-badge-holder');
    const specsHolder = document.getElementById('qr-modal-specs');
    if (!modal || !badgeHolder) return;

    badgeHolder.innerHTML = '';
    const badgeCanvas = window.HospitalQrEngine.createPrintableBadgeCanvas(resource.qrCodeIdentifier, {
      category: resource.resourceType,
      title: resource.resourceName,
      location: resource.location || 'Hospital Ward',
      scale: 2
    });
    badgeCanvas.style.maxWidth = '260px';
    badgeCanvas.style.height = 'auto';
    badgeCanvas.style.border = '2px solid #0f172a';
    badgeCanvas.style.borderRadius = '6px';
    badgeCanvas.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4)';
    badgeHolder.appendChild(badgeCanvas);

    if (specsHolder) {
      specsHolder.innerHTML = `
        <div><strong>Resource:</strong> ${this.escapeHtml(resource.resourceName)}</div>
        <div><strong>Type:</strong> ${this.escapeHtml(resource.resourceType)} (${this.escapeHtml(resource.subType || '')})</div>
        <div><strong>Location:</strong> ${this.escapeHtml(resource.location || 'Hospital')}</div>
        <div><strong>Current Status:</strong> ${this.escapeHtml(resource.status || 'ACTIVE')}</div>
        <div><strong>Tag Format:</strong> High-Contrast Vinyl Sticker (Clinical 2x2")</div>
      `;
    }

    modal.classList.add('active');
  }

  handleDownload(resource) {
    if (!resource || !window.HospitalQrEngine) return;
    window.HospitalQrEngine.downloadBadge(resource.qrCodeIdentifier, {
      category: resource.resourceType,
      title: resource.resourceName,
      location: resource.location || 'Hospital Asset',
      scale: 3
    });
    this.showToast(`Downloaded asset sticker badge for ${resource.qrCodeIdentifier}`, 'success');
  }

  handlePrint(resource) {
    if (!resource || !window.HospitalQrEngine) return;

    // Create a temporary hidden print frame
    const printBadge = window.HospitalQrEngine.createPrintableBadgeCanvas(resource.qrCodeIdentifier, {
      category: resource.resourceType,
      title: resource.resourceName,
      location: resource.location || 'Hospital Asset',
      scale: 2
    });

    const printContainer = document.createElement('div');
    printContainer.className = 'print-target-badge';
    printContainer.style.display = 'flex';
    printContainer.style.flexDirection = 'column';
    printContainer.style.alignItems = 'center';
    printContainer.style.justifyContent = 'center';
    printContainer.appendChild(printBadge);

    document.body.appendChild(printContainer);
    window.print();
    setTimeout(() => {
      document.body.removeChild(printContainer);
    }, 1000);
  }

  handleBatchPrint() {
    window.print();
  }

  // ==========================================================================
  // GENERATE & REGENERATE WORKFLOWS
  // ==========================================================================

  openGenerateModal() {
    const modal = document.getElementById('qr-generate-modal');
    if (modal) modal.classList.add('active');
  }

  async handleGenerateSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('gen-resource-type').value;
    const targetId = document.getElementById('gen-resource-id').value;
    const customId = document.getElementById('gen-custom-identifier').value.trim();

    if (!targetId) {
      this.showToast('Please select a target resource', 'warning');
      return;
    }

    try {
      const payload = {
        resourceType: type,
        resourceId: parseInt(targetId, 10),
        customQrCodeIdentifier: customId || null
      };

      const result = await this.apiRequest('/qr/generate', 'POST', payload);
      this.showToast(`Generated & assigned identifier ${result.qrCodeIdentifier}!`, 'success');
      document.getElementById('qr-generate-modal').classList.remove('active');
      await this.loadResources();
    } catch (err) {
      this.showToast(`Generation failed: ${err.message}`, 'error');
    }
  }

  openRegenerateModal(resource) {
    this.activeResource = resource;
    const modal = document.getElementById('qr-regenerate-modal');
    const inputCurrent = document.getElementById('regen-current-code');
    const inputName = document.getElementById('regen-resource-name');
    if (!modal) return;

    if (inputCurrent) inputCurrent.value = resource.qrCodeIdentifier;
    if (inputName) inputName.value = resource.resourceName;
    modal.classList.add('active');
  }

  async handleRegenerateSubmit(e) {
    e.preventDefault();
    if (!this.activeResource) return;

    const reason = document.getElementById('regen-reason-select').value;
    const oldCode = this.activeResource.qrCodeIdentifier;

    try {
      const payload = {
        resourceType: this.activeResource.resourceType,
        resourceId: this.activeResource.resourceId,
        reason: reason
      };

      const result = await this.apiRequest('/qr/regenerate', 'PUT', payload);
      this.showToast(`Regenerated QR: Old [${oldCode}] revoked -> New [${result.qrCodeIdentifier}] active!`, 'success');
      document.getElementById('qr-regenerate-modal').classList.remove('active');
      await this.loadResources();
    } catch (err) {
      this.showToast(`Regeneration failed: ${err.message}`, 'error');
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
      console.log(`[Toast ${type}]`, message);
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.25rem;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : 'var(--accent-cyan)'};
      color: ${type === 'info' ? '#070b14' : '#fff'};
      font-weight: 600;
      font-size: 0.82rem;
      border-radius: var(--radius-sm);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      margin-bottom: 0.5rem;
      animation: qrFadeIn 0.2s ease-out;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => container.removeChild(toast), 300);
    }, 4000);
  }
}

// Global exposure
window.HospitalQrManager = HospitalQrManager;
