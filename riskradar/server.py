import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class RiskRadarHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable Service Worker and PWA caching headers
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.json') or path.endswith('.webmanifest'):
            return 'application/manifest+json'
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.svg'):
            return 'image/svg+xml'
        return super().guess_type(path)

def run():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RiskRadarHTTPHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"=======================================================")
        print(f"  RISKRADAR LOCAL EMERGENCY SERVER RUNNING")
        print(f"  Serving at: {url}")
        print(f"  Directory:  {DIRECTORY}")
        print(f"=======================================================")
        print(f"Opening browser at {url}...")
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"Could not automatically open browser: {e}")
            
        print("Press Ctrl+C to stop server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down RiskRadar server.")
            httpd.server_close()

if __name__ == '__main__':
    run()
