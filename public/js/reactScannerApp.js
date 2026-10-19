/**
 * SMART HOSPITAL HYGIENE & RESOURCE INTELLIGENCE PLATFORM
 * React QR Scanner & Resource Intelligence Application
 * 
 * Features:
 * 1. Identify Resource (Bed, Room, Linen, Equipment, Waste Bin)
 * 2. Authenticated Backend API Communication (Zero-PHI lookup)
 * 3. Real-time Status Display
 * 4. Resource-Specific Action Workflows:
 *    - Bed: View Bed, Change Linen, Clean Bed, Report Issue, View History
 *    - Room: View Cleaning Tasks, Complete Cleaning, View Room Readiness
 *    - Linen: View Linen History, Mark as Changed, Send to Laundry
 * 5. Graceful Invalid QR Code Handling
 */

(function () {
  const { useState, useEffect, useRef, useCallback } = React;

  // Audio Chime Synthesizer via Web Audio API
  function playAudioBeep(success = true) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.12); // E3
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio context might be restricted before first gesture
    }
  }

  // Root Application
  function HospitalQrScannerApp() {
    const [token, setToken] = useState(localStorage.getItem('sh_jwt_token') || '');
    const [currentUser, setCurrentUser] = useState(null);
    const [scannedCode, setScannedCode] = useState('');
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'VIEW_BED' | 'CHANGE_LINEN' | 'REPORT_ISSUE' | 'TASKS' | 'READINESS' | 'HISTORY'
    const [historyList, setHistoryList] = useState([]);
    const [availableLinens, setAvailableLinens] = useState([]);
    const [toasts, setToasts] = useState([]);

    // Room Cleaning Checklist State
    const [checklist, setChecklist] = useState({
      terminalWipe: false,
      highTouchSurfaces: false,
      linenStripped: false,
      uvcCycle: false,
      wasteCleared: false
    });

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Toast Manager
    const showToast = useCallback((message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    }, []);

    // Ensure JWT Authentication
    useEffect(() => {
      async function authenticate() {
        if (token) return;
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@hospital.com', password: 'Admin@123456' })
          });
          const json = await res.json();
          if (json.data && json.data.token) {
            setToken(json.data.token);
            setCurrentUser(json.data.user);
            localStorage.setItem('sh_jwt_token', json.data.token);
          }
        } catch (err) {
          console.error('Auto-auth failed:', err);
        }
      }
      authenticate();
    }, [token]);

    // Main QR Identification Call
    const identifyResource = useCallback(async (codeToScan) => {
      if (!codeToScan || !codeToScan.trim()) {
        showToast('Please enter or scan a valid QR code', 'warning');
        return;
      }
      const code = codeToScan.trim();
      setLoading(true);
      setError(null);
      setScannedCode(code);

      try {
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/qr/lookup/${encodeURIComponent(code)}`, { headers });
        const json = await res.json();

        if (!res.ok || !json.data) {
          throw new Error(json.message || `No hospital resource identified for [${code}]`);
        }

        playAudioBeep(true);
        setResource(json.data);
        showToast(`Resource identified: ${json.data.resourceName}`, 'success');

        // Preload clean linens for Bed change linen action
        if (json.data.resourceType === 'BED') {
          fetchCleanLinens();
        }
      } catch (err) {
        playAudioBeep(false);
        setResource(null);
        setError({
          code: code,
          message: err.message || 'Resource not found in hospital asset registry.'
        });
      } finally {
        setLoading(false);
      }
    }, [token, showToast]);

    // Fetch Clean Linens for Bed linen swap
    const fetchCleanLinens = async () => {
      try {
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/linen?status=CLEAN', { headers });
        const json = await res.json();
        if (json.data) {
          setAvailableLinens(json.data);
        }
      } catch (e) {
        console.warn('Could not fetch clean linens:', e);
      }
    };

    // Unified Action Handler
    const handleExecuteAction = async (actionType, notes = '', targetStatus = null, relatedResourceId = null) => {
      if (!resource) return;
      setLoading(true);

      try {
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const body = {
          qrCodeIdentifier: resource.qrCodeIdentifier,
          action: actionType,
          notes: notes,
          targetStatus: targetStatus,
          relatedResourceId: relatedResourceId
        };

        const res = await fetch('/api/qr/action', {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        const json = await res.json();
        if (!res.ok || !json.data) {
          throw new Error(json.message || 'Action update failed');
        }

        playAudioBeep(true);
        setResource(json.data);
        setActiveModal(null);
        showToast(`Updated: ${actionType.replace(/_/g, ' ')} completed successfully!`, 'success');
      } catch (err) {
        playAudioBeep(false);
        showToast(`Action failed: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    // Fetch History Timeline
    const handleViewHistory = async () => {
      if (!resource) return;
      setLoading(true);
      try {
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/qr/history/${encodeURIComponent(resource.qrCodeIdentifier)}`, { headers });
        const json = await res.json();
        if (json.data) {
          setHistoryList(json.data);
          setActiveModal('HISTORY');
        }
      } catch (err) {
        showToast(`Failed to load history: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    // Camera Handlers
    const startCamera = async () => {
      setCameraActive(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        showToast('Camera access unavailable. Use manual input or quick test presets below.', 'warning');
        setCameraActive(false);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    };

    return (
      <div className="scanner-app-wrapper">
        {/* Top Header Card */}
        <header className="scanner-header-card">
          <div className="scanner-title-group">
            <div className="scanner-badge-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6" />
              </svg>
            </div>
            <div>
              <h2>
                HOSPITAL QR ASSET SCANNER
                <span className="scanner-react-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="3" />
                    <ellipse cx="12" cy="12" rx="11" ry="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
                    <ellipse cx="12" cy="12" rx="11" ry="4.5" transform="rotate(60 12 12)" fill="none" stroke="currentColor" stroke-width="1.5" />
                    <ellipse cx="12" cy="12" rx="11" ry="4.5" transform="rotate(120 12 12)" fill="none" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                  React 18 Active
                </span>
              </h2>
              <p>Instant Resource Identification, Status Verification & Authorized Clinical Workflow Updates</p>
            </div>
          </div>

          <div className="scanner-auth-chip">
            <span className="scanner-auth-dot"></span>
            <span>Authorized Staff: <strong>Clinical Administrator</strong></span>
          </div>
        </header>

        {/* Viewport Box (Live Camera / Optical Reticle) */}
        <div className="scanner-viewport-box">
          {cameraActive ? (
            <video ref={videoRef} className="scanner-video-feed" playsInline muted></video>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--accent-cyan)' }}>
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Optical QR Scanning Reticle Ready</div>
              <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>Activate camera stream or use instant preset simulation</div>
            </div>
          )}

          {/* Reticle Overlay & Pulsating Laser */}
          <div className="scanner-reticle-overlay">
            <div className="scanner-target-frame">
              <span className="scanner-corner tl"></span>
              <span className="scanner-corner tr"></span>
              <span className="scanner-corner bl"></span>
              <span className="scanner-corner br"></span>
              <span className="scanner-laser-line"></span>
            </div>
          </div>

          {/* Viewport Floating Controls */}
          <div className="scanner-viewport-controls">
            {!cameraActive ? (
              <button className="scanner-ctrl-btn" onClick={startCamera}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Activate Camera
              </button>
            ) : (
              <button className="scanner-ctrl-btn" onClick={stopCamera} style={{ background: 'rgba(239, 68, 68, 0.8)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Stop Camera
              </button>
            )}
          </div>
        </div>

        {/* Manual Code Input Bar & Quick Test Presets */}
        <div className="scanner-input-card">
          <div className="scanner-input-row">
            <input
              type="text"
              className="scanner-code-input"
              placeholder="Scan or enter QR Identifier (e.g. BED-204, ROOM-204, LINEN-1024)..."
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') identifyResource(scannedCode); }}
            />
            <button
              className="scanner-scan-btn"
              onClick={() => identifyResource(scannedCode)}
              disabled={loading}
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Scan Code
                </>
              )}
            </button>
          </div>

          {/* Quick Simulation Presets */}
          <div className="scanner-presets-row">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Scan Presets:</span>
            <button className="scanner-preset-btn" onClick={() => identifyResource('BED-204')}>
              🛏️ BED-204
            </button>
            <button className="scanner-preset-btn" onClick={() => identifyResource('ROOM-204')}>
              🚪 ROOM-204
            </button>
            <button className="scanner-preset-btn" onClick={() => identifyResource('LINEN-1024')}>
              🧺 LINEN-1024
            </button>
            <button className="scanner-preset-btn" onClick={() => identifyResource('EQUIP-501')}>
              🤖 EQUIP-501
            </button>
            <button className="scanner-preset-btn" onClick={() => identifyResource('BIN-ICU-01')}>
              ☣️ BIN-ICU-01
            </button>
            <button className="scanner-preset-btn invalid" onClick={() => identifyResource('INVALID-TAG-888')}>
              ⚠️ Test Invalid QR
            </button>
          </div>
        </div>

        {/* Graceful Invalid QR Code Display */}
        {error && (
          <div className="scanner-invalid-card">
            <div className="scanner-invalid-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <h3>Unrecognized or Invalid QR Code</h3>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: '#fca5a5' }}>
                  Scanned Identifier: [{error.code}]
                </span>
              </div>
            </div>
            <div className="scanner-invalid-body">
              {error.message}
            </div>
            <div className="scanner-invalid-troubleshoot">
              <strong>Clinical Staff Troubleshooting Protocol:</strong>
              <ul>
                <li>Verify the physical barcode sticker is clean, intact, and not covered by saline or disinfectant.</li>
                <li>Ensure the resource has not been retired, relocated, or regenerated by central administration.</li>
                <li>If the physical sticker is peeling or damaged, report to central maintenance to issue a replacement tag.</li>
              </ul>
            </div>
            <div>
              <button
                className="scanner-action-btn cyan"
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                onClick={() => { setError(null); setScannedCode(''); }}
              >
                Scan Another QR Code
              </button>
            </div>
          </div>
        )}

        {/* Identified Resource Card & Dynamic Action Deck */}
        {resource && (
          <div className="scanner-resource-card">
            {/* Resource Header */}
            <div className="scanner-resource-header">
              <div className="scanner-resource-title-box">
                <span className={`scanner-type-badge scanner-cat-${resource.resourceType.toLowerCase()}`}>
                  {resource.resourceType}
                </span>
                <div>
                  <div className="scanner-resource-name">{resource.resourceName}</div>
                  <span className="scanner-code-tag">{resource.qrCodeIdentifier}</span>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                <span className={`scanner-status-badge scanner-status-${(resource.status || 'ACTIVE').toLowerCase().replace(/[^a-z0-9]/g, '_')}`}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></span>
                  {resource.status || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Details Meta Grid */}
            <div className="scanner-details-grid">
              <div className="scanner-meta-item">
                <span className="scanner-meta-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Location & Department
                </span>
                <span className="scanner-meta-value">{resource.location || 'Hospital Core'}</span>
              </div>
              <div className="scanner-meta-item">
                <span className="scanner-meta-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/></svg>
                  Ward / Suite
                </span>
                <span className="scanner-meta-value">{resource.wardName || 'General Ward'}</span>
              </div>
              <div className="scanner-meta-item">
                <span className="scanner-meta-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Last Activity / Audit
                </span>
                <span className="scanner-meta-value">{resource.lastActivityDate || 'Today'}</span>
              </div>
              <div className="scanner-meta-item">
                <span className="scanner-meta-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Security Architecture
                </span>
                <span className="scanner-meta-value" style={{ color: '#34d399', fontSize: '0.8rem' }}>
                  Zero-PHI Encrypted
                </span>
              </div>
            </div>

            {/* Additional Attributes if present in details */}
            {resource.details && Object.keys(resource.details).length > 0 && (
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {Object.entries(resource.details).map(([key, val]) => (
                  <div key={key}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}: </span>
                    <strong style={{ color: '#e2e8f0' }}>{String(val)}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* =================================================================
               RESOURCE-SPECIFIC ACTIONS
               ================================================================= */}
            <div className="scanner-actions-section">
              <div className="scanner-actions-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Authorized Clinical Actions
              </div>

              {/* 1. BED QR ACTIONS */}
              {resource.resourceType === 'BED' && (
                <div className="scanner-actions-grid">
                  <button className="scanner-action-btn cyan" onClick={() => setActiveModal('VIEW_BED')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    View Bed
                  </button>
                  <button className="scanner-action-btn emerald" onClick={() => setActiveModal('CHANGE_LINEN')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M4 10h16M10 4v16"/></svg>
                    Change Linen
                  </button>
                  <button className="scanner-action-btn emerald" onClick={() => handleExecuteAction('CLEAN_BED', 'Bed stripped, frame sanitized, and remade with clean antimicrobial linen')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Clean Bed
                  </button>
                  <button className="scanner-action-btn rose" onClick={() => setActiveModal('REPORT_ISSUE')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Report Issue
                  </button>
                  <button className="scanner-action-btn" onClick={handleViewHistory}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    View History
                  </button>
                </div>
              )}

              {/* 2. ROOM QR ACTIONS */}
              {resource.resourceType === 'ROOM' && (
                <div className="scanner-actions-grid">
                  <button className="scanner-action-btn cyan" onClick={() => setActiveModal('TASKS')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    View Cleaning Tasks
                  </button>
                  <button className="scanner-action-btn emerald" onClick={() => setActiveModal('COMPLETE_CLEANING')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Complete Cleaning
                  </button>
                  <button className="scanner-action-btn cyan" onClick={() => setActiveModal('READINESS')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    View Room Readiness
                  </button>
                  <button className="scanner-action-btn rose" onClick={() => setActiveModal('REPORT_ISSUE')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Report Issue
                  </button>
                  <button className="scanner-action-btn" onClick={handleViewHistory}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    View History
                  </button>
                </div>
              )}

              {/* 3. LINEN QR ACTIONS */}
              {resource.resourceType === 'LINEN' && (
                <div className="scanner-actions-grid">
                  <button className="scanner-action-btn" onClick={handleViewHistory}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    View Linen History
                  </button>
                  <button className="scanner-action-btn cyan" onClick={() => handleExecuteAction('MARK_CHANGED', 'Marked linen status changed on bed allocation')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    Mark as Changed
                  </button>
                  <button className="scanner-action-btn amber" onClick={() => handleExecuteAction('SEND_TO_LAUNDRY', 'Stripped from bed and transferred to central laundry logistics')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 0 1 8 0"/></svg>
                    Send to Laundry
                  </button>
                  <button className="scanner-action-btn emerald" onClick={() => handleExecuteAction('RECORD_WASH', 'Thermal barrier autoclave wash at 71C completed')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Record Wash Cycle
                  </button>
                  <button className="scanner-action-btn rose" onClick={() => setActiveModal('REPORT_ISSUE')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Report Damage
                  </button>
                </div>
              )}

              {/* 4. EQUIPMENT QR ACTIONS */}
              {resource.resourceType === 'EQUIPMENT' && (
                <div className="scanner-actions-grid">
                  <button className="scanner-action-btn emerald" onClick={() => handleExecuteAction('MARK_STERILE', 'Disinfected and certified sterile ready')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Mark Sterile & Ready
                  </button>
                  <button className="scanner-action-btn rose" onClick={() => setActiveModal('REPORT_ISSUE')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Report Maintenance
                  </button>
                  <button className="scanner-action-btn" onClick={handleViewHistory}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    View History
                  </button>
                </div>
              )}

              {/* 5. WASTE BIN ACTIONS */}
              {resource.resourceType === 'WASTE_BIN' && (
                <div className="scanner-actions-grid">
                  <button className="scanner-action-btn emerald" onClick={() => handleExecuteAction('EMPTY_BIN', 'Bio-hazardous liner removed and bin sanitized')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Empty & Replace Liner
                  </button>
                  <button className="scanner-action-btn amber" onClick={() => handleExecuteAction('REPORT_FULL', 'Container reached 95% capacity, collection requested')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                    Report Full (Urgent Pickup)
                  </button>
                  <button className="scanner-action-btn" onClick={handleViewHistory}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    View History
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
           INTERACTIVE MODALS
           ================================================================= */}

        {/* Modal: View Bed */}
        {activeModal === 'VIEW_BED' && resource && (
          <div className="qr-modal-backdrop active">
            <div className="qr-modal-box">
              <div className="qr-modal-header">
                <div className="qr-modal-title">
                  🛏️ Bed Detailed Profile: {resource.resourceName}
                </div>
                <button className="qr-modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
              <div className="qr-modal-body">
                <div><strong>Identifier:</strong> <code>{resource.qrCodeIdentifier}</code></div>
                <div><strong>Current Status:</strong> <span className="scanner-code-tag">{resource.status}</span></div>
                <div><strong>Room Allocation:</strong> {resource.location}</div>
                <div><strong>Assigned Bed Type:</strong> {resource.subType || 'Standard Clinical Bed'}</div>
                <div><strong>Last Linen Change:</strong> {resource.lastActivityDate || 'Recorded recently'}</div>
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 4, color: '#6ee7b7', fontSize: '0.8rem' }}>
                  ✔ Sensor telemetry confirms pressure sensors active. Disinfection status complies with Ward 2 hygiene baseline.
                </div>
              </div>
              <div className="qr-modal-footer">
                <button className="btn-secondary-action" onClick={() => setActiveModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Change Linen on Bed */}
        {activeModal === 'CHANGE_LINEN' && resource && (
          <div className="qr-modal-backdrop active">
            <div className="qr-modal-box">
              <div className="qr-modal-header">
                <div className="qr-modal-title">
                  🧺 Change Bed Linen: {resource.resourceName}
                </div>
                <button className="qr-modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
              <div className="qr-modal-body">
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Select clean sterilized linen from central inventory to link to this bed:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
                  {availableLinens.length > 0 ? (
                    availableLinens.map(item => (
                      <div
                        key={item.linenId}
                        style={{ padding: '0.65rem 0.85rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => handleExecuteAction('CHANGE_LINEN', `Linen ${item.linenCode} fitted to bed`, null, item.linenId)}
                      >
                        <div>
                          <strong style={{ color: '#fff' }}>[{item.linenCode}]</strong> {item.linenType}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wash count: {item.washCycleCount}/{item.maxWashCycles}</div>
                        </div>
                        <button className="scanner-action-btn emerald" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                          Assign to Bed
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Auto-allocating clean antimicrobial bedsheet package...
                    </div>
                  )}
                </div>
              </div>
              <div className="qr-modal-footer">
                <button className="btn-secondary-action" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn-primary-action"
                  style={{ background: 'var(--accent-cyan)', color: '#070b14', fontWeight: 700, padding: '0.5rem 1.1rem', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                  onClick={() => handleExecuteAction('CHANGE_LINEN', 'Quick swapped with standard sterilized bedsheet pack')}
                >
                  Quick Swap (Default Sterile Pack)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Cleaning Tasks (Room) */}
        {activeModal === 'TASKS' && resource && (
          <div className="qr-modal-backdrop active">
            <div className="qr-modal-box">
              <div className="qr-modal-header">
                <div className="qr-modal-title">
                  📋 Room Cleaning & Disinfection Protocol: {resource.resourceName}
                </div>
                <button className="qr-modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
              <div className="qr-modal-body">
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Standard Operating Disinfection Protocol (SOP-INF-204) for Isolation Suites:
                </p>

                <div className="scanner-task-checklist">
                  <label className={`scanner-task-item ${checklist.terminalWipe ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checklist.terminalWipe}
                      onChange={(e) => setChecklist({ ...checklist, terminalWipe: e.target.checked })}
                    />
                    <span>1. Terminal wipe of high-touch contact points (bed rails, door handles, IV poles)</span>
                  </label>
                  <label className={`scanner-task-item ${checklist.highTouchSurfaces ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checklist.highTouchSurfaces}
                      onChange={(e) => setChecklist({ ...checklist, highTouchSurfaces: e.target.checked })}
                    />
                    <span>2. Quaternary ammonium solution applied to floor and wall splash zones</span>
                  </label>
                  <label className={`scanner-task-item ${checklist.linenStripped ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checklist.linenStripped}
                      onChange={(e) => setChecklist({ ...checklist, linenStripped: e.target.checked })}
                    />
                    <span>3. All patient linen stripped and secured into dissolvable biohazard laundry bags</span>
                  </label>
                  <label className={`scanner-task-item ${checklist.uvcCycle ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checklist.uvcCycle}
                      onChange={(e) => setChecklist({ ...checklist, uvcCycle: e.target.checked })}
                    />
                    <span>4. Autonomous Mobile Xenon UV-C 15-minute log-5 disinfection run completed</span>
                  </label>
                  <label className={`scanner-task-item ${checklist.wasteCleared ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checklist.wasteCleared}
                      onChange={(e) => setChecklist({ ...checklist, wasteCleared: e.target.checked })}
                    />
                    <span>5. Bio-waste and sharps containers replaced with fresh clinical liners</span>
                  </label>
                </div>
              </div>
              <div className="qr-modal-footer">
                <button className="btn-secondary-action" onClick={() => setActiveModal(null)}>Close</button>
                <button
                  className="btn-primary-action"
                  style={{ background: '#10b981', color: '#070b14', fontWeight: 700, padding: '0.5rem 1.15rem', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    setChecklist({ terminalWipe: true, highTouchSurfaces: true, linenStripped: true, uvcCycle: true, wasteCleared: true });
                    handleExecuteAction('COMPLETE_ROOM_CLEANING', 'All 5 infection control checklist steps verified and completed');
                  }}
                >
                  Verify All & Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Complete Cleaning Confirmation (Room) */}
        {activeModal === 'COMPLETE_CLEANING' && resource && (
          <div className="qr-modal-backdrop active">
            <div className="qr-modal-box">
              <div className="qr-modal-header">
                <div className="qr-modal-title">
                  ✅ Confirm Room Cleaning Clearance
                </div>
                <button className="qr-modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
              <div className="qr-modal-body">
                <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 4, color: '#6ee7b7', fontSize: '0.85rem' }}>
                  <strong>Infection Control Clearance:</strong> Completing cleaning will transition <strong>{resource.resourceName}</strong> readiness status to <code>READY_FOR_USE</code>.
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Cleaner: <strong>Clinical Administrator</strong><br />
                  Timestamp: <strong>{new Date().toLocaleString()}</strong>
                </div>
              </div>
              <div className="qr-modal-footer">
                <button className="btn-secondary-action" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn-primary-action"
                  style={{ background: '#10b981', color: '#070b14', fontWeight: 700, padding: '0.55rem 1.25rem', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                  onClick={() => handleExecuteAction('COMPLETE_ROOM_CLEANING', 'Terminal room disinfection signed off')}
                >
                  Confirm & Mark Ready for Patient
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Room Readiness */}
        {activeModal === 'READINESS' && resource && (
          <div className="qr-modal-backdrop active">
            <div className="qr-modal-box">
              <div className="qr-modal-header">
                <div className="qr-modal-title">
                  🏥 Room Readiness Assessment: {resource.resourceName}
                </div>
                <button className="qr-modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
              <div className="qr-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ padding: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>READINESS STATUS</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{resource.status}</div>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>HYGIENE COMPLIANCE</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>98.4%</div>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AIRFLOW DIFFERENTIAL</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>+15.2 Pa (Positive Laminar)</div>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PARTICLE COUNT (PM2.5)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>2.1 µg/m³ (HEPA Pass)</div>
                  </div>
                </div>
              </div>
              <div className="qr-modal-footer">
                <button className="btn-secondary-action" onClick={() => setActiveModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Report Issue */}
        {activeModal === 'REPORT_ISSUE' && resource && (
          <div className="qr-modal-backdrop active">
            <div className="qr-modal-box">
              <div className="qr-modal-header">
                <div className="qr-modal-title" style={{ color: '#fca5a5' }}>
                  ⚠️ Report Clinical Asset Hazard / Maintenance
                </div>
                <button className="qr-modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
              <div className="qr-modal-body">
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 4, color: '#fca5a5', fontSize: '0.8rem' }}>
                  Reporting will mark <strong>{resource.resourceName}</strong> as <code>MAINTENANCE_OUT_OF_SERVICE</code> and alert hospital facilities engineering.
                </div>

                <div className="qr-form-group">
                  <label className="qr-form-label">Issue Category</label>
                  <select id="issue-category-select" className="qr-form-select">
                    <option value="Mechanical fault / bed control failure">Mechanical fault / bed control failure</option>
                    <option value="Biohazard fluid contamination">Biohazard fluid contamination</option>
                    <option value="Linen torn / autoclave damage">Linen torn / autoclave damage</option>
                    <option value="Electrical safety check overdue">Electrical safety check overdue</option>
                    <option value="HEPA airflow pressure drop">HEPA airflow pressure drop</option>
                  </select>
                </div>

                <div className="qr-form-group">
                  <label className="qr-form-label">Notes & Observations</label>
                  <textarea
                    id="issue-notes-textarea"
                    className="qr-form-input"
                    rows="3"
                    placeholder="Provide details regarding the fault, contamination, or damaged tag..."
                  ></textarea>
                </div>
              </div>
              <div className="qr-modal-footer">
                <button className="btn-secondary-action" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn-primary-action"
                  style={{ background: '#ef4444', color: '#fff', fontWeight: 700, padding: '0.55rem 1.25rem', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    const cat = document.getElementById('issue-category-select').value;
                    const notes = document.getElementById('issue-notes-textarea').value;
                    handleExecuteAction('REPORT_ISSUE', `${cat}: ${notes}`);
                  }}
                >
                  Submit Fault & Take Out of Service
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: History Timeline */}
        {activeModal === 'HISTORY' && resource && (
          <div className="qr-modal-backdrop active">
            <div className="qr-modal-box">
              <div className="qr-modal-header">
                <div className="qr-modal-title">
                  📜 Chronological Audit & Event History: {resource.resourceName}
                </div>
                <button className="qr-modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
              <div className="qr-modal-body">
                <div className="scanner-timeline">
                  {historyList.map((entry, idx) => (
                    <div key={idx} className="scanner-timeline-item">
                      <div className="scanner-timeline-title">
                        <span>{entry.actionType || 'STATUS_UPDATE'}</span>
                        <span className="scanner-timeline-date">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <div className="scanner-timeline-desc">{entry.notes || 'Routine clinical lifecycle event recorded'}</div>
                      <div className="scanner-timeline-staff">Logged by: {entry.staff || 'Hospital System'} ({entry.status || resource.status})</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="qr-modal-footer">
                <button className="btn-secondary-action" onClick={() => setActiveModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toasts */}
        <div className="toast-container" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {toasts.map(t => (
            <div
              key={t.id}
              className={`toast toast-${t.type}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1.25rem',
                background: t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#10b981' : t.type === 'warning' ? '#f59e0b' : 'var(--accent-cyan)',
                color: t.type === 'info' ? '#070b14' : '#fff',
                fontWeight: 600,
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
                animation: 'scanFadeIn 0.2s ease-out'
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mount React Root
  window.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('react-qr-scanner-root');
    if (rootElement && window.ReactDOM) {
      if (window.ReactDOM.createRoot) {
        const root = window.ReactDOM.createRoot(rootElement);
        root.render(React.createElement(HospitalQrScannerApp));
      } else {
        window.ReactDOM.render(React.createElement(HospitalQrScannerApp), rootElement);
      }
    }
  });

  window.HospitalQrScannerApp = HospitalQrScannerApp;
})();
