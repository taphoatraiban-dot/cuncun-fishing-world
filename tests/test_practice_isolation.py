"""Guardrails: free fishing practice must not access CuncunPrint or cuncun.icu."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class IsolationTests(unittest.TestCase):
    def test_practice_is_client_only(self):
        js = (ROOT / "practice-3d.js").read_text(encoding="utf-8").lower()
        html = (ROOT / "practice.html").read_text(encoding="utf-8").lower()
        for forbidden in (
            "cuncun.icu", "supabase.co", "cuncunprint", "print_queue",
            "telegram", "localstorage", "sessionstorage", "indexeddb",
            "xmlhttprequest", "sendbeacon(", "websocket(", "fetch(",
            "/api/player/", "/api/tickets", "/api/events", "serviceworker",
        ):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, js)
                self.assertNotIn(forbidden, html)

    def test_profile_demo_is_read_only(self):
        source = (ROOT / "profile-demo.html").read_text(encoding="utf-8").lower()
        for forbidden in ("fetch(", "supabase", "cuncun.icu", "localstorage", "xmlhttprequest", "websocket", "<script", "<form"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, source)
        self.assertIn("không lưu dữ liệu", source)

    def test_practice_assets_live_only_in_fishing_repository(self):
        for filename in ("practice.html", "practice-3d.js"):
            self.assertTrue((ROOT / filename).is_file())
        self.assertFalse((ROOT / "CuncunPrint").exists())

if __name__ == "__main__":
    unittest.main()
