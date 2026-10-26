// RiskRadar AI - Corrective and Preventive Action (CAPA) Lifecycle Tracker
// Tracks corrective actions from Open -> In Progress -> Resolved -> Closed

class CAPATracker {
  constructor() {
    this.storageKey = 'riskradar_capa_records';
    this.actions = this.loadActions();
    if (this.actions.length === 0) {
      this.initDefaultActions();
    }
  }

  loadActions() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  saveActions() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.actions));
    } catch (e) {}
  }

  initDefaultActions() {
    this.actions = [
      {
        id: 'CAPA-8901',
        reportId: 'OIL-REP-712894',
        title: 'Rig-21 Fall Arrest & Scaffolding Edge Barrier Retrofit',
        description: 'Install rigid steel toe-boards and certified self-retracting lifelines (SRL) at the 14m derrick monkey board. Conduct mandatory fall protection re-briefing.',
        hazardCategory: 'Gravity / Height',
        priority: 'CRITICAL',
        status: 'Open',
        assignedTo: 'Er. R. Borah (Rig Superintendent)',
        assignedRole: 'Safety Officer',
        location: 'OIL Drilling Rig-21, Duliajan',
        dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        auditTrail: [
          { timestamp: new Date().toLocaleString(), note: 'CAPA automatically provisioned by RiskRadar SIF Detection Engine.' }
        ]
      },
      {
        id: 'CAPA-8894',
        reportId: 'OIL-REP-642109',
        title: 'Wellhead #47 H2S Sensor Recalibration & SCBA Station Check',
        description: 'Replace electrochemical H2S sensor head at Separator B manifold. Test all positive-pressure SCBA sets for seal integrity.',
        hazardCategory: 'Hydrocarbon / Gas',
        priority: 'CRITICAL',
        status: 'In Progress',
        assignedTo: 'M. Phukan (Lead Process Engineer)',
        assignedRole: 'Safety Officer',
        location: 'Wellhead #47 Gathering Station, Moran',
        dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        auditTrail: [
          { timestamp: new Date(Date.now() - 36 * 3600 * 1000).toLocaleString(), note: 'Triggered following H2S near-miss spike.' },
          { timestamp: new Date(Date.now() - 12 * 3600 * 1000).toLocaleString(), note: 'Calibration kit dispatched to site.' }
        ]
      },
      {
        id: 'CAPA-8850',
        reportId: 'OIL-REP-532101',
        title: 'Tank T-104 Confined Space Entry Barrier Audit',
        description: 'Implement digital PTW sign-off protocol and install automated 4-gas continuous logger at manway entrance.',
        hazardCategory: 'Confined Space',
        priority: 'HIGH',
        status: 'Resolved',
        assignedTo: 'K. Saikia (HSE Coordinator)',
        assignedRole: 'Safety Officer',
        location: 'Crude Storage Tank Farm T-104, Digboi',
        dueDate: new Date(Date.now() - 10 * 3600 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        auditTrail: [
          { timestamp: new Date(Date.now() - 72 * 3600 * 1000).toLocaleString(), note: 'Reported after near-miss entry violation.' },
          { timestamp: new Date(Date.now() - 14 * 3600 * 1000).toLocaleString(), note: 'Digital PTW hardware installed and verified.' }
        ]
      }
    ];
    this.saveActions();
  }

  createActionFromReport(report) {
    const defaultRec = (report.recommendedActions && report.recommendedActions[0]) || {
      title: 'Safety Barrier Rectification for ' + report.reportClassification,
      priority: report.isSifPrecursor ? 'CRITICAL' : 'HIGH',
      timeline: 'Within 24 Hours',
      assigneeRole: 'Area Safety Officer',
      actionDetails: 'Verify physical barriers, halt high-energy exposure, and brief shift personnel.'
    };

    const newAction = {
      id: 'CAPA-' + Math.floor(1000 + Math.random() * 9000),
      reportId: report.reportId,
      title: defaultRec.title,
      description: defaultRec.actionDetails,
      hazardCategory: report.matchedEnergies && report.matchedEnergies[0] ? report.matchedEnergies[0].name : 'General Safety Hazard',
      priority: defaultRec.priority,
      status: 'Open',
      assignedTo: defaultRec.assigneeRole,
      assignedRole: 'Safety Officer',
      location: report.location,
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      auditTrail: [
        {
          timestamp: new Date().toLocaleString(),
          note: `Provisioned automatically by SIF Engine (Risk Score: ${report.riskScore}/100). SIF Precursor Flag: ${report.isSifPrecursor ? 'YES' : 'NO'}`
        }
      ]
    };

    this.actions.unshift(newAction);
    this.saveActions();
    return newAction;
  }

  updateStatus(actionId, newStatus, resolutionNote = '') {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) return null;

    const oldStatus = action.status;
    action.status = newStatus;
    action.auditTrail.unshift({
      timestamp: new Date().toLocaleString(),
      note: `Status updated from [${oldStatus}] to [${newStatus}]. ${resolutionNote ? 'Note: ' + resolutionNote : ''}`
    });

    this.saveActions();
    return action;
  }

  getMetrics() {
    const total = this.actions.length;
    const open = this.actions.filter(a => a.status === 'Open').length;
    const inProgress = this.actions.filter(a => a.status === 'In Progress').length;
    const resolved = this.actions.filter(a => a.status === 'Resolved').length;
    const closed = this.actions.filter(a => a.status === 'Closed').length;
    const critical = this.actions.filter(a => a.priority === 'CRITICAL' && a.status !== 'Closed').length;

    return { total, open, inProgress, resolved, closed, critical };
  }
}

window.capaTracker = new CAPATracker();
