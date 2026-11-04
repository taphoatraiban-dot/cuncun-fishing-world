"""Server-side random fishing-seat allocation; payment is verified separately."""
import secrets
import time

CAPACITY = 1000
PRICES_VND = {10: 5000, 30: 10000, 60: 20000}

def initialize(db):
    db.execute("""CREATE TABLE IF NOT EXISTS fishing_seats (
        seat INTEGER PRIMARY KEY CHECK(seat BETWEEN 1 AND 1000),
        player_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        expires_at INTEGER NOT NULL
    )""")

def draw(db, player_name, expiry, now=None):
    now = int(time.time()) if now is None else now
    db.execute("DELETE FROM fishing_seats WHERE expires_at<=?", (now,))
    row = db.execute("SELECT seat FROM fishing_seats WHERE player_name=? COLLATE NOCASE", (player_name,)).fetchone()
    if row:
        db.execute("UPDATE fishing_seats SET expires_at=? WHERE seat=?", (expiry, row[0]))
        return row[0]
    occupied = {r[0] for r in db.execute("SELECT seat FROM fishing_seats")}
    available = [n for n in range(1, CAPACITY + 1) if n not in occupied]
    if not available:
        return None
    seat = secrets.choice(available)
    db.execute("INSERT INTO fishing_seats(seat,player_name,expires_at) VALUES(?,?,?)", (seat, player_name, expiry))
    return seat
