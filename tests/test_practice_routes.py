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

class ServiceLakeRouteTests(unittest.TestCase):
    def test_demo_asset_routes_are_read_only_and_typed(self):
        for suffix,mime in [('','text/html; charset=utf-8'),('main.js','text/javascript; charset=utf-8'),('assets/environment.glb','model/gltf-binary')]:
            handler=object.__new__(Handler);handler.path='/experiments/service-lake-v1/'+suffix
            with patch.object(Handler,'serve_static',return_value=None) as serve:
                handler.do_GET();self.assertEqual(serve.call_args.args[1],mime)
    def test_demo_rejects_traversal_and_non_public_files(self):
        for suffix in ['../../backend/server.py','%2e%2e/%2e%2e/backend/server.py','.env','node_modules/private.key']:
            handler=object.__new__(Handler);handler.path='/experiments/service-lake-v1/'+suffix
            with patch.object(Handler,'respond',return_value=None) as respond,patch.object(Handler,'serve_static') as serve:
                handler.do_GET();serve.assert_not_called();self.assertEqual(respond.call_args.args[0],404)
