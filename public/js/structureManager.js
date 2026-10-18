// ==========================================================================
// SMART HOSPITAL HYGIENE & RESOURCE INTELLIGENCE PLATFORM
// Hospital Structure Management Controller
// Level Hierarchy: Hospitals -> Buildings -> Floors -> Wards -> Rooms -> Beds
// Connects to Spring Boot REST APIs with JWT Authentication
// ==========================================================================

class HospitalStructureManager {
  constructor(containerId = 'structure-management-container') {
    this.containerId = containerId;
    this.container = null;

    // API Config: uses same-origin proxy or direct backend URL
    this.apiBaseUrl = window.location.port === '3000' ? '/api' : 'http://localhost:8080/api';
    this.jwtTokenKey = 'sh_jwt_token';
    this.currentUserKey = 'sh_current_user';
    this.token = localStorage.getItem(this.jwtTokenKey) || '';
    this.currentUser = null;

    // Active Entity View: 'hospitals' | 'buildings' | 'floors' | 'wards' | 'rooms' | 'beds' | 'tree'
    this.activeTab = 'hospitals';

    // Drilldown Breadcrumb Context
    this.breadcrumbs = [
      { id: 'root', label: 'All Hospitals', tab: 'hospitals' }
    ];

    // Data Caches
    this.data = {
      hospitals: [],
      buildings: [],
      floors: [],
      wards: [],
      rooms: [],
      beds: [],
      tree: null
    };

    // Filter & Search States
    this.filters = {
      search: '',
      status: '',
      hospitalId: '',
      buildingId: '',
      floorId: '',
      wardId: '',
      roomId: '',
      wardType: '',
      roomType: '',
      airflowType: '',
      readinessStatus: '',
      bedType: '',
      operationalStatus: ''
    };

    // UI States
    this.loading = false;
    this.error = null;

    // Enums Reference
    this.enums = {
      wardTypes: ['ICU', 'NICU', 'OPERATION_THEATRE', 'EMERGENCY_TRAUMA', 'GENERAL_WARD', 'ISOLATION', 'LABORATORY', 'PEDIATRIC'],
      roomTypes: ['PATIENT_ROOM', 'SURGICAL_SUITE', 'ISOLATION_ROOM', 'SCRUB_STATION', 'NURSE_STATION', 'DECONTAMINATION_BAY', 'STORAGE'],
      airflowTypes: ['STANDARD_LAMINAR', 'POSITIVE_PRESSURE', 'NEGATIVE_PRESSURE', 'NATURAL'],
      readinessStatuses: ['READY_FOR_USE', 'OCCUPIED', 'DIRTY_PENDING_CLEAN', 'DISINFECTION_IN_PROGRESS', 'MAINTENANCE_REQUIRED'],
      bedTypes: ['ICU_ELECTRIC', 'ISOLATION_NEGATIVE', 'STANDARD_INPATIENT', 'NEONATAL_INCUBATOR', 'EMERGENCY_TROLLEY'],
      operationalStatuses: ['VACANT_CLEAN', 'OCCUPIED', 'DIRTY_PENDING_STRIP', 'MAINTENANCE_OUT_OF_SERVICE', 'AVAILABLE_STERILE', 'IN_USE', 'DIRTY_DECONTAMINATION_REQUIRED', 'UNDER_MAINTENANCE']
    };

    this.init();
  }

  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Structure container #${this.containerId} not found yet.`);
      return;
    }

    // Try loading saved user
    const savedUser = localStorage.getItem(this.currentUserKey);
    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) {}
    }

    // Ensure valid auth session
    await this.ensureAuthenticated();

    // Render baseline layout
    this.render();

    // Load initial tab data
    await this.loadCurrentTabData();

    // Pre-populate parent cache for selectors
    this.preloadParentCaches();
  }

  // ==========================================================================
  // Authentication & API Client
  // ==========================================================================

  async ensureAuthenticated() {
    if (this.token) {
      return true;
    }

    try {
      console.log('Authenticating with backend default admin credentials...');
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@hospital.com',
          password: 'Admin@123456'
        })
      });

      if (!response.ok) {
        throw new Error(`Auth failed with HTTP ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data && resJson.data.token) {
        this.token = resJson.data.token;
        this.currentUser = resJson.data;
        localStorage.setItem(this.jwtTokenKey, this.token);
        localStorage.setItem(this.currentUserKey, JSON.stringify(this.currentUser));
        console.log('Logged in successfully as:', this.currentUser.email, 'Role:', this.currentUser.role);
        return true;
      }
    } catch (err) {
      console.error('Auto-login error:', err);
      this.error = `Authentication failed: ${err.message}. Ensure backend is running.`;
      return false;
    }
    return false;
  }

  async apiRequest(endpoint, method = 'GET', body = null) {
    if (!this.token) {
      await this.ensureAuthenticated();
    }

    const headers = {
      'Accept': 'application/json'
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.apiBaseUrl}${endpoint}`;
    let response;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (networkErr) {
      throw new Error(`Network error connecting to backend (${url}): ${networkErr.message}`);
    }

    // Handle token expiration
    if (response.status === 401) {
      console.warn('JWT token expired or unauthorized. Refreshing session...');
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

    let result;
    try {
      result = await response.json();
    } catch (e) {
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      return null;
    }

    if (!response.ok) {
      const errMessage = result.message || (result.errors && result.errors.join(', ')) || `HTTP ${response.status}`;
      throw new Error(errMessage);
    }

    return result.data !== undefined ? result.data : result;
  }

  async preloadParentCaches() {
    try {
      const [hospitals, buildings, floors, wards] = await Promise.all([
        this.apiRequest('/hospitals'),
        this.apiRequest('/buildings'),
        this.apiRequest('/floors'),
        this.apiRequest('/wards')
      ]);
      this.data.hospitals = hospitals || [];
      this.data.buildings = buildings || [];
      this.data.floors = floors || [];
      this.data.wards = wards || [];
    } catch (e) {
      console.warn('Preload parent caches warning:', e.message);
    }
  }

  // ==========================================================================
  // Data Fetching Methods (Actual Backend APIs)
  // ==========================================================================

  async loadCurrentTabData() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      switch (this.activeTab) {
        case 'hospitals':
          await this.loadHospitals();
          break;
        case 'buildings':
          await this.loadBuildings();
          break;
        case 'floors':
          await this.loadFloors();
          break;
        case 'wards':
          await this.loadWards();
          break;
        case 'rooms':
          await this.loadRooms();
          break;
        case 'beds':
          await this.loadBeds();
          break;
        case 'tree':
          await this.loadTree();
          break;
      }
    } catch (err) {
      console.error(`Error loading ${this.activeTab}:`, err);
      this.error = err.message || `Failed to load ${this.activeTab} from backend.`;
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async loadHospitals() {
    let endpoint = '/hospitals';
    const params = new URLSearchParams();
    if (this.filters.search) params.append('keyword', this.filters.search);
    if (this.filters.status) params.append('status', this.filters.status);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const list = await this.apiRequest(endpoint);
    this.data.hospitals = list || [];
  }

  async loadBuildings() {
    let endpoint = '/buildings';
    const params = new URLSearchParams();
    if (this.filters.hospitalId) params.append('hospitalId', this.filters.hospitalId);
    if (this.filters.search) params.append('keyword', this.filters.search);
    if (this.filters.status) params.append('status', this.filters.status);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const list = await this.apiRequest(endpoint);
    this.data.buildings = list || [];
  }

  async loadFloors() {
    let endpoint = '/floors';
    const params = new URLSearchParams();
    if (this.filters.buildingId) params.append('buildingId', this.filters.buildingId);
    if (this.filters.status) params.append('status', this.filters.status);
    if (params.toString()) endpoint += `?${params.toString()}`;

    let list = await this.apiRequest(endpoint);
    list = list || [];

    // Client-side search if keyword provided
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      list = list.filter(f => 
        (f.floorCode && f.floorCode.toLowerCase().includes(q)) ||
        (f.floorName && f.floorName.toLowerCase().includes(q)) ||
        (f.buildingName && f.buildingName.toLowerCase().includes(q))
      );
    }
    this.data.floors = list;
  }

  async loadWards() {
    let endpoint = '/wards';
    const params = new URLSearchParams();
    if (this.filters.floorId) params.append('floorId', this.filters.floorId);
    if (this.filters.wardType) params.append('wardType', this.filters.wardType);
    if (this.filters.status) params.append('status', this.filters.status);
    if (this.filters.search) params.append('keyword', this.filters.search);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const list = await this.apiRequest(endpoint);
    this.data.wards = list || [];
  }

  async loadRooms() {
    let endpoint = '/rooms';
    const params = new URLSearchParams();
    if (this.filters.wardId) params.append('wardId', this.filters.wardId);
    if (this.filters.roomType) params.append('roomType', this.filters.roomType);
    if (this.filters.airflowType) params.append('airflowType', this.filters.airflowType);
    if (this.filters.readinessStatus) params.append('readinessStatus', this.filters.readinessStatus);
    if (this.filters.search) params.append('keyword', this.filters.search);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const list = await this.apiRequest(endpoint);
    this.data.rooms = list || [];
  }

  async loadBeds() {
    let endpoint = '/beds';
    const params = new URLSearchParams();
    if (this.filters.roomId) params.append('roomId', this.filters.roomId);
    if (this.filters.wardId) params.append('wardId', this.filters.wardId);
    if (this.filters.bedType) params.append('bedType', this.filters.bedType);
    if (this.filters.operationalStatus) params.append('operationalStatus', this.filters.operationalStatus);
    if (this.filters.search) params.append('keyword', this.filters.search);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const list = await this.apiRequest(endpoint);
    this.data.beds = list || [];
  }

  async loadTree() {
    if (this.data.hospitals.length === 0) {
      await this.loadHospitals();
    }
    const targetHospitalId = this.filters.hospitalId || (this.data.hospitals[0] ? this.data.hospitals[0].hospitalId : null);
    if (targetHospitalId) {
      this.data.tree = await this.apiRequest(`/hospitals/${targetHospitalId}/tree`);
    } else {
      this.data.tree = null;
    }
  }

  // ==========================================================================
  // Tab & Breadcrumb Navigation
  // ==========================================================================

  switchTab(tabId) {
    this.activeTab = tabId;
    this.filters.search = '';
    // Preserve hierarchical filter if moving to a child tab
    this.loadCurrentTabData();
  }

  drillDown(tabId, filterKey, filterValue, label) {
    this.activeTab = tabId;
    this.filters[filterKey] = filterValue;
    this.breadcrumbs.push({ id: `${filterKey}-${filterValue}`, label, tab: tabId, filterKey, filterValue });
    this.loadCurrentTabData();
  }

  navigateBreadcrumb(index) {
    const target = this.breadcrumbs[index];
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
    this.activeTab = target.tab;

    // Reset filters after target
    if (index === 0) {
      this.filters.hospitalId = '';
      this.filters.buildingId = '';
      this.filters.floorId = '';
      this.filters.wardId = '';
      this.filters.roomId = '';
    }
    this.loadCurrentTabData();
  }

  // ==========================================================================
  // Render Main Layout
  // ==========================================================================

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="structure-container">
        <!-- Structure Top Bar -->
        <div class="structure-top-bar">
          <div class="structure-title-area">
            <div class="structure-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                <line x1="9" y1="22" x2="9" y2="22.01"/>
                <line x1="15" y1="22" x2="15" y2="22.01"/>
                <line x1="9" y1="6" x2="9" y2="6.01"/>
                <line x1="15" y1="6" x2="15" y2="6.01"/>
                <line x1="9" y1="10" x2="9" y2="10.01"/>
                <line x1="15" y1="10" x2="15" y2="10.01"/>
                <line x1="9" y1="14" x2="9" y2="14.01"/>
                <line x1="15" y1="14" x2="15" y2="14.01"/>
                <line x1="9" y1="18" x2="9" y2="18.01"/>
                <line x1="15" y1="18" x2="15" y2="18.01"/>
              </svg>
            </div>
            <div class="structure-title-text">
              <h2>Hospital Structure & Facility Hierarchy</h2>
              <p>Relational Multi-Tier Clinical Operations: Hospital &rarr; Building &rarr; Floor &rarr; Ward &rarr; Room &rarr; Bed</p>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="api-auth-pill ${this.token ? '' : 'offline'}">
              <span class="api-pulse-dot"></span>
              <span>${this.token ? `Connected (Admin: ${this.currentUser?.email || 'admin@hospital.com'})` : 'Connecting Backend...'}</span>
            </div>
            <button class="btn-secondary-action" onclick="window.structureManager.openTreeModal()" title="View Complete Structure Tree">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="6" y1="3" x2="6" y2="15"/>
                <circle cx="18" cy="6" r="3"/>
                <circle cx="6" cy="18" r="3"/>
                <path d="M18 9a9 9 0 0 1-9 9"/>
              </svg>
              Hierarchy Tree
            </button>
          </div>
        </div>

        <!-- Hierarchy Navigation Tabs -->
        <nav class="hierarchy-nav-tabs" aria-label="Hierarchy Level Selector">
          ${this.renderTabBtn('hospitals', '1. Hospitals', this.data.hospitals.length)}
          ${this.renderTabBtn('buildings', '2. Buildings', this.data.buildings.length)}
          ${this.renderTabBtn('floors', '3. Floors', this.data.floors.length)}
          ${this.renderTabBtn('wards', '4. Wards', this.data.wards.length)}
          ${this.renderTabBtn('rooms', '5. Rooms', this.data.rooms.length)}
          ${this.renderTabBtn('beds', '6. Beds', this.data.beds.length)}
        </nav>

        <!-- Breadcrumbs Trail -->
        ${this.renderBreadcrumbs()}

        <!-- Search & Filter Toolbar -->
        ${this.renderToolbar()}

        <!-- Main Content Area: Loading, Error, Empty, or Table -->
        ${this.renderContent()}
      </div>

      <!-- Modal Injection Target -->
      <div id="structure-modal-root"></div>
    `;

    this.bindEvents();
  }

  renderTabBtn(tabId, label, count) {
    const isActive = this.activeTab === tabId;
    return `
      <button class="hierarchy-tab-btn ${isActive ? 'active' : ''}" onclick="window.structureManager.switchTab('${tabId}')">
        <span>${label}</span>
        <span class="tab-count-badge">${count}</span>
      </button>
    `;
  }

  renderBreadcrumbs() {
    return `
      <div class="structure-breadcrumbs">
        <span style="font-weight: 600; color: var(--text-dim); display: flex; align-items: center; gap: 0.3rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Drilldown:
        </span>
        ${this.breadcrumbs.map((b, i) => `
          <span class="breadcrumb-item ${i === this.breadcrumbs.length - 1 ? 'active' : ''}" onclick="window.structureManager.navigateBreadcrumb(${i})">
            ${b.label}
          </span>
          ${i < this.breadcrumbs.length - 1 ? '<span class="breadcrumb-sep">&gt;</span>' : ''}
        `).join('')}
      </div>
    `;
  }

  renderToolbar() {
    const entityLabel = this.activeTab.slice(0, -1);
    const capitalized = entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1);

    return `
      <div class="structure-toolbar">
        <div class="toolbar-search-filter-group">
          <!-- Search Box -->
          <div class="search-box-wrapper">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Search ${this.activeTab}..." 
              value="${this.filters.search}" 
              id="structure-search-input"
            />
          </div>

          <!-- Dynamic Level Filters -->
          ${this.renderDynamicFilters()}

          <!-- Reset Filter Button -->
          <button class="btn-reset-filters" onclick="window.structureManager.resetFilters()">
            Reset
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="btn-secondary-action" onclick="window.structureManager.loadCurrentTabData()" title="Refresh Data">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Refresh
          </button>
          <button class="btn-primary-action" onclick="window.structureManager.openCreateModal('${this.activeTab}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            + New ${capitalized}
          </button>
        </div>
      </div>
    `;
  }

  renderDynamicFilters() {
    let html = '';

    // Status filter (applicable to all entities)
    html += `
      <select class="filter-select" id="filter-status">
        <option value="">Status: All</option>
        <option value="ACTIVE" ${this.filters.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
        <option value="INACTIVE" ${this.filters.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
        <option value="UNDER_MAINTENANCE" ${this.filters.status === 'UNDER_MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
      </select>
    `;

    // Tab-specific filters
    if (this.activeTab === 'buildings') {
      html += `
        <select class="filter-select" id="filter-hospital-id">
          <option value="">Hospital: All</option>
          ${this.data.hospitals.map(h => `<option value="${h.hospitalId}" ${this.filters.hospitalId == h.hospitalId ? 'selected' : ''}>${h.name}</option>`).join('')}
        </select>
      `;
    } else if (this.activeTab === 'floors') {
      html += `
        <select class="filter-select" id="filter-building-id">
          <option value="">Building: All</option>
          ${this.data.buildings.map(b => `<option value="${b.buildingId}" ${this.filters.buildingId == b.buildingId ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      `;
    } else if (this.activeTab === 'wards') {
      html += `
        <select class="filter-select" id="filter-floor-id">
          <option value="">Floor: All</option>
          ${this.data.floors.map(f => `<option value="${f.floorId}" ${this.filters.floorId == f.floorId ? 'selected' : ''}>${f.floorName} (${f.floorCode})</option>`).join('')}
        </select>
        <select class="filter-select" id="filter-ward-type">
          <option value="">Ward Type: All</option>
          ${this.enums.wardTypes.map(t => `<option value="${t}" ${this.filters.wardType === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
        </select>
      `;
    } else if (this.activeTab === 'rooms') {
      html += `
        <select class="filter-select" id="filter-ward-id">
          <option value="">Ward: All</option>
          ${this.data.wards.map(w => `<option value="${w.wardId}" ${this.filters.wardId == w.wardId ? 'selected' : ''}>${w.name}</option>`).join('')}
        </select>
        <select class="filter-select" id="filter-readiness-status">
          <option value="">Readiness: All</option>
          ${this.enums.readinessStatuses.map(s => `<option value="${s}" ${this.filters.readinessStatus === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
        </select>
        <select class="filter-select" id="filter-room-type">
          <option value="">Room Type: All</option>
          ${this.enums.roomTypes.map(t => `<option value="${t}" ${this.filters.roomType === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
        </select>
      `;
    } else if (this.activeTab === 'beds') {
      html += `
        <select class="filter-select" id="filter-bed-operational-status">
          <option value="">Bed Status: All</option>
          ${this.enums.operationalStatuses.map(s => `<option value="${s}" ${this.filters.operationalStatus === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
        </select>
        <select class="filter-select" id="filter-bed-type">
          <option value="">Bed Type: All</option>
          ${this.enums.bedTypes.map(t => `<option value="${t}" ${this.filters.bedType === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
        </select>
      `;
    }

    return html;
  }

  renderContent() {
    if (this.loading) {
      return `
        <div class="structure-loading-state">
          <div class="loading-radar-spinner"></div>
          <p>Connecting to backend API & fetching ${this.activeTab} records...</p>
        </div>
      `;
    }

    if (this.error) {
      return `
        <div class="structure-error-state">
          <div class="error-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>API Communication Error</h3>
          <p>${this.error}</p>
          <button class="btn-primary-action" onclick="window.structureManager.loadCurrentTabData()">
            Retry API Request
          </button>
        </div>
      `;
    }

    const items = this.data[this.activeTab] || [];
    if (items.length === 0) {
      const entityName = this.activeTab.slice(0, -1);
      return `
        <div class="structure-empty-state">
          <div class="empty-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h3>No ${this.activeTab} found</h3>
          <p>No records match the current search or filters. Create your first ${entityName} using the button below or provision a complete structure.</p>
          <button class="btn-primary-action" onclick="window.structureManager.openCreateModal('${this.activeTab}')">
            + Create ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}
          </button>
        </div>
      `;
    }

    switch (this.activeTab) {
      case 'hospitals': return this.renderHospitalsTable(items);
      case 'buildings': return this.renderBuildingsTable(items);
      case 'floors': return this.renderFloorsTable(items);
      case 'wards': return this.renderWardsTable(items);
      case 'rooms': return this.renderRoomsTable(items);
      case 'beds': return this.renderBedsTable(items);
      default: return '';
    }
  }

  // ==========================================================================
  // Entity Tables (Hospitals, Buildings, Floors, Wards, Rooms, Beds)
  // ==========================================================================

  renderHospitalsTable(hospitals) {
    return `
      <div class="structure-table-container">
        <table class="structure-table">
          <thead>
            <tr>
              <th>Hospital Code</th>
              <th>Hospital Name</th>
              <th>License / Reg</th>
              <th>Location</th>
              <th>Buildings</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${hospitals.map(h => `
              <tr>
                <td><span class="cell-code">${h.hospitalCode}</span></td>
                <td>
                  <div style="font-weight: 700; color: #fff;">${h.name}</div>
                  <div class="cell-name-sub">${h.contactEmail || 'No email'} &bull; ${h.contactPhone || 'No phone'}</div>
                </td>
                <td><span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${h.licenseNumber}</span></td>
                <td>${h.city}, ${h.state}</td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('buildings', 'hospitalId', ${h.hospitalId}, '${h.name}')">
                    🏢 ${h.totalBuildings || 0} Buildings &rarr;
                  </span>
                </td>
                <td>${this.renderStatusBadge(h.status)}</td>
                <td>
                  <div class="row-actions-group">
                    <button class="btn-row-action drill" title="Drill into Buildings" onclick="window.structureManager.drillDown('buildings', 'hospitalId', ${h.hospitalId}, '${h.name}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <button class="btn-row-action edit" title="Edit Hospital" onclick="window.structureManager.openEditModal('hospitals', ${h.hospitalId})">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-row-action status" title="Quick Status Change" onclick="window.structureManager.openStatusModal('hospitals', ${h.hospitalId}, '${h.status}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                    </button>
                    <button class="btn-row-action delete" title="Delete Hospital" onclick="window.structureManager.openDeleteModal('hospitals', ${h.hospitalId}, '${h.name}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderBuildingsTable(buildings) {
    return `
      <div class="structure-table-container">
        <table class="structure-table">
          <thead>
            <tr>
              <th>Building Code</th>
              <th>Building Name</th>
              <th>Parent Hospital</th>
              <th>Total Floors</th>
              <th>Floors Configured</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${buildings.map(b => `
              <tr>
                <td><span class="cell-code">${b.buildingCode}</span></td>
                <td><span style="font-weight: 700; color: #fff;">${b.name}</span></td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('hospitals', 'hospitalId', ${b.hospitalId}, '${b.hospitalName || 'Hospital'}')">
                    🏥 ${b.hospitalName || `Hospital #${b.hospitalId}`}
                  </span>
                </td>
                <td>${b.totalFloors} floors</td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('floors', 'buildingId', ${b.buildingId}, '${b.name}')">
                    📶 ${b.actualFloorsConfigured || 0} Floors &rarr;
                  </span>
                </td>
                <td>${this.renderStatusBadge(b.status)}</td>
                <td>
                  <div class="row-actions-group">
                    <button class="btn-row-action drill" title="Drill into Floors" onclick="window.structureManager.drillDown('floors', 'buildingId', ${b.buildingId}, '${b.name}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <button class="btn-row-action edit" title="Edit Building" onclick="window.structureManager.openEditModal('buildings', ${b.buildingId})">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-row-action status" title="Quick Status Change" onclick="window.structureManager.openStatusModal('buildings', ${b.buildingId}, '${b.status}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                    </button>
                    <button class="btn-row-action delete" title="Delete Building" onclick="window.structureManager.openDeleteModal('buildings', ${b.buildingId}, '${b.name}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderFloorsTable(floors) {
    return `
      <div class="structure-table-container">
        <table class="structure-table">
          <thead>
            <tr>
              <th>Floor Code</th>
              <th>Floor Name</th>
              <th>Level #</th>
              <th>Parent Building</th>
              <th>Wards Configured</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${floors.map(f => `
              <tr>
                <td><span class="cell-code">${f.floorCode}</span></td>
                <td><span style="font-weight: 700; color: #fff;">${f.floorName}</span></td>
                <td><span class="type-pill">Level ${f.floorNumber}</span></td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('buildings', 'buildingId', ${f.buildingId}, '${f.buildingName || 'Building'}')">
                    🏢 ${f.buildingName || `Building #${f.buildingId}`}
                  </span>
                </td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('wards', 'floorId', ${f.floorId}, '${f.floorName}')">
                    🩺 ${f.totalWardsCount || 0} Wards &rarr;
                  </span>
                </td>
                <td>${this.renderStatusBadge(f.status)}</td>
                <td>
                  <div class="row-actions-group">
                    <button class="btn-row-action drill" title="Drill into Wards" onclick="window.structureManager.drillDown('wards', 'floorId', ${f.floorId}, '${f.floorName}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <button class="btn-row-action edit" title="Edit Floor" onclick="window.structureManager.openEditModal('floors', ${f.floorId})">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-row-action status" title="Quick Status Change" onclick="window.structureManager.openStatusModal('floors', ${f.floorId}, '${f.status}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                    </button>
                    <button class="btn-row-action delete" title="Delete Floor" onclick="window.structureManager.openDeleteModal('floors', ${f.floorId}, '${f.floorName}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderWardsTable(wards) {
    return `
      <div class="structure-table-container">
        <table class="structure-table">
          <thead>
            <tr>
              <th>Ward Code</th>
              <th>Ward Name</th>
              <th>Ward Type</th>
              <th>Parent Floor</th>
              <th>Hygiene Target / Current</th>
              <th>Rooms</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${wards.map(w => {
              const score = w.currentHygieneScore ? parseFloat(w.currentHygieneScore) : 100;
              const target = w.hygieneTargetScore ? parseFloat(w.hygieneTargetScore) : 95;
              const barColor = score >= target ? 'var(--accent-emerald)' : (score >= 80 ? 'var(--accent-amber)' : 'var(--accent-crimson)');
              return `
                <tr>
                  <td><span class="cell-code">${w.wardCode}</span></td>
                  <td><span style="font-weight: 700; color: #fff;">${w.name}</span></td>
                  <td><span class="type-pill">${(w.wardType || '').replace(/_/g, ' ')}</span></td>
                  <td>
                    <span class="cell-parent-badge" onclick="window.structureManager.drillDown('floors', 'floorId', ${w.floorId}, '${w.floorName || 'Floor'}')">
                      📶 ${w.floorName || `Floor #${w.floorId}`}
                    </span>
                  </td>
                  <td>
                    <div class="score-meter" title="Current: ${score}% | Target: ${target}%">
                      <span>${score.toFixed(1)}%</span>
                      <div class="score-bar-bg">
                        <div class="score-bar-fill" style="width: ${Math.min(100, score)}%; background: ${barColor};"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="cell-parent-badge" onclick="window.structureManager.drillDown('rooms', 'wardId', ${w.wardId}, '${w.name}')">
                      🚪 ${w.totalRoomsCount || 0} Rooms &rarr;
                    </span>
                  </td>
                  <td>${this.renderStatusBadge(w.status)}</td>
                  <td>
                    <div class="row-actions-group">
                      <button class="btn-row-action drill" title="Drill into Rooms" onclick="window.structureManager.drillDown('rooms', 'wardId', ${w.wardId}, '${w.name}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                      <button class="btn-row-action edit" title="Edit Ward" onclick="window.structureManager.openEditModal('wards', ${w.wardId})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="btn-row-action status" title="Update Hygiene Score" onclick="window.structureManager.openHygieneScoreModal(${w.wardId}, ${score})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </button>
                      <button class="btn-row-action delete" title="Delete Ward" onclick="window.structureManager.openDeleteModal('wards', ${w.wardId}, '${w.name}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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

  renderRoomsTable(rooms) {
    return `
      <div class="structure-table-container">
        <table class="structure-table">
          <thead>
            <tr>
              <th>Room #</th>
              <th>Room Type</th>
              <th>QR Identifier</th>
              <th>Parent Ward</th>
              <th>Airflow Spec</th>
              <th>Readiness Status</th>
              <th>Beds</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rooms.map(r => `
              <tr>
                <td><span class="cell-code" style="font-size: 0.9rem;">${r.roomNumber}</span></td>
                <td><span class="type-pill">${(r.roomType || '').replace(/_/g, ' ')}</span></td>
                <td><span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-dim);">${r.qrCodeIdentifier}</span></td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('wards', 'wardId', ${r.wardId}, '${r.wardName || 'Ward'}')">
                    🩺 ${r.wardName || `Ward #${r.wardId}`}
                  </span>
                </td>
                <td><span style="font-size: 0.76rem; color: var(--text-muted);">${(r.airflowType || '').replace(/_/g, ' ')}</span></td>
                <td>${this.renderReadinessBadge(r.readinessStatus)}</td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('beds', 'roomId', ${r.roomId}, 'Room ${r.roomNumber}')">
                    🛏️ ${r.totalBedsCount || 0} Beds &rarr;
                  </span>
                </td>
                <td>
                  <div class="row-actions-group">
                    <button class="btn-row-action drill" title="Drill into Beds" onclick="window.structureManager.drillDown('beds', 'roomId', ${r.roomId}, 'Room ${r.roomNumber}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <button class="btn-row-action status" title="Change Readiness Status" onclick="window.structureManager.openRoomReadinessModal(${r.roomId}, '${r.readinessStatus}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button class="btn-row-action edit" title="Edit Room" onclick="window.structureManager.openEditModal('rooms', ${r.roomId})">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-row-action delete" title="Delete Room" onclick="window.structureManager.openDeleteModal('rooms', ${r.roomId}, 'Room ${r.roomNumber}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderBedsTable(beds) {
    return `
      <div class="structure-table-container">
        <table class="structure-table">
          <thead>
            <tr>
              <th>Bed #</th>
              <th>Bed Type</th>
              <th>Parent Room</th>
              <th>Ward / Floor</th>
              <th>QR Identifier</th>
              <th>Occupancy Ref</th>
              <th>Operational Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${beds.map(b => `
              <tr>
                <td><span class="cell-code" style="font-size: 0.9rem;">${b.bedNumber}</span></td>
                <td><span class="type-pill">${(b.bedType || '').replace(/_/g, ' ')}</span></td>
                <td>
                  <span class="cell-parent-badge" onclick="window.structureManager.drillDown('rooms', 'roomId', ${b.roomId}, 'Room ${b.roomNumber || ''}')">
                    🚪 Room ${b.roomNumber || `#${b.roomId}`}
                  </span>
                </td>
                <td><span style="font-size: 0.76rem; color: var(--text-muted);">${b.wardName || 'Ward'} &bull; ${b.floorName || ''}</span></td>
                <td><span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-dim);">${b.qrCodeIdentifier}</span></td>
                <td><span style="font-size: 0.78rem; color: var(--text-muted);">${b.currentOccupancyReference || '&mdash;'}</span></td>
                <td>${this.renderBedStatusBadge(b.operationalStatus)}</td>
                <td>
                  <div class="row-actions-group">
                    <button class="btn-row-action status" title="Change Operational Status" onclick="window.structureManager.openBedStatusModal(${b.bedId}, '${b.operationalStatus}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button class="btn-row-action edit" title="Edit Bed" onclick="window.structureManager.openEditModal('beds', ${b.bedId})">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-row-action delete" title="Delete Bed" onclick="window.structureManager.openDeleteModal('beds', ${b.bedId}, 'Bed ${b.bedNumber}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================================================
  // Status Badge Renderers
  // ==========================================================================

  renderStatusBadge(status) {
    const s = (status || 'ACTIVE').toUpperCase();
    let badgeClass = 'active';
    let label = 'Active';

    if (s === 'INACTIVE') {
      badgeClass = 'inactive';
      label = 'Inactive';
    } else if (s === 'UNDER_MAINTENANCE') {
      badgeClass = 'under_maintenance';
      label = 'Maintenance';
    }

    return `
      <span class="status-badge ${badgeClass}">
        <span class="status-badge-dot"></span>
        ${label}
      </span>
    `;
  }

  renderReadinessBadge(status) {
    const s = (status || 'READY_FOR_USE').toUpperCase();
    const cssClass = s.toLowerCase();
    const label = s.replace(/_/g, ' ');

    return `
      <span class="status-badge ${cssClass}">
        <span class="status-badge-dot"></span>
        ${label}
      </span>
    `;
  }

  renderBedStatusBadge(status) {
    const s = (status || 'VACANT_CLEAN').toUpperCase();
    const cssClass = s.toLowerCase();
    const label = s.replace(/_/g, ' ');

    return `
      <span class="status-badge ${cssClass}">
        <span class="status-badge-dot"></span>
        ${label}
      </span>
    `;
  }

  // ==========================================================================
  // Event Listeners & Filter Handling
  // ==========================================================================

  bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('structure-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value.trim();
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.loadCurrentTabData();
        }, 320);
      });
    }

    // Status filter
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.loadCurrentTabData();
      });
    }

    // Level-specific filters
    const filterHospitalId = document.getElementById('filter-hospital-id');
    if (filterHospitalId) {
      filterHospitalId.addEventListener('change', (e) => {
        this.filters.hospitalId = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterBuildingId = document.getElementById('filter-building-id');
    if (filterBuildingId) {
      filterBuildingId.addEventListener('change', (e) => {
        this.filters.buildingId = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterFloorId = document.getElementById('filter-floor-id');
    if (filterFloorId) {
      filterFloorId.addEventListener('change', (e) => {
        this.filters.floorId = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterWardType = document.getElementById('filter-ward-type');
    if (filterWardType) {
      filterWardType.addEventListener('change', (e) => {
        this.filters.wardType = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterWardId = document.getElementById('filter-ward-id');
    if (filterWardId) {
      filterWardId.addEventListener('change', (e) => {
        this.filters.wardId = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterReadiness = document.getElementById('filter-readiness-status');
    if (filterReadiness) {
      filterReadiness.addEventListener('change', (e) => {
        this.filters.readinessStatus = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterRoomType = document.getElementById('filter-room-type');
    if (filterRoomType) {
      filterRoomType.addEventListener('change', (e) => {
        this.filters.roomType = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterBedStatus = document.getElementById('filter-bed-operational-status');
    if (filterBedStatus) {
      filterBedStatus.addEventListener('change', (e) => {
        this.filters.operationalStatus = e.target.value;
        this.loadCurrentTabData();
      });
    }

    const filterBedType = document.getElementById('filter-bed-type');
    if (filterBedType) {
      filterBedType.addEventListener('change', (e) => {
        this.filters.bedType = e.target.value;
        this.loadCurrentTabData();
      });
    }
  }

  resetFilters() {
    this.filters = {
      search: '',
      status: '',
      hospitalId: '',
      buildingId: '',
      floorId: '',
      wardId: '',
      roomId: '',
      wardType: '',
      roomType: '',
      airflowType: '',
      readinessStatus: '',
      bedType: '',
      operationalStatus: ''
    };
    this.loadCurrentTabData();
  }

  // ==========================================================================
  // Modal Handlers (Create, Edit, Delete, Quick Status, Tree)
  // ==========================================================================

  closeModal() {
    const modalRoot = document.getElementById('structure-modal-root');
    if (modalRoot) {
      modalRoot.innerHTML = '';
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <span style="font-weight: 700; color: ${type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-crimson)'};">
          ${type === 'success' ? '✔' : '✖'}
        </span>
        <span style="font-size: 0.85rem; color: #fff;">${message}</span>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  // --- Create Modals ---
  async openCreateModal(tabId) {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    let bodyHtml = '';
    let title = '';

    if (tabId === 'hospitals') {
      title = 'Register New Hospital Facility';
      bodyHtml = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Hospital Code <span class="req">*</span></label>
            <input type="text" id="modal-field-code" class="form-control" placeholder="e.g. HOSP-DELHI-01" required />
          </div>
          <div class="form-group">
            <label class="form-label">Hospital Name <span class="req">*</span></label>
            <input type="text" id="modal-field-name" class="form-control" placeholder="e.g. AIIMS Metro Super Specialty" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Clinical License # <span class="req">*</span></label>
            <input type="text" id="modal-field-license" class="form-control" placeholder="e.g. NABH-DEL-2026-889" required />
          </div>
          <div class="form-group">
            <label class="form-label">Operational Status</label>
            <select id="modal-field-status" class="form-control">
              <option value="ACTIVE" selected>Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Street Address Line 1 <span class="req">*</span></label>
          <input type="text" id="modal-field-addr1" class="form-control" placeholder="e.g. Plot 42, Healthcare City Sector 9" required />
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">City <span class="req">*</span></label>
            <input type="text" id="modal-field-city" class="form-control" placeholder="e.g. New Delhi" required />
          </div>
          <div class="form-group">
            <label class="form-label">State <span class="req">*</span></label>
            <input type="text" id="modal-field-state" class="form-control" placeholder="e.g. Delhi" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Postal Code <span class="req">*</span></label>
            <input type="text" id="modal-field-postal" class="form-control" placeholder="e.g. 110029" required />
          </div>
          <div class="form-group">
            <label class="form-label">Country</label>
            <input type="text" id="modal-field-country" class="form-control" value="India" />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Contact Email</label>
            <input type="email" id="modal-field-email" class="form-control" placeholder="e.g. administration@hospital.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <input type="tel" id="modal-field-phone" class="form-control" placeholder="e.g. +91-11-2659-3300" />
          </div>
        </div>
      `;
    } else if (tabId === 'buildings') {
      title = 'Add New Building to Hospital';
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Select Parent Hospital <span class="req">*</span></label>
          <select id="modal-field-parent-hospital" class="form-control" required>
            <option value="">-- Choose Hospital --</option>
            ${this.data.hospitals.map(h => `<option value="${h.hospitalId}" ${this.filters.hospitalId == h.hospitalId ? 'selected' : ''}>${h.name} (${h.hospitalCode})</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Building Code <span class="req">*</span></label>
            <input type="text" id="modal-field-code" class="form-control" placeholder="e.g. BLD-SURG-01" required />
          </div>
          <div class="form-group">
            <label class="form-label">Building Name <span class="req">*</span></label>
            <input type="text" id="modal-field-name" class="form-control" placeholder="e.g. Surgical & Critical Care Tower" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Total Floors Count <span class="req">*</span></label>
            <input type="number" id="modal-field-total-floors" class="form-control" value="4" min="1" max="50" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modal-field-status" class="form-control">
              <option value="ACTIVE" selected>Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>
      `;
    } else if (tabId === 'floors') {
      title = 'Add New Floor to Building';
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Select Parent Building <span class="req">*</span></label>
          <select id="modal-field-parent-building" class="form-control" required>
            <option value="">-- Choose Building --</option>
            ${this.data.buildings.map(b => `<option value="${b.buildingId}" ${this.filters.buildingId == b.buildingId ? 'selected' : ''}>${b.name} (${b.buildingCode})</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Floor Number <span class="req">*</span></label>
            <input type="number" id="modal-field-floor-num" class="form-control" value="1" min="0" max="100" required />
          </div>
          <div class="form-group">
            <label class="form-label">Floor Code <span class="req">*</span></label>
            <input type="text" id="modal-field-code" class="form-control" placeholder="e.g. FL-01" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Floor Name <span class="req">*</span></label>
            <input type="text" id="modal-field-name" class="form-control" placeholder="e.g. Ground Floor Emergency" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modal-field-status" class="form-control">
              <option value="ACTIVE" selected>Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>
      `;
    } else if (tabId === 'wards') {
      title = 'Add New Ward to Floor';
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Select Parent Floor <span class="req">*</span></label>
          <select id="modal-field-parent-floor" class="form-control" required>
            <option value="">-- Choose Floor --</option>
            ${this.data.floors.map(f => `<option value="${f.floorId}" ${this.filters.floorId == f.floorId ? 'selected' : ''}>${f.floorName} (${f.floorCode} - ${f.buildingName || ''})</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Ward Code <span class="req">*</span></label>
            <input type="text" id="modal-field-code" class="form-control" placeholder="e.g. WARD-ICU-A" required />
          </div>
          <div class="form-group">
            <label class="form-label">Ward Name <span class="req">*</span></label>
            <input type="text" id="modal-field-name" class="form-control" placeholder="e.g. Intensive Care Unit Alpha" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Ward Classification <span class="req">*</span></label>
            <select id="modal-field-ward-type" class="form-control" required>
              ${this.enums.wardTypes.map(t => `<option value="${t}">${t.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hygiene Target Score (%)</label>
            <input type="number" id="modal-field-target-score" class="form-control" value="95.00" min="0" max="100" step="0.1" />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Initial Hygiene Score (%)</label>
            <input type="number" id="modal-field-current-score" class="form-control" value="100.00" min="0" max="100" step="0.1" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modal-field-status" class="form-control">
              <option value="ACTIVE" selected>Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>
      `;
    } else if (tabId === 'rooms') {
      title = 'Add New Clinical Room to Ward';
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Select Parent Ward <span class="req">*</span></label>
          <select id="modal-field-parent-ward" class="form-control" required>
            <option value="">-- Choose Ward --</option>
            ${this.data.wards.map(w => `<option value="${w.wardId}" ${this.filters.wardId == w.wardId ? 'selected' : ''}>${w.name} (${w.wardCode})</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Room Number / Ident <span class="req">*</span></label>
            <input type="text" id="modal-field-room-num" class="form-control" placeholder="e.g. RM-301" required />
          </div>
          <div class="form-group">
            <label class="form-label">Room Type <span class="req">*</span></label>
            <select id="modal-field-room-type" class="form-control" required>
              ${this.enums.roomTypes.map(t => `<option value="${t}">${t.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">QR Code Identifier <span class="req">*</span></label>
          <input type="text" id="modal-field-qr" class="form-control" placeholder="e.g. QR-RM-301-ICU-A" required />
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Airflow Specification</label>
            <select id="modal-field-airflow" class="form-control">
              ${this.enums.airflowTypes.map(a => `<option value="${a}">${a.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Initial Readiness Status</label>
            <select id="modal-field-readiness" class="form-control">
              ${this.enums.readinessStatuses.map(s => `<option value="${s}" ${s === 'READY_FOR_USE' ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
      `;
    } else if (tabId === 'beds') {
      title = 'Add New Bed to Clinical Room';
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Select Parent Room <span class="req">*</span></label>
          <select id="modal-field-parent-room" class="form-control" required>
            <option value="">-- Choose Room --</option>
            ${this.data.rooms.map(r => `<option value="${r.roomId}" ${this.filters.roomId == r.roomId ? 'selected' : ''}>Room ${r.roomNumber} (${r.wardName || 'Ward'})</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Bed Number <span class="req">*</span></label>
            <input type="text" id="modal-field-bed-num" class="form-control" placeholder="e.g. BED-301-A" required />
          </div>
          <div class="form-group">
            <label class="form-label">Bed Type <span class="req">*</span></label>
            <select id="modal-field-bed-type" class="form-control" required>
              ${this.enums.bedTypes.map(t => `<option value="${t}">${t.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">QR Code Identifier <span class="req">*</span></label>
            <input type="text" id="modal-field-qr" class="form-control" placeholder="e.g. QR-BED-301-A" required />
          </div>
          <div class="form-group">
            <label class="form-label">Initial Operational Status</label>
            <select id="modal-field-operational-status" class="form-control">
              ${this.enums.operationalStatuses.map(s => `<option value="${s}" ${s === 'VACANT_CLEAN' ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Occupancy Reference (Optional)</label>
          <input type="text" id="modal-field-occupancy" class="form-control" placeholder="e.g. ADM-2026-904" />
        </div>
      `;
    }

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal">
          <div class="structure-modal-header">
            <div class="structure-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              ${title}
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body">
            <div class="form-error-feedback" id="modal-error-box"></div>
            ${bodyHtml}
          </div>
          <div class="structure-modal-footer">
            <button class="btn-secondary-action" onclick="window.structureManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" id="modal-submit-btn" onclick="window.structureManager.submitCreate('${tabId}')">
              Create Record
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async submitCreate(tabId) {
    const errorBox = document.getElementById('modal-error-box');
    const submitBtn = document.getElementById('modal-submit-btn');

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating...';

      let endpoint = '';
      let payload = {};

      if (tabId === 'hospitals') {
        endpoint = '/hospitals';
        payload = {
          hospitalCode: document.getElementById('modal-field-code').value.trim(),
          name: document.getElementById('modal-field-name').value.trim(),
          licenseNumber: document.getElementById('modal-field-license').value.trim(),
          addressLine1: document.getElementById('modal-field-addr1').value.trim(),
          city: document.getElementById('modal-field-city').value.trim(),
          state: document.getElementById('modal-field-state').value.trim(),
          postalCode: document.getElementById('modal-field-postal').value.trim(),
          country: document.getElementById('modal-field-country').value.trim() || 'India',
          contactEmail: document.getElementById('modal-field-email').value.trim() || null,
          contactPhone: document.getElementById('modal-field-phone').value.trim() || null,
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'buildings') {
        endpoint = '/buildings';
        payload = {
          hospitalId: parseInt(document.getElementById('modal-field-parent-hospital').value),
          buildingCode: document.getElementById('modal-field-code').value.trim(),
          name: document.getElementById('modal-field-name').value.trim(),
          totalFloors: parseInt(document.getElementById('modal-field-total-floors').value) || 1,
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'floors') {
        endpoint = '/floors';
        payload = {
          buildingId: parseInt(document.getElementById('modal-field-parent-building').value),
          floorNumber: parseInt(document.getElementById('modal-field-floor-num').value) || 1,
          floorCode: document.getElementById('modal-field-code').value.trim(),
          floorName: document.getElementById('modal-field-name').value.trim(),
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'wards') {
        endpoint = '/wards';
        payload = {
          floorId: parseInt(document.getElementById('modal-field-parent-floor').value),
          wardCode: document.getElementById('modal-field-code').value.trim(),
          name: document.getElementById('modal-field-name').value.trim(),
          wardType: document.getElementById('modal-field-ward-type').value,
          hygieneTargetScore: parseFloat(document.getElementById('modal-field-target-score').value) || 95.0,
          currentHygieneScore: parseFloat(document.getElementById('modal-field-current-score').value) || 100.0,
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'rooms') {
        endpoint = '/rooms';
        payload = {
          wardId: parseInt(document.getElementById('modal-field-parent-ward').value),
          roomNumber: document.getElementById('modal-field-room-num').value.trim(),
          roomType: document.getElementById('modal-field-room-type').value,
          qrCodeIdentifier: document.getElementById('modal-field-qr').value.trim(),
          airflowType: document.getElementById('modal-field-airflow').value,
          readinessStatus: document.getElementById('modal-field-readiness').value
        };
      } else if (tabId === 'beds') {
        endpoint = '/beds';
        payload = {
          roomId: parseInt(document.getElementById('modal-field-parent-room').value),
          bedNumber: document.getElementById('modal-field-bed-num').value.trim(),
          bedType: document.getElementById('modal-field-bed-type').value,
          qrCodeIdentifier: document.getElementById('modal-field-qr').value.trim(),
          operationalStatus: document.getElementById('modal-field-operational-status').value,
          currentOccupancyReference: document.getElementById('modal-field-occupancy').value.trim() || null
        };
      }

      await this.apiRequest(endpoint, 'POST', payload);
      this.closeModal();
      this.showToast(`New ${tabId.slice(0, -1)} successfully created!`, 'success');
      await this.preloadParentCaches();
      await this.loadCurrentTabData();
    } catch (err) {
      console.error('Submit error:', err);
      if (errorBox) {
        errorBox.textContent = err.message || 'Creation failed. Please verify input fields.';
        errorBox.classList.add('visible');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Create Record';
    }
  }

  // --- Edit Modals ---
  async openEditModal(tabId, entityId) {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    const record = (this.data[tabId] || []).find(item => 
      (item.hospitalId === entityId) || 
      (item.buildingId === entityId) || 
      (item.floorId === entityId) || 
      (item.wardId === entityId) || 
      (item.roomId === entityId) || 
      (item.bedId === entityId)
    );

    if (!record) {
      alert('Record not found');
      return;
    }

    let title = `Edit ${tabId.slice(0, -1).toUpperCase()}`;
    let bodyHtml = '';

    if (tabId === 'hospitals') {
      bodyHtml = `
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Hospital Code</label>
            <input type="text" id="modal-field-code" class="form-control" value="${record.hospitalCode || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Hospital Name</label>
            <input type="text" id="modal-field-name" class="form-control" value="${record.name || ''}" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">License Number</label>
            <input type="text" id="modal-field-license" class="form-control" value="${record.licenseNumber || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modal-field-status" class="form-control">
              <option value="ACTIVE" ${record.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
              <option value="INACTIVE" ${record.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
              <option value="UNDER_MAINTENANCE" ${record.status === 'UNDER_MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Address Line 1</label>
          <input type="text" id="modal-field-addr1" class="form-control" value="${record.addressLine1 || ''}" required />
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">City</label>
            <input type="text" id="modal-field-city" class="form-control" value="${record.city || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">State</label>
            <input type="text" id="modal-field-state" class="form-control" value="${record.state || ''}" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Postal Code</label>
            <input type="text" id="modal-field-postal" class="form-control" value="${record.postalCode || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Country</label>
            <input type="text" id="modal-field-country" class="form-control" value="${record.country || 'India'}" />
          </div>
        </div>
      `;
    } else if (tabId === 'buildings') {
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Parent Hospital</label>
          <select id="modal-field-parent-hospital" class="form-control" required>
            ${this.data.hospitals.map(h => `<option value="${h.hospitalId}" ${record.hospitalId == h.hospitalId ? 'selected' : ''}>${h.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Building Code</label>
            <input type="text" id="modal-field-code" class="form-control" value="${record.buildingCode || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Building Name</label>
            <input type="text" id="modal-field-name" class="form-control" value="${record.name || ''}" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Total Floors</label>
            <input type="number" id="modal-field-total-floors" class="form-control" value="${record.totalFloors || 1}" min="1" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modal-field-status" class="form-control">
              <option value="ACTIVE" ${record.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
              <option value="INACTIVE" ${record.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
              <option value="UNDER_MAINTENANCE" ${record.status === 'UNDER_MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
            </select>
          </div>
        </div>
      `;
    } else if (tabId === 'floors') {
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Parent Building</label>
          <select id="modal-field-parent-building" class="form-control" required>
            ${this.data.buildings.map(b => `<option value="${b.buildingId}" ${record.buildingId == b.buildingId ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Floor Number</label>
            <input type="number" id="modal-field-floor-num" class="form-control" value="${record.floorNumber}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Floor Code</label>
            <input type="text" id="modal-field-code" class="form-control" value="${record.floorCode || ''}" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Floor Name</label>
            <input type="text" id="modal-field-name" class="form-control" value="${record.floorName || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="modal-field-status" class="form-control">
              <option value="ACTIVE" ${record.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
              <option value="INACTIVE" ${record.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
              <option value="UNDER_MAINTENANCE" ${record.status === 'UNDER_MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
            </select>
          </div>
        </div>
      `;
    } else if (tabId === 'wards') {
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Parent Floor</label>
          <select id="modal-field-parent-floor" class="form-control" required>
            ${this.data.floors.map(f => `<option value="${f.floorId}" ${record.floorId == f.floorId ? 'selected' : ''}>${f.floorName} (${f.floorCode})</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Ward Code</label>
            <input type="text" id="modal-field-code" class="form-control" value="${record.wardCode || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Ward Name</label>
            <input type="text" id="modal-field-name" class="form-control" value="${record.name || ''}" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Ward Type</label>
            <select id="modal-field-ward-type" class="form-control" required>
              ${this.enums.wardTypes.map(t => `<option value="${t}" ${record.wardType === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hygiene Target Score (%)</label>
            <input type="number" id="modal-field-target-score" class="form-control" value="${record.hygieneTargetScore || 95}" min="0" max="100" step="0.1" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="modal-field-status" class="form-control">
            <option value="ACTIVE" ${record.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
            <option value="INACTIVE" ${record.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
            <option value="UNDER_MAINTENANCE" ${record.status === 'UNDER_MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
          </select>
        </div>
      `;
    } else if (tabId === 'rooms') {
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Parent Ward</label>
          <select id="modal-field-parent-ward" class="form-control" required>
            ${this.data.wards.map(w => `<option value="${w.wardId}" ${record.wardId == w.wardId ? 'selected' : ''}>${w.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Room Number</label>
            <input type="text" id="modal-field-room-num" class="form-control" value="${record.roomNumber || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Room Type</label>
            <select id="modal-field-room-type" class="form-control" required>
              ${this.enums.roomTypes.map(t => `<option value="${t}" ${record.roomType === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">QR Code Identifier</label>
          <input type="text" id="modal-field-qr" class="form-control" value="${record.qrCodeIdentifier || ''}" required />
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Airflow Specification</label>
            <select id="modal-field-airflow" class="form-control">
              ${this.enums.airflowTypes.map(a => `<option value="${a}" ${record.airflowType === a ? 'selected' : ''}>${a.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Readiness Status</label>
            <select id="modal-field-readiness" class="form-control">
              ${this.enums.readinessStatuses.map(s => `<option value="${s}" ${record.readinessStatus === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
      `;
    } else if (tabId === 'beds') {
      bodyHtml = `
        <div class="form-group">
          <label class="form-label">Parent Room</label>
          <select id="modal-field-parent-room" class="form-control" required>
            ${this.data.rooms.map(r => `<option value="${r.roomId}" ${record.roomId == r.roomId ? 'selected' : ''}>Room ${r.roomNumber}</option>`).join('')}
          </select>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Bed Number</label>
            <input type="text" id="modal-field-bed-num" class="form-control" value="${record.bedNumber || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Bed Type</label>
            <select id="modal-field-bed-type" class="form-control" required>
              ${this.enums.bedTypes.map(t => `<option value="${t}" ${record.bedType === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">QR Identifier</label>
            <input type="text" id="modal-field-qr" class="form-control" value="${record.qrCodeIdentifier || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Operational Status</label>
            <select id="modal-field-operational-status" class="form-control">
              ${this.enums.operationalStatuses.map(s => `<option value="${s}" ${record.operationalStatus === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Occupancy Reference</label>
          <input type="text" id="modal-field-occupancy" class="form-control" value="${record.currentOccupancyReference || ''}" />
        </div>
      `;
    }

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal">
          <div class="structure-modal-header">
            <div class="structure-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              ${title}
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body">
            <div class="form-error-feedback" id="modal-error-box"></div>
            ${bodyHtml}
          </div>
          <div class="structure-modal-footer">
            <button class="btn-secondary-action" onclick="window.structureManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" id="modal-submit-btn" onclick="window.structureManager.submitEdit('${tabId}', ${entityId})">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async submitEdit(tabId, entityId) {
    const errorBox = document.getElementById('modal-error-box');
    const submitBtn = document.getElementById('modal-submit-btn');

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Saving...';

      let endpoint = `/${tabId}/${entityId}`;
      let payload = {};

      if (tabId === 'hospitals') {
        payload = {
          hospitalCode: document.getElementById('modal-field-code').value.trim(),
          name: document.getElementById('modal-field-name').value.trim(),
          licenseNumber: document.getElementById('modal-field-license').value.trim(),
          addressLine1: document.getElementById('modal-field-addr1').value.trim(),
          city: document.getElementById('modal-field-city').value.trim(),
          state: document.getElementById('modal-field-state').value.trim(),
          postalCode: document.getElementById('modal-field-postal').value.trim(),
          country: document.getElementById('modal-field-country').value.trim() || 'India',
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'buildings') {
        payload = {
          hospitalId: parseInt(document.getElementById('modal-field-parent-hospital').value),
          buildingCode: document.getElementById('modal-field-code').value.trim(),
          name: document.getElementById('modal-field-name').value.trim(),
          totalFloors: parseInt(document.getElementById('modal-field-total-floors').value) || 1,
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'floors') {
        payload = {
          buildingId: parseInt(document.getElementById('modal-field-parent-building').value),
          floorNumber: parseInt(document.getElementById('modal-field-floor-num').value) || 1,
          floorCode: document.getElementById('modal-field-code').value.trim(),
          floorName: document.getElementById('modal-field-name').value.trim(),
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'wards') {
        payload = {
          floorId: parseInt(document.getElementById('modal-field-parent-floor').value),
          wardCode: document.getElementById('modal-field-code').value.trim(),
          name: document.getElementById('modal-field-name').value.trim(),
          wardType: document.getElementById('modal-field-ward-type').value,
          hygieneTargetScore: parseFloat(document.getElementById('modal-field-target-score').value) || 95.0,
          currentHygieneScore: parseFloat(document.getElementById('modal-field-target-score').value) || 95.0,
          status: document.getElementById('modal-field-status').value
        };
      } else if (tabId === 'rooms') {
        payload = {
          wardId: parseInt(document.getElementById('modal-field-parent-ward').value),
          roomNumber: document.getElementById('modal-field-room-num').value.trim(),
          roomType: document.getElementById('modal-field-room-type').value,
          qrCodeIdentifier: document.getElementById('modal-field-qr').value.trim(),
          airflowType: document.getElementById('modal-field-airflow').value,
          readinessStatus: document.getElementById('modal-field-readiness').value
        };
      } else if (tabId === 'beds') {
        payload = {
          roomId: parseInt(document.getElementById('modal-field-parent-room').value),
          bedNumber: document.getElementById('modal-field-bed-num').value.trim(),
          bedType: document.getElementById('modal-field-bed-type').value,
          qrCodeIdentifier: document.getElementById('modal-field-qr').value.trim(),
          operationalStatus: document.getElementById('modal-field-operational-status').value,
          currentOccupancyReference: document.getElementById('modal-field-occupancy').value.trim() || null
        };
      }

      await this.apiRequest(endpoint, 'PUT', payload);
      this.closeModal();
      this.showToast(`Updated record #${entityId} successfully!`, 'success');
      await this.loadCurrentTabData();
    } catch (err) {
      console.error('Save error:', err);
      if (errorBox) {
        errorBox.textContent = err.message || 'Update failed.';
        errorBox.classList.add('visible');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Changes';
    }
  }

  // --- Delete Confirmation Modal ---
  openDeleteModal(tabId, entityId, entityName) {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal modal-danger">
          <div class="structure-modal-header" style="background: rgba(239, 68, 68, 0.12);">
            <div class="structure-modal-title" style="color: var(--accent-crimson);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Confirm Relational Deletion
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body">
            <div class="form-error-feedback" id="modal-error-box"></div>
            <p style="font-size: 0.92rem; color: #fff; line-height: 1.6;">
              Are you sure you want to permanently delete <strong>${entityName}</strong> (ID: ${entityId})?
            </p>
            <p style="font-size: 0.8rem; color: var(--text-muted); background: rgba(239, 68, 68, 0.08); padding: 0.8rem; border-radius: var(--radius-sm); border: 1px dashed rgba(239, 68, 68, 0.3);">
              <strong>Notice:</strong> The backend strictly enforces foreign-key relational integrity. If child records (such as rooms, beds, or active tasks) depend on this entity, deletion will be rejected to protect clinical history.
            </p>
          </div>
          <div class="structure-modal-footer">
            <button class="btn-secondary-action" onclick="window.structureManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" id="modal-delete-btn" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35); color: #fff;" onclick="window.structureManager.submitDelete('${tabId}', ${entityId})">
              Delete Entity
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async submitDelete(tabId, entityId) {
    const errorBox = document.getElementById('modal-error-box');
    const deleteBtn = document.getElementById('modal-delete-btn');

    try {
      deleteBtn.disabled = true;
      deleteBtn.innerText = 'Deleting...';

      await this.apiRequest(`/${tabId}/${entityId}`, 'DELETE');
      this.closeModal();
      this.showToast(`Deleted ${tabId.slice(0, -1)} successfully!`, 'success');
      await this.loadCurrentTabData();
    } catch (err) {
      console.error('Delete error:', err);
      if (errorBox) {
        errorBox.textContent = err.message || 'Cannot delete entity: relational children exist.';
        errorBox.classList.add('visible');
      }
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.innerText = 'Delete Entity';
    }
  }

  // --- Quick Status Updates ---
  openStatusModal(tabId, entityId, currentStatus) {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal" style="max-width: 440px;">
          <div class="structure-modal-header">
            <div class="structure-modal-title">
              Update Status
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body">
            <div class="form-group">
              <label class="form-label">New Status</label>
              <select id="modal-quick-status-select" class="form-control">
                <option value="ACTIVE" ${currentStatus === 'ACTIVE' ? 'selected' : ''}>Active</option>
                <option value="INACTIVE" ${currentStatus === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
                <option value="UNDER_MAINTENANCE" ${currentStatus === 'UNDER_MAINTENANCE' ? 'selected' : ''}>Under Maintenance</option>
              </select>
            </div>
          </div>
          <div class="structure-modal-footer">
            <button class="btn-secondary-action" onclick="window.structureManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" onclick="window.structureManager.submitStatusPatch('${tabId}', ${entityId})">
              Update Status
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async submitStatusPatch(tabId, entityId) {
    const newStatus = document.getElementById('modal-quick-status-select').value;
    try {
      await this.apiRequest(`/${tabId}/${entityId}/status`, 'PATCH', { status: newStatus });
      this.closeModal();
      this.showToast(`Status updated to ${newStatus}`, 'success');
      await this.loadCurrentTabData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  }

  openRoomReadinessModal(roomId, currentStatus) {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal" style="max-width: 460px;">
          <div class="structure-modal-header">
            <div class="structure-modal-title">
              Clinical Room Readiness Status
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body">
            <div class="form-group">
              <label class="form-label">Select Readiness Stage</label>
              <select id="modal-room-readiness-select" class="form-control">
                ${this.enums.readinessStatuses.map(s => `<option value="${s}" ${currentStatus === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
              </select>
              <span class="form-hint" style="margin-top: 0.4rem;">Updating to "DISINFECTION_IN_PROGRESS" activates UV-C and bio-decontamination protocols.</span>
            </div>
          </div>
          <div class="structure-modal-footer">
            <button class="btn-secondary-action" onclick="window.structureManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" onclick="window.structureManager.submitRoomReadinessPatch(${roomId})">
              Update Readiness
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async submitRoomReadinessPatch(roomId) {
    const newStatus = document.getElementById('modal-room-readiness-select').value;
    try {
      await this.apiRequest(`/rooms/${roomId}/readiness-status`, 'PATCH', { readinessStatus: newStatus });
      this.closeModal();
      this.showToast(`Room readiness updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
      await this.loadCurrentTabData();
    } catch (err) {
      alert(`Readiness update failed: ${err.message}`);
    }
  }

  openBedStatusModal(bedId, currentStatus) {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal" style="max-width: 460px;">
          <div class="structure-modal-header">
            <div class="structure-modal-title">
              Bed Operational Status
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body">
            <div class="form-group">
              <label class="form-label">Select Bed Operational Status</label>
              <select id="modal-bed-status-select" class="form-control">
                ${this.enums.operationalStatuses.map(s => `<option value="${s}" ${currentStatus === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="structure-modal-footer">
            <button class="btn-secondary-action" onclick="window.structureManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" onclick="window.structureManager.submitBedStatusPatch(${bedId})">
              Update Status
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async submitBedStatusPatch(bedId) {
    const newStatus = document.getElementById('modal-bed-status-select').value;
    try {
      await this.apiRequest(`/beds/${bedId}/operational-status`, 'PATCH', { operationalStatus: newStatus });
      this.closeModal();
      this.showToast(`Bed operational status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
      await this.loadCurrentTabData();
    } catch (err) {
      alert(`Bed status update failed: ${err.message}`);
    }
  }

  openHygieneScoreModal(wardId, currentScore) {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal" style="max-width: 440px;">
          <div class="structure-modal-header">
            <div class="structure-modal-title">
              Update Ward Hygiene Score
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body">
            <div class="form-group">
              <label class="form-label">Hygiene Audit Score (0.00 - 100.00 %)</label>
              <input type="number" id="modal-hygiene-score-input" class="form-control" value="${currentScore}" min="0" max="100" step="0.5" />
            </div>
          </div>
          <div class="structure-modal-footer">
            <button class="btn-secondary-action" onclick="window.structureManager.closeModal()">Cancel</button>
            <button class="btn-primary-action" onclick="window.structureManager.submitHygieneScorePatch(${wardId})">
              Update Score
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async submitHygieneScorePatch(wardId) {
    const scoreVal = parseFloat(document.getElementById('modal-hygiene-score-input').value);
    try {
      await this.apiRequest(`/wards/${wardId}/hygiene-score`, 'PATCH', { currentHygieneScore: scoreVal });
      this.closeModal();
      this.showToast(`Ward hygiene score updated to ${scoreVal}%`, 'success');
      await this.loadCurrentTabData();
    } catch (err) {
      alert(`Hygiene score update failed: ${err.message}`);
    }
  }

  // --- Complete Tree Explorer Modal ---
  async openTreeModal() {
    const modalRoot = document.getElementById('structure-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="structure-modal-backdrop" onclick="if(event.target === this) window.structureManager.closeModal()">
        <div class="structure-modal" style="max-width: 780px;">
          <div class="structure-modal-header">
            <div class="structure-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
                <line x1="6" y1="3" x2="6" y2="15"/>
                <circle cx="18" cy="6" r="3"/>
                <circle cx="6" cy="18" r="3"/>
                <path d="M18 9a9 9 0 0 1-9 9"/>
              </svg>
              Hospital Structure Tree Explorer
            </div>
            <button class="modal-close-btn" onclick="window.structureManager.closeModal()">&times;</button>
          </div>
          <div class="structure-modal-body" id="tree-modal-body">
            <div class="structure-loading-state">
              <div class="loading-radar-spinner"></div>
              <p>Fetching full hierarchical tree from backend API...</p>
            </div>
          </div>
          <div class="structure-modal-footer">
            <button class="btn-primary-action" onclick="window.structureManager.closeModal()">Close Explorer</button>
          </div>
        </div>
      </div>
    `;

    try {
      if (this.data.hospitals.length === 0) {
        await this.loadHospitals();
      }
      const targetHospital = this.data.hospitals[0];
      if (!targetHospital) {
        document.getElementById('tree-modal-body').innerHTML = `
          <div class="structure-empty-state">
            <p>No hospital found to render hierarchy. Please create a hospital first.</p>
          </div>
        `;
        return;
      }

      const tree = await this.apiRequest(`/hospitals/${targetHospital.hospitalId}/tree`);
      document.getElementById('tree-modal-body').innerHTML = this.renderTreeHtml(tree);
    } catch (e) {
      document.getElementById('tree-modal-body').innerHTML = `
        <div class="structure-error-state">
          <p>${e.message}</p>
        </div>
      `;
    }
  }

  renderTreeHtml(tree) {
    if (!tree) return '<p>No tree data available.</p>';
    const h = tree.hospital || {};
    const buildings = tree.buildings || [];

    return `
      <div class="tree-explorer-container">
        <div class="tree-node-content" style="background: rgba(0, 242, 254, 0.1); border-color: rgba(0, 242, 254, 0.35);">
          <span style="font-size: 1.1rem;">🏥</span>
          <strong>${h.name || 'Hospital'}</strong>
          <span class="cell-code">${h.hospitalCode || ''}</span>
          ${this.renderStatusBadge(h.status)}
        </div>

        ${buildings.map(bNode => {
          const b = bNode.building || {};
          const floors = bNode.floors || [];
          return `
            <div class="tree-node">
              <div class="tree-node-content">
                <span>🏢</span>
                <strong>${b.name || 'Building'}</strong>
                <span class="cell-code">${b.buildingCode || ''}</span>
                <span style="font-size: 0.75rem; color: var(--text-dim);">${floors.length} floors</span>
              </div>

              ${floors.map(fNode => {
                const f = fNode.floor || {};
                const wards = fNode.wards || [];
                return `
                  <div class="tree-node">
                    <div class="tree-node-content">
                      <span>📶</span>
                      <strong>${f.floorName || 'Floor'}</strong>
                      <span class="type-pill">Level ${f.floorNumber}</span>
                      <span style="font-size: 0.75rem; color: var(--text-dim);">${wards.length} wards</span>
                    </div>

                    ${wards.map(wNode => {
                      const w = wNode.ward || {};
                      const rooms = wNode.rooms || [];
                      return `
                        <div class="tree-node">
                          <div class="tree-node-content">
                            <span>🩺</span>
                            <strong>${w.name || 'Ward'}</strong>
                            <span class="type-pill">${(w.wardType || '').replace(/_/g, ' ')}</span>
                            <span style="font-size: 0.75rem; color: var(--text-dim);">${rooms.length} rooms</span>
                          </div>

                          ${rooms.map(rNode => {
                            const r = rNode.room || {};
                            const beds = rNode.beds || [];
                            return `
                              <div class="tree-node">
                                <div class="tree-node-content">
                                  <span>🚪</span>
                                  <strong>Room ${r.roomNumber || ''}</strong>
                                  ${this.renderReadinessBadge(r.readinessStatus)}
                                  <span style="font-size: 0.75rem; color: var(--text-dim);">${beds.length} beds</span>
                                </div>

                                ${beds.map(b => `
                                  <div class="tree-node">
                                    <div class="tree-node-content">
                                      <span>🛏️</span>
                                      <strong>Bed ${b.bedNumber || ''}</strong>
                                      <span class="type-pill">${(b.bedType || '').replace(/_/g, ' ')}</span>
                                      ${this.renderBedStatusBadge(b.operationalStatus)}
                                    </div>
                                  </div>
                                `).join('')}
                              </div>
                            `;
                          }).join('')}
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

// Global initialization helper
window.HospitalStructureManager = HospitalStructureManager;
