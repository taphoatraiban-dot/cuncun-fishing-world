"""CUNCUN Fishing World MVP backend. Python 3.10+, standard library only.

Run locally:
  export FISHING_ADMIN_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  python3 backend/server.py

Bind defaults to 127.0.0.1:8791. Do not expose directly to the internet.
Use a trusted reverse proxy with TLS, rate limiting and authentication before public deployment.
"""
import json
import os
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

DB_PATH = Path(os.getenv("FISHING_DB_PATH", str(Path(__file__).with_name("fishing.sqlite3"))))
HOST = os.getenv("FISHING_HOST", "127.0.0.1")
PORT = int(os.getenv("FISHING_PORT", "8791"))
TOKEN = os.getenv("FISHING_ADMIN_TOKEN", "")

def connection():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.execute("PRAGMA busy_timeout=10000")
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("""CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        points INTEGER NOT NULL DEFAULT 0,
        catches INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
    )""")
    db.execute("""CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        points INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(player_id) REFERENCES players(id)
    )""")
    return db

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        candidate = self.headers.get("Authorization", "")
        return bool(TOKEN) and secrets.compare_digest(candidate, "Bearer " + TOKEN)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            return self.respond(200, {"ok": True, "service": "cuncun-fishing-backend"})
        if path == "/api/leaderboard":
            with connection() as db:
                rows = db.execute("SELECT name,points,catches FROM players ORDER BY points DESC,id ASC LIMIT 30").fetchall()
            return self.respond(200, {"players": [{"name": n, "points": p, "catches": c} for n,p,c in rows]})
        return self.respond(404, {"error": "not_found"})

    def do_POST(self):
        if urlparse(self.path).path != "/api/events":
            return self.respond(404, {"error": "not_found"})
        if not self.authorized():
            return self.respond(401, {"error": "unauthorized"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size <= 0 or size > 2048:
                return self.respond(413, {"error": "invalid_size"})
            payload = json.loads(self.rfile.read(size))
            name = payload.get("name")
            kind = payload.get("kind")
            points = payload.get("points")
            if not isinstance(name, str) or not 1 <= len(name.strip()) <= 32:
                raise ValueError("invalid name")
            if kind != "catch" or type(points) is not int or not 1 <= points <= 100:
                raise ValueError("invalid event")
            name = name.strip()
        except (ValueError, TypeError, json.JSONDecodeError):
            return self.respond(400, {"error": "invalid_payload"})
        now = int(time.time())
        with connection() as db:
            db.execute("INSERT OR IGNORE INTO players(name,created_at) VALUES(?,?)", (name, now))
            db.execute("UPDATE players SET points=points+?,catches=catches+1 WHERE name=? COLLATE NOCASE", (points,name))
            player_id = db.execute("SELECT id FROM players WHERE name=? COLLATE NOCASE", (name,)).fetchone()[0]
            db.execute("INSERT INTO events(player_id,kind,points,created_at) VALUES(?,?,?,?)", (player_id,kind,points,now))
        return self.respond(200, {"ok": True})

if __name__ == "__main__":
    if not TOKEN or len(TOKEN) < 24:
        raise SystemExit("Set a random FISHING_ADMIN_TOKEN of at least 24 characters")
    with connection():
        pass
    print(f"CUNCUN Fishing backend listening at http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
