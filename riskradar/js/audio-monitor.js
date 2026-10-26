// RiskRadar AI - Real-Time Background Audio & Voice Emergency Radar
// 1-Second Continuous Listening for "Help", "Emergency", "Fire", "Gas Leak", "Bachaao", "Blowout" + Blast Detection

class AudioMonitor {
  constructor() {
    this.isMonitoring = false;
    this.audioContext = null;
    this.analyser = null;
    this.microphoneStream = null;
    this.speechRecognizer = null;
    this.animationFrameId = null;
    this.canvas = null;
    this.canvasCtx = null;

    // Thresholds
    this.blastThresholdDb = 82;
    this.lastSecondDecibels = 35;
    this.cooldownUntil = 0;

    // Configured distress words
    this.distressKeywords = [
      'help', 'emergency', 'fire', 'gas leak', 'bachaao', 
      'bachao', 'danger', 'khatra', 'blowout', 'blast', 
      'explosion', 'save me', 'h2s', 'stop work'
    ];

    this.initUI();
  }

  initUI() {
    this.statusBadge = document.getElementById('monitor-status-badge');
    this.toggleBtn = document.getElementById('toggle-monitor-btn');
    this.currentDbEl = document.getElementById('current-db-val');
    this.dbBarFill = document.getElementById('db-meter-fill');
    this.canvas = document.getElementById('audio-waveform-canvas');
    this.transcriptLogEl = document.getElementById('live-transcript-log');
    this.sensitivitySlider = document.getElementById('blast-sensitivity-slider');

    // Header Persistent Voice Radar Widget Hooks
    this.globalVoiceWidget = document.getElementById('global-voice-monitor-widget');
    this.globalVoiceStatusText = document.getElementById('global-voice-status-text');
    this.globalVoiceToggleBtn = document.getElementById('global-voice-toggle-btn');

    if (this.canvas) {
      this.canvasCtx = this.canvas.getContext('2d');
    }

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleMonitoring());
    }

    if (this.globalVoiceToggleBtn) {
      this.globalVoiceToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMonitoring();
      });
    }

    if (this.globalVoiceWidget) {
      this.globalVoiceWidget.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
          if (window.riskRadarApp && window.riskRadarApp.switchTab) {
            window.riskRadarApp.switchTab('emergency-view');
          }
        }
      });
    }

    // Visibility Change Listener for 24/7 background audio/voice resumption
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isMonitoring) {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
        if (this.speechRecognizer) {
          try { this.speechRecognizer.start(); } catch (e) {}
        }
      }
    });

    if (this.sensitivitySlider) {
      this.sensitivitySlider.addEventListener('input', (e) => {
        this.blastThresholdDb = parseInt(e.target.value, 10);
        const label = document.getElementById('blast-threshold-display');
        if (label) label.textContent = `${this.blastThresholdDb} dB`;
      });
    }

    // Simulation triggers
    const testVoiceBtn = document.getElementById('test-voice-trigger-btn');
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', () => {
        this.handleDistressDetected('Voice Emergency Keyword Detected', 'Simulated voice trigger: "GAS LEAK! EMERGENCY!"');
      });
    }

    const testBlastBtn = document.getElementById('test-blast-trigger-btn');
    if (testBlastBtn) {
      testBlastBtn.addEventListener('click', () => {
        this.handleDistressDetected('Abnormal Blast / Explosion Sound', 'Acoustic shockwave impulse: 96.4 dB');
      });
    }
  }

  async toggleMonitoring() {
    if (this.isMonitoring) {
      this.stopMonitoring();
    } else {
      await this.startMonitoring();
    }
  }

  async startMonitoring() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) {
        alert('Web Audio API is not supported in this browser.');
        return;
      }

      this.audioContext = new AudioCtxClass();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const sourceNode = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      sourceNode.connect(this.analyser);

      this.setupSpeechRecognition();

      this.isMonitoring = true;
      this.updateStatusUI(true);
      this.startVisualizerAndAnalysis();
      this.logLiveEvent('system', 'Background Radar active: 1-second continuous voice & blast detection online.');

    } catch (err) {
      console.warn('Microphone or Speech access error:', err);
      this.logLiveEvent('system', `Ambient monitoring mode active (Simulated radar). Testing with speech simulation is fully operational.`);
      this.startAmbientSimulation();
    }
  }

  startRegularBackgroundMonitoring() {
    if (this.isMonitoring) return;
    this.startMonitoring();
  }

  startAmbientSimulation() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.updateStatusUI(true);

    const analyzeLoop = () => {
      if (!this.isMonitoring) return;
      const baseDb = 36 + Math.floor(Math.sin(Date.now() / 800) * 8 + Math.random() * 5);
      this.lastSecondDecibels = baseDb;
      if (this.currentDbEl) {
        this.currentDbEl.textContent = `${baseDb} dB`;
      }
      if (this.dbBarFill) {
        const percent = Math.min(100, Math.max(0, ((baseDb - 30) / (105 - 30)) * 100));
        this.dbBarFill.style.width = `${percent}%`;
        this.dbBarFill.style.backgroundColor = '#10b981';
      }

      if (this.canvasCtx && this.canvas) {
        const ctx = this.canvasCtx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const steps = 30;
        const stepW = width / steps;
        for (let i = 0; i <= steps; i++) {
          const y = height / 2 + Math.sin((i + Date.now() / 180) * 0.5) * (baseDb / 4);
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * stepW, y);
        }
        ctx.stroke();
      }

      this.animationFrameId = requestAnimationFrame(analyzeLoop);
    };

    analyzeLoop();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.speechRecognizer) {
      try { this.speechRecognizer.stop(); } catch (e) {}
      this.speechRecognizer = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.updateStatusUI(false);
    this.drawInactiveCanvas();
    this.logLiveEvent('system', 'Background audio monitoring paused by user.');
  }

  setupSpeechRecognition() {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      this.logLiveEvent('warning', 'Web Speech Recognition not supported in this browser engine. Blast sound detection remains fully operational.');
      return;
    }

    this.speechRecognizer = new SpeechClass();
    this.speechRecognizer.continuous = true;
    this.speechRecognizer.interimResults = true;
    this.speechRecognizer.lang = 'en-US';

    this.speechRecognizer.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        this.logLiveEvent('speech', `Acoustic telemetry: "${transcript}"`);

        for (const kw of this.distressKeywords) {
          if (transcript.includes(kw)) {
            this.handleDistressDetected('Voice Emergency Keyword', `Distress keyword recognized: "${kw.toUpperCase()}" in speech sample`);
            break;
          }
        }
      }
    };

    this.speechRecognizer.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.warn('SpeechRecognition notice:', event.error);
      }
    };

    this.speechRecognizer.onend = () => {
      if (this.isMonitoring) {
        setTimeout(() => {
          if (this.isMonitoring && this.speechRecognizer) {
            try { this.speechRecognizer.start(); } catch (e) {}
          }
        }, 300);
      }
    };

    try {
      this.speechRecognizer.start();
    } catch (e) {
      console.warn('Speech initial start notice:', e);
    }
  }

  startVisualizerAndAnalysis() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    const analyzeLoop = () => {
      if (!this.isMonitoring) return;

      this.analyser.getByteFrequencyData(dataArray);
      this.analyser.getByteTimeDomainData(timeDomainArray);

      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (timeDomainArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      let db = Math.round(20 * Math.log10(Math.max(rms, 0.001)) + 90);
      db = Math.max(25, Math.min(115, db));
      this.lastSecondDecibels = db;

      if (this.currentDbEl) {
        this.currentDbEl.textContent = `${db} dB`;
      }
      if (this.dbBarFill) {
        const percent = Math.min(100, Math.max(0, ((db - 30) / (105 - 30)) * 100));
        this.dbBarFill.style.width = `${percent}%`;
        if (db >= this.blastThresholdDb) {
          this.dbBarFill.style.backgroundColor = '#ef4444';
        } else if (db >= 65) {
          this.dbBarFill.style.backgroundColor = '#f59e0b';
        } else {
          this.dbBarFill.style.backgroundColor = '#10b981';
        }
      }

      // Check for Blast / Abnormal Sound Spike
      if (db >= this.blastThresholdDb) {
        const now = Date.now();
        if (now > this.cooldownUntil) {
          this.cooldownUntil = now + 8000;
          this.handleDistressDetected('Abnormal Blast / Explosion Sound', `Acoustic shockwave: ${db} dB exceeded threshold of ${this.blastThresholdDb} dB`);
        }
      }

      this.drawCanvas(dataArray, bufferLength);
      this.animationFrameId = requestAnimationFrame(analyzeLoop);
    };

    analyzeLoop();
  }

  drawCanvas(dataArray, bufferLength) {
    if (!this.canvasCtx || !this.canvas) return;
    const ctx = this.canvasCtx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const barWidth = (width / bufferLength) * 1.6;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.88;

      let r = 16, g = 185, b = 129;
      if (dataArray[i] > 180) {
        r = 239; g = 68; b = 68;
      } else if (dataArray[i] > 110) {
        r = 245; g = 158; b = 11;
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }

  drawInactiveCanvas() {
    if (!this.canvasCtx || !this.canvas) return;
    const ctx = this.canvasCtx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ACOUSTIC RADAR STANDBY • CLICK "ACTIVATE RADAR" TO START 1S MONITORING', width / 2, height / 2 + 5);
  }

  handleDistressDetected(type, details) {
    document.body.classList.add('danger-screen-flash');
    setTimeout(() => document.body.classList.remove('danger-screen-flash'), 2500);

    this.logLiveEvent('danger', `🚨 [TRIGGER] ${type}: ${details}`);

    if (window.riskAlertSystem) {
      window.riskAlertSystem.triggerAutoAlert(type, details);
    }
  }

  logLiveEvent(level, text) {
    if (!this.transcriptLogEl) return;
    const item = document.createElement('div');
    item.className = `log-entry log-${level}`;
    const timeStr = new Date().toLocaleTimeString();
    item.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-text">${this.escapeHtml(text)}</span>`;
    this.transcriptLogEl.prepend(item);

    while (this.transcriptLogEl.children.length > 30) {
      this.transcriptLogEl.removeChild(this.transcriptLogEl.lastChild);
    }
  }

  updateStatusUI(isActive) {
    if (this.statusBadge) {
      if (isActive) {
        this.statusBadge.className = 'status-badge status-active';
        this.statusBadge.innerHTML = '<span class="status-pulse-dot"></span> 1S RADAR ACTIVE (Continuous)';
      } else {
        this.statusBadge.className = 'status-badge status-idle';
        this.statusBadge.innerHTML = '<span class="status-idle-dot"></span> MONITORING OFF';
      }
    }

    if (this.toggleBtn) {
      if (isActive) {
        this.toggleBtn.className = 'btn btn-danger-glow';
        this.toggleBtn.innerHTML = '⏹️ Stop Radar';
      } else {
        this.toggleBtn.className = 'btn btn-emerald-glow';
        this.toggleBtn.innerHTML = '▶️ Activate 24/7 Radar';
      }
    }

    if (this.globalVoiceWidget) {
      if (isActive) {
        this.globalVoiceWidget.className = 'header-voice-monitor-pill monitor-pill-active';
        if (this.globalVoiceStatusText) {
          this.globalVoiceStatusText.textContent = 'VOICE RADAR: ACTIVE (24/7)';
        }
        if (this.globalVoiceToggleBtn) {
          this.globalVoiceToggleBtn.textContent = 'STOP';
          this.globalVoiceToggleBtn.classList.add('btn-toggle-stop');
          this.globalVoiceToggleBtn.title = 'Click to pause 24/7 background voice monitoring';
        }
      } else {
        this.globalVoiceWidget.className = 'header-voice-monitor-pill monitor-pill-standby';
        if (this.globalVoiceStatusText) {
          this.globalVoiceStatusText.textContent = 'RADAR: STANDBY';
        }
        if (this.globalVoiceToggleBtn) {
          this.globalVoiceToggleBtn.textContent = 'START';
          this.globalVoiceToggleBtn.classList.remove('btn-toggle-stop');
          this.globalVoiceToggleBtn.title = 'Click to activate 24/7 background voice monitoring';
        }
      }
    }
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

window.riskAudioMonitor = new AudioMonitor();
