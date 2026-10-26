// RiskRadar AI - Safety Corner: Approved OIL Industrial Safety Guidelines & Interactive Checklists
// Grounded in Oil India Limited (OIL), OISD (Oil Industry Safety Directorate) & DGMS Standards

const OIL_SAFETY_MODULES = [
  {
    id: 'height',
    title: 'Working at Height & Derrick Operations',
    icon: '🏗️',
    badge: 'OISD-GDN-192 • SIF Critical',
    color: '#ef4444',
    summary: 'Critical barrier protocols for rig derricks, monkey boards, scaffolds, and elevated catwalks above 1.8 meters.',
    keyRules: [
      '**100% Continuous Tie-Off**: Workers on monkey boards or derrick platforms must remain tied off to certified anchor points at all times using double-lanyard self-retracting lifelines (SRL).',
      '**Full-Body Harness Mandatory**: Only certified full-body safety harnesses (IS 3521 / EN 361) are permitted. Body belts are strictly prohibited for fall arrest.',
      '**Scaffolding Tagging System**: Green Tag (Inspected & Safe to use by certified scaffolder); Red Tag (Danger / Do Not Use).',
      '**Toe-boards & Edge Protection**: All elevated platforms must have top rail (1.0m - 1.15m), mid rail (0.5m), and rigid toe-board (min 150mm) to prevent dropped objects.'
    ],
    checklist: [
      'Conduct pre-climb physical inspection of harness webbing, D-rings, and snap hooks',
      'Verify valid Working at Height Permit (PTW) signed by Area HSE Officer',
      'Secure all hand tools with lanyards/tool-pouches to prevent dropped object hazards',
      'Verify weather & wind velocity (< 25 knots / 45 km/h for elevated derrick work)',
      'Confirm rescue descent plan and emergency tripod/winch are staged below'
    ]
  },
  {
    id: 'gas',
    title: 'Gas Leakage (H2S & Combustible Hydrocarbons)',
    icon: '⚠️',
    badge: 'OISD-STD-116 • High Toxicity',
    color: '#f59e0b',
    summary: 'Survival and containment procedures for Hydrogen Sulfide (H2S) release and Lower Explosive Limit (LEL) breaches.',
    keyRules: [
      '**H2S Exposure Thresholds**: 10 ppm (8-hr TWA limit); 15 ppm (STEL limit - evacuate); >100 ppm (Immediately Dangerous to Life and Health - IDLH; causes instant olfactory paralysis).',
      '**Never Walk Downwind**: Always observe site windsocks. Evacuate immediately crosswind, then upwind to the designated primary muster point.',
      '**Zero-Spark Rule**: Do NOT flip electrical switches, crank engines, or operate non-intrinsically safe radios within the vapor dispersion zone.',
      '**Buddy System & SCBA**: No personnel may enter a verified gas contaminated zone without positive-pressure Self-Contained Breathing Apparatus (SCBA) and a standby buddy.'
    ],
    checklist: [
      'Sound Site General Alarm (Continuous Warble Siren)',
      'Observe windsock and evacuate crosswind to higher ground / upwind muster area',
      'Initiate remote Emergency Shutdown (ESD) at central control room',
      'Don 30-minute positive pressure SCBA before initiating rescue or valve isolation',
      'Deploy portable multi-gas detectors to delineate 0% - 10% LEL hazard boundary'
    ]
  },
  {
    id: 'fire_explosion',
    title: 'Fire & Explosion Prevention (Crude & Condensate)',
    icon: '🔥',
    badge: 'OISD-STD-117 • Catastrophic Hazard',
    color: '#dc2626',
    summary: 'Flashpoint controls, hot-work mitigation, and hydrocarbon fire response for crude storage and processing manifolds.',
    keyRules: [
      '**Hot Work Permit Protocol**: Continuous gas monitoring (0% LEL required) within 15 meters of any welding, grinding, or open-flame operation.',
      '**Hydrocarbon Foam Suppression**: Water must never be applied directly into open crude oil tanks (prevents violent boilover / frothover). Deploy Class B Aqueous Film-Forming Foam (AFFF).',
      '**Non-Sparking Tools**: Use non-sparking beryllium-copper or bronze hand tools inside Zone 0 and Zone 1 classified hazardous areas.',
      '**Static Grounding & Bonding**: All fuel transfer lines, road tankers, and crude loading manifolds must have verified static earthing (< 10 ohms resistance).'
    ],
    checklist: [
      'Activate manual fire call point and notify OIL Central Fire Station (101)',
      'Trigger deluge water spray and automated foam injection system on crude tanks',
      'Isolate fuel supply valves and depressurize affected manifold headers',
      'Establish 100m cordon around potential BLEVE (Boiling Liquid Expanding Vapor Explosion) radius',
      'Account for all personnel via tag-in board at safe assembly point'
    ]
  },
  {
    id: 'electrical',
    title: 'Electrical Hazards & Arc Flash Safety',
    icon: '⚡',
    badge: 'NFPA 70E / OISD-STD-137',
    color: '#eab308',
    summary: 'Lockout/Tagout (LOTO), high-voltage switchgear maintenance, and flameproof Ex-d compliance.',
    keyRules: [
      '**Life-Saving LOTO Rule**: Zero energy state must be proven. Never work on electrical equipment based purely on switch position—always test with a calibrated high-voltage multimeter.',
      '**Arc Flash Protection**: Cal-rated arc flash suits, blast hoods, and dielectric leather over-gloves are mandatory when racking 3.3kV or 440V circuit breakers.',
      '**Flameproof (Ex-d) Integrity**: Ensure all junction box covers, cable glands, and explosion-proof fittings are tightly torqued without missing bolts in hazardous zones.',
      '**Rescue Hook Requirement**: A fiberglass non-conductive shepherd’s rescue hook must be mounted in all MCC control rooms.'
    ],
    checklist: [
      'Apply individual safety padlocks and danger tags on master breaker (LOTO)',
      'Discharge residual capacitance and connect temporary earth grounding leads',
      'Verify dead with certified high-voltage contact tester before touching conductors',
      'Ensure standby electrician is stationed outside the arc flash boundary',
      'Inspect flameproof rubber seals and torque all enclosure bolts upon reassembly'
    ]
  },
  {
    id: 'confined_space',
    title: 'Confined Space Entry (Tanks, Sumps & Mud Pits)',
    icon: '🕳️',
    badge: 'OISD-STD-105 • Atmospheric Risk',
    color: '#8b5cf6',
    summary: 'Strict entry barrier procedures for crude oil settling tanks, mud tanks, separator vessels, and underground valve pits.',
    keyRules: [
      '**Mandatory 4-Gas Certification**: Prior to entry, test for Oxygen (19.5% - 23.5%), Combustible Gas (0% LEL), H2S (< 5 ppm), and Carbon Monoxide (< 25 ppm) at top, middle, and bottom depths.',
      '**Dedicated Standby Attendant**: A trained safety watcher must remain outside the manway entrance at all times and must never enter to attempt an unassisted rescue.',
      '**Continuous Mechanical Ventilation**: Forced-air blowers must operate continuously during human occupancy inside the vessel.',
      '**Rescue Winch & Tripod**: Entrants must wear safety harnesses connected to an external mechanical retrieval hoist.'
    ],
    checklist: [
      'Obtain certified Confined Space Entry Permit signed by authorized Gas Tester',
      'Physically blind/spade all incoming crude, gas, and steam lines (Positive Isolation)',
      'Verify continuous forced air ventilation with non-sparking pneumatic blower',
      'Equip standby watcher with emergency air-horn and communication radio',
      'Log entrant names, cylinder pressures, and entry/exit timestamps on entry board'
    ]
  },
  {
    id: 'machinery_pinch',
    title: 'Machinery Safety & Drill Floor Pinch Points',
    icon: '⚙️',
    badge: 'DGMS Guidelines • Crush Hazards',
    color: '#0284c7',
    summary: 'Safe handling protocols for rotary tables, iron roughnecks, cat-heads, draw-works, and mud pump manifolds.',
    keyRules: [
      '**Rig Red Zone Discipline**: No unauthorized personnel permitted in the rotary table or iron roughneck travel envelope during drill pipe rotation or hoisting.',
      '**Crown-O-Matic & Anti-Two-Block**: Test upper hoist limit switches at the beginning of each drilling shift to prevent catastrophic crown block collisions.',
      '**Machine Guarding**: All belts, drive shafts, flywheels, and chain couplers must have securely bolted metal safety guards.',
      '**Whip-Checks on High Pressure Hoses**: All mud discharge and rotary vibrator hoses must be secured with safety steel cables at both connection flanges.'
    ],
    checklist: [
      'Inspect iron roughneck torque clamps and rotary slip dies for wear',
      'Verify whip-check safety cables are tensioned across all mud pump line joints',
      'Conduct 5-minute pre-job Tool Box Talk (TBT) before tripping pipe strings',
      'Confirm Emergency Stop (E-Stop) push-buttons functional at driller console',
      'Keep drill floor deck clean and free of slick drilling mud or grease'
    ]
  },
  {
    id: 'ppe_chemical',
    title: 'PPE & Toxic Chemical Exposure',
    icon: '🥽',
    badge: 'OSHA / OISD Standards',
    color: '#059669',
    summary: 'Selection, inspection, and chemical defense for drilling fluid additives, biocides, caustic soda, and hydrocarbon aromatics.',
    keyRules: [
      '**Inherent Flame-Resistant Coveralls**: Certified NOMEX / Proban cotton flame-resistant clothing (FRC) mandatory at all operational well sites.',
      '**Chemical Splash Defense**: Chemical goggles, face shield, and butyl rubber gauntlets required when mixing caustic mud additives or biocides.',
      '**Emergency Eye Wash Station**: Eye wash fountains and deluge showers must be tested weekly and clear of obstructions within 10 seconds walking distance.',
      '**Respiratory Defense**: Half-face cartridge respirators for organic vapors; full-face SCBA for toxic H2S atmospheres.'
    ],
    checklist: [
      'Review Safety Data Sheet (SDS) for active chemicals before mixing',
      'Verify emergency eye-wash water flow and pressure before handling caustics',
      'Inspect FRC garments for hydrocarbon saturation (wash or replace immediately)',
      'Wear steel-toe safety boots with puncture-resistant soles and oil-resistant grip',
      'Dispose contaminated absorbent pads in sealed hazardous chemical drums'
    ]
  },
  {
    id: 'evacuation_muster',
    title: 'Site Evacuation & Emergency Muster Protocol',
    icon: '🚨',
    badge: 'On-Site Disaster Management Plan',
    color: '#6366f1',
    summary: 'Alarm audibility, evacuation corridors, head-count reconciliation, and emergency liaison operations.',
    keyRules: [
      '**Siren Identification**: Continuous Siren (Fire / Hydrocarbon Release); Intermittent Warble (Toxic H2S Leak); All-Clear (Straight continuous tone for 2 minutes).',
      '**Muster Point Reporting**: Immediately report to designated primary or secondary muster station depending on wind direction.',
      '**T-Card Board Reconciliation**: Muster wardens must collect physical T-cards or electronic badge tallies to confirm 100% personnel accountability.',
      '**Liaison with External Services**: Only authorized Incident Commander may release operational updates to local administration and disaster management.'
    ],
    checklist: [
      'Stop work safely (depressurize equipment if safe, do not delay evacuation)',
      'Check wind direction on nearest windsock; move perpendicular to wind vector',
      'Assemble at safe Muster Point and report to designated Muster Warden',
      'Conduct complete head-count reconciliation against daily entry register',
      'Maintain radio silence on emergency tactical frequency for command updates'
    ]
  }
];

window.OIL_SAFETY_MODULES = OIL_SAFETY_MODULES;
