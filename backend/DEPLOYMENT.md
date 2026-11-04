# CUNCUN Fishing World — VPS deployment preparation

This is a separate service. It does NOT use the CUNCUN accounting database, Telegram sessions, or their secrets.

## 1. Read-only preflight on the existing VPS

Run these commands to inspect available capacity and port conflicts (no changes):

```bash
uname -a
free -h
df -h /
ss -lnt
systemctl --type=service --state=running --no-pager
```

Do not share tokens, private keys, .env files, or Telegram sessions.

## 2. Local smoke test (Mac or isolated VPS staging directory)

Requires Python 3.10+. No pip packages required.

```bash
git clone https://github.com/taphoatraiban-dot/cuncun-fishing-world.git
cd cuncun-fishing-world
python3 -m unittest discover -s tests -v
export FISHING_ADMIN_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
python3 backend/server.py
```

In a second terminal:

```bash
curl -fsS http://127.0.0.1:8791/health
curl -fsS http://127.0.0.1:8791/api/leaderboard
```

Do not paste the generated token into chat. Store it privately in a root-owned environment file for production.

## 3. Production design (not yet deployed)

- Run under a dedicated non-login Linux user and separate working directory.
- Use a dedicated SQLite database on persistent storage, with backups.
- Bind to 127.0.0.1:8791 only; no public exposure of the Python HTTP server.
- Reverse proxy via an HTTPS hostname distinct from cuncun.icu, with access controls and rate limits.
- Protect POST /api/events using a server-side token. Never embed the admin token in frontend HTML or JavaScript.
- Add event IDs/idempotency, real viewer authentication, anti-abuse rules, and transactional score validation before accepting TikTok events.
- The current backend is a development scaffold. It is NOT yet suitable for public multiuser writes or 24/7 production traffic.
- GitHub Pages hosts only static files and does not run the backend.

## 4. Rollout gates

1. Verify VPS resources and existing services.
2. Confirm hostname and TLS route, no overlap with existing CUNCUN/Telegram services.
3. Deploy isolated staging instance, test health and restart.
4. Add authenticated server-side TikTok event ingestion, durable queues, and monitoring.
5. Connect frontend read-only leaderboard after CORS and backend origin are configured.
6. Perform load testing and backups before 24/7 production launch.

Rollback: stop only the dedicated fishing service and leave all other services unchanged.
