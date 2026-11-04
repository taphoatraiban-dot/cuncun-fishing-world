"""Issue a fishing ticket and private player session from the VPS terminal.
Usage: python3 -m backend.issue_ticket 'Player Name' 10
Run only on the trusted VPS as the service data owner/root. Do not post the token publicly.
"""
import hashlib
import secrets
import sys
import time
from . import server


def issue(name, minutes):
    name = name.strip()
    if not 1 <= len(name) <= 32 or any(ord(c) < 32 for c in name):
        raise ValueError("Player name must contain 1-32 printable characters")
    if not 1 <= minutes <= 60:
        raise ValueError("Ticket duration must be 1-60 minutes")
    now = int(time.time())
    with server.connection() as db:
        db.execute("BEGIN IMMEDIATE")
        count = db.execute("SELECT COUNT(DISTINCT player_name COLLATE NOCASE) FROM tickets WHERE expires_at>?", (now,)).fetchone()[0]
        previous = db.execute("SELECT MAX(expires_at) FROM tickets WHERE player_name=? COLLATE NOCASE AND expires_at>?", (name, now)).fetchone()[0]
        if count >= 200 and previous is None:
            raise ValueError("Lake is full (200 active players)")
        expiry = max(now, previous or now) + minutes * 60
        db.execute("INSERT INTO tickets(player_name,expires_at,created_at) VALUES(?,?,?)", (name, expiry, now))
        token = secrets.token_urlsafe(32)
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        db.execute("INSERT INTO player_sessions(token_hash,player_name,expires_at) VALUES(?,?,?)", (digest, name, expiry))
    return token, expiry


def revoke_sessions(name):
    name = name.strip()
    if not 1 <= len(name) <= 32:
        raise ValueError("Invalid player name")
    with server.connection() as db:
        cursor = db.execute("DELETE FROM player_sessions WHERE player_name=? COLLATE NOCASE", (name,))
        return cursor.rowcount


def rotate_session(name):
    name = name.strip()
    now = int(time.time())
    with server.connection() as db:
        db.execute("BEGIN IMMEDIATE")
        expiry = db.execute("SELECT MAX(expires_at) FROM tickets WHERE player_name=? COLLATE NOCASE", (name,)).fetchone()[0]
        if not expiry or expiry <= now:
            raise ValueError("Player has no active ticket")
        db.execute("DELETE FROM player_sessions WHERE player_name=? COLLATE NOCASE", (name,))
        token = secrets.token_urlsafe(32)
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        db.execute("INSERT INTO player_sessions(token_hash,player_name,expires_at) VALUES(?,?,?)", (digest,name,expiry))
    return token, expiry


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python3 -m backend.issue_ticket 'Player Name' 10|rotate|revoke")
    try:
        action = sys.argv[2].lower()
        if action == "revoke":
            count = revoke_sessions(sys.argv[1])
            print("Revoked sessions:", count)
            return
        if action == "rotate":
            token, expiry = rotate_session(sys.argv[1])
        else:
            minutes = int(action)
            token, expiry = issue(sys.argv[1], minutes)
    except ValueError as error:
        raise SystemExit(str(error)) from error
    print("Player:", sys.argv[1].strip())
    print("Expires (Unix timestamp):", expiry)
    print("PRIVATE PLAYER SESSION TOKEN:", token)
    print("Give this token privately to the player. Never share the admin token.")


if __name__ == "__main__":
    main()
