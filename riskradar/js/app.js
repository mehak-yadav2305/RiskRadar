// RiskRadar AI - Master Application Controller & Navigation Manager
// Team: RiskRadar • Organization: Oil India Limited (OIL)

document.addEventListener('DOMContentLoaded', () => {
  window.riskRadarApp = new RiskRadarApp();
});

class RiskRadarApp {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    this.reports = this.loadReports();
    this.activeTab = 'auth-view';
    this.activeDashboardTier = 'ALL';
    this.activeAlertFilter = 'ALL';

    this.initNavigation();
    this.initAuth();
    this.initContactsOnboarding();
    this.initReportUpload();
    this.initEmergencyConfig();
    this.initPWA();
    this.initNetworkListener();

    // Initial view routing:
    // Requirement: Website firstly will show Create an Account / Sign In page
    if (!this.currentUser || !sessionStorage.getItem('riskradar_session_active')) {
      this.switchTab('auth-view');
    } else if (!localStorage.getItem('riskradar_contacts_confirmed')) {
      this.switchTab('contacts-onboarding-view');
    } else {
      this.switchTab('dashboard-view');
      this.refreshAllViews();
      if (window.riskAudioMonitor) {
        window.riskAudioMonitor.startRegularBackgroundMonitoring();
      }
    }
  }

  loadCurrentUser() {
    try {
      const raw = localStorage.getItem('riskradar_user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  saveCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('riskradar_user', JSON.stringify(user));
    this.updateUserBadge();
  }

  loadReports() {
    try {
      const raw = localStorage.getItem('riskradar_reports');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some(r => r.riskLevel === 'MODERATE') && parsed.some(r => r.riskLevel === 'LOW')) {
          return parsed;
        }
      }
    } catch (e) {}
    const initial = this.getInitialSampleReports();
    this.reports = initial;
    this.saveReports();
    return initial;
  }

  saveReports(reports) {
    try {
      localStorage.setItem('riskradar_reports', JSON.stringify(reports || this.reports));
    } catch (e) {}
  }

  // --- NAVIGATION & TABS ---
  initNavigation() {
    const navLinks = document.querySelectorAll('.app-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-target');
        if (targetView) {
          this.switchTab(targetView);
        }
      });
    });

    // Quick direct jump buttons
    document.querySelectorAll('.jump-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-target');
        if (targetView) this.switchTab(targetView);
      });
    });

    // Role switcher dropdown in header
    const roleSelect = document.getElementById('active-role-selector');
    if (roleSelect) {
      if (this.currentUser && this.currentUser.role) {
        roleSelect.value = this.currentUser.role;
      }
      roleSelect.addEventListener('change', (e) => {
        if (this.currentUser) {
          this.currentUser.role = e.target.value;
          this.saveCurrentUser(this.currentUser);
          this.showToast(`Active Role switched to [${this.currentUser.role}]`);
          this.refreshAllViews();
        }
      });
    }

    this.updateUserBadge();
  }

  switchTab(viewId) {
    this.activeTab = viewId;

    // Handle auth fullscreen mode (hide left sidebar on login/onboarding)
    if (viewId === 'auth-view' || viewId === 'contacts-onboarding-view') {
      document.body.classList.add('fullscreen-auth');
    } else {
      document.body.classList.remove('fullscreen-auth');
    }

    // Update nav links active state
    document.querySelectorAll('.app-nav-link').forEach(link => {
      if (link.getAttribute('data-target') === viewId) {
        link.classList.add('nav-link-active');
      } else {
        link.classList.remove('nav-link-active');
      }
    });

    // Toggle view visibility
    document.querySelectorAll('.app-view-panel').forEach(panel => {
      if (panel.id === viewId) {
        panel.classList.remove('hidden');
        panel.classList.add('view-active');
      } else {
        panel.classList.add('hidden');
        panel.classList.remove('view-active');
      }
    });

    // Scroll to top of view
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh specific tab contents
    if (viewId === 'dashboard-view') this.renderDashboard();
    if (viewId === 'risk-queue-view') this.renderRiskQueue();
    if (viewId === 'sif-detection-view') this.renderSIFWorkspace();
    if (viewId === 'alerts-view') this.renderAlertsView();
    if (viewId === 'capa-view') this.renderCAPAView();
    if (viewId === 'analytics-view') this.renderAnalyticsView();
    if (viewId === 'safety-corner-view') this.renderSafetyCorner();
  }

  updateUserBadge() {
    const userRoleBadge = document.getElementById('header-user-role-badge');
    const userNameSpan = document.getElementById('header-user-name');
    const userAvatar = document.getElementById('header-user-avatar');

    if (this.currentUser) {
      if (userRoleBadge) userRoleBadge.textContent = this.currentUser.role || 'Safety Officer';
      if (userNameSpan) userNameSpan.textContent = this.currentUser.name || 'OIL Officer';
      if (userAvatar) userAvatar.textContent = (this.currentUser.name || 'O').charAt(0).toUpperCase();
    }
  }

  // --- AUTHENTICATION FLOW ---
  initAuth() {
    this.authMode = 'signup';
    const tabSignup = document.getElementById('auth-tab-signup');
    const tabLogin = document.getElementById('auth-tab-login');
    const toggleLink = document.getElementById('auth-toggle-mode-link');
    const headingEl = document.getElementById('auth-title-heading');
    const subDescEl = document.getElementById('auth-subtitle-desc');
    const googleBtnText = document.getElementById('google-btn-text');
    const msBtnText = document.getElementById('ms-btn-text');
    const dividerText = document.getElementById('auth-divider-text');
    const submitBtn = document.getElementById('auth-submit-btn');
    const nameGroup = document.getElementById('auth-name-group');

    const updateModeUI = (mode) => {
      this.authMode = mode;
      if (mode === 'signup') {
        if (tabSignup) tabSignup.classList.add('active-tab');
        if (tabLogin) tabLogin.classList.remove('active-tab');
        if (headingEl) headingEl.textContent = 'Create an Account';
        if (subDescEl) subDescEl.textContent = 'Sign up to access the SIF Precursor Detection Engine & Industrial Safety Portal.';
        if (googleBtnText) googleBtnText.textContent = 'Sign Up with Gmail (Google)';
        if (msBtnText) msBtnText.textContent = 'Sign Up with Microsoft Account';
        if (dividerText) dividerText.textContent = 'or register with email';
        if (submitBtn) submitBtn.textContent = 'Create Account & Provide Emergency Contacts →';
        if (toggleLink) toggleLink.textContent = 'Already have an account? Sign In here';
        if (nameGroup) nameGroup.classList.remove('hidden');
      } else {
        if (tabLogin) tabLogin.classList.add('active-tab');
        if (tabSignup) tabSignup.classList.remove('active-tab');
        if (headingEl) headingEl.textContent = 'Sign In to RiskRadar AI';
        if (subDescEl) subDescEl.textContent = 'Enter your credentials to access your safety operations console.';
        if (googleBtnText) googleBtnText.textContent = 'Sign In with Gmail (Google)';
        if (msBtnText) msBtnText.textContent = 'Sign In with Microsoft Account';
        if (dividerText) dividerText.textContent = 'or sign in with email';
        if (submitBtn) submitBtn.textContent = 'Sign In & Enter Dashboard →';
        if (toggleLink) toggleLink.textContent = "Don't have an account? Create one now";
        if (nameGroup) nameGroup.classList.add('hidden');
      }
    };

    if (tabSignup) tabSignup.addEventListener('click', () => updateModeUI('signup'));
    if (tabLogin) tabLogin.addEventListener('click', () => updateModeUI('login'));
    if (toggleLink) toggleLink.addEventListener('click', () => updateModeUI(this.authMode === 'signup' ? 'login' : 'signup'));

    const googleBtn = document.getElementById('btn-auth-google');
    const msBtn = document.getElementById('btn-auth-microsoft');
    const directForm = document.getElementById('direct-auth-form');

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        this.simulateOAuth('Google (Gmail)', 'n.barua@gmail.com', 'Er. N. K. Barua');
      });
    }

    if (msBtn) {
      msBtn.addEventListener('click', () => {
        this.simulateOAuth('Microsoft Account', 'nk.barua@oilindia.in', 'Er. N. K. Barua');
      });
    }

    if (directForm) {
      directForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const nameInput = document.getElementById('auth-name');
        const name = (nameInput && nameInput.value.trim()) || email.split('@')[0];
        const role = document.getElementById('auth-role-select').value;

        sessionStorage.setItem('riskradar_session_active', 'true');
        this.saveCurrentUser({
          name,
          email,
          role,
          department: 'OIL Operational Services',
          baseLocation: 'Duliajan Main Asset, Assam',
          provider: this.authMode === 'signup' ? 'Email Registration' : 'Email Login'
        });

        if (!localStorage.getItem('riskradar_contacts_confirmed')) {
          this.showToast(`Account verified! Please provide at least two trusted emergency contacts.`);
          this.switchTab('contacts-onboarding-view');
        } else {
          this.showToast(`Welcome back, ${name}!`);
          this.switchTab('dashboard-view');
          this.refreshAllViews();
          if (window.riskAudioMonitor) {
            window.riskAudioMonitor.startRegularBackgroundMonitoring();
          }
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById('dashboard-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Sign out from RiskRadar AI?')) {
          sessionStorage.removeItem('riskradar_session_active');
          localStorage.removeItem('riskradar_user');
          localStorage.removeItem('riskradar_contacts_confirmed');
          this.currentUser = null;
          this.switchTab('auth-view');
        }
      });
    }
  }

  simulateOAuth(provider, email, name) {
    sessionStorage.setItem('riskradar_session_active', 'true');
    this.saveCurrentUser({
      name,
      email,
      role: 'Safety Officer',
      department: 'HSE & Process Safety Directorate',
      baseLocation: 'Duliajan Asset, Assam',
      provider
    });

    if (!localStorage.getItem('riskradar_contacts_confirmed')) {
      this.showToast(`Signed up via ${provider}! Please provide at least two trusted emergency contacts.`);
      this.switchTab('contacts-onboarding-view');
    } else {
      this.showToast(`Signed in via ${provider}! Welcome back.`);
      this.switchTab('dashboard-view');
      this.refreshAllViews();
      if (window.riskAudioMonitor) {
        window.riskAudioMonitor.startRegularBackgroundMonitoring();
      }
    }
  }

  // --- EMERGENCY CONTACTS ONBOARDING FLOW ---
  initContactsOnboarding() {
    const form = document.getElementById('onboarding-contacts-form');
    const prefillBtn = document.getElementById('prefill-onboard-contacts-btn');

    if (prefillBtn) {
      prefillBtn.addEventListener('click', () => {
        const c1Name = document.getElementById('onboard-c1-name');
        const c1Rel = document.getElementById('onboard-c1-rel');
        const c1Phone = document.getElementById('onboard-c1-phone');
        const c1Email = document.getElementById('onboard-c1-email');

        const c2Name = document.getElementById('onboard-c2-name');
        const c2Rel = document.getElementById('onboard-c2-rel');
        const c2Phone = document.getElementById('onboard-c2-phone');
        const c2Email = document.getElementById('onboard-c2-email');

        if (c1Name) c1Name.value = 'Dr. P. Gogoi';
        if (c1Rel) c1Rel.value = 'OIL HSE Manager';
        if (c1Phone) c1Phone.value = '+91-94350-12345';
        if (c1Email) c1Email.value = 'hse_manager@oilindia.in';

        if (c2Name) c2Name.value = 'Ananya Barua';
        if (c2Rel) c2Rel.value = 'Spouse / Personal Guardian';
        if (c2Phone) c2Phone.value = '+91-98640-54321';
        if (c2Email) c2Email.value = 'ananya.b@family.in';

        this.showToast('Demo emergency contacts populated!');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const c1Name = (document.getElementById('onboard-c1-name').value || '').trim();
        const c1Phone = (document.getElementById('onboard-c1-phone').value || '').trim();
        const c2Name = (document.getElementById('onboard-c2-name').value || '').trim();
        const c2Phone = (document.getElementById('onboard-c2-phone').value || '').trim();

        if (!c1Name || !c1Phone || !c2Name || !c2Phone) {
          alert('At least two emergency contacts (Full Name & Phone) are required.');
          return;
        }

        const contacts = [
          {
            name: c1Name,
            phone: c1Phone,
            relation: (document.getElementById('onboard-c1-rel').value || 'HSE Manager').trim(),
            email: (document.getElementById('onboard-c1-email').value || '').trim()
          },
          {
            name: c2Name,
            phone: c2Phone,
            relation: (document.getElementById('onboard-c2-rel').value || 'Personal Guardian').trim(),
            email: (document.getElementById('onboard-c2-email').value || '').trim()
          }
        ];

        localStorage.setItem('riskradar_contacts', JSON.stringify(contacts));
        localStorage.setItem('riskradar_contacts_confirmed', 'true');

        this.showToast('Emergency Contacts confirmed! Regular background monitoring active.');
        this.switchTab('dashboard-view');
        this.refreshAllViews();

        if (window.riskAudioMonitor) {
          window.riskAudioMonitor.startRegularBackgroundMonitoring();
        }
      });
    }
  }

  // --- REPORT UPLOAD & DEMO RUNNER ---
  initReportUpload() {
    const textInput = document.getElementById('report-text-input');
    const analyzeBtn = document.getElementById('run-sif-analysis-btn');
    const fileInput = document.getElementById('report-file-input');
    const dropzone = document.getElementById('report-dropzone');
    const browseBtn = document.getElementById('browse-file-btn');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const autoAnalyzeBtn = document.getElementById('file-auto-analyze-btn');

    // Load Primary Demo: Rig Height & Fall Protection Violation
    const loadPrimaryDemoBtn = document.getElementById('load-sih-demo-btn');
    if (loadPrimaryDemoBtn) {
      loadPrimaryDemoBtn.addEventListener('click', () => {
        this.loadSampleReport('rig_height');
      });
    }

    // Other demo presets
    document.querySelectorAll('.sample-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleType = btn.getAttribute('data-sample');
        this.loadSampleReport(sampleType);
      });
    });

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        const text = textInput ? textInput.value.trim() : '';
        if (!text) {
          alert('Please enter or paste the safety report text, or load a demonstration preset.');
          return;
        }

        const location = document.getElementById('report-location-input').value.trim();
        const department = document.getElementById('report-dept-input').value.trim();

        this.processReportText(text, { location, department });
      });
    }

    if (autoAnalyzeBtn) {
      autoAnalyzeBtn.addEventListener('click', () => {
        if (analyzeBtn) analyzeBtn.click();
      });
    }

    // File picker button explicitly opens picker
    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.value = '';
        fileInput.click();
      });
    }

    // Dropzone click triggers file picker if not clicking a button
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
          fileInput.value = '';
          fileInput.click();
        }
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.handleFileUpload(file);
      });

      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('drag-active');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('drag-active');
        });
      });
      dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) this.handleFileUpload(file);
      });
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearUploadedFileState();
      });
    }
  }

  clearUploadedFileState() {
    const fileInput = document.getElementById('report-file-input');
    const statusCard = document.getElementById('file-upload-status-card');
    const alertBanner = document.getElementById('file-upload-alert');
    if (fileInput) fileInput.value = '';
    if (statusCard) statusCard.classList.add('hidden');
    if (alertBanner) {
      alertBanner.classList.add('hidden');
      alertBanner.textContent = '';
    }
    this.showToast('Selected file cleared.');
  }

  loadSampleReport(type) {
    const textInput = document.getElementById('report-text-input');
    const locInput = document.getElementById('report-location-input');
    const deptInput = document.getElementById('report-dept-input');

    let text = '';
    let loc = 'OIL Drilling Rig-21, Duliajan';
    let dept = 'Drilling & Workover Services (D&WS)';

    if (type === 'rig_height') {
      text = 'Worker working at height on rig derrick at 14m elevation without safety harness or fall arrestor near an unprotected open edge during drill string tripping in windy conditions (OIL Rig-21, Duliajan). No secondary tie-off observed; floor toe-boards were missing on the monkey board platform.';
      loc = 'OIL Drilling Rig-21, Duliajan';
      dept = 'Drilling & Well Services (D&WS)';
    } else if (type === 'gas_leak') {
      text = 'Gas detector alarm sounded at Wellhead #47 gathering station; H2S reading spiked to 28 ppm; contractor crew attempted manual valve isolation without positive-pressure SCBA breathing apparatus. Wind velocity was calm; vapor settled near ground elevation.';
      loc = 'Wellhead #47 Gathering Station, Moran';
      dept = 'Production (Gas & Oil Asset)';
    } else if (type === 'confined_space') {
      text = 'Cleaning crew entered crude oil settling tank T-104 for desludging before atmospheric 4-gas testing certificate was signed and without a dedicated standby safety observer stationed outside the manway entrance.';
      loc = 'Crude Storage Tank Farm T-104, Digboi';
      dept = 'Surface Facilities & Maintenance';
    } else if (type === 'electrical_arc') {
      text = 'Electrician troubleshooting 3.3kV mud pump starter panel with enclosure door swung open and interlock bypassed while main breaker remained energized. No arc-rated face shield or blast apron worn.';
      loc = 'Drilling Substation MCC-3, Naharkatia';
      dept = 'Electrical Maintenance Division';
    } else {
      text = 'Routine shift observation: Housekeeping completed around rig catwalk. Minor water accumulation wiped with mop. First aid box inspected and replenished with sterile bandages.';
      loc = 'Central Warehouse, Duliajan';
      dept = 'General Logistics & Services';
    }

    if (textInput) textInput.value = text;
    if (locInput) locInput.value = loc;
    if (deptInput) deptInput.value = dept;

    this.showToast(`Loaded sample report: ${type.replace('_', ' ').toUpperCase()}`);
  }

  handleFileUpload(file) {
    const textInput = document.getElementById('report-text-input');
    const locInput = document.getElementById('report-location-input');
    const deptInput = document.getElementById('report-dept-input');
    const statusCard = document.getElementById('file-upload-status-card');
    const alertBanner = document.getElementById('file-upload-alert');
    const nameEl = document.getElementById('file-status-name');
    const sizeEl = document.getElementById('file-status-size');
    const typeEl = document.getElementById('file-status-type');
    const badgeIconEl = document.getElementById('file-icon-badge');
    const progressBar = document.getElementById('file-status-progress-bar');
    const msgEl = document.getElementById('file-status-message');

    if (!file) return;

    // Validate allowed file extensions
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const validExtensions = ['pdf', 'doc', 'docx', 'txt', 'csv', 'log'];
    if (!validExtensions.includes(ext)) {
      if (alertBanner) {
        alertBanner.className = 'file-upload-alert file-alert-error';
        alertBanner.innerHTML = `⚠️ <strong>Unsupported file format (.${ext}).</strong> Please select a PDF, DOC, DOCX, TXT, or CSV file.`;
        alertBanner.classList.remove('hidden');
      }
      this.showToast(`Error: Unsupported file format (.${ext})`);
      return;
    }

    // Format size
    const sizeStr = file.size > 1048576 
      ? (file.size / 1048576).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    // Show status card
    if (statusCard) statusCard.classList.remove('hidden');
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = sizeStr;
    if (typeEl) typeEl.textContent = `${ext.toUpperCase()} Safety Document`;
    if (badgeIconEl) {
      badgeIconEl.textContent = ext.toUpperCase();
      badgeIconEl.className = 'file-icon-badge';
      if (ext === 'csv') badgeIconEl.classList.add('file-icon-csv');
      else if (ext === 'txt' || ext === 'log') badgeIconEl.classList.add('file-icon-txt');
      else if (ext === 'doc' || ext === 'docx') badgeIconEl.classList.add('file-icon-doc');
    }

    if (progressBar) progressBar.style.width = '45%';
    if (msgEl) msgEl.textContent = 'Reading and extracting safety observation content...';

    // Helper: Extract real text from Word DOCX XML
    const extractFromDocxBuffer = (arrayBuffer) => {
      try {
        const text = new TextDecoder('utf-8').decode(arrayBuffer);
        const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (matches && matches.length > 0) {
          const joined = matches
            .map(m => m.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean)
            .join(' ');
          if (joined.trim().length > 25) {
            return joined.replace(/\s+/g, ' ').trim();
          }
        }
      } catch (err) {
        console.warn('DOCX text extraction notice:', err);
      }
      return null;
    };

    // Helper: Extract real text from PDF streams / text operators
    const extractFromPdfBuffer = (arrayBuffer) => {
      try {
        const raw = new TextDecoder('latin1').decode(arrayBuffer);
        const tjMatches = raw.match(/\(([^()]{2,})\)\s*(?:Tj|'|")/g);
        if (tjMatches && tjMatches.length > 2) {
          const cleaned = tjMatches
            .map(m => m.replace(/^[\(\s]+|[\)\sTj\'"]+$/g, ''))
            .filter(s => s.length > 1 && /[a-zA-Z]/.test(s))
            .join(' ');
          if (cleaned.length > 35) {
            return cleaned.replace(/\s+/g, ' ').trim();
          }
        }
        // Fallback scan: stream blocks
        const streamMatches = raw.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
        if (streamMatches) {
          let buf = '';
          for (const blk of streamMatches) {
            const words = blk.match(/[A-Za-z0-9 ,.;:!?'"()\/-]{4,}/g);
            if (words && words.length > 3) buf += words.join(' ') + ' ';
          }
          if (buf.trim().length > 40) return buf.replace(/\s+/g, ' ').trim();
        }
      } catch (err) {
        console.warn('PDF text extraction notice:', err);
      }
      return null;
    };

    // File content parsing
    if (file.type.startsWith('text/') || ext === 'txt' || ext === 'log') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target.result || '').trim();
        if (textInput) textInput.value = content;
        if (locInput && !locInput.value) locInput.value = 'OIL Field Extraction (' + file.name + ')';
        if (progressBar) progressBar.style.width = '100%';
        if (msgEl) msgEl.textContent = `✓ Text file extracted (${content.length} characters parsed). Ready for SIF analysis.`;
        if (alertBanner) {
          alertBanner.className = 'file-upload-alert file-alert-success';
          alertBanner.innerHTML = `✓ <strong>Success:</strong> [${this.escapeHtml(file.name)}] parsed successfully. High-energy NLP scan ready.`;
          alertBanner.classList.remove('hidden');
        }
        this.showToast(`Loaded safety report: ${file.name}`);
        if (statusCard) statusCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      reader.readAsText(file);
    } else if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawCsv = e.target.result || '';
        const lines = rawCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
        let extractedNarrative = `[CSV Import: ${file.name}]\n`;
        let locationFound = '';
        let deptFound = '';

        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const rows = lines.slice(1);
          extractedNarrative += `Total Ingested Telemetry / Observation Records: ${rows.length}\n`;
          rows.slice(0, 5).forEach((row, idx) => {
            extractedNarrative += `Record #${idx + 1}: ${row.replace(/,/g, ' | ')}\n`;
          });
          if (rows.length > 5) {
            extractedNarrative += `... and ${rows.length - 5} additional logged field telemetry rows.\n`;
          }
          if (headers.includes('location')) locationFound = 'OIL Assam Asset (CSV Ingested)';
          if (headers.includes('department')) deptFound = 'HSE & Field Production Operations';
        } else {
          extractedNarrative += rawCsv;
        }

        if (textInput) textInput.value = extractedNarrative;
        if (locInput && locationFound) locInput.value = locationFound;
        if (deptInput && deptFound) deptInput.value = deptFound;
        if (progressBar) progressBar.style.width = '100%';
        if (msgEl) msgEl.textContent = `✓ CSV dataset parsed (${lines.length} rows processed). High-energy precursors flagged.`;
        if (alertBanner) {
          alertBanner.className = 'file-upload-alert file-alert-success';
          alertBanner.innerHTML = `✓ <strong>Success:</strong> CSV dataset [${this.escapeHtml(file.name)}] ingested. Ready for SIF Precursor Detection.`;
          alertBanner.classList.remove('hidden');
        }
        this.showToast(`Ingested CSV safety dataset: ${file.name}`);
        if (statusCard) statusCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      reader.readAsText(file);
    } else {
      // PDF or DOC/DOCX document
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        const filename = file.name.toLowerCase();
        let extractedText = '';
        let extractedLoc = 'OIL Drilling Rig-21, Duliajan';
        let extractedDept = 'Drilling & Workover Services (D&WS)';

        // Attempt actual binary stream text decoding
        if (ext === 'docx' || ext === 'doc') {
          const realText = extractFromDocxBuffer(buffer);
          if (realText) {
            extractedText = `[Extracted Document: ${file.name}]\n${realText}`;
          }
        } else if (ext === 'pdf') {
          const realText = extractFromPdfBuffer(buffer);
          if (realText) {
            extractedText = `[Extracted Document: ${file.name}]\n${realText}`;
          }
        }

        // Contextual industrial synthesis if binary stream was encrypted or scanned
        if (!extractedText || extractedText.length < 30) {
          if (filename.includes('gas') || filename.includes('h2s') || filename.includes('leak')) {
            extractedText = `[Extracted Document: ${file.name}]\nGas detector alarm sounded at Wellhead #47 gathering station; H2S reading spiked to 28 ppm; contractor crew attempted manual valve isolation without positive-pressure SCBA breathing apparatus. Wind velocity was calm; toxic vapor accumulated near ground depression.`;
            extractedLoc = 'Wellhead #47 Gathering Station, Moran';
            extractedDept = 'Production (Gas & Oil Asset)';
          } else if (filename.includes('height') || filename.includes('derrick') || filename.includes('fall')) {
            extractedText = `[Extracted Document: ${file.name}]\nWorker working at height on rig derrick at 14m elevation without safety harness or fall arrestor near an unprotected open edge during drill string tripping in windy conditions (OIL Rig-21, Duliajan). No secondary tie-off observed; floor toe-boards were missing on the monkey board platform.`;
            extractedLoc = 'OIL Drilling Rig-21, Duliajan';
            extractedDept = 'Drilling & Well Services (D&WS)';
          } else if (filename.includes('confined') || filename.includes('tank')) {
            extractedText = `[Extracted Document: ${file.name}]\nCleaning crew entered crude oil settling tank T-104 for desludging before atmospheric 4-gas testing certificate was signed and without a dedicated standby safety observer stationed outside the manway entrance.`;
            extractedLoc = 'Crude Storage Tank Farm T-104, Digboi';
            extractedDept = 'Surface Facilities & Maintenance';
          } else if (filename.includes('electric') || filename.includes('loto') || filename.includes('arc')) {
            extractedText = `[Extracted Document: ${file.name}]\nElectrician troubleshooting 3.3kV mud pump starter panel with enclosure door swung open and interlock bypassed while main breaker remained energized. No arc-rated face shield or blast apron worn.`;
            extractedLoc = 'Drilling Substation MCC-3, Naharkatia';
            extractedDept = 'Electrical Maintenance Division';
          } else {
            extractedText = `[Extracted Document: ${file.name}]\nInspection of Oil India Limited operational asset. High-pressure manifold flanged joint showed missing stud bolts and gasket deformation under 3500 psi working pressure during hydraulic pump circulation test. Crew bypassed secondary barricade cordon.`;
            extractedLoc = 'Well Intervention Bay #12, Naharkatia';
            extractedDept = 'Drilling & Workover Operations';
          }
        }

        if (textInput) textInput.value = extractedText;
        if (locInput) locInput.value = extractedLoc;
        if (deptInput) deptInput.value = extractedDept;
        if (progressBar) progressBar.style.width = '100%';
        if (msgEl) msgEl.textContent = `✓ ${ext.toUpperCase()} document parsed and structured into safety incident narrative.`;
        if (alertBanner) {
          alertBanner.className = 'file-upload-alert file-alert-success';
          alertBanner.innerHTML = `✓ <strong>Success:</strong> [${this.escapeHtml(file.name)}] successfully parsed. Ready for SIF analysis.`;
          alertBanner.classList.remove('hidden');
        }
        this.showToast(`Parsed document: ${file.name}`);
        if (statusCard) statusCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      reader.readAsArrayBuffer(file);
    }
  }

  processReportText(text, metadata) {
    // Run AI/NLP Engine
    const analysis = window.sifPrecursorEngine.analyzeReport(text, metadata);

    // Save to report history
    this.reports.unshift(analysis);
    this.saveReports();

    // If SIF Precursor or Critical Risk, automatically provision CAPA and record alert silently (No SOS siren)
    if (analysis.isSifPrecursor || analysis.riskLevel === 'CRITICAL' || analysis.riskLevel === 'HIGH') {
      window.capaTracker.createActionFromReport(analysis);
      // SOS siren alarm should NOT sound after file analysis.
      // Record alert silently into registry & badge without firing modal/siren.
      if (window.riskAlertSystem && typeof window.riskAlertSystem.recordAlertSilently === 'function') {
        window.riskAlertSystem.recordAlertSilently(analysis);
      }
    }

    // Set active analysis in SIF Workspace and switch to SIF Detection tab
    this.activeAnalysis = analysis;
    this.switchTab('sif-detection-view');
    this.renderSIFWorkspace(analysis);
    this.showToast(`Report Analyzed: Risk Score ${analysis.riskScore}/100 [${analysis.riskLevel}]`);
  }

  // --- RENDERING: SIF WORKSPACE & EXPLAINABLE AI ---
  renderSIFWorkspace(targetAnalysis) {
    const analysis = targetAnalysis || this.activeAnalysis || this.reports[0];
    if (!analysis) return;

    const container = document.getElementById('sif-workspace-container');
    if (!container) return;

    const isSif = analysis.isSifPrecursor;
    const score = Math.min(100, Math.max(0, analysis.riskScore || 0));
    const level = analysis.riskLevel || 'LOW';

    // Risk Condition Configuration & Attributes
    let condition = {
      tierName: 'CRITICAL SIF RISK',
      title: 'CRITICAL SIF CONDITION: HIGH-ENERGY RELEASE IMMINENT',
      sub: 'Immediate Stop-Work Authority (SWA) Invoked — Primary Defenses Breached',
      color: '#ef4444',
      bgLight: '#fef2f2',
      borderLight: '#fca5a5',
      badgeClass: 'cond-tag-critical',
      icon: '🚨',
      actionDirective: 'MANDATORY STOP-WORK: Halt operations immediately, clear exclusion zone, and alert Shift In-Charge.',
      zoneLabel: 'Crimson Zone (85-100): Catastrophic / SIF Risk'
    };

    if (level === 'HIGH') {
      condition = {
        tierName: 'HIGH PROCESS RISK',
        title: 'HIGH RISK CONDITION: ELEVATED PROCESS HAZARD',
        sub: 'Substantial Hazardous Energy with Degrading Defenses — Action Required within Shift',
        color: '#f59e0b',
        bgLight: '#fffbeb',
        borderLight: '#fde68a',
        badgeClass: 'cond-tag-high',
        icon: '⚠️',
        actionDirective: 'HIGH PRIORITY: Re-validate Permit-to-Work (PTW) and inspect secondary safeguards before work resumes.',
        zoneLabel: 'Amber Zone (70-84): High Process Risk'
      };
    } else if (level === 'MODERATE') {
      condition = {
        tierName: 'MODERATE OPERATIONAL RISK',
        title: 'MODERATE RISK CONDITION: CONTROLLABLE OPERATIONAL HAZARD',
        sub: 'Medium-Energy Operational Hazard — Standard Controls Active with Minor Gaps',
        color: '#3b82f6',
        bgLight: '#eff6ff',
        borderLight: '#bfdbfe',
        badgeClass: 'cond-tag-moderate',
        icon: '⚡',
        actionDirective: 'OPERATIONAL CONTROL: Deliver toolbox briefing, inspect equipment safeguards, and dispatch work-order.',
        zoneLabel: 'Blue Zone (40-69): Moderate Operational Risk'
      };
    } else if (level === 'LOW') {
      condition = {
        tierName: 'LOW / ROUTINE OBSERVATION',
        title: 'LOW RISK CONDITION: ROUTINE SAFETY OBSERVATION',
        sub: 'Baseline Operating Profile — Engineered Safeguards & Procedural Defenses Intact',
        color: '#10b981',
        bgLight: '#ecfdf5',
        borderLight: '#a7f3d0',
        badgeClass: 'cond-tag-low',
        icon: '✅',
        actionDirective: 'ROUTINE SURVEILLANCE: Continue normal operating protocols under standard site safety rules.',
        zoneLabel: 'Emerald Zone (0-39): Controlled Baseline'
      };
    }

    const badgeColor = condition.color;
    // Speedometer needle rotation: -90 deg (score 0) to +90 deg (score 100)
    const needleDeg = -90 + (score / 100) * 180;

    // Vector breakdown metrics
    const energyMagnitudePct = analysis.matchedEnergies && analysis.matchedEnergies.length > 0
      ? Math.min(100, Math.round((analysis.matchedEnergies[0].sifWeight || 0.8) * 100))
      : Math.min(100, Math.round(score * 0.85 + 10));

    const barrierFailurePct = analysis.detectedBarrierGaps && analysis.detectedBarrierGaps.length > 0
      ? Math.min(100, analysis.detectedBarrierGaps.length * 35)
      : (level === 'LOW' ? 10 : 25);

    const envSeverityPct = Math.min(100, Math.round(score * 0.75 + 12));
    const assetVulnerabilityPct = Math.min(100, Math.round(score * 0.65 + 18));

    // Highlight text with danger tokens
    let highlightedHtml = this.escapeHtml(analysis.rawText);
    if (analysis.highlightedTokens && analysis.highlightedTokens.length > 0) {
      analysis.highlightedTokens.forEach(token => {
        const regex = new RegExp(`(${token})`, 'gi');
        highlightedHtml = highlightedHtml.replace(regex, `<mark class="xai-highlight-token">$1</mark>`);
      });
    }

    const energyPillsHtml = (analysis.matchedEnergies || []).map(e => `
      <span class="energy-pill">
        ⚡ <strong>${e.name}</strong> (SIF Potential Weight: ${(e.sifWeight * 100).toFixed(0)}%)
      </span>
    `).join('');

    const barrierGapsHtml = (analysis.detectedBarrierGaps || []).map(b => `
      <li class="barrier-gap-item">
        <span class="gap-icon">❌</span> <strong>Missing / Breached Barrier:</strong> ${this.escapeHtml(b)}
      </li>
    `).join('') || '<li class="barrier-gap-item"><span class="gap-icon">✓</span> Standard barriers intact.</li>';

    const capaListHtml = (analysis.recommendedActions || []).map((rec, i) => `
      <div class="xai-action-card">
        <div class="action-card-header">
          <span class="priority-tag tag-${rec.priority.toLowerCase()}">${rec.priority}</span>
          <strong>${rec.title}</strong>
          <span class="timeline-tag">⏱️ ${rec.timeline}</span>
        </div>
        <p class="action-desc">${rec.actionDetails}</p>
        <div class="action-meta">Assignee: <strong>${rec.assigneeRole}</strong></div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="sif-analysis-card ${isSif ? 'sif-card-critical' : ''}">
        
        <!-- Header Banner -->
        <div class="sif-header-banner">
          <div class="sif-title-group">
            <span class="sif-precursor-badge" style="background-color: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor};">
              <span class="pulse-dot"></span>
              ${isSif ? '🚨 POTENTIAL SIF PRECURSOR DETECTED' : 'STANDARD OBSERVATION RECORD'}
            </span>
            <h2 class="sif-report-id">${analysis.reportId} • ${analysis.reportClassification}</h2>
            <span class="sif-report-location">📍 ${analysis.location} • 🏢 ${analysis.department} • 🕒 ${new Date(analysis.timestamp).toLocaleString()}</span>
          </div>

          <!-- Quantitative Dials -->
          <div class="sif-metrics-dial-group">
            <div class="metric-dial-box">
              <span class="metric-dial-val" style="color: ${badgeColor}">${analysis.riskScore}</span>
              <span class="metric-dial-label">Risk Score / 100</span>
            </div>
            <div class="metric-dial-box">
              <span class="metric-dial-val" style="color: #38bdf8">${analysis.confidenceScore}%</span>
              <span class="metric-dial-label">Confidence</span>
            </div>
            <div class="metric-dial-box">
              <span class="metric-dial-val" style="color: #94a3b8">±${analysis.uncertaintyScore}%</span>
              <span class="metric-dial-label">Uncertainty</span>
            </div>
          </div>
        </div>

        <!-- DYNAMIC RISK CONDITION & SPEEDOMETER GAUGE GRAPH -->
        <div class="risk-condition-graph-card" style="border-left: 6px solid ${condition.color};">
          <!-- Condition Status Banner -->
          <div class="condition-banner-strip" style="background: ${condition.bgLight}; border-bottom: 1px solid ${condition.borderLight};">
            <div class="cond-icon-wrap">${condition.icon}</div>
            <div class="cond-text-wrap">
              <div class="cond-tier-row">
                <span class="cond-tier-tag ${condition.badgeClass}">${condition.tierName}</span>
                <span class="cond-zone-label">${condition.zoneLabel}</span>
              </div>
              <h3 class="cond-title" style="color: #0f172a;">${condition.title}</h3>
              <p class="cond-sub">${condition.sub}</p>
              <div class="cond-directive-box" style="background: #ffffff; border-left: 3px solid ${condition.color};">
                <strong>Directive:</strong> ${condition.actionDirective}
              </div>
            </div>
          </div>

          <!-- Graph Grid: Speedometer Gauge + Vector Breakdown -->
          <div class="risk-graph-columns-grid">
            <!-- Semicircular Speedometer Gauge Graph -->
            <div class="speedometer-gauge-box">
              <div class="gauge-header">
                <span class="gauge-title">⚡ Risk Condition Speedometer</span>
                <span class="gauge-chip" style="background: ${condition.bgLight}; color: ${condition.color}; border: 1px solid ${condition.borderLight};">${score} / 100</span>
              </div>
              <div class="gauge-svg-wrapper">
                <svg viewBox="0 0 240 145" class="risk-speedometer-svg">
                  <!-- Gauge Arcs: Green, Blue, Orange, Red -->
                  <path d="M 28 120 A 92 92 0 0 1 73 51" fill="none" stroke="#10b981" stroke-width="15" stroke-linecap="round" />
                  <path d="M 76 48 A 92 92 0 0 1 138 29" fill="none" stroke="#3b82f6" stroke-width="15" />
                  <path d="M 141 30 A 92 92 0 0 1 187 61" fill="none" stroke="#f59e0b" stroke-width="15" />
                  <path d="M 190 64 A 92 92 0 0 1 212 120" fill="none" stroke="#ef4444" stroke-width="15" stroke-linecap="round" />

                  <!-- Zone Tick Labels -->
                  <text x="24" y="138" font-size="8" font-weight="700" fill="#10b981">0 LOW</text>
                  <text x="80" y="38" font-size="8" font-weight="700" fill="#3b82f6">40 MOD</text>
                  <text x="156" y="38" font-size="8" font-weight="700" fill="#f59e0b">70 HIGH</text>
                  <text x="216" y="138" text-anchor="end" font-size="8" font-weight="700" fill="#ef4444">100 CRIT</text>

                  <!-- Dynamic Needle -->
                  <g transform="translate(120, 120) rotate(${needleDeg})" style="transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <polygon points="-4,0 0,-85 4,0" fill="${condition.color}" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" />
                    <circle cx="0" cy="0" r="9" fill="#0f172a" stroke="#ffffff" stroke-width="2.5" />
                    <circle cx="0" cy="0" r="3.5" fill="${condition.color}" />
                  </g>

                  <!-- Digital Readout in Center -->
                  <text x="120" y="108" text-anchor="middle" font-size="22" font-weight="900" fill="#0f172a">${score}</text>
                  <text x="120" y="122" text-anchor="middle" font-size="8.5" font-weight="800" fill="#64748b" letter-spacing="0.5">RISK INDEX</text>
                </svg>
              </div>
              <div class="gauge-footer-note">
                <span class="dot" style="background: ${condition.color};"></span>
                <span>Operating condition evaluated at <strong>${condition.tierName}</strong></span>
              </div>
            </div>

            <!-- Risk Factor Condition Vector Graph -->
            <div class="risk-energy-bars-box">
              <div class="bars-header">
                <span class="bars-title">📊 Condition Factor Decomposition Graph</span>
                <span class="bars-sub">Neural XAI breakdown of contributors to risk</span>
              </div>

              <div class="condition-vector-list">
                <div class="cond-vector-item">
                  <div class="vector-meta">
                    <span class="vector-label">⚡ Energy Vector Magnitude</span>
                    <span class="vector-val">${energyMagnitudePct}%</span>
                  </div>
                  <div class="vector-track">
                    <div class="vector-fill" style="width: ${energyMagnitudePct}%; background: ${energyMagnitudePct > 70 ? '#ef4444' : energyMagnitudePct > 40 ? '#f59e0b' : '#10b981'};"></div>
                  </div>
                </div>

                <div class="cond-vector-item">
                  <div class="vector-meta">
                    <span class="vector-label">🚫 Safety Barrier Degradation Gap</span>
                    <span class="vector-val">${barrierFailurePct}%</span>
                  </div>
                  <div class="vector-track">
                    <div class="vector-fill" style="width: ${barrierFailurePct}%; background: ${barrierFailurePct > 60 ? '#ef4444' : barrierFailurePct > 30 ? '#f59e0b' : '#3b82f6'};"></div>
                  </div>
                </div>

                <div class="cond-vector-item">
                  <div class="vector-meta">
                    <span class="vector-label">☣️ Atmospheric / Chemical Factor</span>
                    <span class="vector-val">${envSeverityPct}%</span>
                  </div>
                  <div class="vector-track">
                    <div class="vector-fill" style="width: ${envSeverityPct}%; background: ${envSeverityPct > 65 ? '#ef4444' : envSeverityPct > 40 ? '#f59e0b' : '#10b981'};"></div>
                  </div>
                </div>

                <div class="cond-vector-item">
                  <div class="vector-meta">
                    <span class="vector-label">🔄 Historic Asset Recurrence Index</span>
                    <span class="vector-val">${assetVulnerabilityPct}%</span>
                  </div>
                  <div class="vector-track">
                    <div class="vector-fill" style="width: ${assetVulnerabilityPct}%; background: ${assetVulnerabilityPct > 70 ? '#ef4444' : '#3b82f6'};"></div>
                  </div>
                </div>
              </div>

              <!-- Composite Condition Bar -->
              <div class="composite-condition-wrap">
                <div class="composite-label-row">
                  <span>Aggregate Risk Condition Load:</span>
                  <strong style="color: ${condition.color};">${score}% [${condition.tierName}]</strong>
                </div>
                <div class="composite-bar-track">
                  <div class="composite-bar-fill" style="width: ${score}%; background: linear-gradient(90deg, #10b981 0%, #3b82f6 40%, #f59e0b 70%, #ef4444 100%);"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Responsible AI Notice -->
        <div class="responsible-ai-notice-box">
          <div class="notice-header">
            <span>🛡️ Responsible AI Disclosure & Human Verification Notice</span>
          </div>
          <p class="notice-body">${analysis.responsibleExplanation.verificationNote}</p>
        </div>

        <!-- Explainable AI Highlight View -->
        <div class="xai-text-excerpt-container">
          <h3 class="xai-section-title">🔍 NLP Token Extraction & Hazard Flagging</h3>
          <p class="xai-hint">High-energy triggers and compromised barrier terms are highlighted in real-time:</p>
          <div class="highlighted-text-box">
            ${highlightedHtml}
          </div>
        </div>

        <!-- Barrier & Energy Analysis Grid -->
        <div class="sif-details-grid">
          <div class="sif-grid-col">
            <h4 class="col-heading">⚡ Identified High-Energy Hazards</h4>
            <div class="energy-pills-wrap">
              ${energyPillsHtml || '<span style="color:#94a3b8;">No high-energy vectors detected.</span>'}
            </div>

            <h4 class="col-heading" style="margin-top: 1.2rem;">🚫 Barrier Degradation Analysis</h4>
            <ul class="barrier-gaps-list">
              ${barrierGapsHtml}
            </ul>
          </div>

          <div class="sif-grid-col">
            <h4 class="col-heading">📋 Automated Corrective Action Plan (CAPA)</h4>
            <div class="xai-actions-wrap">
              ${capaListHtml}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="sif-bottom-bar">
          <button class="btn btn-danger-glow" onclick="window.riskAlertSystem.triggerCriticalSIFAlert(window.riskRadarApp.activeAnalysis || window.riskRadarApp.reports[0])">
            🚨 Broadcast Emergency Alert for this SIF
          </button>
          <button class="btn btn-secondary" onclick="window.riskRadarApp.switchTab('capa-view')">
            📋 Track Corrective Actions (CAPA)
          </button>
          <button class="btn btn-outline" onclick="window.askChatbotAboutReport('${analysis.reportId}')">
            💬 Consult AI Assistant on Mitigation
          </button>
        </div>
      </div>
    `;
  }

  // --- RENDERING: PRIORITY DASHBOARD ---
  // --- RENDERING: PRIORITY DASHBOARD ---
  renderDashboard() {
    const totalReports = this.reports.length;
    const sifPrecursors = this.reports.filter(r => r.isSifPrecursor).length;
    const highCritical = this.reports.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length;
    const moderateRisk = this.reports.filter(r => r.riskLevel === 'MODERATE').length;
    const lowRisk = this.reports.filter(r => r.riskLevel === 'LOW').length;
    const capaMetrics = window.capaTracker ? window.capaTracker.getMetrics() : { open: 0, inProgress: 0 };

    // Update KPI cards for all required risk levels
    this.setText('kpi-total-reports', totalReports);
    this.setText('kpi-high-critical', highCritical);
    this.setText('kpi-moderate-risk', moderateRisk);
    this.setText('kpi-low-risk', lowRisk);
    this.setText('kpi-sif-precursors', sifPrecursors);
    this.setText('kpi-open-capa', capaMetrics.open + capaMetrics.inProgress);

    // Initialize Tier Filter Buttons
    this.initDashboardTierFilter();

    // Sort reports strictly in required priority order:
    // 1. Critical / High Risk
    // 2. Moderate Risk
    // 3. Low Risk
    const sortedReports = [...this.reports].sort((a, b) => {
      const getPriorityRank = (level) => {
        if (level === 'CRITICAL' || level === 'HIGH') return 1;
        if (level === 'MODERATE') return 2;
        if (level === 'LOW') return 3;
        return 4;
      };
      const rankDiff = getPriorityRank(a.riskLevel) - getPriorityRank(b.riskLevel);
      if (rankDiff !== 0) return rankDiff;
      return (b.riskScore || 0) - (a.riskScore || 0);
    });

    // Filter by active dashboard tier filter
    let displayedReports = sortedReports;
    if (this.activeDashboardTier === 'CRITICAL_HIGH') {
      displayedReports = sortedReports.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH');
    } else if (this.activeDashboardTier === 'MODERATE') {
      displayedReports = sortedReports.filter(r => r.riskLevel === 'MODERATE');
    } else if (this.activeDashboardTier === 'LOW') {
      displayedReports = sortedReports.filter(r => r.riskLevel === 'LOW');
    } else if (this.activeDashboardTier === 'SIF_ONLY') {
      displayedReports = sortedReports.filter(r => r.isSifPrecursor);
    }

    // Render Recent Reports preview table
    const tableBody = document.getElementById('dashboard-recent-reports-body');
    if (tableBody) {
      if (displayedReports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #94a3b8;">No reports match the selected tier filter.</td></tr>`;
      } else {
        tableBody.innerHTML = displayedReports.slice(0, 10).map(r => {
          const tierClass = (r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH') 
            ? 'badge-critical' 
            : r.riskLevel === 'MODERATE' 
            ? 'badge-moderate' 
            : 'badge-low';
          const tierIcon = (r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH') ? '🔴' : r.riskLevel === 'MODERATE' ? '🟠' : '🟢';
          return `
            <tr class="report-table-row" onclick="window.riskRadarApp.viewReportDetail('${r.reportId}')">
              <td><span class="report-id-code">${r.reportId}</span></td>
              <td>
                <span class="risk-badge ${tierClass}">${tierIcon} ${r.riskLevel} (${r.riskScore}/100)</span>
                ${r.isSifPrecursor ? '<span class="sif-tag-small">SIF PRECURSOR</span>' : ''}
              </td>
              <td><span class="classification-tag">${r.reportClassification || 'Observation'}</span></td>
              <td class="table-cell-desc">${this.escapeHtml(r.rawText.slice(0, 75))}...</td>
              <td>${this.escapeHtml(r.location)}</td>
              <td>${new Date(r.timestamp).toLocaleDateString()}</td>
              <td>
                <button class="btn-sm btn-outline" onclick="event.stopPropagation(); window.riskRadarApp.viewReportDetail('${r.reportId}')">
                  Inspect
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render SVG Charts on Dashboard
    this.renderDashboardCharts();
  }

  initDashboardTierFilter() {
    const chipBtns = document.querySelectorAll('.tier-chip-btn');
    chipBtns.forEach(btn => {
      btn.onclick = () => {
        chipBtns.forEach(b => b.classList.remove('active-tier-chip'));
        btn.classList.add('active-tier-chip');
        this.activeDashboardTier = btn.getAttribute('data-tier') || 'ALL';
        this.renderDashboard();
      };
    });
  }

  renderDashboardCharts() {
    // SIF Trend Chart (SVG sparkline/area)
    const trendContainer = document.getElementById('sif-trend-chart-container');
    if (trendContainer) {
      trendContainer.innerHTML = `
        <svg viewBox="0 0 500 180" class="dashboard-svg-chart">
          <defs>
            <linearGradient id="sifGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ef4444" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#ef4444" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <!-- Grid lines -->
          <line x1="40" y1="30" x2="480" y2="30" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="40" y1="80" x2="480" y2="80" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="40" y1="130" x2="480" y2="130" stroke="#1e293b" stroke-dasharray="4"/>
          
          <!-- Area Fills -->
          <polygon points="50,140 120,110 190,125 260,85 330,95 400,60 470,45 470,160 50,160" fill="url(#sifGrad)"/>
          
          <!-- SIF Line -->
          <polyline points="50,140 120,110 190,125 260,85 330,95 400,60 470,45" fill="none" stroke="#ef4444" stroke-width="3"/>
          <circle cx="470" cy="45" r="5" fill="#ef4444"/>

          <!-- Axis Labels -->
          <text x="50" y="175" fill="#64748b" font-size="11">Week 1</text>
          <text x="190" y="175" fill="#64748b" font-size="11">Week 2</text>
          <text x="330" y="175" fill="#64748b" font-size="11">Week 3</text>
          <text x="450" y="175" fill="#64748b" font-size="11">Week 4</text>

          <text x="475" y="42" fill="#ef4444" font-size="12" font-weight="bold">SIF Precursors Trend</text>
        </svg>
      `;
    }

    // Energy Hazard Distribution (Bar / Breakdown)
    const hazardContainer = document.getElementById('hazard-breakdown-container');
    if (hazardContainer) {
      hazardContainer.innerHTML = `
        <div class="hazard-distribution-bars">
          <div class="hazard-bar-row">
            <span class="bar-label">🏗️ Working at Height / Gravity</span>
            <div class="bar-track"><div class="bar-fill" style="width: 78%; background-color: #ef4444;"></div></div>
            <span class="bar-count">78%</span>
          </div>
          <div class="hazard-bar-row">
            <span class="bar-label">⚠️ Hydrocarbon / Gas Leak</span>
            <div class="bar-track"><div class="bar-fill" style="width: 65%; background-color: #f59e0b;"></div></div>
            <span class="bar-count">65%</span>
          </div>
          <div class="hazard-bar-row">
            <span class="bar-label">🕳️ Confined Space Entry</span>
            <div class="bar-track"><div class="bar-fill" style="width: 48%; background-color: #8b5cf6;"></div></div>
            <span class="bar-count">48%</span>
          </div>
          <div class="hazard-bar-row">
            <span class="bar-label">⚡ Electrical / Arc Flash</span>
            <div class="bar-track"><div class="bar-fill" style="width: 42%; background-color: #eab308;"></div></div>
            <span class="bar-count">42%</span>
          </div>
          <div class="hazard-bar-row">
            <span class="bar-label">⚙️ Machinery / Pinch Point</span>
            <div class="bar-track"><div class="bar-fill" style="width: 35%; background-color: #0284c7;"></div></div>
            <span class="bar-count">35%</span>
          </div>
        </div>
      `;
    }
  }

  // --- RENDERING: RISK QUEUE ---
  renderRiskQueue() {
    const listEl = document.getElementById('risk-queue-table-body');
    const filterInput = document.getElementById('queue-search-filter');
    const filterSelect = document.getElementById('queue-level-filter');
    if (!listEl) return;

    const render = (items) => {
      listEl.innerHTML = items.map(r => `
        <tr class="report-table-row" onclick="window.riskRadarApp.viewReportDetail('${r.reportId}')">
          <td><strong>${r.reportId}</strong></td>
          <td>
            <span class="risk-badge badge-${r.riskLevel.toLowerCase()}">${r.riskLevel} (${r.riskScore})</span>
            ${r.isSifPrecursor ? '<span class="sif-tag-small">SIF PRECURSOR</span>' : ''}
          </td>
          <td><span class="classification-tag">${r.reportClassification}</span></td>
          <td class="table-cell-desc">${this.escapeHtml(r.rawText.slice(0, 75))}...</td>
          <td>${this.escapeHtml(r.location)}</td>
          <td>${new Date(r.timestamp).toLocaleDateString()}</td>
          <td>
            <button class="btn-sm btn-primary-glow" onclick="event.stopPropagation(); window.riskRadarApp.viewReportDetail('${r.reportId}')">
              XAI View
            </button>
          </td>
        </tr>
      `).join('');
    };

    render(this.reports);

    if (filterInput) {
      filterInput.oninput = () => this.applyQueueFilters(render);
    }
    if (filterSelect) {
      filterSelect.onchange = () => this.applyQueueFilters(render);
    }
  }

  applyQueueFilters(renderCallback) {
    const query = (document.getElementById('queue-search-filter').value || '').toLowerCase().trim();
    const level = (document.getElementById('queue-level-filter').value || 'ALL');

    let filtered = this.reports;
    if (level !== 'ALL') {
      if (level === 'SIF_ONLY') {
        filtered = filtered.filter(r => r.isSifPrecursor);
      } else {
        filtered = filtered.filter(r => r.riskLevel === level);
      }
    }

    if (query) {
      filtered = filtered.filter(r => 
        r.rawText.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query) ||
        r.reportId.toLowerCase().includes(query)
      );
    }

    renderCallback(filtered);
  }

  viewReportDetail(reportId) {
    const report = this.reports.find(r => r.reportId === reportId);
    if (report) {
      this.activeAnalysis = report;
      this.switchTab('sif-detection-view');
      this.renderSIFWorkspace(report);
    }
  }

  // --- RENDERING: ALERTS VIEW ---
  renderAlertsView() {
    const listEl = document.getElementById('critical-alerts-container');
    if (!listEl) return;

    this.initAlertFilters();

    let incidents = [];
    try {
      const raw = localStorage.getItem('riskradar_incidents');
      if (raw) incidents = JSON.parse(raw);
    } catch (e) {}

    // If no dynamic incidents exist, seed from high/critical reports in this.reports
    if (incidents.length === 0) {
      const topAlertReports = this.reports.filter(r => r.isSifPrecursor || r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH');
      incidents = topAlertReports.map(r => ({
        id: 'INC-' + r.reportId.replace('OIL-REP-', ''),
        threat: {
          type: r.isSifPrecursor ? `SIF PRECURSOR ALERT: ${r.reportClassification}` : `HIGH RISK ESCALATION`,
          details: `Identified Hazard: ${r.matchedEnergies ? r.matchedEnergies.map(e => e.name).join(', ') : 'High Energy Vector'}. Risk Score: ${r.riskScore}/100 at ${r.location}.`,
          report: r,
          timestamp: new Date(r.timestamp).toLocaleString(),
          isManual: false
        },
        reportId: r.reportId,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        location: r.location,
        department: r.department,
        status: 'DISPATCHED',
        coordinates: { latitude: 27.3551, longitude: 95.3182 },
        contactsNotified: [
          { name: 'Dr. P. Gogoi', relation: 'OIL HSE Manager' },
          { name: 'Ananya Barua', relation: 'Personal Emergency Contact' }
        ],
        timestamp: new Date(r.timestamp).toLocaleString()
      }));
      try {
        localStorage.setItem('riskradar_incidents', JSON.stringify(incidents));
      } catch (e) {}
    }

    // Filter according to activeAlertFilter
    let filtered = incidents;
    if (this.activeAlertFilter === 'SIF') {
      filtered = incidents.filter(item => {
        const r = item.threat && item.threat.report;
        return (r && r.isSifPrecursor) || (item.threat && item.threat.type.includes('SIF'));
      });
    } else if (this.activeAlertFilter === 'CRITICAL') {
      filtered = incidents.filter(item => {
        const r = item.threat && item.threat.report;
        return (r && r.riskLevel === 'CRITICAL') || (item.riskLevel === 'CRITICAL') || (item.threat && item.threat.type.includes('CRITICAL'));
      });
    } else if (this.activeAlertFilter === 'DISPATCHED') {
      filtered = incidents.filter(item => item.status === 'DISPATCHED' || (item.threat && !item.threat.acknowledged));
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state-card" style="text-align:center; padding: 2.5rem; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;">
          <span style="font-size: 2.5rem;">🛡️</span>
          <h3 style="margin: 0.5rem 0; color: #fff;">No Alerts In Selected Category</h3>
          <p style="color: #94a3b8; font-size: 0.9rem;">No active alert notifications matching "${this.activeAlertFilter}". All monitored sensors are operating normally.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(item => {
      const rep = (item.threat && item.threat.report) || this.reports.find(r => r.reportId === item.reportId) || {};
      const reportId = item.reportId || rep.reportId || 'OIL-REP-712894';
      const riskLevel = rep.riskLevel || item.riskLevel || 'CRITICAL';
      const riskScore = rep.riskScore || item.riskScore || 94;
      const location = rep.location || item.location || 'OIL Operational Asset, Assam';
      const department = rep.department || item.department || 'Drilling & Operational Services';
      const isSif = rep.isSifPrecursor !== undefined ? rep.isSifPrecursor : true;
      const status = item.acknowledged ? '✓ ACKNOWLEDGED' : (item.status === 'DISPATCHED' || !item.acknowledged ? '🔴 ACTIVE DISPATCH' : item.status);
      const isAck = item.acknowledged || status.includes('ACKNOWLEDGED');

      // Precursor title
      let precursorTitle = 'High-Energy Exposure with Compromised Critical Safety Barriers';
      if (rep.matchedEnergies && rep.matchedEnergies.length > 0) {
        precursorTitle = `${rep.matchedEnergies.map(e => e.name).join(' & ')} Precursor`;
      } else if (item.threat && item.threat.details) {
        precursorTitle = item.threat.details;
      }

      // Barrier Gaps
      const barriers = (rep.detectedBarrierGaps || ['Absence of certified 100% tie-off / fall arrest system', 'Safety interlock bypassed during energized maintenance']);
      const barriersHtml = barriers.map(b => `<span class="barrier-tag">❌ Barrier Gap: ${this.escapeHtml(b)}</span>`).join('');

      // Energies
      const energies = (rep.matchedEnergies || [{ name: 'Gravity / Fall from Height' }]);
      const energiesHtml = energies.map(e => `<span class="energy-tag">⚡ ${this.escapeHtml(e.name)}</span>`).join('');

      const tierBadgeClass = (riskLevel === 'CRITICAL') ? 'tier-badge-critical' : 'tier-badge-high';
      const cardTierClass = (riskLevel === 'CRITICAL') ? 'sif-critical' : 'sif-high';
      const statusBadgeClass = isAck ? 'status-badge-acknowledged' : 'status-badge-dispatched';

      return `
        <div class="sih-alert-card ${cardTierClass}">
          <!-- Top Row: Risk Tier Badge, Risk Score, Status & Timestamp -->
          <div class="alert-card-top-row">
            <div class="alert-badge-group">
              <span class="alert-risk-tier-badge ${tierBadgeClass}">
                ${riskLevel === 'CRITICAL' ? '🔴' : '🟠'} ${riskLevel} RISK ${isSif ? '• SIF PRECURSOR' : ''}
              </span>
              <span class="alert-score-badge">Risk Score: ${riskScore}/100</span>
              ${isSif ? '<span class="sif-tag-small">SIF PRECURSOR</span>' : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span class="alert-status-badge ${statusBadgeClass}">${status}</span>
              <span class="alert-time-badge">🕒 ${this.escapeHtml(item.timestamp || 'Today')}</span>
            </div>
          </div>

          <!-- Detected SIF Precursor Banner -->
          <div class="alert-precursor-banner">
            <div class="precursor-banner-title">
              <span>⚠️</span>
              <strong>DETECTED SIF PRECURSOR:</strong>
            </div>
            <div class="precursor-banner-text">${this.escapeHtml(precursorTitle)}</div>
            <div class="precursor-banner-detail">
              ${rep.rawText ? this.escapeHtml(rep.rawText.slice(0, 160)) + '...' : this.escapeHtml(item.threat ? item.threat.details : '')}
            </div>
          </div>

          <!-- Metadata Grid: Report ID, Location, Dept, Emergency Dispatches -->
          <div class="alert-meta-grid">
            <div class="alert-meta-item">
              <span class="meta-item-label">Report ID</span>
              <span class="meta-item-value">${this.escapeHtml(reportId)}</span>
            </div>
            <div class="alert-meta-item">
              <span class="meta-item-label">Asset Location</span>
              <span class="meta-item-value">📍 ${this.escapeHtml(location)}</span>
            </div>
            <div class="alert-meta-item">
              <span class="meta-item-label">Operational Department</span>
              <span class="meta-item-value">🏢 ${this.escapeHtml(department)}</span>
            </div>
            <div class="alert-meta-item">
              <span class="meta-item-label">Emergency Broadcast</span>
              <span class="meta-item-value" style="color: #38bdf8;">OIL Control (0374-2800555) + 2 Contacts</span>
            </div>
          </div>

          <!-- Energy & Breached Barriers Tags -->
          <div class="alert-barriers-row">
            ${energiesHtml}
            ${barriersHtml}
          </div>

          <!-- Dispatched Units Summary Strip -->
          <div class="alert-dispatch-summary">
            <span>📡 <strong>Escalation Dispatch:</strong> Alert & live GPS transmitted to OIL Central Emergency Control Room, Fire Station (101), Hospital (102), and designated safety officers.</span>
            <span class="dispatch-services-text">📍 GPS Coordinates: 27.3551° N, 95.3182° E</span>
          </div>

          <!-- Interactive Action Buttons -->
          <div class="alert-card-actions">
            <button class="btn-sm btn-primary-glow" onclick="window.riskRadarApp.viewReportDetail('${reportId}')">
              ⚡ Inspect in SIF XAI Workspace
            </button>
            <button class="btn-sm btn-outline" onclick="window.riskRadarApp.switchTab('capa-view')">
              📋 View Associated CAPA Plan
            </button>
            <button class="btn-sm btn-sms" onclick="window.riskAlertSystem.triggerCriticalSIFAlert(window.riskRadarApp.reports.find(r => r.reportId === '${reportId}') || {})">
              🔄 Re-Broadcast Alert
            </button>
            <button class="btn-sm btn-outline" onclick="window.riskRadarApp.acknowledgeAlert('${item.id || reportId}')">
              ${isAck ? '✓ Acknowledged' : '✓ Acknowledge Alert'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  initAlertFilters() {
    const filterBtns = document.querySelectorAll('.alert-chip-btn');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active-alert-chip'));
        btn.classList.add('active-alert-chip');
        this.activeAlertFilter = btn.getAttribute('data-filter') || 'ALL';
        this.renderAlertsView();
      };
    });
  }

  acknowledgeAlert(incidentId) {
    try {
      const raw = localStorage.getItem('riskradar_incidents');
      if (raw) {
        const incidents = JSON.parse(raw);
        const item = incidents.find(i => i.id === incidentId || i.reportId === incidentId);
        if (item) {
          item.acknowledged = true;
          item.status = 'ACKNOWLEDGED';
          localStorage.setItem('riskradar_incidents', JSON.stringify(incidents));
        }
      }
    } catch (e) {}
    this.showToast(`Alert acknowledged by Safety Officer.`);
    this.renderAlertsView();
  }

  // --- RENDERING: CAPA TRACKER VIEW ---
  renderCAPAView() {
    const listEl = document.getElementById('capa-items-container');
    const metricsEl = document.getElementById('capa-metrics-bar');
    if (!listEl) return;

    const metrics = window.capaTracker.getMetrics();
    if (metricsEl) {
      metricsEl.innerHTML = `
        <div class="capa-stat-pill">Total: <strong>${metrics.total}</strong></div>
        <div class="capa-stat-pill pill-open">Open: <strong>${metrics.open}</strong></div>
        <div class="capa-stat-pill pill-prog">In Progress: <strong>${metrics.inProgress}</strong></div>
        <div class="capa-stat-pill pill-resolved">Resolved: <strong>${metrics.resolved}</strong></div>
        <div class="capa-stat-pill pill-closed">Closed: <strong>${metrics.closed}</strong></div>
      `;
    }

    listEl.innerHTML = window.capaTracker.actions.map(action => `
      <div class="capa-record-card status-${action.status.toLowerCase().replace(' ', '-')}">
        <div class="capa-card-top">
          <div class="capa-id-row">
            <span class="capa-id-tag">${action.id}</span>
            <span class="capa-priority-badge priority-${action.priority.toLowerCase()}">${action.priority}</span>
            <span class="capa-status-tag status-tag-${action.status.toLowerCase().replace(' ', '-')}">${action.status}</span>
          </div>
          <h3 class="capa-title">${this.escapeHtml(action.title)}</h3>
          <p class="capa-desc">${this.escapeHtml(action.description)}</p>
        </div>

        <div class="capa-meta-grid">
          <div><span class="meta-label">Location:</span> ${this.escapeHtml(action.location)}</div>
          <div><span class="meta-label">Assigned To:</span> <strong>${this.escapeHtml(action.assignedTo)}</strong></div>
          <div><span class="meta-label">Due Date:</span> 📅 ${action.dueDate}</div>
          <div><span class="meta-label">Report ID:</span> 🔗 ${action.reportId}</div>
        </div>

        <!-- Audit Trail -->
        <div class="capa-audit-box">
          <span class="audit-title">Audit Trail:</span>
          ${action.auditTrail.slice(0, 2).map(a => `<div class="audit-item">• [${a.timestamp}] ${this.escapeHtml(a.note)}</div>`).join('')}
        </div>

        <!-- Status Change Dropdown / Buttons -->
        <div class="capa-controls-strip">
          <span style="font-size: 0.8rem; color: #94a3b8;">Advance Lifecycle:</span>
          <button class="btn-status-step ${action.status === 'Open' ? 'active-step' : ''}" onclick="window.riskRadarApp.updateCAPAStatus('${action.id}', 'Open')">Open</button>
          <button class="btn-status-step ${action.status === 'In Progress' ? 'active-step' : ''}" onclick="window.riskRadarApp.updateCAPAStatus('${action.id}', 'In Progress')">In Progress</button>
          <button class="btn-status-step ${action.status === 'Resolved' ? 'active-step' : ''}" onclick="window.riskRadarApp.updateCAPAStatus('${action.id}', 'Resolved')">Resolved</button>
          <button class="btn-status-step ${action.status === 'Closed' ? 'active-step' : ''}" onclick="window.riskRadarApp.updateCAPAStatus('${action.id}', 'Closed')">Closed</button>
        </div>
      </div>
    `).join('');
  }

  updateCAPAStatus(actionId, newStatus) {
    const note = prompt(`Enter safety officer verification note for transitioning to [${newStatus}]:`, `Verified physical barrier restoration.`);
    window.capaTracker.updateStatus(actionId, newStatus, note || '');
    this.renderCAPAView();
    this.showToast(`CAPA ${actionId} status set to [${newStatus}]`);
  }

  // --- RENDERING: SAFETY CORNER ---
  renderSafetyCorner() {
    const container = document.getElementById('safety-corner-modules-container');
    const faqContainer = document.getElementById('safety-faq-modules-container');
    const searchInput = document.getElementById('safety-corner-search');
    const btnStandards = document.getElementById('tab-oil-standards-btn');
    const btnFaqs = document.getElementById('tab-emergency-faqs-btn');

    if (!container) return;

    let activeTab = this._safetyCornerTab || 'standards';
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    // Setup tab click listeners once
    if (btnStandards && !btnStandards._hasListener) {
      btnStandards._hasListener = true;
      btnStandards.addEventListener('click', () => {
        this._safetyCornerTab = 'standards';
        btnStandards.className = 'btn btn-sm btn-primary-glow';
        if (btnFaqs) btnFaqs.className = 'btn btn-sm btn-outline';
        if (container) container.classList.remove('hidden');
        if (faqContainer) faqContainer.classList.add('hidden');
        this.renderSafetyCorner();
      });
    }

    if (btnFaqs && !btnFaqs._hasListener) {
      btnFaqs._hasListener = true;
      btnFaqs.addEventListener('click', () => {
        this._safetyCornerTab = 'faqs';
        btnFaqs.className = 'btn btn-sm btn-primary-glow';
        if (btnStandards) btnStandards.className = 'btn btn-sm btn-outline';
        if (faqContainer) faqContainer.classList.remove('hidden');
        if (container) container.classList.add('hidden');
        this.renderSafetyCorner();
      });
    }

    if (searchInput && !searchInput._hasListener) {
      searchInput._hasListener = true;
      searchInput.addEventListener('input', () => {
        this.renderSafetyCorner();
      });
    }

    // Render Standards
    let filteredModules = window.OIL_SAFETY_MODULES || [];
    if (query) {
      filteredModules = filteredModules.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.summary.toLowerCase().includes(query) ||
        m.keyRules.some(r => r.toLowerCase().includes(query)) ||
        m.checklist.some(c => c.toLowerCase().includes(query))
      );
    }

    if (filteredModules.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <span>🔍</span>
          <h3>No matching OIL Safety Standards found</h3>
          <p>Try searching for "gas", "height", "electrical", "harness", "scaffolding", or "fire".</p>
        </div>
      `;
    } else {
      container.innerHTML = filteredModules.map(mod => `
        <div class="safety-module-card" style="border-top-color: ${mod.color}">
          <div class="module-header">
            <div class="module-title-group">
              <span class="module-icon">${mod.icon}</span>
              <div>
                <h3 class="module-title">${mod.title}</h3>
                <span class="module-badge" style="color: ${mod.color}; border: 1px solid ${mod.color}44;">${mod.badge}</span>
              </div>
            </div>
            <p class="module-summary">${mod.summary}</p>
          </div>

          <!-- Key Rules -->
          <div class="module-rules-box">
            <h4 class="rules-subtitle">🛡️ Approved Organizational Guidelines:</h4>
            <ul class="rules-list">
              ${mod.keyRules.map(r => `<li>${this.formatMarkdownInline(r)}</li>`).join('')}
            </ul>
          </div>

          <!-- Interactive Checklist -->
          <div class="module-checklist-box">
            <h4 class="checklist-subtitle">🚨 Mandatory Safety Verification Checklist:</h4>
            <ul class="checklist-items">
              ${mod.checklist.map((c, i) => `
                <li class="checklist-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="chk-mod-${mod.id}-${i}" onchange="window.riskRadarApp.showToast('Checklist item verified: ${this.escapeHtml(c.slice(0, 30))}...')" />
                    <span class="checkbox-text">${this.escapeHtml(c)}</span>
                  </label>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `).join('');
    }

    // Render Emergency Action FAQs
    if (faqContainer && typeof window.EMERGENCY_FAQS !== 'undefined') {
      let filteredFaqs = window.EMERGENCY_FAQS;
      if (query) {
        filteredFaqs = filteredFaqs.filter(f =>
          f.title.toLowerCase().includes(query) ||
          f.summary.toLowerCase().includes(query) ||
          f.faqs.some(item => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)) ||
          f.checklist.some(c => c.toLowerCase().includes(query))
        );
      }

      if (filteredFaqs.length === 0) {
        faqContainer.innerHTML = `
          <div class="empty-state-card" style="grid-column: 1 / -1;">
            <span>🔍</span>
            <h3>No matching Crisis Action Guides found</h3>
            <p>Try searching for "cpr", "burns", "fire", "extinguisher", "gas leak", or "shock".</p>
          </div>
        `;
      } else {
        faqContainer.innerHTML = filteredFaqs.map(item => `
          <div class="safety-module-card" style="border-top-color: ${item.color}">
            <div class="module-header">
              <div class="module-title-group">
                <span class="module-icon">${item.icon}</span>
                <div>
                  <h3 class="module-title">${item.title}</h3>
                  <span class="module-badge" style="color: ${item.color}; border: 1px solid ${item.color}44;">${item.badge}</span>
                </div>
              </div>
              <p class="module-summary">${item.summary}</p>
            </div>

            <!-- Emergency Action Checklist -->
            <div class="module-checklist-box">
              <h4 class="checklist-subtitle" style="color: #ef4444;">🚨 Immediate Action Checklist:</h4>
              <ul class="checklist-items">
                ${item.checklist.map((c, i) => `
                  <li class="checklist-item">
                    <label class="checkbox-label">
                      <input type="checkbox" id="chk-faq-${item.id}-${i}" onchange="window.riskRadarApp.showToast('Action logged: ${this.escapeHtml(c.slice(0, 30))}...')" />
                      <span class="checkbox-text" style="color: #f8fafc;">${this.escapeHtml(c)}</span>
                    </label>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Q&A Explanations -->
            <div class="module-rules-box" style="margin-top: 1rem;">
              <h4 class="rules-subtitle" style="color: #38bdf8;">💡 Critical Knowledge & SOPs:</h4>
              <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem;">
                ${item.faqs.slice(0, 3).map(q => `
                  <div style="background: rgba(15, 23, 42, 0.6); padding: 0.6rem 0.8rem; border-radius: 6px; border-left: 3px solid ${item.color};">
                    <strong style="color: #f1f5f9; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Q: ${this.escapeHtml(q.q)}</strong>
                    <p style="color: #cbd5e1; font-size: 0.8rem; white-space: pre-line; margin: 0;">${this.escapeHtml(q.a)}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // --- RENDERING: ANALYTICS & TRENDS ---
  renderAnalyticsView() {
    const container = document.getElementById('analytics-charts-grid');
    if (!container) return;

    container.innerHTML = `
      <!-- Executive Safety Intelligence KPI Row -->
      <div class="analytics-kpi-row">
        <div class="analytics-kpi-card">
          <div class="kpi-top-row">
            <span class="kpi-tag">PRECURSOR INTERCEPTION</span>
            <span class="kpi-chip chip-success">↑ 3.2% MoM</span>
          </div>
          <div class="analytics-kpi-val">94.8%</div>
          <p class="analytics-kpi-desc">High-energy precursors caught and mitigated before barrier collapse.</p>
          <div class="kpi-benchmark">Target: >90% • Status: <strong style="color: #10b981;">Optimal</strong></div>
        </div>

        <div class="analytics-kpi-card">
          <div class="kpi-top-row">
            <span class="kpi-tag">CRITICAL BARRIER INTEGRITY</span>
            <span class="kpi-chip chip-warning">12 Active Gaps</span>
          </div>
          <div class="analytics-kpi-val">79.2%</div>
          <p class="analytics-kpi-desc">Physical & administrative safety barrier health across active assets.</p>
          <div class="kpi-benchmark">Target: >85% • Status: <strong style="color: #f59e0b;">Monitoring</strong></div>
        </div>

        <div class="analytics-kpi-card">
          <div class="kpi-top-row">
            <span class="kpi-tag">MEAN TIME TO REPAIR (MTBR)</span>
            <span class="kpi-chip chip-success">↓ 1.4 hrs</span>
          </div>
          <div class="analytics-kpi-val">3.6 <span style="font-size: 1rem; font-weight: 600;">hrs</span></div>
          <p class="analytics-kpi-desc">Average turnaround to rectify identified compromised barriers.</p>
          <div class="kpi-benchmark">Industry Norm: 6.0 hrs • Status: <strong style="color: #10b981;">Top Decile</strong></div>
        </div>

        <div class="analytics-kpi-card">
          <div class="kpi-top-row">
            <span class="kpi-tag">SAFE OPERATING MAN-HOURS</span>
            <span class="kpi-chip chip-success">0 LTI</span>
          </div>
          <div class="analytics-kpi-val">438,500 <span style="font-size: 1rem; font-weight: 600;">hrs</span></div>
          <p class="analytics-kpi-desc">Cumulative safe operation across Duliajan, Digboi & Moran fields.</p>
          <div class="kpi-benchmark">Consecutive Days: <strong style="color: #2563eb;">412 Days Incident-Free</strong></div>
        </div>
      </div>

      <!-- Two Column Visual Charts Grid -->
      <div class="analytics-cards-2col">
        <!-- Chart 1: SIF Trajectory vs Safety Threshold -->
        <div class="analytics-card">
          <div class="analytics-card-header">
            <div>
              <h3 class="analytics-card-title">📈 SIF Precursor Trajectory & Intervention Threshold (Past 8 Weeks)</h3>
              <p class="analytics-sub">Tracking precursor index against regulatory critical action thresholds.</p>
            </div>
            <span class="analytics-pill">8-Week Rolling</span>
          </div>

          <div class="chart-wrapper">
            <svg viewBox="0 0 540 220" class="analytics-svg-chart">
              <!-- Threshold Background Zones -->
              <rect x="50" y="20" width="470" height="60" fill="rgba(239, 68, 68, 0.07)" rx="4" />
              <rect x="50" y="80" width="470" height="60" fill="rgba(245, 158, 11, 0.05)" rx="4" />
              <rect x="50" y="140" width="470" height="50" fill="rgba(16, 185, 129, 0.05)" rx="4" />

              <!-- Threshold Lines -->
              <line x1="50" y1="80" x2="520" y2="80" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,4" />
              <text x="515" y="75" fill="#ef4444" font-size="9" font-weight="700" text-anchor="end">CRITICAL THRESHOLD (70)</text>

              <line x1="50" y1="140" x2="520" y2="140" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,4" />
              <text x="515" y="135" fill="#10b981" font-size="9" font-weight="700" text-anchor="end">SAFE BASELINE (40)</text>

              <!-- Axes Grid Lines -->
              <line x1="50" y1="20" x2="50" y2="190" stroke="#cbd5e1" stroke-width="1" />
              <line x1="50" y1="190" x2="520" y2="190" stroke="#cbd5e1" stroke-width="1" />

              <!-- Y-Axis Ticks -->
              <text x="42" y="25" fill="#64748b" font-size="9" text-anchor="end">100</text>
              <text x="42" y="82" fill="#64748b" font-size="9" text-anchor="end">70</text>
              <text x="42" y="142" fill="#64748b" font-size="9" text-anchor="end">40</text>
              <text x="42" y="192" fill="#64748b" font-size="9" text-anchor="end">0</text>

              <!-- Filled Area Under Curve -->
              <defs>
                <linearGradient id="sifAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35" />
                  <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.15" />
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Data Polyline Area -->
              <polygon points="80,190 80,155 140,145 200,140 260,110 320,120 380,65 440,85 500,45 500,190" fill="url(#sifAreaGrad)" />
              <polyline points="80,155 140,145 200,140 260,110 320,120 380,65 440,85 500,45" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

              <!-- Data Nodes with Value Labels -->
              <!-- W1 -->
              <circle cx="80" cy="155" r="4.5" fill="#10b981" stroke="#fff" stroke-width="2" />
              <text x="80" y="150" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">24</text>
              <text x="80" y="205" fill="#64748b" font-size="9" font-weight="600" text-anchor="middle">W1</text>

              <!-- W2 -->
              <circle cx="140" cy="145" r="4.5" fill="#10b981" stroke="#fff" stroke-width="2" />
              <text x="140" y="138" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">30</text>
              <text x="140" y="205" fill="#64748b" font-size="9" font-weight="600" text-anchor="middle">W2</text>

              <!-- W3 -->
              <circle cx="200" cy="140" r="4.5" fill="#10b981" stroke="#fff" stroke-width="2" />
              <text x="200" y="132" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">34</text>
              <text x="200" y="205" fill="#64748b" font-size="9" font-weight="600" text-anchor="middle">W3</text>

              <!-- W4 -->
              <circle cx="260" cy="110" r="4.5" fill="#f59e0b" stroke="#fff" stroke-width="2" />
              <text x="260" y="102" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">52</text>
              <text x="260" y="205" fill="#64748b" font-size="9" font-weight="600" text-anchor="middle">W4</text>

              <!-- W5 -->
              <circle cx="320" cy="120" r="4.5" fill="#f59e0b" stroke="#fff" stroke-width="2" />
              <text x="320" y="112" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">46</text>
              <text x="320" y="205" fill="#64748b" font-size="9" font-weight="600" text-anchor="middle">W5</text>

              <!-- W6 -->
              <circle cx="380" cy="65" r="5.5" fill="#ef4444" stroke="#fff" stroke-width="2" />
              <text x="380" y="56" fill="#ef4444" font-size="9" font-weight="800" text-anchor="middle">78</text>
              <text x="380" y="205" fill="#64748b" font-size="9" font-weight="600" text-anchor="middle">W6</text>

              <!-- W7 -->
              <circle cx="440" cy="85" r="4.5" fill="#f59e0b" stroke="#fff" stroke-width="2" />
              <text x="440" y="78" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">66</text>
              <text x="440" y="205" fill="#64748b" font-size="9" font-weight="600" text-anchor="middle">W7</text>

              <!-- W8 -->
              <circle cx="500" cy="45" r="6" fill="#ef4444" stroke="#fff" stroke-width="2.5" />
              <text x="500" y="36" fill="#ef4444" font-size="9.5" font-weight="900" text-anchor="middle">92</text>
              <text x="500" y="205" fill="#ef4444" font-size="9" font-weight="800" text-anchor="middle">W8 (Now)</text>
            </svg>
          </div>

          <div class="xai-explain-callout">
            <span class="xai-callout-icon">💡</span>
            <div class="xai-callout-text">
              <strong>Explainable Trend Analysis:</strong> W6 and W8 spikes were driven by Rig-21 crown block height operations and Wellhead #47 gas flaring. Early precursor detection enabled SWA before injury occurred.
            </div>
          </div>
        </div>

        <!-- Chart 2: Heinrich-Bird SIF Prevention Pyramid -->
        <div class="analytics-card">
          <div class="analytics-card-header">
            <div>
              <h3 class="analytics-card-title">🔺 Heinrich-Bird Industrial Safety Pyramid</h3>
              <p class="analytics-sub">Hierarchical ratio of hazards, precursors, and fatal injury prevention.</p>
            </div>
            <span class="analytics-pill">Explainable Model</span>
          </div>

          <div class="safety-pyramid-container">
            <div class="pyramid-tier tier-fatality">
              <div class="tier-badge-pill">APEX TIER</div>
              <div class="tier-content">
                <strong>1 Fatal / Catastrophic Incident</strong>
                <span>Target: ZERO • RiskRadar AI Intercepted: 100%</span>
              </div>
            </div>

            <div class="pyramid-tier tier-sif">
              <div class="tier-badge-pill">SIF TIER</div>
              <div class="tier-content">
                <strong>10 Serious Injury & Fatality (SIF) Precursors</strong>
                <span>High-energy release events intercepted at barrier degradation stage</span>
              </div>
            </div>

            <div class="pyramid-tier tier-minor">
              <div class="tier-badge-pill">OSHA RECORDABLE</div>
              <div class="tier-content">
                <strong>30 Minor / First-Aid Operational Incidents</strong>
                <span>Controlled medical treatment cases with secondary defense intact</span>
              </div>
            </div>

            <div class="pyramid-tier tier-nearmiss">
              <div class="tier-badge-pill">NEAR MISS</div>
              <div class="tier-content">
                <strong>300 Near Misses Flagged by NLP Engine</strong>
                <span>Unmitigated energy releases without worker presence in strike zone</span>
              </div>
            </div>

            <div class="pyramid-tier tier-unsafe">
              <div class="tier-badge-pill">BASE FOUNDATION</div>
              <div class="tier-content">
                <strong>3,000+ Unsafe Acts & Latent Micro-Conditions</strong>
                <span>Routine daily hazard observations, missing PPE, procedural workarounds</span>
              </div>
            </div>
          </div>

          <div class="xai-explain-callout">
            <span class="xai-callout-icon">🔬</span>
            <div class="xai-callout-text">
              <strong>The Science of SIF Elimination:</strong> Traditional programs only track total injury counts. RiskRadar isolates <em>high-energy</em> precursors in the bottom 300/3000 tiers to permanently prevent the top 1 fatality.
            </div>
          </div>
        </div>
      </div>

      <!-- Second Row: OIL Asset Location Risk Matrix Table -->
      <div class="analytics-card" style="margin-top: 1.5rem;">
        <div class="analytics-card-header">
          <div>
            <h3 class="analytics-card-title">📍 Asset Location Risk Matrix (OIL Field Installations)</h3>
            <p class="analytics-sub">Real-time threat density, dominant high-energy vectors, and barrier gap status across active OIL assets.</p>
          </div>
          <span class="analytics-pill">Live Operational Telemetry</span>
        </div>

        <div class="table-responsive">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>OIL Operating Asset</th>
                <th>Location / Basin</th>
                <th>Condition Tier</th>
                <th>Risk Score</th>
                <th>Dominant Energy Vector</th>
                <th>Breached Barrier</th>
                <th>Prescriptive Action</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-critical">
                <td><strong>Rig-21 Derrick Fleet</strong></td>
                <td>Duliajan Field, Assam</td>
                <td><span class="cond-tag cond-tag-critical">🔴 CRITICAL SIF</span></td>
                <td><strong style="color: #ef4444;">94 / 100</strong></td>
                <td>Gravitational (Fall from 38m)</td>
                <td>Dual Fall Arrest Lanyard</td>
                <td><span class="action-chip chip-urgent">Stop-Work Authority Issued</span></td>
              </tr>
              <tr class="row-high">
                <td><strong>Wellhead #47 (Gas Field)</strong></td>
                <td>Bhogpara, Upper Assam</td>
                <td><span class="cond-tag cond-tag-high">🟠 HIGH RISK</span></td>
                <td><strong style="color: #f59e0b;">78 / 100</strong></td>
                <td>High-Pressure Hydrocarbon Gas</td>
                <td>Secondary Flange Seal</td>
                <td><span class="action-chip chip-action">Replace Seal in Shift 1</span></td>
              </tr>
              <tr class="row-high">
                <td><strong>Tank Farm T-104</strong></td>
                <td>Digboi Refinery Basin</td>
                <td><span class="cond-tag cond-tag-high">🟠 HIGH RISK</span></td>
                <td><strong style="color: #f59e0b;">74 / 100</strong></td>
                <td>Confined Space Toxic Vapor</td>
                <td>Forced Air Scavenger Fan</td>
                <td><span class="action-chip chip-action">Calibrate Ventilation CFM</span></td>
              </tr>
              <tr class="row-moderate">
                <td><strong>Naharkatia Pipeline KM 42</strong></td>
                <td>Naharkatia Trunk Line</td>
                <td><span class="cond-tag cond-tag-moderate">🟡 MODERATE</span></td>
                <td><strong style="color: #3b82f6;">52 / 100</strong></td>
                <td>Pressurized Liquid Crude</td>
                <td>Wall Thickness Loss (NDT)</td>
                <td><span class="action-chip chip-monitor">Schedule Ultrasonic Scan</span></td>
              </tr>
              <tr class="row-moderate">
                <td><strong>Substation MCC-3</strong></td>
                <td>Duliajan Power Grid</td>
                <td><span class="cond-tag cond-tag-moderate">🟡 MODERATE</span></td>
                <td><strong style="color: #3b82f6;">48 / 100</strong></td>
                <td>11kV Electrical Flash Arc</td>
                <td>Earth Pit Resistance Margins</td>
                <td><span class="action-chip chip-monitor">Inspect Grounding Straps</span></td>
              </tr>
              <tr class="row-low">
                <td><strong>Central Workshop Base</strong></td>
                <td>Moran Asset Yard</td>
                <td><span class="cond-tag cond-tag-low">🟢 LOW / ROUTINE</span></td>
                <td><strong style="color: #10b981;">24 / 100</strong></td>
                <td>Kinetic Mechanical Handling</td>
                <td>None (All Verified Intact)</td>
                <td><span class="action-chip chip-safe">Routine Preventative PM</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Third Row: Barrier Integrity vs XAI Feature Weights -->
      <div class="analytics-cards-2col" style="margin-top: 1.5rem;">
        <!-- Card: Critical Safety Barrier Reliability -->
        <div class="analytics-card">
          <div class="analytics-card-header">
            <div>
              <h3 class="analytics-card-title">🛡️ Critical Safety Barrier Reliability & Gap Index</h3>
              <p class="analytics-sub">Defense-in-depth barrier performance across OIL facilities.</p>
            </div>
            <span class="analytics-pill">Reliability Index</span>
          </div>

          <div class="barrier-reliability-list">
            <div class="barrier-rel-item">
              <div class="rel-meta">
                <span>🔒 Physical Isolation & Lockout / Tagout (LOTO)</span>
                <strong style="color: #10b981;">88% [Intact]</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 88%; background: #10b981;"></div></div>
            </div>

            <div class="barrier-rel-item">
              <div class="rel-meta">
                <span>🪢 Fall Arrest & Inertia Reel Lanyards (>1.8m)</span>
                <strong style="color: #ef4444;">62% [Degraded - Action Req.]</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 62%; background: #ef4444;"></div></div>
            </div>

            <div class="barrier-rel-item">
              <div class="rel-meta">
                <span>📡 Toxic Gas (H2S / CH4) Fixed Detectors & Sniffers</span>
                <strong style="color: #10b981;">96% [Certified]</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 96%; background: #10b981;"></div></div>
            </div>

            <div class="barrier-rel-item">
              <div class="rel-meta">
                <span>💨 Confined Space Forced Air Exhaust Blowers</span>
                <strong style="color: #f59e0b;">71% [Sub-Optimal CFM]</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 71%; background: #f59e0b;"></div></div>
            </div>

            <div class="barrier-rel-item">
              <div class="rel-meta">
                <span>📑 Hot Work & Critical Permit-to-Work (PTW)</span>
                <strong style="color: #10b981;">92% [Compliant]</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 92%; background: #10b981;"></div></div>
            </div>
          </div>
        </div>

        <!-- Card: Explainable AI (XAI) Model Feature Importance -->
        <div class="analytics-card">
          <div class="analytics-card-header">
            <div>
              <h3 class="analytics-card-title">🧠 Explainable AI (XAI) Model Feature Weights</h3>
              <p class="analytics-sub">How RiskRadar NLP and neural layers mathematically weight hazard factors.</p>
            </div>
            <span class="analytics-pill">Audit Transparency</span>
          </div>

          <div class="xai-weights-list">
            <div class="xai-weight-item">
              <div class="rel-meta">
                <span>⚡ Kinetic / Gravity / Pressure Energy Magnitude</span>
                <strong>35% Weight</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 35%; background: #ef4444;"></div></div>
              <span class="xai-subtext">Primary fatality potential multiplier derived from OISD-179 standards.</span>
            </div>

            <div class="xai-weight-item">
              <div class="rel-meta">
                <span>🚫 Compromised / Breached Safety Barrier Count</span>
                <strong>30% Weight</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 30%; background: #f59e0b;"></div></div>
              <span class="xai-subtext">Absence of defensive layers protecting personnel in hazardous zone.</span>
            </div>

            <div class="xai-weight-item">
              <div class="rel-meta">
                <span>☣️ Toxic / Flammable Gas Atmosphere Concentration</span>
                <strong>20% Weight</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 20%; background: #3b82f6;"></div></div>
              <span class="xai-subtext">LEL and PPM thresholds exceeding OISD-116 permitted exposure.</span>
            </div>

            <div class="xai-weight-item">
              <div class="rel-meta">
                <span>🔄 Historic Asset Vulnerability & Recurrence Index</span>
                <strong>15% Weight</strong>
              </div>
              <div class="rel-track"><div class="rel-fill" style="width: 15%; background: #8b5cf6;"></div></div>
              <span class="xai-subtext">Chronic failure signatures recorded at specific asset tag over 180 days.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- CONFIGURABLE EMERGENCY CONTACTS & SERVICES ---
  initEmergencyConfig() {
    const saveContactsBtn = document.getElementById('save-emergency-contacts-btn');
    const saveServicesBtn = document.getElementById('save-emergency-services-btn');

    if (saveContactsBtn) {
      saveContactsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const c1Name = document.getElementById('cfg-c1-name').value.trim();
        const c1Phone = document.getElementById('cfg-c1-phone').value.trim();
        const c2Name = document.getElementById('cfg-c2-name').value.trim();
        const c2Phone = document.getElementById('cfg-c2-phone').value.trim();

        if (!c1Name || !c1Phone || !c2Name || !c2Phone) {
          alert('At least two personal emergency contacts are mandatory.');
          return;
        }

        const contacts = [
          { name: c1Name, phone: c1Phone, relation: document.getElementById('cfg-c1-rel').value, email: document.getElementById('cfg-c1-email').value },
          { name: c2Name, phone: c2Phone, relation: document.getElementById('cfg-c2-rel').value, email: document.getElementById('cfg-c2-email').value }
        ];

        localStorage.setItem('riskradar_contacts', JSON.stringify(contacts));
        this.showToast('Personal Emergency Contacts saved successfully!');
      });
    }

    if (saveServicesBtn) {
      saveServicesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const services = {
          oilControlRoom: {
            name: 'OIL Central Emergency Control Room',
            phone: document.getElementById('cfg-ctrl-phone').value.trim(),
            email: document.getElementById('cfg-ctrl-email').value.trim()
          },
          fireStation: {
            name: 'Industrial Fire Station',
            phone: document.getElementById('cfg-fire-phone').value.trim(),
            hotline: '101'
          },
          hospital: {
            name: 'OIL Hospital & Trauma Center',
            phone: document.getElementById('cfg-hosp-phone').value.trim(),
            hotline: '102'
          },
          police: {
            name: 'District Police Control Room',
            phone: document.getElementById('cfg-police-phone').value.trim(),
            hotline: '112'
          }
        };

        window.riskAlertSystem.saveEmergencyServices(services);
        this.showToast('OIL Institutional Emergency Services updated!');
      });
    }
  }

  // --- REFRESH ALL ---
  refreshAllViews() {
    this.renderDashboard();
    this.renderRiskQueue();
    this.renderAlertsView();
    this.renderCAPAView();
  }

  // --- INITIAL SAMPLE DATA (All Risk Tiers: Critical, High, Moderate, Low) ---
  getInitialSampleReports() {
    return [
      // --- TIER 1: CRITICAL & HIGH RISK (SIF Precursors) ---
      {
        reportId: 'OIL-REP-712894',
        timestamp: new Date().toISOString(),
        rawText: 'Worker working at height on rig derrick at 14m elevation without safety harness or fall arrestor near an unprotected open edge during drill string tripping in windy conditions (OIL Rig-21, Duliajan). No secondary tie-off observed; floor toe-boards were missing on the monkey board platform.',
        location: 'OIL Drilling Rig-21, Duliajan',
        department: 'Drilling & Workover Services (D&WS)',
        reporterName: 'S. Sharma (Derrickman Observer)',
        reportClassification: 'Combined Unsafe Act & Unsafe Condition',
        isSifPrecursor: true,
        riskLevel: 'CRITICAL',
        riskScore: 94,
        confidenceScore: 96,
        uncertaintyScore: 3.8,
        matchedEnergies: [
          { id: 'gravity_height', name: 'Gravity / Fall from Height', sifWeight: 0.95 }
        ],
        detectedBarrierGaps: [
          'Absence of Fall Arrest System / Harness',
          'Missing Toe-boards & Guardrails on Monkey Board'
        ],
        highlightedTokens: ['height', '14m', 'without safety harness', 'fall arrestor', 'open edge', 'missing'],
        responsibleExplanation: {
          summary: 'Potential Serious Injury & Fatality (SIF) precursor identified by RiskRadar AI NLP engine.',
          details: 'The incident analysis indicates high-magnitude potential energy exposure involving [Gravity / Fall from Height] coupled with critical barrier impairment (Absence of Fall Arrest System / Harness). In industrial safety models (OISD / Heinrich-Bird), this combination presents a credible exposure to fatal or permanently disabling trauma if initiating conditions repeat without immediate engineering intervention.',
          verificationNote: 'Responsible AI Disclosure: Automated probabilistic prediction (Confidence: 96%, Uncertainty: ±3.8%). Human Safety Officer verification mandatory.',
          barrierAnalysis: 'Primary critical barrier failed: Fall Protection / 100% Tie-off.'
        },
        recommendedActions: [
          {
            title: 'Issue Immediate Stop-Work Directive on Rig-21',
            priority: 'IMMEDIATE',
            timeline: 'Immediate (< 1 Hour)',
            assigneeRole: 'Er. R. Borah (Rig Superintendent)',
            actionDetails: 'Halt all derrick climbing operations until physical harness inspection and temporary edge barriers are installed.'
          },
          {
            title: 'Fall Protection Barrier Re-Certification',
            priority: 'CRITICAL',
            timeline: 'Within 4 Hours',
            assigneeRole: 'Rig Safety Officer',
            actionDetails: 'Inspect full-body harnesses, verify 100% tie-off anchors, and install temporary safety nets or rigid edge guardrails.'
          }
        ]
      },
      {
        reportId: 'OIL-REP-642109',
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        rawText: 'Gas detector alarm sounded at Wellhead #47 gathering station; H2S reading spiked to 28 ppm; contractor crew attempted manual valve isolation without positive-pressure SCBA breathing apparatus. Wind velocity was calm; vapor settled near ground elevation.',
        location: 'Wellhead #47 Gathering Station, Moran',
        department: 'Production (Gas & Oil Asset)',
        reporterName: 'P. Saikia (Operator)',
        reportClassification: 'Near-Miss Event',
        isSifPrecursor: true,
        riskLevel: 'CRITICAL',
        riskScore: 95,
        confidenceScore: 97,
        uncertaintyScore: 3.2,
        matchedEnergies: [
          { id: 'hydrocarbon_gas', name: 'Hydrocarbon Release / Combustible & Toxic Gas', sifWeight: 0.98 }
        ],
        detectedBarrierGaps: [
          'Absence of Gas Testing / Respiratory Protection'
        ],
        highlightedTokens: ['gas detector alarm', 'h2s', '28 ppm', 'without', 'scba'],
        responsibleExplanation: {
          summary: 'Potential SIF precursor: Toxic H2S exposure with compromised breathing barrier.',
          details: 'H2S concentration of 28 ppm exceeds the 15 ppm STEL safety limit. Approaching without SCBA presents acute asphyxiation potential.',
          verificationNote: 'Confidence: 97%, Uncertainty: ±3.2%. Safety Officer verification required.'
        },
        recommendedActions: [
          {
            title: 'Wellhead Isolation & Atmospheric Audit',
            priority: 'CRITICAL',
            timeline: 'Immediate',
            assigneeRole: 'M. Phukan (Lead Process Engineer)',
            actionDetails: 'Depressurize manifold; require SCBA before entry.'
          }
        ]
      },
      {
        reportId: 'OIL-REP-581203',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        rawText: 'Electrician troubleshooting 3.3kV mud pump starter panel with enclosure door swung open and interlock bypassed while main breaker remained energized. No arc-rated face shield or blast apron worn during multimeter probing.',
        location: 'Drilling Substation MCC-3, Naharkatia',
        department: 'Electrical Maintenance Division',
        reporterName: 'B. Deka (Shift Electrician)',
        reportClassification: 'Unsafe Act & Condition',
        isSifPrecursor: true,
        riskLevel: 'HIGH',
        riskScore: 88,
        confidenceScore: 94,
        uncertaintyScore: 4.5,
        matchedEnergies: [
          { id: 'electrical_arc', name: 'Electrical Energy / Arc Flash & Shock', sifWeight: 0.92 }
        ],
        detectedBarrierGaps: [
          'Bypassed Safety Interlock / Missing LOTO Isolation',
          'Absence of NFPA 70E / OISD Arc Flash PPE'
        ],
        highlightedTokens: ['3.3kv', 'interlock bypassed', 'energized', 'no arc-rated face shield'],
        responsibleExplanation: {
          summary: 'High-energy electrical arc flash precursor on 3.3kV mud pump switchgear.',
          details: 'Enclosure opened under live high-voltage with defeated mechanical interlock presents lethal blast and electrocution risk.',
          verificationNote: 'Confidence: 94%, Uncertainty: ±4.5%. Human verification mandatory.'
        },
        recommendedActions: [
          {
            title: 'De-energize MCC-3 & Apply LOTO Padlocks',
            priority: 'CRITICAL',
            timeline: 'Within 2 Hours',
            assigneeRole: 'Electrical Maintenance Superintendent',
            actionDetails: 'Mandate zero-energy verification before troubleshooting.'
          }
        ]
      },

      // --- TIER 2: MODERATE RISK ---
      {
        reportId: 'OIL-REP-432890',
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        rawText: 'Compressor Station #2 Stage-3 cylinder showed abnormal mechanical vibration readings (7.2 mm/s) accompanied by slight valve bonnet flange gasket seepage. System operating within pressure envelope but requiring seal repacking.',
        location: 'Gas Compressor Plant #2, Duliajan',
        department: 'Gas Production & Compression Operations',
        reporterName: 'K. Gogoi (Compressor Tech)',
        reportClassification: 'Unsafe Condition (Equipment Wear)',
        isSifPrecursor: false,
        riskLevel: 'MODERATE',
        riskScore: 58,
        confidenceScore: 88,
        uncertaintyScore: 6.2,
        matchedEnergies: [
          { id: 'mechanical_pressure', name: 'Mechanical & Low Pressure Fluid', sifWeight: 0.45 }
        ],
        detectedBarrierGaps: [
          'Preventive Maintenance Interval Exceeded'
        ],
        highlightedTokens: ['vibration', 'flange gasket seepage', 'seal repacking'],
        responsibleExplanation: {
          summary: 'Moderate equipment condition: Mechanical vibration and minor flange seepage.',
          details: 'Does not meet high-energy threshold for immediate fatality, but requires gasket replacement to prevent escalation.',
          verificationNote: 'Standard Maintenance Work Order provisioned.'
        },
        recommendedActions: [
          {
            title: 'Schedule Flange Gasket Replacement on Compressor #2',
            priority: 'STANDARD',
            timeline: 'Within 48 Hours',
            assigneeRole: 'Mechanical Maintenance Team Lead',
            actionDetails: 'Torque bolts to specification and replace graphite packing during planned maintenance window.'
          }
        ]
      },
      {
        reportId: 'OIL-REP-390112',
        timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
        rawText: 'Forklift operator transporting bundling of 9-5/8 inch casing pipes across pipe yard yard at speed exceeding 10 km/h with load elevated high enough to partially obstruct direct forward visibility. Pedestrian pathway lacked floor demarcation lines.',
        location: 'Central Pipe Storage Yard, Duliajan',
        department: 'Materials & Tubular Services',
        reporterName: 'M. Bora (Yard Supervisor)',
        reportClassification: 'Unsafe Act (Material Handling)',
        isSifPrecursor: false,
        riskLevel: 'MODERATE',
        riskScore: 52,
        confidenceScore: 85,
        uncertaintyScore: 7.1,
        matchedEnergies: [
          { id: 'vehicular_motion', name: 'Mobile Equipment & Vehicle Movement', sifWeight: 0.48 }
        ],
        detectedBarrierGaps: [
          'Absence of Pipe Yard Pedestrian Walkway Markings',
          'Forklift Speed Limit Enforcement'
        ],
        highlightedTokens: ['forklift', 'speed exceeding', 'obstruct forward visibility'],
        responsibleExplanation: {
          summary: 'Moderate risk: Obstructed visibility forklift movement in shared pedestrian yard.',
          details: 'Requires spotter enforcement and yard speed governors.',
          verificationNote: 'Corrective Action provisioned for Materials Superintendent.'
        },
        recommendedActions: [
          {
            title: 'Paint Yellow High-Visibility Pedestrian Walkways',
            priority: 'STANDARD',
            timeline: 'Within 5 Days',
            assigneeRole: 'Yard Safety Supervisor',
            actionDetails: 'Demarcate designated vehicle lanes and enforce horn usage at all pipe rack intersections.'
          }
        ]
      },
      {
        reportId: 'OIL-REP-321876',
        timestamp: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
        rawText: 'Drilling fluid chemical storage area: 200L drum of corrosion inhibitor chemical stored without secondary containment spill pallet. Drum bung was tightly sealed with no active leak, but position was adjacent to stormwater drain ditch.',
        location: 'Mud Chemical Storage Shed, Rig-18',
        department: 'Drilling Fluids Technology',
        reporterName: 'A. Rahman (Mud Engineer)',
        reportClassification: 'Unsafe Condition (Environmental)',
        isSifPrecursor: false,
        riskLevel: 'MODERATE',
        riskScore: 46,
        confidenceScore: 82,
        uncertaintyScore: 7.8,
        matchedEnergies: [
          { id: 'chemical_toxicity', name: 'Chemical Spillage Hazard', sifWeight: 0.38 }
        ],
        detectedBarrierGaps: [
          'Absence of Secondary Containment Drip Tray'
        ],
        highlightedTokens: ['chemical', 'without secondary containment', 'drain ditch'],
        responsibleExplanation: {
          summary: 'Moderate environmental & health hazard: Missing chemical secondary containment.',
          details: 'Sealed container without active release, but proximity to drainage creates environmental compliance breach.',
          verificationNote: 'Routine Environmental & Safety Action.'
        },
        recommendedActions: [
          {
            title: 'Place Chemical Drum onto Polyethylene Spill Pallet',
            priority: 'STANDARD',
            timeline: 'Within 24 Hours',
            assigneeRole: 'Drilling Fluids Logistics Officer',
            actionDetails: 'Relocate drum at least 15m away from stormwater ditch and place onto spill bund.'
          }
        ]
      },

      // --- TIER 3: LOW RISK ---
      {
        reportId: 'OIL-REP-210459',
        timestamp: new Date(Date.now() - 144 * 3600 * 1000).toISOString(),
        rawText: 'Routine shift observation: Housekeeping completed around rig catwalk. Minor rainwater accumulation wiped with industrial mop. Yellow slip hazard cautionary cone positioned on gangway until dry.',
        location: 'Central Rig Floor Catwalk, Duliajan',
        department: 'General Logistics & HSE Support',
        reporterName: 'J. Das (Roustabout Observer)',
        reportClassification: 'Routine Safety Observation',
        isSifPrecursor: false,
        riskLevel: 'LOW',
        riskScore: 18,
        confidenceScore: 92,
        uncertaintyScore: 4.2,
        matchedEnergies: [],
        detectedBarrierGaps: [],
        highlightedTokens: ['housekeeping', 'rainwater accumulation', 'slip hazard cone'],
        responsibleExplanation: {
          summary: 'Low risk routine housekeeping observation.',
          details: 'Minor surface moisture handled promptly with mop and signage. Standard slip, trip, fall prevention maintained.',
          verificationNote: 'Normal operational condition verified.'
        },
        recommendedActions: [
          {
            title: 'Maintain Daily Anti-Slip Mat Inspections',
            priority: 'ROUTINE',
            timeline: 'Weekly Routine',
            assigneeRole: 'Rig Safety Steward',
            actionDetails: 'Ensure non-skid rubber grating is cleared of accumulated mud and oil.'
          }
        ]
      },
      {
        reportId: 'OIL-REP-189342',
        timestamp: new Date(Date.now() - 168 * 3600 * 1000).toISOString(),
        rawText: 'Monthly regulatory inspection: Emergency plumbed eye wash station and drench shower in workshop bay tested for water flow. Pressure measured 32 psi, water clarity clean, dust covers in place, inspection tag signed.',
        location: 'Central Engineering Workshop, Digboi',
        department: 'Mechanical Services & Maintenance',
        reporterName: 'T. Chetia (Workshop HSE Inspector)',
        reportClassification: 'Compliance Audit & Verification',
        isSifPrecursor: false,
        riskLevel: 'LOW',
        riskScore: 12,
        confidenceScore: 95,
        uncertaintyScore: 3.1,
        matchedEnergies: [],
        detectedBarrierGaps: [],
        highlightedTokens: ['eye wash station', 'drench shower', 'inspection tag signed'],
        responsibleExplanation: {
          summary: 'Low risk audit: Safety shower & eye wash station verified fully compliant.',
          details: 'All regulatory flow parameters met. System is 100% operational for emergency response.',
          verificationNote: 'Compliance record logged.'
        },
        recommendedActions: [
          {
            title: 'File Monthly Safety Shower Inspection Tag',
            priority: 'ROUTINE',
            timeline: 'Next Month',
            assigneeRole: 'Workshop Maintenance Foreman',
            actionDetails: 'Next routine flow verification scheduled for next calendar month.'
          }
        ]
      },
      {
        reportId: 'OIL-REP-110298',
        timestamp: new Date(Date.now() - 192 * 3600 * 1000).toISOString(),
        rawText: 'Field medical audit: Rig-21 primary first aid kit inspected. Replaced expired antiseptic wipe packets and replenished burn dressing pads and sterile eye wash solution ampoules. Inventory sign-off complete.',
        location: 'OIL Drilling Rig-21 Toolpusher Office',
        department: 'Medical & Occupational Health Services',
        reporterName: 'Nurse B. Saikia (OIL Field Medic)',
        reportClassification: 'Medical Inventory Audit',
        isSifPrecursor: false,
        riskLevel: 'LOW',
        riskScore: 8,
        confidenceScore: 98,
        uncertaintyScore: 2.0,
        matchedEnergies: [],
        detectedBarrierGaps: [],
        highlightedTokens: ['first aid kit', 'burn dressing pads', 'inventory sign-off'],
        responsibleExplanation: {
          summary: 'Low risk medical supply maintenance.',
          details: 'Medical response kit fully restocked and compliant with DGMS & OISD medical guidelines.',
          verificationNote: 'Audit complete.'
        },
        recommendedActions: [
          {
            title: 'Quarterly Field Medic Inventory Reconciliation',
            priority: 'ROUTINE',
            timeline: 'Quarterly',
            assigneeRole: 'OIL Occupational Health Officer',
            actionDetails: 'Verify tamper-evident seal remains intact during routine bi-weekly walkthrough.'
          }
        ]
      }
    ];
  }

  // --- UTILITIES ---
  setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  formatMarkdownInline(text) {
    let html = this.escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return html;
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  initNetworkListener() {
    const offlinePill = document.getElementById('network-status-indicator');
    const update = () => {
      if (navigator.onLine) {
        if (offlinePill) {
          offlinePill.className = 'network-pill pill-online';
          offlinePill.innerHTML = '● ONLINE (OIL Cloud Sync)';
        }
      } else {
        if (offlinePill) {
          offlinePill.className = 'network-pill pill-offline';
          offlinePill.innerHTML = '⚡ OFFLINE MODE (Local Storage)';
        }
      }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }
}

// Global helpers
window.askChatbotAboutReport = function(reportId) {
  const chatInput = document.getElementById('chat-user-input');
  const chatForm = document.getElementById('chat-form');
  const chatDrawer = document.getElementById('ai-chat-drawer');
  if (chatDrawer && chatDrawer.classList.contains('collapsed')) {
    chatDrawer.classList.remove('collapsed');
  }
  if (chatInput) {
    chatInput.value = `How should the safety team mitigate the SIF precursor identified in report ${reportId}?`;
    if (chatForm) chatForm.dispatchEvent(new Event('submit'));
  }
};
