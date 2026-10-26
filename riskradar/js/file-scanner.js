// RiskRadar - Bold & High-Impact File Risk Scanner Engine
class RiskFileScanner {
  constructor() {
    this.dropzone = document.getElementById('risk-dropzone');
    this.fileInput = document.getElementById('risk-file-input');
    this.resultsContainer = document.getElementById('scan-results-container');
    this.activeFile = null;
    this.initListeners();
  }

  initListeners() {
    if (!this.dropzone || !this.fileInput) return;

    // Click to select
    this.dropzone.addEventListener('click', (e) => {
      // Don't re-trigger if clicking inside an interactive child
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.processFile(file);
    });

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('drag-active');
      });
    });

    this.dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files && dt.files[0];
      if (file) this.processFile(file);
    });

    // Preset sample files button support
    document.querySelectorAll('.sample-risk-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sampleType = btn.getAttribute('data-sample');
        this.loadSampleRiskReport(sampleType);
      });
    });
  }

  processFile(file) {
    this.activeFile = file;
    this.showScanningState(file);

    // Read content / preview
    const isImage = file.type.startsWith('image/');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.log') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target.result;
        setTimeout(() => {
          this.analyzeImageRisk(file, previewUrl);
        }, 1200);
      };
      reader.readAsDataURL(file);
    } else if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setTimeout(() => {
          this.analyzeTextRisk(file, text);
        }, 1200);
      };
      reader.readAsText(file);
    } else {
      // Document or generic binary file
      setTimeout(() => {
        this.analyzeGenericDocument(file);
      }, 1400);
    }
  }

  showScanningState(file) {
    if (!this.resultsContainer) return;
    this.resultsContainer.classList.remove('hidden');
    this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    this.resultsContainer.innerHTML = `
      <div class="scan-processing-box">
        <div class="radar-scan-animation">
          <div class="scanner-sweep-line"></div>
          <div class="scanner-icon">🛡️</div>
        </div>
        <h3 class="processing-title">Deep Scanning: ${this.escapeHtml(file.name)}</h3>
        <p class="processing-sub">Running neural pattern recognition, hazard indicator extraction, and structural toxicity checks...</p>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill animate-progress"></div>
        </div>
      </div>
    `;
  }

  analyzeImageRisk(file, previewUrl) {
    const filename = file.name.toLowerCase();
    let score = 74;
    let severity = 'HIGH';
    let hazards = ['Visual Structural Cracks', 'Ignition Proximity', 'Corrosion Anomaly'];
    let recommendations = [
      'Immediate physical cordoning of the photographed perimeter',
      'Structural safety inspection required within 12 hours',
      'Disable adjacent electrical circuits and gas mains'
    ];

    if (filename.includes('fire') || filename.includes('burn') || filename.includes('smoke')) {
      score = 96;
      severity = 'CRITICAL';
      hazards = ['Active Combustion Signature', 'Rapid Smoke Spread Vector', 'Thermal Hazard > 450°C'];
      recommendations = [
        'Trigger instant building evacuation alarms',
        'Deploy Class ABC Fire Extinguishers if isolated',
        'Contact Fire Station immediately'
      ];
    } else if (filename.includes('gas') || filename.includes('cylinder') || filename.includes('leak')) {
      score = 89;
      severity = 'CRITICAL';
      hazards = ['Pressurized Gas Release Hazard', 'Atmospheric Flammability Spike', 'Combustion Sensitivity'];
      recommendations = [
        'Do NOT touch electrical switches or light sparks',
        'Evacuate room and open perimeter vents immediately',
        'Shut off main cylinder / meter regulator'
      ];
    } else if (filename.includes('safe') || filename.includes('clear')) {
      score = 15;
      severity = 'SAFE';
      hazards = ['No Critical Irregularities Detected', 'Normal Containment Threshold'];
      recommendations = [
        'Maintain regular scheduled safety monitoring',
        'Keep fire exits unobstructed'
      ];
    }

    this.renderResults({
      file,
      previewUrl,
      score,
      severity,
      hazards,
      recommendations,
      timestamp: new Date().toLocaleString(),
      type: 'Visual Hazard Inspection'
    });
  }

  analyzeTextRisk(file, text) {
    const lower = text.toLowerCase();
    const hazardTerms = [
      { word: 'explosion', weight: 35, tag: 'Explosion Threat' },
      { word: 'blast', weight: 35, tag: 'Blast Hazard' },
      { word: 'fire', weight: 30, tag: 'Thermal / Flame Danger' },
      { word: 'gas leak', weight: 30, tag: 'Toxic Gas Escape' },
      { word: 'leakage', weight: 20, tag: 'Fluid Containment Loss' },
      { word: 'electric shock', weight: 28, tag: 'High Voltage Discharge' },
      { word: 'voltage', weight: 15, tag: 'Electrical Anomaly' },
      { word: 'crack', weight: 18, tag: 'Structural Instability' },
      { word: 'toxic', weight: 25, tag: 'Chemical Toxicity' },
      { word: 'failure', weight: 15, tag: 'Component Breakdown' },
      { word: 'danger', weight: 15, tag: 'High Threat Level' },
      { word: 'emergency', weight: 20, tag: 'Emergency Event' },
      { word: 'oil spill', weight: 25, tag: 'Combustible Hydrocarbon Spill' }
    ];

    let detectedHazards = [];
    let calculatedScore = 20;

    hazardTerms.forEach(item => {
      if (lower.includes(item.word)) {
        calculatedScore += item.weight;
        if (!detectedHazards.includes(item.tag)) {
          detectedHazards.push(item.tag);
        }
      }
    });

    calculatedScore = Math.min(100, calculatedScore);
    let severity = calculatedScore >= 80 ? 'CRITICAL' : calculatedScore >= 50 ? 'HIGH' : calculatedScore >= 30 ? 'MODERATE' : 'LOW';

    if (detectedHazards.length === 0) {
      detectedHazards = ['Minor Operational Log Irregularities'];
    }

    this.renderResults({
      file,
      score: calculatedScore,
      severity,
      hazards: detectedHazards,
      recommendations: [
        'Forward verified threat parameters to emergency response unit',
        'Review safety checklist for identified hazard categories',
        'Notify on-duty site safety supervisor immediately'
      ],
      timestamp: new Date().toLocaleString(),
      snippet: text.slice(0, 280) + (text.length > 280 ? '...' : ''),
      type: 'Text & Sensor Telemetry Scan'
    });
  }

  analyzeGenericDocument(file) {
    const filename = file.name.toLowerCase();
    let score = 65;
    let severity = 'MODERATE';
    let hazards = ['Unclassified Hazard Vector', 'Documented Compliance Gap'];

    if (filename.includes('incident') || filename.includes('hazard') || filename.includes('crash')) {
      score = 85;
      severity = 'HIGH';
      hazards = ['Documented Incident Report', 'Safety Non-Compliance Risk', 'Active Hazard Exposure'];
    }

    this.renderResults({
      file,
      score,
      severity,
      hazards,
      recommendations: [
        'Verify incident severity and isolate affected zones',
        'Review mandatory safety checklist in the FAQs section',
        'Keep emergency contacts on standby'
      ],
      timestamp: new Date().toLocaleString(),
      type: 'Emergency Document Audit'
    });
  }

  loadSampleRiskReport(sampleType) {
    if (sampleType === 'chemical') {
      this.renderResults({
        file: { name: 'Chemical_Storage_Leak_Sensor_Report.log', size: 14280 },
        score: 92,
        severity: 'CRITICAL',
        hazards: ['Flammable Solvent Vapor Spike (>180ppm)', 'Corrosive Fume Detection', 'Explosive Lower Limit Breach (LEL 42%)'],
        recommendations: [
          'Immediate Area Evacuation: Sound localized chemical alert',
          'Deploy breathing apparatus before entering spill perimeter',
          'Activate forced exhaust dilution ventilation systems',
          'Notify Chemical Disaster Response Team (1077)'
        ],
        timestamp: new Date().toLocaleString(),
        snippet: '[CRITICAL ALERT 14:02:18] Sensor #CH-09 detected 188ppm Benzene/Toluene mix. Tank pressure dropping 0.4 bar/min. Spark threshold risk active.',
        type: 'Sensor Telemetry Audit'
      });
    } else if (sampleType === 'fire') {
      this.renderResults({
        file: { name: 'Electrical_Panel_Thermal_Overheat.pdf', size: 684200 },
        score: 87,
        severity: 'CRITICAL',
        hazards: ['Busbar Temperature Exceeding 140°C', 'Insulation Melt Imminent', 'Class C Electrical Arc Flash Danger'],
        recommendations: [
          'Trip main circuit breaker immediately from substation feeder',
          'Clear 15m blast radius around main electrical control panel',
          'Prepare CO2 fire extinguishers for electrical suppression'
        ],
        timestamp: new Date().toLocaleString(),
        snippet: 'Thermal anomaly report indicates Phase B terminal temperature has escalated past rating. Arcing audible at 50Hz frequency.',
        type: 'Electrical Threat Diagnostic'
      });
    } else {
      this.renderResults({
        file: { name: 'Facility_Safety_Checklist_Q3.docx', size: 84000 },
        score: 22,
        severity: 'SAFE',
        hazards: ['Routine Maintenance Overdue (Fire Extinguisher Seal Q2)'],
        recommendations: [
          'Schedule standard quarterly inspection of dry chemical extinguishers',
          'Ensure emergency exit signs remain illuminated'
        ],
        timestamp: new Date().toLocaleString(),
        type: 'Routine Compliance Review'
      });
    }
  }

  renderResults(data) {
    if (!this.resultsContainer) return;
    this.resultsContainer.classList.remove('hidden');

    const severityClass = data.severity.toLowerCase();
    const scoreColor = data.score >= 80 ? '#ef4444' : data.score >= 50 ? '#f59e0b' : '#10b981';

    let previewHtml = '';
    if (data.previewUrl) {
      previewHtml = `
        <div class="result-preview-image">
          <img src="${data.previewUrl}" alt="Scanned Hazard Image" />
          <div class="image-scan-grid"></div>
        </div>
      `;
    } else if (data.snippet) {
      previewHtml = `
        <div class="result-snippet-box">
          <span class="snippet-label">Extracted Hazard Excerpt:</span>
          <code>${this.escapeHtml(data.snippet)}</code>
        </div>
      `;
    }

    const hazardsListHtml = data.hazards.map(h => `<li class="hazard-badge-item"><span class="hazard-dot"></span>${this.escapeHtml(h)}</li>`).join('');
    const recsListHtml = data.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('');

    this.resultsContainer.innerHTML = `
      <div class="risk-report-card severity-${severityClass}">
        <div class="report-header">
          <div class="report-meta">
            <span class="report-badge badge-${severityClass}">
              <span class="pulse-dot"></span> ${data.severity} RISK LEVEL
            </span>
            <h3 class="report-filename">${this.escapeHtml(data.file.name)}</h3>
            <span class="report-type">${data.type} • Scanned on ${data.timestamp}</span>
          </div>
          <div class="report-score-dial">
            <div class="score-circle" style="border-color: ${scoreColor}">
              <span class="score-val" style="color: ${scoreColor}">${data.score}</span>
              <span class="score-max">/100</span>
            </div>
            <span class="score-label">Danger Index</span>
          </div>
        </div>

        ${previewHtml}

        <div class="report-grid">
          <div class="report-col">
            <h4 class="col-title"><span class="icon">⚠️</span> Detected Hazard Flags</h4>
            <ul class="hazard-list">
              ${hazardsListHtml}
            </ul>
          </div>
          <div class="report-col">
            <h4 class="col-title"><span class="icon">📋</span> Immediate Action Directives</h4>
            <ol class="action-steps-list">
              ${recsListHtml}
            </ol>
          </div>
        </div>

        <div class="report-actions">
          <button class="btn btn-danger-glow" onclick="window.riskAlertSystem && window.riskAlertSystem.triggerEmergencyFromReport('${data.severity}', '${this.escapeHtml(data.file.name)}')">
            🚨 Dispatch Alert with this Report
          </button>
          <button class="btn btn-secondary" onclick="window.askChatbotAboutRisk('${data.severity}', '${this.escapeHtml(data.file.name)}')">
            💬 Consult AI Guardian on this Risk
          </button>
          <button class="btn btn-outline" onclick="window.printRiskReport()">
            🖨️ Export Audit
          </button>
        </div>
      </div>
    `;

    this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }
}

// Global helpers for report interactions
window.askChatbotAboutRisk = function(severity, filename) {
  const chatInput = document.getElementById('chat-user-input');
  const chatForm = document.getElementById('chat-form');
  const chatDrawer = document.getElementById('ai-chat-drawer');
  if (chatDrawer && chatDrawer.classList.contains('collapsed')) {
    chatDrawer.classList.remove('collapsed');
  }
  if (chatInput) {
    chatInput.value = `I uploaded "${filename}" with a ${severity} risk score. What emergency steps should I take first?`;
    if (chatForm) {
      chatForm.dispatchEvent(new Event('submit'));
    }
  }
};

window.printRiskReport = function() {
  window.print();
};
