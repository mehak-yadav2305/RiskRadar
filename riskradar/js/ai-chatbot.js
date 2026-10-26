// RiskRadar AI - Industrial Safety Assistant & SIF Precursor Advisor
// Grounded in Oil India Limited (OIL), OISD & DGMS Regulations

class RiskAIChatbot {
  constructor() {
    this.messagesContainer = document.getElementById('chat-messages');
    this.inputForm = document.getElementById('chat-form');
    this.inputField = document.getElementById('chat-user-input');
    this.drawerEl = document.getElementById('ai-chat-drawer');
    this.toggleDrawerBtn = document.getElementById('toggle-chat-btn');
    this.closeDrawerBtn = document.getElementById('close-chat-btn');
    this.quickChipsContainer = document.getElementById('chat-quick-chips');

    this.chatHistory = this.loadHistory();
    this.initUI();
  }

  initUI() {
    if (this.inputForm) {
      this.inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.inputField ? this.inputField.value.trim() : '';
        if (text) {
          this.handleUserMessage(text);
          if (this.inputField) this.inputField.value = '';
        }
      });
    }

    if (this.toggleDrawerBtn) {
      this.toggleDrawerBtn.addEventListener('click', () => {
        if (this.drawerEl) {
          this.drawerEl.classList.toggle('collapsed');
        }
      });
    }

    if (this.closeDrawerBtn) {
      this.closeDrawerBtn.addEventListener('click', () => {
        if (this.drawerEl) {
          this.drawerEl.classList.add('collapsed');
        }
      });
    }

    this.setupQuickChips();
    this.renderInitialMessages();
  }

  setupQuickChips() {
    const chips = [
      '🔍 What is a SIF Precursor in OIL operations?',
      '🏗️ Rig derrick height work without harness protocol',
      '⚠️ H2S gas leak alarm response steps',
      '⚡ 3.3kV MCC panel LOTO procedure',
      '🕳️ Confined space entry 4-gas test criteria'
    ];

    if (this.quickChipsContainer) {
      this.quickChipsContainer.innerHTML = chips.map(c => `
        <button class="chat-chip-btn" type="button">${c}</button>
      `).join('');

      this.quickChipsContainer.querySelectorAll('.chat-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.textContent.replace(/^[\p{Emoji}\s]+/u, '').trim();
          this.handleUserMessage(text);
        });
      });
    }
  }

  renderInitialMessages() {
    if (!this.messagesContainer) return;

    if (this.chatHistory.length === 0) {
      this.addMessageToUI('assistant', 
        'Hello! I am your **RiskRadar AI Industrial Safety Assistant** 🛡️.\n\nI am trained on **Oil India Limited (OIL)**, **OISD**, and **DGMS** industrial safety procedures to help you identify **SIF Precursors**, evaluate barrier failures, and execute emergency response protocols.\n\n*How can I assist your safety assessment or field query today?*'
      );
    } else {
      this.chatHistory.forEach(msg => {
        this.addMessageToUI(msg.role, msg.content, false);
      });
    }
  }

  handleUserMessage(text) {
    this.addMessageToUI('user', text);
    this.chatHistory.push({ role: 'user', content: text });
    this.saveHistory();

    this.showTypingIndicator();

    setTimeout(() => {
      this.hideTypingIndicator();
      const response = this.generateResponse(text);
      this.addMessageToUI('assistant', response.text, true, response.action);
      this.chatHistory.push({ role: 'assistant', content: response.text });
      this.saveHistory();
    }, 550);
  }

  generateResponse(input) {
    const q = input.toLowerCase();

    // Emergency trigger
    if (q.includes('help me') || q.includes('bachaao') || q.includes('emergency') || q.includes('in danger') || q.includes('blowout')) {
      return {
        text: '🚨 **IMMEDIATE EMERGENCY ASSISTANCE:**\nIf an active blowout, fire, or severe casualty is underway, activate the red SOS Panic button below immediately. This triggers the audible siren and transmits your GPS coordinates to the **OIL Central Emergency Control Room (0374-2800555)** and designated emergency contacts.',
        action: {
          type: 'sos_button',
          label: '🚨 TRIGGER IMMEDIATE SOS PANIC ALERT'
        }
      };
    }

    // What is a SIF Precursor
    if (q.includes('sif') || q.includes('precursor') || q.includes('serious injury')) {
      return {
        text: '📊 **WHAT IS A SIF PRECURSOR? (OIL Industrial Safety Context):**\n\nA **Serious Injury & Fatality (SIF) Precursor** is an unsafe act, unsafe condition, or near-miss event where **high-magnitude energy** (e.g. gravity >1.8m, combustible hydrocarbons, electrical arc flash, high pressure) is present, and one or more **critical safety barriers** are either absent, bypassed, or compromised.\n\nUnder the Heinrich-Bird triangle, preventing minor injuries does not automatically prevent fatalities; **only identifying and neutralizing SIF precursors** protects workers from catastrophic outcomes.'
      };
    }

    // Height work / derrick
    if (q.includes('height') || q.includes('derrick') || q.includes('scaffold') || q.includes('harness') || q.includes('monkey board') || q.includes('fall')) {
      return {
        text: '🏗️ **WORKING AT HEIGHT & DERRICK PROTOCOLS (OISD-GDN-192):**\n\n• **100% Tie-Off**: Mandatory dual-lanyard connection at all elevations above 1.8 meters.\n• **Harness Requirement**: Full-body harness with dorsal D-ring (IS 3521 / EN 361). Waist belts are strictly forbidden.\n• **Derrick Monkey Board**: Self-Retracting Lifeline (SRL) must be certified and shock absorber un-deployed.\n• **Edge Guardrails**: Top rail (1.0m), mid rail (0.5m), and rigid toe-board (150mm) required.\n• **Stop-Work Trigger**: Wind velocity exceeding 25 knots (45 km/h) or active electrical storm requires immediate descent.'
      };
    }

    // Gas leak / H2S
    if (q.includes('h2s') || q.includes('gas leak') || q.includes('hydrogen sulfide') || q.includes('smell') || q.includes('lel')) {
      return {
        text: '⚠️ **H2S & HYDROCARBON GAS LEAK PROTOCOL (OISD-STD-116):**\n\n• **Immediate Action**: Sound site warble alarm. Evacuate crosswind, then upwind observing site windsocks.\n• **Zero-Spark Rule**: Do not operate electrical switches, standard mobile phones, or non-Ex-d equipment.\n• **Toxicity Warning**: H2S > 10 ppm requires positive-pressure SCBA. Above 100 ppm causes immediate olfactory paralysis (you will no longer smell it before collapse).\n• **Wellhead Isolation**: Only emergency response crew with positive-pressure SCBA and buddy lines may approach for valve shutoff.'
      };
    }

    // Electrical / LOTO
    if (q.includes('electric') || q.includes('loto') || q.includes('switchgear') || q.includes('mcc') || q.includes('3.3kv') || q.includes('arc flash')) {
      return {
        text: '⚡ **ELECTRICAL SAFETY & LOTO PROTOCOL (NFPA 70E / OISD-STD-137):**\n\n• **Proving Dead**: Never assume an open breaker is dead. Always test with a calibrated high-voltage proximity detector or contact tester.\n• **Lockout / Tagout**: Every technician must affix personal red padlock and danger tag to master isolator.\n• **Arc Flash Boundary**: Flash suit and rated face shield mandatory when racking 3.3kV mud pump breakers.\n• **Flameproof Ex-d**: Never operate electrical enclosure in Zone 1/2 with bolts removed or door interlock bypassed.'
      };
    }

    // Confined space
    if (q.includes('confined') || q.includes('tank') || q.includes('mud tank') || q.includes('vessel') || q.includes('desludging')) {
      return {
        text: '🕳️ **CONFINED SPACE ENTRY BARRIERS (OISD-STD-105):**\n\n1. **4-Gas Certification**: Test Oxygen (19.5% - 23.5%), LEL (0%), H2S (<5 ppm), CO (<25 ppm) with calibrated detector.\n2. **Standby Safety Attendant**: Must remain stationed outside the manway at all times; equipped with air horn and rescue hoist.\n3. **Positive Isolation**: Physical spade/blind plates inserted into all connecting hydrocarbon/steam lines.\n4. **Forced Ventilation**: Continuous pneumatic blower operation throughout human occupancy.'
      };
    }

    // Default response
    return {
      text: `🛡️ **RiskRadar AI Industrial Guidance:**\n\nRegarding your query about *"${input}"*:\n1. Check the **Safety Corner** tab on this dashboard for approved OISD/DGMS step-by-step checklists.\n2. Use the **Upload Report** section to run automated AI/NLP SIF precursor analysis on any field observation.\n3. In case of immediate physical hazard, enforce the **Life-Saving Stop-Work Rule** and notify your site HSE Officer.`
    };
  }

  addMessageToUI(role, markdownText, scroll = true, action = null) {
    if (!this.messagesContainer) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-bubble chat-bubble-${role}`;

    const parsedHtml = this.renderMarkdown(markdownText);
    msgEl.innerHTML = `
      <div class="bubble-avatar">${role === 'assistant' ? '🛡️' : '👤'}</div>
      <div class="bubble-content">
        <div class="bubble-text">${parsedHtml}</div>
        ${action ? `<div class="bubble-action-box" style="margin-top: 0.6rem;"><button class="btn btn-danger-glow" onclick="window.riskAlertSystem && window.riskAlertSystem.triggerManualSOS()">${action.label}</button></div>` : ''}
        <span class="bubble-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `;

    this.messagesContainer.appendChild(msgEl);
    if (scroll) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  showTypingIndicator() {
    if (!this.messagesContainer) return;
    this.hideTypingIndicator();

    const indicator = document.createElement('div');
    indicator.id = 'chat-typing-indicator';
    indicator.className = 'chat-bubble chat-bubble-assistant typing-bubble';
    indicator.innerHTML = `
      <div class="bubble-avatar">🛡️</div>
      <div class="bubble-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    this.messagesContainer.appendChild(indicator);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) indicator.remove();
  }

  renderMarkdown(text) {
    if (!text) return '';
    let html = this.escapeHtml(text);

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^• (.*?)$/gm, '<li class="chat-li">$1</li>');
    html = html.replace(/(<li class="chat-li">.*?<\/li>)/gs, '<ul class="chat-ul">$1</ul>');
    html = html.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

    return html;
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

  loadHistory() {
    try {
      const raw = localStorage.getItem('riskradar_chat_history');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  saveHistory() {
    try {
      if (this.chatHistory.length > 40) {
        this.chatHistory = this.chatHistory.slice(-30);
      }
      localStorage.setItem('riskradar_chat_history', JSON.stringify(this.chatHistory));
    } catch (e) {}
  }
}

window.riskAIChatbot = new RiskAIChatbot();
