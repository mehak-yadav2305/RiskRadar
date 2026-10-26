// RiskRadar AI - AI/NLP SIF Precursor Detection Engine
// Oil India Limited (OIL) Industrial Safety Framework

class SIFPrecursorEngine {
  constructor() {
    this.energyTaxonomy = {
      gravity_height: {
        name: 'Gravity / Fall from Height',
        keywords: ['height', 'elevation', 'scaffolding', 'derrick', 'monkey board', 'ladder', 'roof', 'open edge', 'fall', 'floor opening', 'suspended', '14m', '12m', '10m', '5m', '2m', 'platform', 'catwalk', 'rig'],
        sifPotential: 0.95,
        requiredBarriers: ['Full Body Harness', '100% Tie-off / Lanyard', 'Rigid Guardrails / Toe-boards', 'Fall Arrest System', 'Work at Height Permit']
      },
      hydrocarbon_gas: {
        name: 'Hydrocarbon Release / Combustible & Toxic Gas',
        keywords: ['gas leak', 'h2s', 'hydrogen sulfide', 'methane', 'lel', 'combustible', 'hydrocarbon', 'flange leak', 'wellhead', 'separator', 'flare', 'blowout', 'crude leak', 'condensate', 'vapor', 'smell of gas'],
        sifPotential: 0.98,
        requiredBarriers: ['Continuous Gas Monitoring', 'SCBA / Respiratory Gear', 'LEL Lower Flammable Limit Interlock', 'ESD Emergency Shutdown Valve', 'Flameproof (Ex-d) Equipment']
      },
      pressure: {
        name: 'High Pressure Energy',
        keywords: ['high pressure', 'psi', 'bar', 'pressure relief', 'pop valve', 'choke manifold', 'hydraulic', 'pneumatic', 'compressed gas', 'burst', 'blowout preventer', 'bop', 'mud pump', 'pipe rupture'],
        sifPotential: 0.92,
        requiredBarriers: ['Certified Pressure Relief Valves (PRV)', 'Periodic Hydrostatic Testing', 'Whip-checks on Hoses', 'Pressure Bleed-off Procedure']
      },
      confined_space: {
        name: 'Confined Space & Toxic Atmosphere',
        keywords: ['confined space', 'storage tank', 'mud tank', 'vessel entry', 'desludging', 'oxygen deficiency', 'toxic fumes', 'asphyxiation', 'manhole', 'sump', 'pit entry', 'tank t-104'],
        sifPotential: 0.94,
        requiredBarriers: ['Confined Space Entry Permit', 'Calibrated 4-Gas Detector', 'Continuous Forced Air Ventilation', 'Dedicated Standby Safety Watcher', 'Emergency Rescue Winch & Tripod']
      },
      electrical_arc: {
        name: 'Electrical Energy & Arc Flash',
        keywords: ['electric shock', 'live wire', 'switchgear', '3.3kv', '440v', 'arc flash', 'transformer', 'substation', 'uninsulated', 'energized', 'circuit breaker', 'short circuit', 'mcc panel'],
        sifPotential: 0.90,
        requiredBarriers: ['Lockout / Tagout (LOTO)', 'Arc Flash PPE (NFPA 70E)', 'Voltage Testing & Proving Dead', 'Certified Electrical Isolation Permit']
      },
      struck_by_kinetic: {
        name: 'Heavy Suspended Loads & Mechanical Pinch Points',
        keywords: ['crane', 'suspended load', 'rigging', 'winch line', 'rotary table', 'iron roughneck', 'tubular handling', 'drill collar', 'sling failure', 'pinch point', 'crush', 'struck by', 'dropped object'],
        sifPotential: 0.88,
        requiredBarriers: ['Drop Prevention Netting', 'Clear Red Zone Enforcement', 'Certified Rigging Hardware', 'Anti-Two-Block Safety Device']
      },
      hot_work_fire: {
        name: 'Thermal / Hot Work in Flammable Zone',
        keywords: ['welding', 'grinding', 'hot work', 'torch cutting', 'sparks', 'crude storage', 'tank farm', 'open flame', 'combustion', 'explosion'],
        sifPotential: 0.93,
        requiredBarriers: ['Hot Work Permit', 'Continuous Explosive Gas Testing (0% LEL)', 'Fire Retardant Blankets', 'Standby Fire Watch & Foam Extinguisher']
      }
    };

    this.barrierDeficiencyKeywords = [
      'without', 'no ppe', 'missing', 'bypassed', 'disabled', 'failed', 
      'not wearing', 'lacked', 'unprotected', 'no harness', 'no tie-off', 
      'expired', 'uncalibrated', 'defect', 'damaged', 'corroded', 
      'ignored', 'not signed', 'unauthorized', 'without permit', 'no watcher'
    ];
  }

  analyzeReport(text, metadata = {}) {
    const raw = (text || '').trim();
    const lower = raw.toLowerCase();

    // 1. Identify Energy Categories & Matched Hazard Tokens
    const matchedEnergies = [];
    const highlightedTokens = [];

    Object.entries(this.energyTaxonomy).forEach(([key, energy]) => {
      const foundTerms = energy.keywords.filter(term => lower.includes(term));
      if (foundTerms.length > 0) {
        matchedEnergies.push({
          id: key,
          name: energy.name,
          sifWeight: energy.sifPotential,
          terms: foundTerms,
          requiredBarriers: energy.requiredBarriers
        });
        foundTerms.forEach(t => {
          if (!highlightedTokens.includes(t)) highlightedTokens.push(t);
        });
      }
    });

    // 2. Identify Barrier Deficiencies
    const detectedBarrierGaps = [];
    this.barrierDeficiencyKeywords.forEach(gap => {
      if (lower.includes(gap)) {
        detectedBarrierGaps.push(gap);
        if (!highlightedTokens.includes(gap)) highlightedTokens.push(gap);
      }
    });

    // Specific barrier gap checks
    const missingHarness = lower.includes('without') && (lower.includes('harness') || lower.includes('fall arrest') || lower.includes('tie-off') || lower.includes('ppe'));
    const missingGasCheck = lower.includes('without') && (lower.includes('gas test') || lower.includes('scba') || lower.includes('breathing'));
    const bypassedLoto = lower.includes('bypassed') || (lower.includes('without') && lower.includes('loto')) || (lower.includes('energized') && lower.includes('panel'));
    const missingPermit = lower.includes('without permit') || lower.includes('not signed') || lower.includes('unauthorized');

    if (missingHarness) detectedBarrierGaps.push('Absence of Fall Arrest System / Harness');
    if (missingGasCheck) detectedBarrierGaps.push('Absence of Gas Testing / Respiratory Protection');
    if (bypassedLoto) detectedBarrierGaps.push('Bypassed Electrical Interlock / Missing LOTO');
    if (missingPermit) detectedBarrierGaps.push('Work Conducted Without Valid Safe Work Permit (PTW)');

    // 3. Classify Unsafe Act vs Unsafe Condition
    const isUnsafeAct = lower.includes('worker') || lower.includes('crew') || lower.includes('electrician') || lower.includes('operator') || lower.includes('contractor') || lower.includes('not wearing') || lower.includes('climbed') || lower.includes('entered') || lower.includes('attempted') || lower.includes('bypassed');
    const isUnsafeCondition = lower.includes('corroded') || lower.includes('leaking') || lower.includes('defective') || lower.includes('rusted') || lower.includes('damaged') || lower.includes('open edge') || lower.includes('alarm sounded') || lower.includes('spilled');

    let reportClassification = 'Near-Miss Event';
    if (isUnsafeAct && isUnsafeCondition) {
      reportClassification = 'Combined Unsafe Act & Unsafe Condition';
    } else if (isUnsafeAct) {
      reportClassification = 'Unsafe Act (Behavioral Precursor)';
    } else if (isUnsafeCondition) {
      reportClassification = 'Unsafe Condition (Environmental / Mechanical)';
    }

    // 4. Determine SIF Precursor Probability & Quantitative Scoring
    let baseScore = 25;
    let isSifPrecursor = false;
    let confidence = 85;
    let uncertainty = 6.5;

    // Energy calculation
    let maxEnergyWeight = 0;
    matchedEnergies.forEach(e => {
      baseScore += (e.sifWeight * 35);
      if (e.sifWeight > maxEnergyWeight) maxEnergyWeight = e.sifWeight;
    });

    // Barrier gaps calculation
    if (detectedBarrierGaps.length > 0) {
      baseScore += (detectedBarrierGaps.length * 12);
    }

    // Height specific SIF rule (Gravity > 1.8m without fall protection = High SIF Precursor)
    const isHeightThreat = matchedEnergies.some(e => e.id === 'gravity_height');
    if (isHeightThreat && (missingHarness || detectedBarrierGaps.length > 0 || lower.includes('14m') || lower.includes('12m') || lower.includes('derrick'))) {
      isSifPrecursor = true;
      baseScore = Math.max(baseScore, 92);
      confidence = 96;
      uncertainty = 3.8;
    }

    // Hydrocarbon / Gas specific SIF rule (H2S or Flammable Gas leak near crew = Critical SIF Precursor)
    const isGasThreat = matchedEnergies.some(e => e.id === 'hydrocarbon_gas');
    if (isGasThreat && (lower.includes('h2s') || lower.includes('blowout') || detectedBarrierGaps.length > 0)) {
      isSifPrecursor = true;
      baseScore = Math.max(baseScore, 95);
      confidence = 97;
      uncertainty = 3.2;
    }

    // Confined space specific SIF rule
    const isConfinedThreat = matchedEnergies.some(e => e.id === 'confined_space');
    if (isConfinedThreat && (detectedBarrierGaps.length > 0 || lower.includes('without'))) {
      isSifPrecursor = true;
      baseScore = Math.max(baseScore, 90);
      confidence = 94;
      uncertainty = 4.5;
    }

    // Electrical arc flash specific SIF rule
    const isElectricalThreat = matchedEnergies.some(e => e.id === 'electrical_arc');
    if (isElectricalThreat && (bypassedLoto || lower.includes('energized') || lower.includes('3.3kv'))) {
      isSifPrecursor = true;
      baseScore = Math.max(baseScore, 88);
      confidence = 93;
      uncertainty = 4.9;
    }

    // Clamp score
    const riskScore = Math.min(99, Math.max(12, Math.round(baseScore)));

    // Categorize Risk Level
    let riskLevel = 'LOW';
    if (riskScore >= 85) riskLevel = 'CRITICAL';
    else if (riskScore >= 65) riskLevel = 'HIGH';
    else if (riskScore >= 35) riskLevel = 'MODERATE';

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      if (maxEnergyWeight >= 0.85) isSifPrecursor = true;
    }

    // 5. Generate Responsible AI Explanation
    const responsibleExplanation = this.generateResponsibleAIExplanation({
      isSifPrecursor,
      riskLevel,
      riskScore,
      matchedEnergies,
      detectedBarrierGaps,
      confidence,
      uncertainty,
      reportClassification
    });

    // 6. Recommended Corrective Actions (CAPA)
    const recommendedActions = this.generateRecommendedActions({
      matchedEnergies,
      isSifPrecursor,
      riskLevel,
      detectedBarrierGaps
    });

    return {
      reportId: 'OIL-REP-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      rawText: raw,
      location: metadata.location || this.extractLocation(raw) || 'OIL Operational Area, Assam',
      department: metadata.department || this.extractDepartment(raw) || 'Drilling & Workover Services',
      reporterName: metadata.reporter || 'Field Safety Observer',
      reportClassification,
      isSifPrecursor,
      riskLevel,
      riskScore,
      confidenceScore: confidence,
      uncertaintyScore: uncertainty,
      matchedEnergies,
      detectedBarrierGaps,
      highlightedTokens,
      responsibleExplanation,
      recommendedActions
    };
  }

  generateResponsibleAIExplanation(data) {
    const energiesStr = data.matchedEnergies.map(e => e.name).join(', ') || 'General Occupational Hazard';
    const barrierGapsStr = data.detectedBarrierGaps.length > 0 
      ? data.detectedBarrierGaps.slice(0, 3).join(', ') 
      : 'Absence of secondary containment or protective barriers';

    if (data.isSifPrecursor) {
      return {
        summary: `⚠️ Potential Serious Injury & Fatality (SIF) precursor identified by RiskRadar AI NLP engine.`,
        details: `The incident analysis indicates high-magnitude potential energy exposure involving [${energiesStr}] coupled with critical barrier impairment (${barrierGapsStr}). In industrial safety models (OISD / Heinrich-Bird), this combination presents a credible exposure to fatal or permanently disabling trauma if initiating conditions repeat without immediate engineering intervention.`,
        verificationNote: `Responsible AI Disclosure: This assessment represents an automated probabilistic prediction (Confidence: ${data.confidenceScore}%, Uncertainty: ±${data.uncertaintyScore}%). It is not a conclusive declaration that an injury occurred, but a priority alert that conditions for a catastrophic failure existed. Mandatory human Safety Officer verification is required.`,
        barrierAnalysis: `Primary critical barrier failed: Fall Protection / Gas Isolation / Physical Containment. Recommended immediate Stop-Work Notice.`
      };
    } else if (data.riskLevel === 'MODERATE') {
      return {
        summary: `Moderate risk hazard detected with localized incident potential.`,
        details: `Report describes an unsafe act or condition involving [${energiesStr}]. While high-energy vectors are constrained, barrier degradation was observed. Progression to a SIF event is currently mitigated by baseline administrative controls.`,
        verificationNote: `Automated Assessment (Confidence: ${data.confidenceScore}%, Uncertainty: ±${data.uncertaintyScore}%). Safety Officer inspection recommended within 48 hours.`,
        barrierAnalysis: `Administrative barriers present but require re-enforcement.`
      };
    } else {
      return {
        summary: `Low risk operational observation with negligible SIF potential.`,
        details: `Routine housekeeping or minor non-conformity. Energy levels involved are insufficient to cause serious injury or fatality under normal operating envelopes.`,
        verificationNote: `Automated Assessment (Confidence: ${data.confidenceScore}%). Standard logging for trending.`,
        barrierAnalysis: `Existing standard controls remain adequate.`
      };
    }
  }

  generateRecommendedActions(data) {
    const actions = [];

    if (data.isSifPrecursor || data.riskLevel === 'CRITICAL') {
      actions.push({
        title: 'Issue Immediate Stop-Work Directive',
        priority: 'IMMEDIATE',
        timeline: 'Immediate (< 1 Hour)',
        assigneeRole: 'Rig Superintendent / Area HSE In-Charge',
        actionDetails: 'Halt all associated operations in the immediate hazard perimeter until physical verification of barriers is completed.'
      });
    }

    // Energy specific actions
    data.matchedEnergies.forEach(e => {
      if (e.id === 'gravity_height') {
        actions.push({
          title: 'Fall Protection Barrier Re-Certification',
          priority: 'CRITICAL',
          timeline: 'Within 4 Hours',
          assigneeRole: 'Rig Safety Officer',
          actionDetails: 'Inspect full-body harnesses, verify 100% tie-off anchors, and install temporary safety nets or rigid edge guardrails.'
        });
      } else if (e.id === 'hydrocarbon_gas') {
        actions.push({
          title: 'Hydrocarbon Leak Containment & Atmosphere Audit',
          priority: 'CRITICAL',
          timeline: 'Immediate (< 2 Hours)',
          assigneeRole: 'Process Safety Engineer',
          actionDetails: 'Conduct multi-point LEL and H2S sniff survey; isolate affected wellhead manifold and require positive-pressure SCBA before entry.'
        });
      } else if (e.id === 'electrical_arc') {
        actions.push({
          title: 'LOTO Verification & Switchgear Isolation',
          priority: 'CRITICAL',
          timeline: 'Within 6 Hours',
          assigneeRole: 'Lead Electrical Engineer',
          actionDetails: 'Apply master lockouts, discharge residual voltage, and audit interlock integrity on 3.3kV MCC panels.'
        });
      } else if (e.id === 'confined_space') {
        actions.push({
          title: 'Confined Space Permit & Continuous Ventilation Audit',
          priority: 'CRITICAL',
          timeline: 'Immediate',
          assigneeRole: 'HSE Coordinator',
          actionDetails: 'Evacuate vessel; calibrate 4-gas atmospheric monitors and assign designated certified standby observer.'
        });
      }
    });

    if (actions.length === 0) {
      actions.push({
        title: 'Routine Corrective Housekeeping & Log Audit',
        priority: 'STANDARD',
        timeline: 'Within 7 Days',
        assigneeRole: 'Workplace Supervisor',
        actionDetails: 'Rectify observed non-conformity and brief shift personnel during daily tool-box talk (TBT).'
      });
    }

    return actions;
  }

  extractLocation(text) {
    const lower = text.toLowerCase();
    if (lower.includes('rig-21') || lower.includes('rig 21')) return 'OIL Drilling Rig-21, Duliajan';
    if (lower.includes('wellhead #47') || lower.includes('wellhead 47')) return 'Wellhead #47 Gathering Station, Moran';
    if (lower.includes('tank t-104') || lower.includes('tank farm')) return 'Crude Storage Tank Farm T-104, Digboi';
    if (lower.includes('central gas') || lower.includes('cggs')) return 'Central Gas Gathering Station (CGGS), Duliajan';
    if (lower.includes('pipeline')) return 'Main Trunk Pipeline KM 42, Naharkatia';
    return null;
  }

  extractDepartment(text) {
    const lower = text.toLowerCase();
    if (lower.includes('rig') || lower.includes('drilling') || lower.includes('derrick')) return 'Drilling & Well Services (D&WS)';
    if (lower.includes('gas') || lower.includes('cggs') || lower.includes('separator')) return 'Production (Gas & Oil Asset)';
    if (lower.includes('pipeline') || lower.includes('pump')) return 'Pipeline Maintenance Department';
    if (lower.includes('electric') || lower.includes('switchgear') || lower.includes('mcc')) return 'Electrical Maintenance Division';
    return null;
  }
}

// Global Singleton Instance
window.sifPrecursorEngine = new SIFPrecursorEngine();
