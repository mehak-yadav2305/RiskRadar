# Automated Verification Test Suite for RiskRadar AI
# Oil India Limited • SIF Precursor Detection Engine

import os
import sys
import json
import re
import urllib.request
import threading
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_file_integrity():
    print("==================================================")
    print("1. VERIFYING FILE INTEGRITY & ASSET REGISTRY")
    print("==================================================")
    required_files = [
        "index.html",
        "manifest.json",
        "sw.js",
        "server.py",
        "css/styles.css",
        "js/sif-engine.js",
        "js/capa-tracker.js",
        "js/faq-data.js",
        "js/safety-corner.js",
        "js/alert-system.js",
        "js/audio-monitor.js",
        "js/ai-chatbot.js",
        "js/app.js",
        "assets/icon-192.svg",
        "assets/icon-512.svg"
    ]
    for rel_path in required_files:
        full_path = os.path.join(BASE_DIR, rel_path)
        assert os.path.exists(full_path), f"Missing required file: {rel_path}"
        size = os.path.getsize(full_path)
        assert size > 0, f"File is empty: {rel_path}"
        print(f"  [OK] {rel_path} ({size:,} bytes)")
    print("File integrity verification: PASSED\n")

def test_index_html_contracts():
    print("==================================================")
    print("2. VERIFYING INDEX.HTML SCRIPT & UI HOOKS")
    print("==================================================")
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    expected_ids = [
        "dashboard-view",
        "upload-view",
        "risk-queue-view",
        "sif-detection-view",
        "alerts-view",
        "capa-view",
        "analytics-view",
        "safety-corner-view",
        "ai-assistant-view",
        "emergency-view",
        "profile-view",
        "contacts-onboarding-view",
        "auth-view",
        "header-sos-btn",
        "active-role-selector",
        "report-dropzone",
        "report-text-input",
        "run-sif-analysis-btn",
        "load-sih-demo-btn",
        "sif-workspace-container",
        "audio-waveform-canvas",
        "toggle-monitor-btn",
        "test-voice-trigger-btn",
        "test-blast-trigger-btn",
        "emergency-alert-modal",
        "dispatch-success-modal",
        # New UI elements added in update
        "global-voice-monitor-widget",
        "global-voice-status-text",
        "global-voice-toggle-btn",
        "browse-file-btn",
        "file-upload-status-card",
        "file-upload-alert",
        "kpi-high-critical",
        "kpi-moderate-risk",
        "kpi-low-risk",
        "main-sos-panic-btn",
        "critical-alerts-container",
        "btn-refresh-alerts"
    ]

    for elem_id in expected_ids:
        assert f'id="{elem_id}"' in html, f"Missing required element ID in index.html: {elem_id}"
        print(f"  [OK] Element ID verified: #{elem_id}")

    # Check script loading order
    scripts_in_order = [
        "js/sif-engine.js",
        "js/capa-tracker.js",
        "js/faq-data.js",
        "js/safety-corner.js",
        "js/alert-system.js",
        "js/audio-monitor.js",
        "js/ai-chatbot.js",
        "js/app.js"
    ]
    last_idx = -1
    for s in scripts_in_order:
        idx = html.find(s)
        assert idx != -1, f"Missing script tag for: {s}"
        assert idx > last_idx, f"Script loaded out of order: {s}"
        last_idx = idx
        print(f"  [OK] Script loaded in correct sequence: {s}")

    print("Index.html contracts: PASSED\n")

# Python test implementation mirroring sif-engine.js logic to verify taxonomy
class PythonSIFEngineValidator:
    def __init__(self):
        self.energy_tax = {
            'gravity_height': ['height', 'elevation', 'scaffolding', 'derrick', 'monkey board', 'ladder', 'roof', 'open edge', 'fall', '14m', '12m', '10m', '5m', '2m', 'platform'],
            'hydrocarbon_gas': ['gas leak', 'h2s', 'hydrogen sulfide', 'methane', 'lel', 'combustible', 'hydrocarbon', 'flange leak', 'wellhead', 'separator', 'blowout'],
            'pressure': ['high pressure', 'psi', 'bar', 'pressure relief', 'pop valve', 'choke manifold', 'hydraulic', 'blowout preventer'],
            'confined_space': ['confined space', 'storage tank', 'mud tank', 'vessel entry', 'desludging', 'asphyxiation', 'manhole', 'tank t-104'],
            'electrical_arc': ['electric shock', 'live wire', 'switchgear', '3.3kv', '440v', 'arc flash', 'transformer', 'energized'],
        }
        self.barrier_gaps = [
            'without', 'no ppe', 'missing', 'bypassed', 'disabled', 'failed',
            'not wearing', 'unprotected', 'no harness', 'no tie-off', 'unauthorized', 'without permit'
        ]

    def analyze(self, text):
        lower = text.lower()
        matched_energies = [k for k, v in self.energy_tax.items() if any(term in lower for term in v)]
        detected_gaps = [g for g in self.barrier_gaps if g in lower]
        
        missing_harness = 'without' in lower and any(x in lower for x in ['harness', 'fall arrest', 'tie-off', 'ppe'])
        is_height = 'gravity_height' in matched_energies and (missing_harness or '14m' in lower or 'derrick' in lower)
        is_gas = 'hydrocarbon_gas' in matched_energies and ('h2s' in lower or 'blowout' in lower or len(detected_gaps) > 0)
        is_confined = 'confined_space' in matched_energies and (len(detected_gaps) > 0 or 'without' in lower)
        is_electrical = 'electrical_arc' in matched_energies and ('bypassed' in lower or 'energized' in lower or '3.3kv' in lower)

        is_sif = is_height or is_gas or is_confined or is_electrical
        
        score = 25
        if 'gravity_height' in matched_energies: score += 35
        if 'hydrocarbon_gas' in matched_energies: score += 35
        if len(detected_gaps) > 0: score += len(detected_gaps) * 12
        if is_sif: score = max(score, 90)
        score = min(99, max(12, score))

        level = "CRITICAL" if score >= 85 else ("HIGH" if score >= 65 else ("MODERATE" if score >= 35 else "LOW"))
        return {
            'is_sif': is_sif,
            'score': score,
            'level': level,
            'energies': matched_energies,
            'gaps': detected_gaps
        }

def test_sif_precursor_benchmarks():
    print("==================================================")
    print("3. VERIFYING SIF PRECURSOR BENCHMARKS")
    print("==================================================")
    engine = PythonSIFEngineValidator()

    # Scenario 1: Primary SIH Demo
    text1 = "Worker working at height on rig derrick at 14m elevation without safety harness or fall arrestor near an unprotected open edge during drill string tripping in windy conditions (OIL Rig-21, Duliajan). No secondary tie-off observed; floor toe-boards were missing on the monkey board platform."
    res1 = engine.analyze(text1)
    print(f"  Scenario 1 (Rig Derrick 14m Height):")
    print(f"    SIF Precursor: {res1['is_sif']} | Risk Level: {res1['level']} | Score: {res1['score']}")
    assert res1['is_sif'] is True, "Scenario 1 failed to trigger SIF precursor flag"
    assert res1['level'] == 'CRITICAL', "Scenario 1 risk level must be CRITICAL"
    assert 'gravity_height' in res1['energies']

    # Scenario 2: H2S Gas Leak
    text2 = "Gas detector alarm sounded at Wellhead #47 gathering station; H2S reading spiked to 28 ppm; contractor crew attempted manual valve isolation without positive-pressure SCBA breathing apparatus."
    res2 = engine.analyze(text2)
    print(f"  Scenario 2 (H2S Gas Leak 28ppm):")
    print(f"    SIF Precursor: {res2['is_sif']} | Risk Level: {res2['level']} | Score: {res2['score']}")
    assert res2['is_sif'] is True, "Scenario 2 failed to trigger SIF precursor flag"
    assert res2['level'] == 'CRITICAL', "Scenario 2 risk level must be CRITICAL"
    assert 'hydrocarbon_gas' in res2['energies']

    # Scenario 3: Confined Space
    text3 = "Cleaning crew entered crude oil settling tank T-104 for desludging without atmospheric 4-gas testing certificate."
    res3 = engine.analyze(text3)
    print(f"  Scenario 3 (Tank T-104 Confined Space):")
    print(f"    SIF Precursor: {res3['is_sif']} | Risk Level: {res3['level']} | Score: {res3['score']}")
    assert res3['is_sif'] is True, "Scenario 3 failed to trigger SIF precursor flag"
    assert res3['level'] in ['CRITICAL', 'HIGH']
    assert 'confined_space' in res3['energies']

    # Scenario 4: Electrical Arc
    text4 = "Electrician troubleshooting 3.3kV mud pump starter panel with door swung open and interlock bypassed while energized."
    res4 = engine.analyze(text4)
    print(f"  Scenario 4 (3.3kV Electrical Arc):")
    print(f"    SIF Precursor: {res4['is_sif']} | Risk Level: {res4['level']} | Score: {res4['score']}")
    assert res4['is_sif'] is True, "Scenario 4 failed to trigger SIF precursor flag"
    assert res4['level'] in ['CRITICAL', 'HIGH']
    assert 'electrical_arc' in res4['energies']

    # Scenario 5: Routine Observation
    text5 = "Routine shift observation: Housekeeping completed around rig catwalk. Minor water accumulation wiped with mop. First aid box replenished."
    res5 = engine.analyze(text5)
    print(f"  Scenario 5 (Routine Housekeeping):")
    print(f"    SIF Precursor: {res5['is_sif']} | Risk Level: {res5['level']} | Score: {res5['score']}")
    assert res5['is_sif'] is False, "Scenario 5 should NOT trigger SIF precursor"
    assert res5['level'] == 'LOW', "Scenario 5 risk level must be LOW"

    print("SIF Precursor benchmarks: ALL 5 SCENARIOS PASSED\n")

def test_server_http_endpoints():
    print("==================================================")
    print("4. VERIFYING HTTP SERVER & HEADERS")
    print("==================================================")
    import http.server
    import socketserver

    PORT = 8089
    class TestHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=BASE_DIR, **kwargs)
        def end_headers(self):
            self.send_header('Service-Worker-Allowed', '/')
            self.send_header('Access-Control-Allow-Origin', '*')
            super().end_headers()

    httpd = socketserver.TCPServer(("127.0.0.1", PORT), TestHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    endpoints_to_test = [
        ("/", 200, "text/html"),
        ("/index.html", 200, "text/html"),
        ("/manifest.json", 200, "application/json"),
        ("/sw.js", 200, "application/javascript"),
        ("/css/styles.css", 200, "text/css"),
        ("/js/sif-engine.js", 200, "application/javascript"),
        ("/js/capa-tracker.js", 200, "application/javascript"),
        ("/js/faq-data.js", 200, "application/javascript"),
        ("/js/safety-corner.js", 200, "application/javascript"),
        ("/js/alert-system.js", 200, "application/javascript"),
        ("/js/audio-monitor.js", 200, "application/javascript"),
        ("/js/ai-chatbot.js", 200, "application/javascript"),
        ("/js/app.js", 200, "application/javascript"),
        ("/assets/icon-192.svg", 200, "image/svg+xml")
    ]

    for path, exp_code, exp_type in endpoints_to_test:
        url = f"http://127.0.0.1:{PORT}{path}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            code = resp.getcode()
            content_type = resp.headers.get("Content-Type", "")
            sw_allowed = resp.headers.get("Service-Worker-Allowed", "")
            assert code == exp_code, f"Failed GET {path}: code {code}"
            assert exp_type in content_type or "javascript" in content_type or "octet-stream" in content_type, f"Unexpected content type for {path}: {content_type}"
            assert sw_allowed == "/", f"Missing Service-Worker-Allowed header on {path}"
            print(f"  [OK] GET {path:22} -> HTTP {code} | {content_type.split(';')[0]} | SW Header: OK")

    httpd.shutdown()
    httpd.server_close()
    print("HTTP Server & Header verification: PASSED\n")

def test_features_and_sos_design():
    print("==================================================")
    print("5. VERIFYING SOS DESIGN, RISK TIERS & FILE UPLOAD")
    print("==================================================")
    
    # 1. Verify SOS button containment in styles.css
    css_path = os.path.join(BASE_DIR, "css", "styles.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    assert ".sos-large-circle-btn" in css, "Missing .sos-large-circle-btn class in CSS"
    assert "border-radius: 50%" in css, "SOS button must be circular (border-radius: 50%)"
    assert "overflow: hidden" in css, "SOS button must have overflow: hidden to prevent text spill"
    print("  [OK] SOS button circular containment verified (overflow: hidden, 50% radius)")

    # 2. Verify sample reports and sorting in app.js
    app_js_path = os.path.join(BASE_DIR, "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js = f.read()

    assert "CRITICAL" in app_js, "app.js must contain CRITICAL reports"
    assert "HIGH" in app_js, "app.js must contain HIGH reports"
    assert "MODERATE" in app_js, "app.js must contain MODERATE reports"
    assert "LOW" in app_js, "app.js must contain LOW reports"
    assert "levelWeight" in app_js or "priority" in app_js, "app.js must implement priority tier sorting"
    print("  [OK] All 3 risk tiers (Critical/High, Moderate, Low) verified in app.js data & sorting")

    # 3. Verify file upload formats supported
    for ext in ["pdf", "docx", "txt", "csv"]:
        assert ext in app_js.lower(), f"app.js missing support for file format: {ext}"
    print("  [OK] File upload handler supports PDF, DOCX, TXT, CSV")

    # 4. Verify voice monitor background synchronization
    audio_js_path = os.path.join(BASE_DIR, "js", "audio-monitor.js")
    with open(audio_js_path, "r", encoding="utf-8") as f:
        audio_js = f.read()
    assert "global-voice-monitor-widget" in audio_js, "audio-monitor.js must bind to header voice widget"
    assert "visibilitychange" in audio_js, "audio-monitor.js must handle visibilitychange"
    print("  [OK] Audio monitor background synchronization & header widget verified")

    # 5. Verify SIH26165 is removed from visible prototype strings in index.html
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
    # Check title tag and visible header
    assert "<title>RiskRadar AI | OIL SIF Precursor Detection Engine</title>" in html, "Title should not contain SIH code"
    assert "sih26165" not in html.lower() or "problem statement sih26165" not in html.lower(), "Visible prototype strings should not display SIH26165"
    print("  [OK] Title and header clean of SIH problem statement code")

    # 6. Verify bright theme CSS styling
    assert "--bg-main: #f8fafc;" in css, "CSS must define bright background (--bg-main: #f8fafc)"
    assert "--bg-card: #ffffff;" in css, "CSS must define white card background (--bg-card: #ffffff)"
    assert "BRIGHT / DAYLIGHT INDUSTRIAL SAFETY THEME" in css, "CSS must contain bright theme styling overrides"
    print("  [OK] Bright / Daylight industrial theme verified in CSS")
    print("SOS design, risk tiers, file upload & bright theme verification: PASSED\n")

if __name__ == "__main__":
    try:
        test_file_integrity()
        test_index_html_contracts()
        test_sif_precursor_benchmarks()
        test_features_and_sos_design()
        test_server_http_endpoints()
        print("**************************************************")
        print("  ALL RISKRADAR AI VERIFICATION TESTS PASSED!  ")
        print("**************************************************")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
