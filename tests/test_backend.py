import http.client
import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from http.server import ThreadingHTTPServer
from unittest.mock import patch

from backend import server

class BackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        server.DB_PATH = Path(cls.temp.name) / "test.sqlite3"
        server.TOKEN = "test-token-with-at-least-24-characters"
        with server.connection():
            pass
        cls.http = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.thread.join(timeout=5)
        cls.temp.cleanup()

    def request(self, method, path, payload=None, token=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.http.server_port, timeout=5)
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        body = json.dumps(payload) if payload is not None else None
        conn.request(method, path, body=body, headers=headers)
        response = conn.getresponse()
        result = response.status, json.loads(response.read())
        conn.close()
        return result

    def test_health(self):
        status, result = self.request("GET", "/health")
        self.assertEqual(status, 200)
        self.assertTrue(result["ok"])

    def test_rejects_unauthenticated_writes(self):
        status, _ = self.request("POST", "/api/events", {"name":"Test","kind":"catch","points":5})
        self.assertEqual(status, 401)

    def test_rejects_invalid_points(self):
        for points in [-1, 0, 101, True, "5"]:
            status, _ = self.request("POST", "/api/events", {"name":"Test","kind":"catch","points":points}, server.TOKEN)
            self.assertEqual(status, 400)

    def test_ticket_cast_reel_flow(self):
        name = "TicketFlowPlayer"
        token = server.TOKEN
        status, _ = self.request("POST", "/api/cast", {"name": name}, token)
        self.assertEqual(status, 403)
        status, ticket = self.request("POST", "/api/tickets", {"name": name, "minutes": 10}, token)
        self.assertEqual(status, 200)
        self.assertGreater(ticket["expires_at"], 0)
        status, roster = self.request("GET", "/api/tickets/active")
        self.assertEqual(status, 200)
        self.assertTrue(any(p["name"] == name for p in roster["players"]))
        status, cast = self.request("POST", "/api/cast", {"name": name}, token)
        self.assertEqual(status, 200)
        status, _ = self.request("POST", "/api/cast", {"name": name}, token)
        self.assertEqual(status, 409)
        status, _ = self.request("POST", "/api/reel", {"name": name}, token)
        self.assertEqual(status, 429)
        with patch.object(server.time, "time", return_value=cast["cast_at"] + 4):
            status, result = self.request("POST", "/api/reel", {"name": name}, token)
        self.assertEqual(status, 200)
        self.assertIn("fish", result)
        self.assertGreater(result["points"], 0)
        status, _ = self.request("POST", "/api/reel", {"name": name}, token)
        self.assertEqual(status, 409)
        status, leaderboard = self.request("GET", "/api/leaderboard")
        self.assertEqual(status, 200)
        player = next(p for p in leaderboard["players"] if p["name"] == name)
        self.assertEqual(player["catches"], 1)
        self.assertEqual(player["points"], result["points"])

    def test_ticket_rejects_unauthorized_and_invalid_duration(self):
        status, _ = self.request("POST", "/api/tickets", {"name": "Guest", "minutes": 10})
        self.assertEqual(status, 401)
        for minutes in (0, 61, True, "10"):
            status, _ = self.request("POST", "/api/tickets", {"name": "Guest", "minutes": minutes}, server.TOKEN)
            self.assertEqual(status, 400)

    def test_player_session_scoped_to_ticket_owner(self):
        name = "SessionPlayer"
        status, _ = self.request("POST", "/api/sessions", {"name": name}, server.TOKEN)
        self.assertEqual(status, 403)
        status, _ = self.request("POST", "/api/tickets", {"name": name, "minutes": 10}, server.TOKEN)
        self.assertEqual(status, 200)
        status, _ = self.request("POST", "/api/sessions", {"name": name})
        self.assertEqual(status, 401)
        status, session = self.request("POST", "/api/sessions", {"name": name}, server.TOKEN)
        self.assertEqual(status, 200)
        token = session["token"]
        self.assertGreaterEqual(len(token), 40)
        status, _ = self.request("POST", "/api/player/cast", {"name": "Imposter"}, token)
        self.assertEqual(status, 200)
        with server.connection() as db:
            row = db.execute("SELECT player_name FROM casts WHERE player_name=?", (name,)).fetchone()
        self.assertEqual(row[0], name)
        status, _ = self.request("POST", "/api/player/reel", {"name": "Imposter"}, "invalid-token")
        self.assertEqual(status, 401)

    def test_catch_and_leaderboard(self):
        status, result = self.request("POST", "/api/events", {"name":"Cun","kind":"catch","points":9}, server.TOKEN)
        self.assertEqual(status, 200)
        self.assertTrue(result["ok"])
        status, result = self.request("GET", "/api/leaderboard")
        self.assertEqual(status, 200)
        player = next(p for p in result["players"] if p["name"] == "Cun")
        self.assertEqual(player["points"], 9)
        self.assertEqual(player["catches"], 1)

if __name__ == "__main__":
    unittest.main()
