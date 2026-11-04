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
import random
import hashlib
import sqlite3
import time
from . import seats
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

SITE_ROOT = Path(__file__).resolve().parent.parent

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
    db.execute("""CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL COLLATE NOCASE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    )""")
    db.execute("""CREATE TABLE IF NOT EXISTS casts (
        player_name TEXT PRIMARY KEY COLLATE NOCASE,
        cast_at INTEGER NOT NULL
    )""")
    db.execute("""CREATE TABLE IF NOT EXISTS player_sessions (
        token_hash TEXT PRIMARY KEY,
        player_name TEXT NOT NULL,
        expires_at INTEGER NOT NULL
    )""")
    seats.initialize(db)
    return db

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        if self.path.split("?", 1)[0] in ("/api/leaderboard", "/api/stats", "/api/tickets/active"):
            self.send_header("Access-Control-Allow-Origin", "https://taphoatraiban-dot.github.io")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        candidate = self.headers.get("Authorization", "")
        return bool(TOKEN) and secrets.compare_digest(candidate, "Bearer " + TOKEN)

    def player_session(self):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        candidate = auth[7:]
        if len(candidate) != 43:
            return None
        digest = hashlib.sha256(candidate.encode("utf-8")).hexdigest()
        with connection() as db:
            row = db.execute("SELECT player_name FROM player_sessions WHERE token_hash=? AND expires_at>?", (digest, int(time.time()))).fetchone()
        return row[0] if row else None

    def serve_static(self, filename, content_type):
        try:
            body = (SITE_ROOT / filename).read_bytes()
        except OSError:
            return self.respond(404, {"error": "not_found"})
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            return self.serve_static("index.html", "text/html; charset=utf-8")
        if path == "/server-leaderboard.js":
            return self.serve_static("server-leaderboard.js", "text/javascript; charset=utf-8")
        if path == "/online-fishing.js":
            return self.serve_static("online-fishing.js", "text/javascript; charset=utf-8")
        if path == "/health":
            return self.respond(200, {"ok": True, "service": "cuncun-fishing-backend"})
        if path == "/api/tickets/active":
            with connection() as db:
                now = int(time.time())
                rows = db.execute("SELECT player_name,MAX(expires_at) FROM tickets WHERE expires_at>? GROUP BY player_name ORDER BY player_name LIMIT 200", (now,)).fetchall()
            return self.respond(200, {"players": [{"name": n, "expires_at": e} for n,e in rows]})
        if path == "/api/ticket-prices":
            return self.respond(200, {"currency": "VND", "tickets": [{"minutes": m, "price": p} for m,p in seats.PRICES_VND.items()], "visitor_access": "free", "payment": "admin_verified_only"})
        if path == "/api/seats":
            now = int(time.time())
            with connection() as db:
                rows = db.execute("SELECT seat,player_name,expires_at FROM fishing_seats WHERE expires_at>? ORDER BY seat", (now,)).fetchall()
            return self.respond(200, {"capacity": seats.CAPACITY, "occupied": [{"seat": n, "name": p, "expires_at": e} for n,p,e in rows]})
        if path == "/api/stats":
            with connection() as db:
                players = db.execute("SELECT COUNT(*) FROM players").fetchone()[0]
                catches, points = db.execute("SELECT COUNT(*), COALESCE(SUM(points),0) FROM events").fetchone()
            return self.respond(200, {"players": players, "catches": catches, "points": points})
        if path == "/api/leaderboard":
            with connection() as db:
                rows = db.execute("SELECT name,points,catches FROM players ORDER BY points DESC,id ASC LIMIT 30").fetchall()
            return self.respond(200, {"players": [{"name": n, "points": p, "catches": c} for n,p,c in rows]})
        return self.respond(404, {"error": "not_found"})

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in ("/api/events", "/api/tickets", "/api/cast", "/api/reel", "/api/sessions", "/api/player/cast", "/api/player/reel", "/api/player/seat"):
            return self.respond(404, {"error": "not_found"})
        player_name = None
        if path in ("/api/player/cast", "/api/player/reel", "/api/player/seat"):
            player_name = self.player_session()
            if player_name is None:
                return self.respond(401, {"error": "unauthorized"})
        elif not self.authorized():
            return self.respond(401, {"error": "unauthorized"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size <= 0 or size > 2048:
                return self.respond(413, {"error": "invalid_size"})
            payload = json.loads(self.rfile.read(size))
            name = player_name if player_name is not None else payload.get("name")
            kind = payload.get("kind")
            if not isinstance(name, str) or not 1 <= len(name.strip()) <= 32:
                raise ValueError("invalid name")
            if path == "/api/events":
                points = payload.get("points")
                if kind != "catch" or type(points) is not int or not 1 <= points <= 100:
                    raise ValueError("invalid event")
            elif path == "/api/tickets":
                minutes = payload.get("minutes", 10)
                if type(minutes) is not int or not 1 <= minutes <= 60:
                    raise ValueError("invalid ticket duration")
            name = name.strip()
        except (ValueError, TypeError, json.JSONDecodeError):
            return self.respond(400, {"error": "invalid_payload"})
        now = int(time.time())
        if path == "/api/player/seat":
            with connection() as db:
                db.execute("BEGIN IMMEDIATE")
                expiry = db.execute("SELECT MAX(expires_at) FROM tickets WHERE player_name=? COLLATE NOCASE", (name,)).fetchone()[0]
                if not expiry or expiry <= now:
                    return self.respond(403, {"error": "ticket_required"})
                seat = seats.draw(db, name, expiry, now)
                if seat is None:
                    return self.respond(409, {"error": "seats_full"})
            return self.respond(200, {"ok": True, "seat": seat, "expires_at": expiry})
        if path == "/api/sessions":
            with connection() as db:
                expiry = db.execute("SELECT MAX(expires_at) FROM tickets WHERE player_name=? COLLATE NOCASE", (name,)).fetchone()[0]
                if not expiry or expiry <= now:
                    return self.respond(403, {"error": "ticket_required"})
                session_token = secrets.token_urlsafe(32)
                digest = hashlib.sha256(session_token.encode("utf-8")).hexdigest()
                db.execute("INSERT INTO player_sessions(token_hash,player_name,expires_at) VALUES(?,?,?)", (digest,name,expiry))
            return self.respond(200, {"ok": True, "token": session_token, "expires_at": expiry})
        if path == "/api/tickets":
            with connection() as db:
                active = db.execute("SELECT COUNT(DISTINCT player_name) FROM tickets WHERE expires_at>?", (now,)).fetchone()[0]
                existing = db.execute("SELECT MAX(expires_at) FROM tickets WHERE player_name=? COLLATE NOCASE AND expires_at>?", (name,now)).fetchone()[0]
                if active >= 200 and existing is None:
                    return self.respond(409, {"error": "lake_full"})
                expires = max(now, existing or now) + minutes * 60
                db.execute("INSERT INTO tickets(player_name,expires_at,created_at) VALUES(?,?,?)", (name,expires,now))
            return self.respond(200, {"ok": True, "name": name, "expires_at": expires})
        if path in ("/api/cast", "/api/reel", "/api/player/cast", "/api/player/reel", "/api/player/seat"):
            with connection() as db:
                db.execute("BEGIN IMMEDIATE")
                valid = db.execute("SELECT MAX(expires_at) FROM tickets WHERE player_name=? COLLATE NOCASE", (name,)).fetchone()[0]
                if not valid or valid <= now:
                    return self.respond(403, {"error": "ticket_required"})
                if path in ("/api/cast", "/api/player/cast"):
                    previous = db.execute("SELECT cast_at FROM casts WHERE player_name=? COLLATE NOCASE", (name,)).fetchone()
                    if previous:
                        return self.respond(409, {"error": "already_cast"})
                    db.execute("INSERT INTO casts(player_name,cast_at) VALUES(?,?)", (name,now))
                    db.commit()
                    return self.respond(200, {"ok": True, "cast_at": now, "min_wait_seconds": 3})
                previous = db.execute("SELECT cast_at FROM casts WHERE player_name=? COLLATE NOCASE", (name,)).fetchone()
                if not previous:
                    return self.respond(409, {"error": "cast_first"})
                if now - previous[0] < 3:
                    return self.respond(429, {"error": "fish_not_ready"})
                db.execute("DELETE FROM casts WHERE player_name=? COLLATE NOCASE", (name,))
                fish, points = random.SystemRandom().choice([("Cá rô", 3), ("Cá chép", 7), ("Cá trắm", 12), ("Cá vàng", 18), ("Cá boss", 35)])
                db.execute("INSERT OR IGNORE INTO players(name,created_at) VALUES(?,?)", (name,now))
                db.execute("UPDATE players SET points=points+?,catches=catches+1 WHERE name=? COLLATE NOCASE", (points,name))
                player_id = db.execute("SELECT id FROM players WHERE name=? COLLATE NOCASE", (name,)).fetchone()[0]
                db.execute("INSERT INTO events(player_id,kind,points,created_at) VALUES(?,?,?,?)", (player_id,"catch",points,now))
            return self.respond(200, {"ok": True, "fish": fish, "points": points})
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
