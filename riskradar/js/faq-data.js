// RiskRadar - Offline Emergency Guides & Action Checklists
const EMERGENCY_FAQS = [
  {
    id: 'fire',
    title: 'Fire Emergency',
    badge: 'High Hazard',
    icon: '🔥',
    color: '#ef4444',
    summary: 'Immediate action protocol for domestic, electrical, and commercial fires.',
    faqs: [
      {
        q: 'What should I do first when a fire breaks out?',
        a: 'Alert everyone nearby immediately by shouting or sounding the alarm. If the fire is small and you are trained, use the appropriate fire extinguisher. If the fire is growing, evacuate immediately via the nearest exit. Never use elevators. Once outside, call emergency services (101 / 911 / 112).'
      },
      {
        q: 'How do I use a Fire Extinguisher (P.A.S.S. Method)?',
        a: 'Remember **P.A.S.S.**:\n• **P - Pull** the pin at the top of the extinguisher.\n• **A - Aim** low, pointing the nozzle or hose at the base of the fire (not the flames).\n• **S - Squeeze** the handle slowly and evenly.\n• **S - Sweep** the nozzle from side to side at the base of the fire until extinguished.'
      },
      {
        q: 'What should I do if smoke fills the room or corridor?',
        a: 'Crawl low on your hands and knees. Toxic smoke and heat rise toward the ceiling, leaving cleaner, cooler air near the floor (about 12 to 24 inches above the ground). Cover your mouth and nose with a damp cloth if available. Feel closed doors with the back of your hand before opening; if warm, do not open.'
      },
      {
        q: 'What if it is a grease fire (cooking oil) or electrical fire?',
        a: '• **Grease Fire**: **NEVER throw water** on burning oil! Water explodes the flaming oil. Turn off the stove heat, slide a metal lid over the pan to smother it, or dump baking soda (not flour).\n• **Electrical Fire**: Do not use water (causes severe electrocution). Disconnect power if safe, and use a Class C or Dry Chemical (ABC/CO2) extinguisher.'
      },
      {
        q: 'What should I do if my clothes catch fire?',
        a: '**STOP, DROP, and ROLL** immediately. Do not run, as running fans the flames. Drop to the ground, cover your face with your hands, and roll back and forth until the flames are smothered.'
      }
    ],
    checklist: [
      'Sound alarm and alert all occupants in building',
      'If grease/oil fire, smother with metal lid (NEVER USE WATER)',
      'Stay low and crawl under smoke layer',
      'Feel closed doors with back of hand before opening',
      'Evacuate via stairs - NEVER use elevators',
      'Assemble at safe designated outdoor evacuation point',
      'Call Fire Brigade (101 / 112 / 911) with precise location'
    ]
  },
  {
    id: 'gas',
    title: 'Gas Leakage (LPG / CNG / Natural Gas)',
    badge: 'Explosion Risk',
    icon: '⚠️',
    color: '#f59e0b',
    summary: 'Essential procedures for handling suspected or confirmed gas leaks without triggering explosions.',
    faqs: [
      {
        q: 'How do I detect a gas leak?',
        a: 'Look for three signs:\n1. **Smell**: Distinctive rotten egg or boiled cabbage odor (Ethyl Mercaptan added intentionally for safety).\n2. **Sound**: A hissing, whistling, or roaring sound near pipelines, regulators, or cylinders.\n3. **Visual**: Bubbling in standing water or dying vegetation along an underground pipeline.'
      },
      {
        q: 'What are the critical DON\'Ts during a gas leak?',
        a: '• **DO NOT touch any electrical switches** (turning ON or OFF produces a tiny micro-spark capable of igniting gas).\n• **DO NOT light matches, lighters, candles, or cigarettes**.\n• **DO NOT use landline or mobile phones** inside the leak area.\n• **DO NOT start your car or motorcycle** if near the leak.\n• **DO NOT operate doorbell switches**.'
      },
      {
        q: 'What is the immediate action plan for LPG cylinder leak?',
        a: '1. Put out all open flames immediately.\n2. Turn the cylinder regulator switch knob to **OFF**.\n3. Place the safety plastic cap securely on top of the cylinder valve if leak persists.\n4. Open all doors and windows wide to let natural ventilation disperse the gas (LPG is heavier than air and settles on floors; CNG/Methane rises).\n5. Evacuate all occupants and pets into open air.\n6. Call the emergency gas distributor helpline from a safe distance outside.'
      },
      {
        q: 'What if gas catches fire at the cylinder valve?',
        a: 'Do not panic. Cover the cylinder with a wet, heavy cotton blanket, wet towel, or bedsheet quickly from behind the flame direction to cut off oxygen, then promptly close the regulator valve if possible. If fire is uncontrolled, evacuate immediately and call the fire department.'
      }
    ],
    checklist: [
      'Do NOT operate any electric switches (neither ON nor OFF)',
      'Turn off cylinder knob / main gas meter shut-off valve',
      'Open all doors and windows wide for cross-ventilation',
      'Extinguish all nearby candles, incense sticks, and pilot lights',
      'Evacuate all family members and pets to open outdoors',
      'Do not use phone inside; call emergency helpline from outside',
      'Wait for official clearance before re-entering premises'
    ]
  },
  {
    id: 'oil',
    title: 'Oil Leakage & Flammable Spills',
    badge: 'Toxic / Slip / Fire',
    icon: '🛢️',
    color: '#d97706',
    summary: 'Safety containment and fire hazard prevention for fuel, engine oil, and industrial chemical leaks.',
    faqs: [
      {
        q: 'Why is an oil spill hazardous?',
        a: 'Oil leaks pose a triple threat:\n1. **Extreme Fire & Vapor Flash Risk**: Fuel vapors ignite easily at low flashpoints.\n2. **Slip and Physical Trauma Hazard**: Oil on tiled, asphalt, or concrete floors causes severe falling injuries.\n3. **Toxicity & Environmental Contamination**: Oil fumes can cause respiratory distress, and runoff poisons soil/water.'
      },
      {
        q: 'How should I contain an oil leak immediately?',
        a: '• Stop the source if safe (tighten cap, upright container, close valve).\n• **Do NOT wash away with water** hose! Water spreads oil further, contaminates storm drains, and creates broader flammability.\n• Use absorbent barriers: Pour dry sand, cat litter, baking soda, sawdust, or dirt around the perimeter to block runoff.\n• Ventilate enclosed garage or workshop areas thoroughly.'
      },
      {
        q: 'How do I safely eliminate ignition sources around spilled oil?',
        a: 'Turn off vehicle engines, portable generators, space heaters, and power tools. Never smoke or create friction sparks. Use non-sparking brass/plastic tools rather than steel shovels if scraping saturated absorbent material.'
      },
      {
        q: 'How to clean up once absorbed?',
        a: 'Let the absorbent sit for 15-30 minutes until saturated. Wear nitrile gloves and safety goggles. Sweep the absorbent into a heavy-duty sealable plastic bin or metal drum. Dispose according to municipal hazardous waste regulations.'
      }
    ],
    checklist: [
      'Stop source of spill if safe (shut valve / upright vessel)',
      'Eliminate all sparks, heaters, engines, and smoking materials',
      'DO NOT spray water - it spreads the oil slick',
      'Create containment barrier using sand, earth, or kitty litter',
      'Mark off area to prevent slip-and-fall injuries',
      'Wear protective gloves and eye protection during cleanup',
      'Dispose contaminated absorbent in sealed hazardous waste containers'
    ]
  },
  {
    id: 'electric',
    title: 'Electric Shock & High Voltage',
    badge: 'Lethal Hazard',
    icon: '⚡',
    color: '#eab308',
    summary: 'Life-saving protocols to rescue a victim without becoming electrocuted yourself.',
    faqs: [
      {
        q: 'What is Rule #1 when someone is in contact with electricity?',
        a: '**DO NOT TOUCH THE VICTIM DIRECTLY!** The human body conducts electricity. If you touch them while they are still in contact with a live electrical source, current will flow into you, causing another casualty.'
      },
      {
        q: 'How do I safely separate a victim from a live wire?',
        a: '1. **Cut the Power First**: Switch off the main breaker, unplug the appliance, or trip the master fuse.\n2. **If Power Cannot Be Cut**: Stand on a dry, non-conductive surface (rubber mat, dry wooden board, stack of newspapers).\n3. **Use Non-Conductive Objects**: Push the live wire or victim away using a dry wooden broomstick, PVC pipe, wooden chair, or thick dry rope. Never use metal, wet wood, or damp cloths.'
      },
      {
        q: 'What First Aid should be given after separation?',
        a: '• Check consciousness, breathing, and pulse immediately.\n• If not breathing or no pulse, begin **Cardiopulmonary Resuscitation (CPR)** immediately:\n  - 30 chest compressions (2 inches deep, 100-120 bpm) followed by 2 rescue breaths.\n• If breathing normally, place them in the **Recovery Position** on their side.\n• Treat electrical burns by covering with clean, sterile, dry dressing (never apply ointments or ice).\n• Always take electrical shock victims to the hospital as internal cardiac arrhythmias can occur hours later.'
      },
      {
        q: 'What to do for downed outdoor high-voltage power lines?',
        a: 'Keep at least 35 feet (10 meters) away. The ground around a high-voltage wire can be energized. If you are near it, keep your feet together and shuffle or bunny-hop away without lifting your feet high, to avoid voltage differential between your feet.'
      }
    ],
    checklist: [
      'DO NOT touch the victim with bare hands while current is live',
      'Shut off the main electrical circuit breaker / master fuse',
      'Use dry wood / PVC / rubber object to push wire away if breaker unreachable',
      'Call emergency ambulance (102 / 108 / 911) immediately',
      'Check breathing; start CPR if victim is unresponsive',
      'Cover visible electrical burns with clean dry cloth (no ice)',
      'Keep victim warm and calm; monitor for delayed cardiac shock'
    ]
  },
  {
    id: 'earthquake',
    title: 'Earthquake Survival Protocol',
    badge: 'Structural Hazard',
    icon: '🌍',
    color: '#8b5cf6',
    summary: 'Critical defensive measures during tremors and immediate post-quake survival steps.',
    faqs: [
      {
        q: 'What should I do during the shaking (Indoors)?',
        a: 'Remember **DROP, COVER, and HOLD ON**:\n• **DROP** down onto your hands and knees. This protects you from being knocked over.\n• **COVER** your head and neck under a sturdy table or desk. If no shelter is nearby, drop next to an interior wall and cover head with your arms.\n• **HOLD ON** to your shelter with one hand and protect your head/neck until shaking stops completely.\n• **Stay away from windows, glass facades, heavy mirrors, and tall furniture** that could topple.'
      },
      {
        q: 'What should I do if I am outdoors or driving?',
        a: '• **Outdoors**: Move away from buildings, streetlights, overhead power cables, billboards, and flyovers. Drop to open ground.\n• **Driving**: Pull over safely to the side away from bridges, overpasses, and power poles. Keep your seatbelt fastened until the shaking ends.'
      },
      {
        q: 'Should I run outside during an earthquake?',
        a: '**NO!** Most earthquake injuries happen when people try to exit buildings while shaking is active, as bricks, glass, and facade tiles fall from above onto doorways and sidewalks. Stay inside under shelter until tremors cease.'
      },
      {
        q: 'What must be done immediately after the shaking stops?',
        a: '1. Check yourself and others for injuries.\n2. Smell for gas leaks. If detected, shut off the gas valve and do not use matches.\n3. Turn off electricity at the main breaker if you see spark damage or broken wires.\n4. Wear sturdy shoes to protect your feet from broken glass.\n5. Evacuate using stairs (never use elevators).\n6. Prepare for aftershocks (which can be as strong as the main quake).'
      }
    ],
    checklist: [
      'DROP to hands and knees immediately',
      'COVER head and neck under sturdy desk or interior corner',
      'HOLD ON to shelter until shaking stops completely',
      'Do NOT run outside during active shaking',
      'Avoid elevators - always use structural stairs',
      'Check for gas leaks and shut main gas/water/electric valves',
      'Wear sturdy shoes before walking through debris',
      'Tune into emergency radio/phone broadcasts for aftershock warnings'
    ]
  }
];

// Helper to search FAQs
function searchFaqs(query) {
  if (!query) return EMERGENCY_FAQS;
  const q = query.toLowerCase().trim();
  return EMERGENCY_FAQS.map(cat => {
    const matchingFaqs = cat.faqs.filter(f => 
      f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
    const matchesCat = cat.title.toLowerCase().includes(q) || cat.summary.toLowerCase().includes(q);
    if (matchesCat || matchingFaqs.length > 0) {
      return {
        ...cat,
        faqs: matchesCat ? cat.faqs : matchingFaqs
      };
    }
    return null;
  }).filter(Boolean);
}
