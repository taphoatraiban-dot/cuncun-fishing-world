"""Regression checks for isolated free practice routes and assets.

Run from repository root: python3 -m unittest discover -s tests -p 'test_practice_routes.py'
"""
import unittest
from pathlib import Path
from unittest.mock import patch
from backend.server import Handler, SITE_ROOT

class PracticeRouteTests(unittest.TestCase):
    def test_practice_assets_exist(self):
        for filename in ("practice.html", "practice-3d.js", "profile-demo.html", "fishing-progression.js"):
            with self.subTest(filename=filename):
                self.assertTrue((SITE_ROOT / filename).is_file())

    def test_practice_routes_serve_expected_types(self):
        for path, filename, mime in (
            ("/practice.html", "practice.html", "text/html; charset=utf-8"),
            ("/profile-demo.html", "profile-demo.html", "text/html; charset=utf-8"),
            ("/practice-3d.js", "practice-3d.js", "text/javascript; charset=utf-8"),
            ("/fishing-progression.js", "fishing-progression.js", "text/javascript; charset=utf-8"),
        ):
            with self.subTest(path=path):
                handler = object.__new__(Handler)
                handler.path = path
                with patch.object(Handler, "serve_static", return_value=None) as serve:
                    handler.do_GET()
                serve.assert_called_once_with(filename, mime)

    def test_practice_has_no_payment_or_score_api_calls(self):
        source = (SITE_ROOT / "practice-3d.js").read_text(encoding="utf-8")
        for forbidden in ("fetch(", "XMLHttpRequest", "/api/events", "/api/tickets", "localStorage.setItem"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, source)

    def test_main_page_links_practice(self):
        source = (SITE_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="./practice.html"', source)

if __name__ == "__main__":
    unittest.main()
