// RiskRadar AI - Automated Alert, Emergency Services & SOS Broadcast System
// Configurable for Personal Contacts + OIL Institutional Emergency Services

class RiskAlertSystem {
  constructor() {
    this.countdownTimer = null;
    this.countdownRemaining = 5;
    this.sirenAudioContext = null;
    this.sirenOscillator = null;
    this.sirenLfo = null;
    this.isSirenPlaying = false;
    this.currentCoordinates = null;

    this.emergencyServices = this.loadEmergencyServices();
    this.initUI();
    this.requestInitialPermissions();
    this.trackLocation();
  }

  loadEmergencyServices() {
    const key = 'riskradar_emergency_services';
    const defaults = {
      oilControlRoom: { name: 'OIL Central Emergency Control Room (Duliajan)', phone: '0374-2800555', email: 'controlroom@oilindia.in' },
      fireStation: { name: 'OIL Industrial Fire & Rescue Station', phone: '0374-2800101', hotline: '101' },
      hospital: { name: 'OIL Hospital & Emergency Trauma Center', phone: '0374-2800222', hotline: '102' },
      police: { name: 'District Police Headquarters / Control Room', phone: '0374-2800100', hotline: '112' }
    };
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {}
    return defaults;
  }

  saveEmergencyServices(services) {
    this.emergencyServices = services;
    localStorage.setItem('riskradar_emergency_services', JSON.stringify(services));
  }

  initUI() {
    this.modalEl = document.getElementById('emergency-alert-modal');
    this.countdownEl = document.getElementById('countdown-timer-val');
    this.cancelAlertBtn = document.getElementById('cancel-alert-btn');
    this.immediateDispatchBtn = document.getElementById('dispatch-now-btn');
    this.sirenToggleBtn = document.getElementById('toggle-siren-btn');
    this.sosHeaderBtn = document.getElementById('header-sos-btn');
    this.dispatchedStatusModal = document.getElementById('dispatch-success-modal');

    if (this.cancelAlertBtn) {
      this.cancelAlertBtn.addEventListener('click', () => this.cancelAutoAlert());
    }

    if (this.immediateDispatchBtn) {
      this.immediateDispatchBtn.addEventListener('click', () => {
        clearInterval(this.countdownTimer);
        this.executeDispatch();
      });
    }

    if (this.sosHeaderBtn) {
      this.sosHeaderBtn.addEventListener('click', () => this.triggerManualSOS());
    }

    if (this.sirenToggleBtn) {
      this.sirenToggleBtn.addEventListener('click', () => this.toggleSiren());
    }
  }

  requestInitialPermissions() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  trackLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toLocaleString()
          };
          const locBadge = document.getElementById('gps-status-badge');
          if (locBadge) {
            locBadge.innerHTML = `📍 GPS Active: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            locBadge.classList.add('gps-locked');
          }
        },
        () => {
          const locBadge = document.getElementById('gps-status-badge');
          if (locBadge) {
            locBadge.innerHTML = `📍 Location: Assam Operational Assets`;
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  triggerAutoAlert(threatType, details) {
    this.activeThreat = {
      type: threatType,
      details: details,
      timestamp: new Date().toLocaleString(),
      isManual: false
    };

    this.showCountdownModal();
  }

  triggerManualSOS() {
    this.activeThreat = {
      type: 'MANUAL RED SOS EMERGENCY TRIGGERED',
      details: 'On-site user activated emergency distress beacon.',
      timestamp: new Date().toLocaleString(),
      isManual: true
    };

    this.executeDispatch();
  }

  triggerCriticalSIFAlert(report) {
    this.activeThreat = {
      type: `SIF PRECURSOR ALERT: ${report.reportClassification}`,
      details: `Hazard: ${report.matchedEnergies ? report.matchedEnergies.map(e => e.name).join(', ') : 'High Potential Event'}. Risk Score: ${report.riskScore}/100 at ${report.location}.`,
      report: report,
      timestamp: new Date().toLocaleString(),
      isManual: false
    };

    this.showCountdownModal();
  }

  recordAlertSilently(report) {
    // Record alert in repository without sounding alarm or displaying panic modal
    const alertEntry = {
      id: 'ALT-' + (report.id || Date.now().toString().slice(-6)),
      type: `SIF PRECURSOR: ${report.reportClassification || 'Incident Precursor'}`,
      details: `Identified SIF precursor at ${report.location || 'OIL Asset'}. Risk Score: ${report.riskScore}/100 [${report.riskLevel}].`,
      reportId: report.id || ('OIL-' + Date.now().toString().slice(-6)),
      location: report.location || 'OIL Operational Facility',
      department: report.department || 'Operations',
      riskScore: report.riskScore || 85,
      riskLevel: report.riskLevel || 'CRITICAL',
      precursorType: report.isSifPrecursor ? 'SIF Precursor Warning' : 'Elevated Hazard',
      timestamp: new Date().toLocaleTimeString() + ' (' + new Date().toLocaleDateString() + ')',
      status: 'LOGGED / PENDING VERIFICATION',
      isManual: false
    };

    try {
      const existing = JSON.parse(localStorage.getItem('riskradar_saved_alerts') || '[]');
      existing.unshift(alertEntry);
      localStorage.setItem('riskradar_saved_alerts', JSON.stringify(existing.slice(0, 50)));
    } catch (e) {}

    const badge = document.getElementById('sidebar-alert-badge');
    if (badge) {
      badge.textContent = '1+';
      badge.classList.remove('hidden');
    }
  }

  showCountdownModal() {
    if (!this.modalEl) return;

    this.countdownRemaining = 5;
    const threatTitle = document.getElementById('modal-threat-title');
    const threatDesc = document.getElementById('modal-threat-desc');

    if (threatTitle) threatTitle.textContent = this.activeThreat.type;
    if (threatDesc) threatDesc.textContent = this.activeThreat.details;
    if (this.countdownEl) this.countdownEl.textContent = this.countdownRemaining;

    this.modalEl.classList.remove('hidden');
    this.playWarningBeep();

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      this.countdownRemaining--;
      if (this.countdownEl) this.countdownEl.textContent = this.countdownRemaining;
      this.playWarningBeep();

      if (this.countdownRemaining <= 0) {
        clearInterval(this.countdownTimer);
        this.executeDispatch();
      }
    }, 1000);
  }

  cancelAutoAlert() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
    if (window.riskAudioMonitor) {
      window.riskAudioMonitor.logLiveEvent('system', 'Emergency alert sequence cancelled (False Alarm).');
    }
  }

  async executeDispatch() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }

    // 1. Play Emergency Siren
    this.startSiren();

    // 2. Refresh coordinates
    await this.refreshCoordinatesQuick();

    // 3. Contacts & User
    const contacts = this.getRegisteredContacts();
    const userProfile = this.getUserProfile();
    const mapUrl = this.currentCoordinates 
      ? `https://maps.google.com/?q=${this.currentCoordinates.latitude},${this.currentCoordinates.longitude}`
      : 'OIL Assam Operational Grid Coordinates';

    const alertMessageText = `🚨 RISKRADAR AI - CRITICAL SAFETY ALERT 🚨\nReported By: ${userProfile.name} (${userProfile.role || 'Safety Personnel'})\nAlert Type: ${this.activeThreat ? this.activeThreat.type : 'DISTRESS ALERT'}\nDetails: ${this.activeThreat ? this.activeThreat.details : 'Critical safety precursor'}\nTime: ${new Date().toLocaleTimeString()}\nGPS Location: ${mapUrl}\nAction Required: Immediate Safety Verification & Stop-Work Assessment.`;

    // 4. Desktop Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 RISKRADAR AI: SIF ALERT TRANSMITTED', {
        body: `Threat: ${this.activeThreat.type}. Emergency contacts & safety officers notified.`,
        icon: 'assets/icon-192.svg'
      });
    }

    // 5. Save Record
    this.saveIncidentRecord({
      threat: this.activeThreat,
      coordinates: this.currentCoordinates,
      contactsNotified: contacts,
      servicesNotified: this.emergencyServices,
      timestamp: new Date().toLocaleString()
    });

    // 6. Show confirmation modal
    this.showDispatchedStatusModal(contacts, alertMessageText, mapUrl);
  }

  async refreshCoordinatesQuick() {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve();
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toLocaleString()
          };
          resolve();
        },
        () => resolve(),
        { timeout: 2000 }
      );
    });
  }

  showDispatchedStatusModal(contacts, messageText, mapUrl) {
    if (!this.dispatchedStatusModal) return;

    const contactsListEl = document.getElementById('modal-dispatched-contacts');
    const servicesListEl = document.getElementById('modal-dispatched-services');
    const msgPreviewEl = document.getElementById('modal-alert-msg-preview');
    const mapsLinkEl = document.getElementById('modal-gps-link');

    if (msgPreviewEl) msgPreviewEl.textContent = messageText;
    if (mapsLinkEl) {
      if (this.currentCoordinates) {
        mapsLinkEl.href = mapUrl;
        mapsLinkEl.textContent = `📍 Open Live GPS Coordinates (${this.currentCoordinates.latitude.toFixed(4)}, ${this.currentCoordinates.longitude.toFixed(4)})`;
        mapsLinkEl.classList.remove('hidden');
      } else {
        mapsLinkEl.classList.add('hidden');
      }
    }

    if (contactsListEl) {
      contactsListEl.innerHTML = contacts.map(c => `
        <div class="dispatched-contact-row">
          <div class="contact-info">
            <strong>${this.escapeHtml(c.name)}</strong> (${this.escapeHtml(c.relation || 'Personal Contact')})
            <span class="contact-details">📞 ${this.escapeHtml(c.phone)} | ✉️ ${this.escapeHtml(c.email || 'N/A')}</span>
          </div>
          <div class="contact-dispatch-actions">
            <span class="status-sent-badge">✓ Auto-Notified</span>
            <a href="sms:${encodeURIComponent(c.phone)}?body=${encodeURIComponent(messageText)}" class="btn-sm btn-sms">💬 SMS</a>
            <a href="https://wa.me/${encodeURIComponent(c.phone.replace(/[^0-9]/g, ''))}?text=${encodeURIComponent(messageText)}" target="_blank" class="btn-sm btn-wa">🟢 WhatsApp</a>
            <a href="tel:${encodeURIComponent(c.phone)}" class="btn-sm btn-call">📞 Call</a>
          </div>
        </div>
      `).join('');
    }

    if (servicesListEl) {
      const s = this.emergencyServices;
      servicesListEl.innerHTML = `
        <div class="dispatched-services-summary">
          <h4 style="font-size: 0.85rem; font-weight: 700; color: #f87171; margin-bottom: 0.5rem;">OIL Institutional Emergency Dispatches:</h4>
          <div class="service-pill-row">
            <span class="service-chip">🏢 ${this.escapeHtml(s.oilControlRoom.name)}: <strong>${s.oilControlRoom.phone}</strong></span>
            <span class="service-chip">🚒 Fire: <strong>${s.fireStation.phone}</strong> (Ext. ${s.fireStation.hotline})</span>
            <span class="service-chip">🚑 Hospital: <strong>${s.hospital.phone}</strong> (Ext. ${s.hospital.hotline})</span>
            <span class="service-chip">👮 Police: <strong>${s.police.phone}</strong> (Dial ${s.police.hotline})</span>
          </div>
        </div>
      `;
    }

    this.dispatchedStatusModal.classList.remove('hidden');

    // Requirement: Alarm must close in 10 seconds and return to Dashboard
    if (this.autoDismissInterval) {
      clearInterval(this.autoDismissInterval);
      this.autoDismissInterval = null;
    }
    let secondsLeft = 10;
    const secondsEl = document.getElementById('alarm-countdown-seconds');
    if (secondsEl) secondsEl.textContent = secondsLeft;

    this.autoDismissInterval = setInterval(() => {
      secondsLeft--;
      const el = document.getElementById('alarm-countdown-seconds');
      if (el) el.textContent = secondsLeft;
      if (secondsLeft <= 0) {
        clearInterval(this.autoDismissInterval);
        this.autoDismissInterval = null;
        this.closeAlertAndOpenDashboard();
      }
    }, 1000);
  }

  closeAlertAndOpenDashboard() {
    if (this.autoDismissInterval) {
      clearInterval(this.autoDismissInterval);
      this.autoDismissInterval = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.stopSiren();
    if (this.modalEl) this.modalEl.classList.add('hidden');
    if (this.dispatchedStatusModal) this.dispatchedStatusModal.classList.add('hidden');

    if (window.riskRadarApp) {
      window.riskRadarApp.switchTab('dashboard-view');
      window.riskRadarApp.refreshAllViews();
      window.riskRadarApp.showToast('Alarm auto-closed in 10s. Returned to Priority Dashboard.');
    }
  }

  startSiren() {
    if (this.isSirenPlaying) return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.sirenAudioContext = new AudioCtxClass();
      const ctx = this.sirenAudioContext;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(720, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(840, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(2.4, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(240, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      osc1.connect(masterGain);
      osc2.connect(masterGain);

      lfo.start();
      osc1.start();
      osc2.start();

      this.isSirenPlaying = true;
      if (this.sirenToggleBtn) {
        this.sirenToggleBtn.classList.remove('hidden');
        this.sirenToggleBtn.innerHTML = '🔊 Mute Siren';
      }
    } catch (err) {
      console.warn('Emergency Siren audio error:', err);
    }
  }

  stopSiren() {
    if (!this.isSirenPlaying) return;
    try {
      if (this.sirenAudioContext) {
        this.sirenAudioContext.close().catch(() => {});
        this.sirenAudioContext = null;
      }
      this.isSirenPlaying = false;
      if (this.sirenToggleBtn) {
        this.sirenToggleBtn.innerHTML = '🔕 Siren Muted';
      }
    } catch (e) {}
  }

  toggleSiren() {
    if (this.isSirenPlaying) {
      this.stopSiren();
    } else {
      this.startSiren();
    }
  }

  playWarningBeep() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  getRegisteredContacts() {
    const raw = localStorage.getItem('riskradar_contacts');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      } catch (e) {}
    }
    return [
      { name: 'Dr. P. Gogoi (HSE Manager)', phone: '+91-94350-12345', relation: 'OIL Safety Officer', email: 'hse_manager@oilindia.in' },
      { name: 'Family / Personal Contact', phone: '+91-98640-54321', relation: 'Personal Guardian', email: 'guardian@oil.in' }
    ];
  }

  getUserProfile() {
    const raw = localStorage.getItem('riskradar_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return { name: 'Safety Engineer', email: 'safety.officer@oilindia.in', role: 'Safety Officer' };
  }

  saveIncidentRecord(record) {
    const key = 'riskradar_incidents';
    let incidents = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) incidents = JSON.parse(raw);
    } catch (e) {}

    incidents.unshift(record);
    if (incidents.length > 30) incidents = incidents.slice(0, 30);
    localStorage.setItem(key, JSON.stringify(incidents));

    window.riskRadarApp && window.riskRadarApp.renderRecentIncidents && window.riskRadarApp.renderRecentIncidents();
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
}

window.riskAlertSystem = new RiskAlertSystem();
